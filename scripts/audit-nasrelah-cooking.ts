/**
 * Audit Nasrelah El Masri assigned meals for cooking instructions / translations.
 * Run: npx --yes tsx scripts/audit-nasrelah-cooking.ts
 */
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import {
  COOKING_BY_MEAL,
  englishCookingForMeal,
  translateCookingInstructions,
  translateMealName,
} from '../src/locales/client/mealContent.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const raw = readFileSync(path.join(__dirname, '..', '.env'), 'utf8');
  const env: Record<string, string> = {};
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    let val = m[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[m[1]] = val;
  }
  return env;
}

const norm = (s: string) =>
  String(s || '')
    .toLowerCase()
    .replace(/['']/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

function hasArabic(text: string) {
  return /[\u0600-\u06FF]/.test(text);
}

async function main() {
  const env = loadEnv();
  const sb = createClient(env.VITE_SUPABASE_URL!, env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_SERVICE_ROLE_KEY!);

  const { data: clients, error } = await sb
    .from('clients')
    .select('id, full_name')
    .or('full_name.ilike.%nasrelah%,full_name.ilike.%el masri%,full_name.ilike.%masri%');

  if (error) {
    console.error(error);
    process.exit(1);
  }

  const client =
    (clients || []).find((c) => /nasrelah/i.test(c.full_name || '')) ||
    (clients || []).find((c) => /masri/i.test(c.full_name || ''));

  if (!client) {
    console.error('Client not found. Matches:', clients);
    process.exit(1);
  }

  console.log(`Client: ${client.full_name} (${client.id})`);

  const { data: planRow } = await sb
    .from('nutrition_plans')
    .select('plan_json')
    .eq('client_id', client.id)
    .maybeSingle();

  const plan = planRow?.plan_json as {
    mealSlots?: Array<{
      name?: string;
      selectedMeals?: Array<{
        meal?: {
          id?: string;
          name?: string;
          cookingInstructions?: string;
          ingredients?: Array<{ name?: string }>;
        };
        slotOverride?: { nameOverride?: string; instructionsOverride?: string };
      }>;
    }>;
  } | null;

  if (!plan?.mealSlots?.length) {
    console.log('No nutrition plan / meal slots');
    process.exit(0);
  }

  const mealNames = new Set<string>();
  const report: unknown[] = [];

  for (const slot of plan.mealSlots) {
    for (const sm of slot.selectedMeals || []) {
      const baseName = sm.meal?.name || '';
      const effectiveName = sm.slotOverride?.nameOverride?.trim() || baseName;
      const stored =
        sm.slotOverride?.instructionsOverride?.trim() ||
        sm.meal?.cookingInstructions?.trim() ||
        '';
      const key = norm(effectiveName);
      const catalog = COOKING_BY_MEAL[key];
      const catalogEn = catalog?.en || englishCookingForMeal(effectiveName);
      const ar = translateCookingInstructions(effectiveName, stored, 'ar');
      const fr = translateCookingInstructions(effectiveName, stored, 'fr');
      const nameAr = translateMealName(effectiveName, 'ar');
      const nameFr = translateMealName(effectiveName, 'fr');
      const ingredients = (sm.meal?.ingredients || []).map((i) => i.name || '').filter(Boolean);

      mealNames.add(effectiveName);

      const issues: string[] = [];
      if (!stored) issues.push('missing_stored_en');
      if (!catalog) issues.push('not_in_cooking_catalog');
      if (!hasArabic(ar || '') || ar === stored) issues.push('missing_or_fallback_ar');
      if (!fr || fr === stored) issues.push('missing_or_fallback_fr');
      if (nameAr === effectiveName) issues.push('meal_name_not_translated_ar');
      if (nameFr === effectiveName) issues.push('meal_name_not_translated_fr');
      if (stored && catalogEn && norm(stored) !== norm(catalogEn)) issues.push('stored_differs_catalog_en');

      const row = {
        slot: slot.name,
        baseName,
        effectiveName,
        mealId: sm.meal?.id,
        ingredients,
        stored,
        inCatalog: Boolean(catalog),
        issues,
        ar,
        fr,
        nameAr,
        nameFr,
        catalogEn,
      };
      report.push(row);

      console.log(`\n[${slot.name}] ${effectiveName}`);
      console.log(`  issues: ${issues.length ? issues.join(', ') : 'OK'}`);
      console.log(`  stored: ${stored ? stored.slice(0, 140) : '(empty)'}`);
      console.log(`  ar: ${(ar || '').slice(0, 100)}`);
      console.log(`  fr: ${(fr || '').slice(0, 100)}`);
      console.log(`  ingredients: ${ingredients.join(' | ')}`);
    }
  }

  // Check meal database for same names
  const { data: dbMeals } = await sb
    .from('meals')
    .select('id, name, cooking_instructions')
    .in('name', [...mealNames]);

  console.log('\n========== MEAL DATABASE MATCHES ==========');
  for (const m of dbMeals || []) {
    const key = norm(m.name);
    const catalog = COOKING_BY_MEAL[key];
    const stored = (m.cooking_instructions || '').trim();
    const ar = translateCookingInstructions(m.name, stored, 'ar');
    const fr = translateCookingInstructions(m.name, stored, 'fr');
    const issues: string[] = [];
    if (!stored) issues.push('missing_stored_en');
    if (!catalog) issues.push('not_in_cooking_catalog');
    if (!hasArabic(ar || '') || ar === stored) issues.push('missing_or_fallback_ar');
    if (!fr || fr === stored) issues.push('missing_or_fallback_fr');
    console.log(`\nDB: ${m.name} (${m.id})`);
    console.log(`  issues: ${issues.length ? issues.join(', ') : 'OK'}`);
    console.log(`  stored: ${stored ? stored.slice(0, 140) : '(empty)'}`);
  }

  writeFileSync(
    path.join(__dirname, '..', 'tmp-nasrelah-cooking-audit.json'),
    JSON.stringify({ client, report, dbMeals }, null, 2)
  );
  console.log('\nWrote tmp-nasrelah-cooking-audit.json');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
