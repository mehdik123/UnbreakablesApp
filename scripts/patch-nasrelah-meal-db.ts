/**
 * Sync Nasrelah-assigned meal DB cooking instructions to match his plan.
 * Only touches meals assigned to this client (by meal id).
 * Run: npx --yes tsx scripts/patch-nasrelah-meal-db.ts
 */
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { englishCookingForMeal } from '../src/locales/client/mealContent.ts';

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

const CLIENT_ID = '0633e6e6-ac18-4987-9b79-3e76593f224d';

const env = loadEnv();
const sb = createClient(env.VITE_SUPABASE_URL!, env.VITE_SUPABASE_ANON_KEY!);

const { data: planRow, error: planErr } = await sb
  .from('nutrition_plans')
  .select('plan_json')
  .eq('client_id', CLIENT_ID)
  .maybeSingle();

if (planErr || !planRow?.plan_json) {
  console.error('Plan not found', planErr);
  process.exit(1);
}

type MealRef = {
  meal?: { id?: string; name?: string; cookingInstructions?: string };
  slotOverride?: { nameOverride?: string; instructionsOverride?: string };
};

const assigned = new Map<string, { name: string; instructions: string }>();

for (const slot of (planRow.plan_json as { mealSlots?: Array<{ selectedMeals?: MealRef[] }> }).mealSlots || []) {
  for (const sm of slot.selectedMeals || []) {
    const id = sm.meal?.id;
    if (!id) continue;
    const name = sm.slotOverride?.nameOverride?.trim() || sm.meal?.name || '';
    const instructions =
      sm.slotOverride?.instructionsOverride?.trim() ||
      sm.meal?.cookingInstructions?.trim() ||
      englishCookingForMeal(name);
    assigned.set(id, { name, instructions });
  }
}

console.log(`Assigned meal IDs: ${[...assigned.keys()].join(', ')}`);

for (const [id, { name, instructions }] of assigned) {
  const { data: row, error: getErr } = await sb
    .from('meals')
    .select('id, name, cooking_instructions')
    .eq('id', id)
    .maybeSingle();

  if (getErr) {
    console.error(`Fetch failed for ${id}`, getErr);
    continue;
  }
  if (!row) {
    console.log(`⚠ meal ${id} (${name}) not in meals table — skipping DB update`);
    continue;
  }

  const catalogEn = englishCookingForMeal(name) || instructions;
  const next = instructions || catalogEn;
  const current = (row.cooking_instructions || '').trim();

  if (norm(current) === norm(next)) {
    console.log(`OK DB ${row.name} (${id}) — already in sync`);
    continue;
  }

  if (!next) {
    console.log(`⚠ no instructions to write for ${row.name}`);
    continue;
  }

  const { error: updErr } = await sb
    .from('meals')
    .update({ cooking_instructions: next })
    .eq('id', id);

  if (updErr) {
    console.error(`Update failed for ${id}`, updErr);
  } else {
    console.log(`Updated DB meal ${row.name} (${id})`);
    console.log(`  from: ${current.slice(0, 80) || '(empty)'}`);
    console.log(`  to:   ${next.slice(0, 80)}`);
  }
}

console.log('Done');
