/**
 * Import 2600 kcal client meal plan (5 breakfast / 5 lunch / 5 dinner).
 * - Reuses existing ingredients when a close match exists (keeps DB macros).
 * - Creates only missing ingredients with plan macros (powders stored per 100 g).
 *
 * Run: node _import_2600_meal_plan.cjs
 */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

function loadEnv(file) {
  const out = {};
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) out[m[1]] = m[2].trim();
  }
  return out;
}

const env = loadEnv(path.join(__dirname, '.env'));
const sb = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Plan ingredient key → exact existing DB name (must match dump). Keys are normalized. */
const EXISTING_MAP_RAW = {
  'cottage cheese (2%)': 'Cottage Cheese, 1% milkfat',
  'greek yogurt (0%)': 'Plain Low-Fat Greek Yoghurt',
  'whole-wheat bread': 'Whole-Wheat Bread',
  'whole-wheat toast': 'Whole Bread Toast',
  'whole-wheat wrap': 'Whole-Wheat Wrap',
  'dark chocolate (85%)': 'Dark Chocolate, 70-85% Cacao',
  'beef (lean, cooked)': 'Beef, Ground, 90% lean',
  'steak (sirloin, cooked)': 'Beef, Steak, Sirloin',
  'broccoli (cooked)': 'Broccoli',
  'sweet potato (baked)': 'Sweet Potato, Raw',
  'almond milk (unsweetened)': 'Almond Milk (unsweetened)',
  'skim / no-fat milk': 'Milk',
  'cucumber': 'Cucumber',
  'kiwi': 'Kiwi',
  'tuna in water (drained)': 'Canned Tuna in Water',
  'oats / oat powder': 'Plain Oats, Raw',
  'avocado': 'Avocado',
  'whole eggs': 'Eggs',
  'on gold 100% whey': 'Optimum Gold Standard Whey Protein Powder',
};

/** Missing ingredients to create. Macros are per 100 g (powders converted from scoop labels). */
const NEW_INGREDIENTS = [
  // Mexican mix cheese — not in DB
  { name: 'Mexican Mix Cheese', kcal: 366, protein: 23, fat: 29, carbs: 3 },
  // Mixed berries blend — not in DB
  { name: 'Mixed Berries', kcal: 50, protein: 1, fat: 0, carbs: 12 },
  // ON Isolate: 110/25/0.5/1 per 31 g scoop → per 100 g
  { name: 'ON Gold 100% Isolate', kcal: 355, protein: 81, fat: 2, carbs: 3 },
  // FITLife TRU ISO Plain: 135/32/1/1.5 per 36 g scoop → per 100 g
  { name: 'FITLife TRU ISO Plain', kcal: 375, protein: 89, fat: 3, carbs: 4 },
];

/** Plan key → new ingredient name */
const NEW_MAP_RAW = {
  'mexican mix cheese': 'Mexican Mix Cheese',
  'berries (mixed)': 'Mixed Berries',
  'on gold 100% isolate': 'ON Gold 100% Isolate',
  'fitlife tru iso plain': 'FITLife TRU ISO Plain',
};

const EXISTING_MAP = Object.fromEntries(
  Object.entries(EXISTING_MAP_RAW).map(([k, v]) => [norm(k), v])
);
const NEW_MAP = Object.fromEntries(
  Object.entries(NEW_MAP_RAW).map(([k, v]) => [norm(k), v])
);

const IMG = {
  breakfast: 'https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?w=400&h=300&fit=crop',
  lunch: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop',
  dinner: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=300&fit=crop',
};

/**
 * Meals: items use plan ingredient keys + grams (scoop weights for powders).
 */
const MEALS = [
  // —— Breakfast (~800) ——
  {
    name: 'B1 Oat & Isolate Power Bowl',
    category: 'breakfast',
    kcal_target: 800,
    instructions:
      'Cook oats with water or milk. Stir in ON Isolate until smooth. Top with Greek yogurt, mixed berries, and diced avocado. Serve warm.',
    items: [
      ['oats / oat powder', 125],
      ['on gold 100% isolate', 31],
      ['greek yogurt (0%)', 150],
      ['berries (mixed)', 100],
      ['avocado', 52],
    ],
  },
  {
    name: 'B2 Eggs & Cheese Toast',
    category: 'breakfast',
    kcal_target: 800,
    instructions:
      'Toast the whole-wheat bread. Cook eggs to preference. Melt Mexican mix cheese on toast, add eggs, avocado, and cucumber. Mix ON Whey as a side shake.',
    items: [
      ['whole eggs', 100],
      ['whole-wheat toast', 150],
      ['mexican mix cheese', 30],
      ['on gold 100% whey', 32],
      ['cucumber', 120],
      ['avocado', 35],
    ],
  },
  {
    name: 'B3 Cottage Cheese Oat Stack',
    category: 'breakfast',
    kcal_target: 800,
    instructions:
      'Cook oats. Stir in cottage cheese and ON Isolate. Top with berries and avocado.',
    items: [
      ['cottage cheese (2%)', 150],
      ['oats / oat powder', 115],
      ['berries (mixed)', 120],
      ['on gold 100% isolate', 31],
      ['avocado', 50],
    ],
  },
  {
    name: 'B4 Tuna Melt Wrap',
    category: 'breakfast',
    kcal_target: 800,
    instructions:
      'Drain tuna and mix with Greek yogurt. Fill whole-wheat wrap with tuna, cheese, cucumber, and avocado. Warm briefly to melt cheese if desired.',
    items: [
      ['whole-wheat wrap', 120],
      ['tuna in water (drained)', 120],
      ['mexican mix cheese', 30],
      ['cucumber', 100],
      ['avocado', 60],
      ['greek yogurt (0%)', 120],
    ],
  },
  {
    name: 'B5 Choc Protein Oat Bowl',
    category: 'breakfast',
    kcal_target: 800,
    instructions:
      'Cook oats in skim milk. Stir in ON Isolate and chopped dark chocolate. Fold in scrambled or soft-cooked egg. Serve warm.',
    items: [
      ['oats / oat powder', 125],
      ['on gold 100% isolate', 31],
      ['skim / no-fat milk', 200],
      ['dark chocolate (85%)', 17],
      ['whole eggs', 50],
    ],
  },
  // —— Lunch (~900) ——
  {
    name: 'L1 Beef & Sweet Potato Plate',
    category: 'lunch',
    kcal_target: 900,
    instructions:
      'Cook lean beef. Bake or steam sweet potato and broccoli. Plate with avocado and a sprinkle of Mexican mix cheese.',
    items: [
      ['beef (lean, cooked)', 170],
      ['sweet potato (baked)', 380],
      ['broccoli (cooked)', 150],
      ['avocado', 60],
      ['mexican mix cheese', 20],
    ],
  },
  {
    name: 'L2 Steak & Bread Plate',
    category: 'lunch',
    kcal_target: 900,
    instructions:
      'Grill or pan-sear sirloin steak. Serve with whole-wheat bread, cooked broccoli, avocado, and cucumber.',
    items: [
      ['steak (sirloin, cooked)', 150],
      ['whole-wheat bread', 170],
      ['broccoli (cooked)', 150],
      ['avocado', 60],
      ['cucumber', 100],
    ],
  },
  {
    name: 'L3 Tuna Oat Power Bowl',
    category: 'lunch',
    kcal_target: 900,
    instructions:
      'Cook oats. Flake drained tuna over oats with broccoli, avocado, and cucumber.',
    items: [
      ['tuna in water (drained)', 150],
      ['oats / oat powder', 150],
      ['broccoli (cooked)', 150],
      ['avocado', 60],
      ['cucumber', 100],
    ],
  },
  {
    name: 'L4 Beef Wrap',
    category: 'lunch',
    kcal_target: 900,
    instructions:
      'Fill wrap with cooked lean beef, Mexican mix cheese, and avocado. Serve sweet potato and broccoli on the side.',
    items: [
      ['whole-wheat wrap', 64],
      ['beef (lean, cooked)', 150],
      ['mexican mix cheese', 30],
      ['sweet potato (baked)', 220],
      ['broccoli (cooked)', 120],
      ['avocado', 35],
    ],
  },
  {
    name: 'L5 Steak Sweet-Potato Bowl',
    category: 'lunch',
    kcal_target: 900,
    instructions:
      'Cook sirloin steak. Bake sweet potato. Serve in a bowl with broccoli and avocado.',
    items: [
      ['steak (sirloin, cooked)', 165],
      ['sweet potato (baked)', 430],
      ['broccoli (cooked)', 150],
      ['avocado', 70],
    ],
  },
  // —— Dinner (~900, post-workout) ——
  {
    name: 'D1 Steak, Potato & Kiwi',
    category: 'dinner',
    kcal_target: 900,
    instructions:
      'Cook sirloin steak and sweet potato. Steam broccoli. Serve with sliced kiwi and a small amount of avocado.',
    items: [
      ['steak (sirloin, cooked)', 160],
      ['sweet potato (baked)', 390],
      ['kiwi', 220],
      ['broccoli (cooked)', 150],
      ['avocado', 15],
    ],
  },
  {
    name: 'D2 Beef & Berry Recovery Plate',
    category: 'dinner',
    kcal_target: 900,
    instructions:
      'Cook lean beef with sweet potato and broccoli. Serve berries and a glass of skim milk on the side.',
    items: [
      ['beef (lean, cooked)', 160],
      ['sweet potato (baked)', 380],
      ['berries (mixed)', 200],
      ['skim / no-fat milk', 250],
      ['broccoli (cooked)', 150],
    ],
  },
  {
    name: 'D3 Tuna, Potato & Fruit + Shake',
    category: 'dinner',
    kcal_target: 900,
    instructions:
      'Plate drained tuna with baked sweet potato, kiwi, berries, and avocado. Mix FITLife TRU ISO Plain as a shake.',
    items: [
      ['tuna in water (drained)', 120],
      ['sweet potato (baked)', 430],
      ['kiwi', 200],
      ['berries (mixed)', 150],
      ['fitlife tru iso plain', 36],
      ['avocado', 25],
    ],
  },
  {
    name: 'D4 Steak Recovery Shake Plate',
    category: 'dinner',
    kcal_target: 900,
    instructions:
      'Cook steak with sweet potato and broccoli. Serve berries and skim milk. Mix ON Whey as a recovery shake.',
    items: [
      ['steak (sirloin, cooked)', 120],
      ['sweet potato (baked)', 360],
      ['berries (mixed)', 160],
      ['skim / no-fat milk', 250],
      ['on gold 100% whey', 32],
      ['broccoli (cooked)', 100],
    ],
  },
  {
    name: 'D5 Beef, Potato & Kiwi Bowl',
    category: 'dinner',
    kcal_target: 900,
    instructions:
      'Cook lean beef and sweet potato. Steam broccoli. Finish with kiwi and a little avocado.',
    items: [
      ['beef (lean, cooked)', 170],
      ['sweet potato (baked)', 380],
      ['kiwi', 220],
      ['broccoli (cooked)', 150],
      ['avocado', 20],
    ],
  },
];

async function main() {
  const log = [];
  const byName = new Map();

  const { data: ingredients, error: listErr } = await sb
    .from('ingredients')
    .select('id,name,kcal,protein,fat,carbs');
  if (listErr) throw listErr;
  for (const row of ingredients) byName.set(norm(row.name), row);

  log.push(`Loaded ${ingredients.length} existing ingredients`);

  // Create missing ingredients
  for (const ing of NEW_INGREDIENTS) {
    const key = norm(ing.name);
    if (byName.has(key)) {
      log.push(`SKIP ingredient (exists): ${ing.name}`);
      continue;
    }
    const { data, error } = await sb.from('ingredients').insert(ing).select('*').single();
    if (error) {
      log.push(`FAIL ingredient ${ing.name}: ${error.message}`);
      throw error;
    }
    byName.set(norm(data.name), data);
    log.push(`ADD ingredient: ${data.name} (${data.kcal}/${data.protein}/${data.fat}/${data.carbs})`);
  }

  function resolvePlanKey(planKey) {
    const k = norm(planKey);
    const existingName = EXISTING_MAP[k];
    if (existingName) {
      const row = byName.get(norm(existingName));
      if (!row) throw new Error(`Mapped ingredient missing in DB: ${existingName} (for ${planKey})`);
      return { row, source: 'existing' };
    }
    const newName = NEW_MAP[k];
    if (newName) {
      const row = byName.get(norm(newName));
      if (!row) throw new Error(`New ingredient not found after insert: ${newName}`);
      return { row, source: 'new' };
    }
    throw new Error(`No mapping for plan ingredient: ${planKey}`);
  }

  let createdMeals = 0;
  let skippedMeals = 0;

  for (const meal of MEALS) {
    const { data: existingMeal } = await sb
      .from('meals')
      .select('id,name')
      .eq('name', meal.name)
      .maybeSingle();

    if (existingMeal) {
      log.push(`SKIP meal (exists): ${meal.name}`);
      skippedMeals += 1;
      continue;
    }

    const { data: mealRow, error: mealErr } = await sb
      .from('meals')
      .insert({
        name: meal.name,
        category: meal.category,
        is_template: true,
        kcal_target: meal.kcal_target,
        image: IMG[meal.category],
        cooking_instructions: meal.instructions,
      })
      .select('*')
      .single();

    if (mealErr) {
      // category column might not exist on older schema — retry without it
      if (/category/i.test(mealErr.message || '')) {
        const retry = await sb
          .from('meals')
          .insert({
            name: meal.name,
            is_template: true,
            kcal_target: meal.kcal_target,
            image: IMG[meal.category],
            cooking_instructions: meal.instructions,
          })
          .select('*')
          .single();
        if (retry.error) throw retry.error;
        Object.assign(mealRow || {}, retry.data);
        // continue with retry.data
        const mealId = retry.data.id;
        for (const [planKey, grams] of meal.items) {
          const { row } = resolvePlanKey(planKey);
          const { error: itemErr } = await sb.from('meal_items').insert({
            meal_id: mealId,
            ingredient_id: row.id,
            quantity_g: grams,
          });
          if (itemErr) throw itemErr;
        }
        createdMeals += 1;
        log.push(`ADD meal (no category col): ${meal.name} [${meal.items.length} items]`);
        continue;
      }
      throw mealErr;
    }

    for (const [planKey, grams] of meal.items) {
      const { row, source } = resolvePlanKey(planKey);
      const { error: itemErr } = await sb.from('meal_items').insert({
        meal_id: mealRow.id,
        ingredient_id: row.id,
        quantity_g: grams,
      });
      if (itemErr) {
        // some DBs use quantity instead of quantity_g
        if (/quantity_g/i.test(itemErr.message || '')) {
          const retry = await sb.from('meal_items').insert({
            meal_id: mealRow.id,
            ingredient_id: row.id,
            quantity: grams,
          });
          if (retry.error) throw retry.error;
        } else {
          throw itemErr;
        }
      }
      log.push(`  item: ${row.name} ${grams}g (${source})`);
    }

    createdMeals += 1;
    log.push(`ADD meal: ${meal.name} [${meal.category}, target ${meal.kcal_target}]`);
  }

  log.push(`DONE createdMeals=${createdMeals} skippedMeals=${skippedMeals}`);
  const out = path.join(__dirname, '_import_2600_meal_plan_log.txt');
  fs.writeFileSync(out, log.join('\n'), 'utf8');
  console.log(log.join('\n'));
  console.log('\nLog written to', out);
}

main().catch((e) => {
  console.error('IMPORT FAILED:', e.message || e);
  process.exit(1);
});
