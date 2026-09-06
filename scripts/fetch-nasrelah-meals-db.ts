/**
 * Fetch Nasrelah assigned meal DB rows.
 * Run: npx --yes tsx scripts/fetch-nasrelah-meals-db.ts
 */
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

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

const ids = [
  'd62145ee-224d-4a8e-8c3c-d21e10726541',
  '124cfbe2-9c31-4fbe-bdb0-30a9ec2d1d02',
  '061acb09-6543-49a0-91ec-ac5756d20c83',
];

const env = loadEnv();
const sb = createClient(env.VITE_SUPABASE_URL!, env.VITE_SUPABASE_ANON_KEY!);
const { data, error } = await sb.from('meals').select('id, name, cooking_instructions').in('id', ids);
writeFileSync(path.join(__dirname, '..', 'tmp-nasrelah-meals-db.json'), JSON.stringify({ error, data }, null, 2));
console.log(JSON.stringify({ error, data }, null, 2));
