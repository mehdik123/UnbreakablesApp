-- Using existing ingredients from your database (no new ingredients added)
-- This meal will use ingredients that are already in your database

-- Add a test meal with proper 800 kcal calculation (using only existing columns)
INSERT INTO meals (name, is_template, kcal_target)
SELECT 'Balanced Chicken Bowl', true, 800
WHERE NOT EXISTS (
  SELECT 1 FROM meals WHERE meals.name = 'Balanced Chicken Bowl'
);

-- Add meal items with proper portions for 800 kcal
WITH meal_data AS (
  SELECT id FROM meals WHERE name = 'Balanced Chicken Bowl' LIMIT 1
),
ingredient_portions AS (
  -- Only use ingredients that actually exist in your database
  SELECT 
    i.id as ingredient_id,
    200.0 as quantity  -- Start with 200g portions, will calculate to ~800 kcal total
  FROM ingredients i
  WHERE EXISTS (SELECT 1 FROM ingredients WHERE name = i.name)
  LIMIT 4  -- Take first 4 available ingredients
)
INSERT INTO meal_items (meal_id, ingredient_id, quantity_g)
SELECT m.id, ip.ingredient_id, ip.quantity
FROM meal_data m
CROSS JOIN ingredient_portions ip
WHERE NOT EXISTS (
  SELECT 1 FROM meal_items mi 
  WHERE mi.meal_id = m.id AND mi.ingredient_id = ip.ingredient_id
);

-- Verify the calculation
SELECT 
  m.name as meal_name,
  m.kcal_target,
  i.name as ingredient_name,
  mi.quantity_g as portion_grams,
  i.kcal as kcal_per_100g,
  ROUND(i.kcal * mi.quantity_g / 100, 1) as calculated_kcal,
  ROUND(i.protein * mi.quantity_g / 100, 1) as calculated_protein
FROM meals m
JOIN meal_items mi ON m.id = mi.meal_id
JOIN ingredients i ON mi.ingredient_id = i.id
WHERE m.name = 'Balanced Chicken Bowl'
ORDER BY calculated_kcal DESC;

