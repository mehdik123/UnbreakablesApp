-- Step-by-step meal setup - Execute each section one by one

-- STEP 1: Check current database structure
SELECT 'Current meals count:' as info, COUNT(*) as count FROM meals;
SELECT 'Current ingredients count:' as info, COUNT(*) as count FROM ingredients;

-- STEP 2: Add essential ingredients (if they don't exist)
INSERT INTO ingredients (name, kcal, protein, fat, carbs) VALUES
('Chicken Breast', 165, 31, 3.6, 0),
('Brown Rice', 123, 2.6, 0.9, 23),
('Quinoa', 368, 14, 6, 64),
('Salmon', 208, 20, 12, 0),
('Greek Yogurt', 59, 10, 0.4, 3.6),
('Oats', 389, 16.9, 6.9, 66.3),
('Eggs', 155, 13, 11, 1.1),
('Olive Oil', 884, 0, 100, 0),
('Avocado', 160, 2, 15, 9),
('Almonds', 579, 21, 50, 22)
ON CONFLICT (name) DO NOTHING;

-- STEP 3: Create one test meal first
INSERT INTO meals (name, category, image, cooking_instructions, is_template, kcal_target)
VALUES ('Test Protein Bowl', 'breakfast', 
        'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?w=400&h=300&fit=crop',
        'Mix Greek yogurt with oats and berries. Top with almonds.',
        true, 800)
ON CONFLICT (name) DO NOTHING;

-- STEP 4: Add meal items for the test meal
INSERT INTO meal_items (meal_id, ingredient_id, quantity)
SELECT m.id, i.id, portions.qty
FROM (SELECT id FROM meals WHERE name = 'Test Protein Bowl' LIMIT 1) m
CROSS JOIN (
  SELECT 'Greek Yogurt' as name, 400.0 as qty  -- 400g = 236 kcal
  UNION ALL SELECT 'Oats', 60.0               -- 60g = 233 kcal
  UNION ALL SELECT 'Almonds', 50.0            -- 50g = 290 kcal
  UNION ALL SELECT 'Olive Oil', 3.0           -- 3g = 27 kcal
) portions                                     -- TOTAL = 786 kcal
JOIN ingredients i ON i.name = portions.name
ON CONFLICT DO NOTHING;

-- STEP 5: Verify the test meal
SELECT 
  m.name,
  m.kcal_target,
  SUM(i.kcal * mi.quantity / 100) as calculated_kcal,
  COUNT(mi.id) as ingredient_count
FROM meals m
LEFT JOIN meal_items mi ON m.id = mi.meal_id
LEFT JOIN ingredients i ON mi.ingredient_id = i.id
WHERE m.name = 'Test Protein Bowl'
GROUP BY m.id, m.name, m.kcal_target;

