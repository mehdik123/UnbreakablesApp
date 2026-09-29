/**
 * Insert EAFIT Gainer Max into ingredients if missing.
 * Run: node scripts/add-eafit-gainer-ingredient.cjs
 */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

function loadEnv(file) {
  const out = {};
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) out[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
  return out;
}

const ROW = {
  name: 'EAFIT Gainer Max Double Chocolate',
  kcal: 358,
  protein: 17,
  fat: 1,
  carbs: 70,
};

async function main() {
  const env = loadEnv(path.join(__dirname, '..', '.env'));
  const key = env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY;
  const sb = createClient(env.VITE_SUPABASE_URL, key);

  const { data: existing } = await sb.from('ingredients').select('id,name').eq('name', ROW.name).maybeSingle();

  if (existing) {
    console.log('already present', existing.name);
    return;
  }

  const { data, error } = await sb.from('ingredients').insert(ROW).select('id,name').single();
  if (error) console.error('insert failed', error.message);
  else console.log('inserted', data?.name);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
