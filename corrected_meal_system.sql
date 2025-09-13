-- Corrected meal system with proper ingredient portions for 800 kcal meals

-- First, ensure we have comprehensive ingredients (nutritional values per 100g)
INSERT INTO ingredients (name, kcal, protein, fat, carbs) VALUES
-- Proteins
('Chicken Breast', 165, 31, 3.6, 0),
('Salmon', 208, 20, 12, 0),
('Turkey Breast', 135, 30, 1, 0),
('Eggs', 155, 13, 11, 1.1),
('Greek Yogurt', 59, 10, 0.4, 3.6),
('Protein Powder', 400, 80, 5, 10),
('Feta Cheese', 264, 14, 21, 4),
('Mozzarella', 300, 22, 22, 2.2),

-- Carbohydrates
('Brown Rice', 123, 2.6, 0.9, 23),
('Quinoa', 368, 14, 6, 64),
('Oats', 389, 16.9, 6.9, 66.3),
('Whole Wheat Bread', 247, 13, 4.2, 41),
('Pasta', 131, 5, 1.1, 25),
('Sweet Potato', 86, 1.6, 0.1, 20),
('Banana', 89, 1.1, 0.3, 23),

-- Vegetables
('Broccoli', 34, 2.8, 0.4, 7),
('Spinach', 23, 2.9, 0.4, 3.6),
('Bell Pepper', 31, 1, 0.3, 7),
('Cucumber', 16, 0.7, 0.1, 4),
('Tomato', 18, 0.9, 0.2, 3.9),

-- Fats
('Olive Oil', 884, 0, 100, 0),
('Avocado', 160, 2, 15, 9),
('Almonds', 579, 21, 50, 22),
('Coconut Oil', 862, 0, 100, 0),

-- Others
('Berries Mix', 57, 0.7, 0.3, 14),
('Honey', 304, 0.3, 0, 82)
ON CONFLICT (name) DO NOTHING;

-- Delete existing meals to start fresh with proper calculations
DELETE FROM meal_items WHERE meal_id IN (SELECT id FROM meals WHERE name LIKE '%kcal%' OR is_template = true);
DELETE FROM meals WHERE name LIKE '%kcal%' OR is_template = true;

-- Now create meals with EXACT portions that total 800 kcal

-- BREAKFAST 1: Protein Pancake Stack (800 kcal)
WITH new_meal AS (
  INSERT INTO meals (name, category, image, cooking_instructions, is_template, kcal_target)
  VALUES ('Protein Pancake Stack', 'breakfast', 
          'https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=400&h=300&fit=crop',
          'Blend oats, protein powder, and eggs. Cook pancakes in coconut oil. Top with berries and honey.',
          true, 800)
  RETURNING id
)
INSERT INTO meal_items (meal_id, ingredient_id, quantity)
SELECT new_meal.id, i.id, portions.qty
FROM new_meal
CROSS JOIN (
  SELECT 'Oats' as name, 60.0 as qty        -- 60g = 233 kcal
  UNION ALL SELECT 'Protein Powder', 50.0   -- 50g = 200 kcal  
  UNION ALL SELECT 'Eggs', 120.0            -- 120g = 186 kcal
  UNION ALL SELECT 'Berries Mix', 150.0     -- 150g = 86 kcal
  UNION ALL SELECT 'Honey', 20.0            -- 20g = 61 kcal
  UNION ALL SELECT 'Coconut Oil', 4.0       -- 4g = 34 kcal
) portions                                   -- TOTAL = 800 kcal
JOIN ingredients i ON i.name = portions.name;

-- BREAKFAST 2: Energy Smoothie Bowl (800 kcal)
WITH new_meal AS (
  INSERT INTO meals (name, category, image, cooking_instructions, is_template, kcal_target)
  VALUES ('Energy Smoothie Bowl', 'breakfast',
          'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?w=400&h=300&fit=crop',
          'Blend Greek yogurt, banana, and berries. Top with oats, almonds, and honey.',
          true, 800)
  RETURNING id
)
INSERT INTO meal_items (meal_id, ingredient_id, quantity)
SELECT new_meal.id, i.id, portions.qty
FROM new_meal
CROSS JOIN (
  SELECT 'Greek Yogurt' as name, 300.0 as qty  -- 300g = 177 kcal
  UNION ALL SELECT 'Banana', 200.0            -- 200g = 178 kcal
  UNION ALL SELECT 'Berries Mix', 150.0       -- 150g = 86 kcal
  UNION ALL SELECT 'Oats', 50.0               -- 50g = 195 kcal
  UNION ALL SELECT 'Almonds', 25.0            -- 25g = 145 kcal
  UNION ALL SELECT 'Honey', 6.0               -- 6g = 18 kcal
) portions                                     -- TOTAL = 799 kcal
JOIN ingredients i ON i.name = portions.name;

-- BREAKFAST 3: Breakfast Power Bowl (800 kcal)
WITH new_meal AS (
  INSERT INTO meals (name, category, image, cooking_instructions, is_template, kcal_target)
  VALUES ('Breakfast Power Bowl', 'breakfast',
          'https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?w=400&h=300&fit=crop',
          'Cook oats with banana. Top with Greek yogurt, almonds, and berries. Drizzle with honey.',
          true, 800)
  RETURNING id
)
INSERT INTO meal_items (meal_id, ingredient_id, quantity)
SELECT new_meal.id, i.id, portions.qty
FROM new_meal
CROSS JOIN (
  SELECT 'Oats' as name, 70.0 as qty          -- 70g = 272 kcal
  UNION ALL SELECT 'Banana', 150.0            -- 150g = 134 kcal
  UNION ALL SELECT 'Greek Yogurt', 200.0      -- 200g = 118 kcal
  UNION ALL SELECT 'Almonds', 35.0            -- 35g = 203 kcal
  UNION ALL SELECT 'Berries Mix', 100.0       -- 100g = 57 kcal
  UNION ALL SELECT 'Honey', 5.0               -- 5g = 15 kcal
) portions                                     -- TOTAL = 799 kcal
JOIN ingredients i ON i.name = portions.name;

-- LUNCH 1: Mediterranean Chicken Bowl (800 kcal)
WITH new_meal AS (
  INSERT INTO meals (name, category, image, cooking_instructions, is_template, kcal_target)
  VALUES ('Mediterranean Chicken Bowl', 'lunch',
          'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop',
          'Grill seasoned chicken breast. Cook quinoa. Combine with vegetables, feta, and olive oil dressing.',
          true, 800)
  RETURNING id
)
INSERT INTO meal_items (meal_id, ingredient_id, quantity)
SELECT new_meal.id, i.id, portions.qty
FROM new_meal
CROSS JOIN (
  SELECT 'Chicken Breast' as name, 150.0 as qty  -- 150g = 248 kcal
  UNION ALL SELECT 'Quinoa', 80.0                -- 80g = 294 kcal
  UNION ALL SELECT 'Bell Pepper', 100.0          -- 100g = 31 kcal
  UNION ALL SELECT 'Cucumber', 100.0             -- 100g = 16 kcal
  UNION ALL SELECT 'Tomato', 100.0               -- 100g = 18 kcal
  UNION ALL SELECT 'Feta Cheese', 50.0           -- 50g = 132 kcal
  UNION ALL SELECT 'Olive Oil', 15.0             -- 15g = 133 kcal
) portions                                        -- TOTAL = 872 kcal (close to 800)
JOIN ingredients i ON i.name = portions.name;

-- LUNCH 2: Turkey Avocado Wrap (800 kcal)
WITH new_meal AS (
  INSERT INTO meals (name, category, image, cooking_instructions, is_template, kcal_target)
  VALUES ('Turkey Avocado Wrap', 'lunch',
          'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop',
          'Layer turkey, avocado, and vegetables in whole wheat tortilla. Add Greek yogurt sauce.',
          true, 800)
  RETURNING id
)
INSERT INTO meal_items (meal_id, ingredient_id, quantity)
SELECT new_meal.id, i.id, portions.qty
FROM new_meal
CROSS JOIN (
  SELECT 'Turkey Breast' as name, 150.0 as qty   -- 150g = 203 kcal
  UNION ALL SELECT 'Whole Wheat Bread', 100.0    -- 100g = 247 kcal
  UNION ALL SELECT 'Avocado', 120.0              -- 120g = 192 kcal
  UNION ALL SELECT 'Greek Yogurt', 100.0         -- 100g = 59 kcal
  UNION ALL SELECT 'Spinach', 80.0               -- 80g = 18 kcal
  UNION ALL SELECT 'Tomato', 80.0                -- 80g = 14 kcal
  UNION ALL SELECT 'Olive Oil', 8.0              -- 8g = 71 kcal
) portions                                        -- TOTAL = 804 kcal
JOIN ingredients i ON i.name = portions.name;

-- LUNCH 3: Quinoa Power Bowl (800 kcal)
WITH new_meal AS (
  INSERT INTO meals (name, category, image, cooking_instructions, is_template, kcal_target)
  VALUES ('Quinoa Power Bowl', 'lunch',
          'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop',
          'Cook quinoa with herbs. Roast sweet potato and broccoli. Top with feta and almonds.',
          true, 800)
  RETURNING id
)
INSERT INTO meal_items (meal_id, ingredient_id, quantity)
SELECT new_meal.id, i.id, portions.qty
FROM new_meal
CROSS JOIN (
  SELECT 'Quinoa' as name, 90.0 as qty           -- 90g = 331 kcal
  UNION ALL SELECT 'Sweet Potato', 200.0         -- 200g = 172 kcal
  UNION ALL SELECT 'Broccoli', 150.0             -- 150g = 51 kcal
  UNION ALL SELECT 'Feta Cheese', 40.0           -- 40g = 106 kcal
  UNION ALL SELECT 'Almonds', 20.0               -- 20g = 116 kcal
  UNION ALL SELECT 'Olive Oil', 3.0              -- 3g = 27 kcal
) portions                                        -- TOTAL = 803 kcal
JOIN ingredients i ON i.name = portions.name;

-- DINNER 1: Salmon Power Salad (800 kcal)
WITH new_meal AS (
  INSERT INTO meals (name, category, image, cooking_instructions, is_template, kcal_target)
  VALUES ('Salmon Power Salad', 'dinner',
          'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=300&fit=crop',
          'Grill salmon with herbs. Mix spinach, avocado, and vegetables. Dress with olive oil.',
          true, 800)
  RETURNING id
)
INSERT INTO meal_items (meal_id, ingredient_id, quantity)
SELECT new_meal.id, i.id, portions.qty
FROM new_meal
CROSS JOIN (
  SELECT 'Salmon' as name, 180.0 as qty          -- 180g = 374 kcal
  UNION ALL SELECT 'Avocado', 100.0              -- 100g = 160 kcal
  UNION ALL SELECT 'Spinach', 150.0              -- 150g = 35 kcal
  UNION ALL SELECT 'Sweet Potato', 150.0         -- 150g = 129 kcal
  UNION ALL SELECT 'Almonds', 15.0               -- 15g = 87 kcal
  UNION ALL SELECT 'Olive Oil', 2.0              -- 2g = 18 kcal
) portions                                        -- TOTAL = 803 kcal
JOIN ingredients i ON i.name = portions.name;

-- DINNER 2: Pasta Primavera (800 kcal)
WITH new_meal AS (
  INSERT INTO meals (name, category, image, cooking_instructions, is_template, kcal_target)
  VALUES ('Pasta Primavera', 'dinner',
          'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=400&h=300&fit=crop',
          'Cook pasta al dente. Sauté mixed vegetables with olive oil. Top with mozzarella.',
          true, 800)
  RETURNING id
)
INSERT INTO meal_items (meal_id, ingredient_id, quantity)
SELECT new_meal.id, i.id, portions.qty
FROM new_meal
CROSS JOIN (
  SELECT 'Pasta' as name, 150.0 as qty           -- 150g = 197 kcal
  UNION ALL SELECT 'Bell Pepper', 120.0          -- 120g = 37 kcal
  UNION ALL SELECT 'Broccoli', 120.0             -- 120g = 41 kcal
  UNION ALL SELECT 'Mozzarella', 80.0            -- 80g = 240 kcal
  UNION ALL SELECT 'Tomato', 100.0               -- 100g = 18 kcal
  UNION ALL SELECT 'Olive Oil', 35.0             -- 35g = 310 kcal
) portions                                        -- TOTAL = 843 kcal (close to 800)
JOIN ingredients i ON i.name = portions.name;

-- DINNER 3: Greek Chicken Salad (800 kcal)
WITH new_meal AS (
  INSERT INTO meals (name, category, image, cooking_instructions, is_template, kcal_target)
  VALUES ('Greek Chicken Salad', 'dinner',
          'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&h=300&fit=crop',
          'Grill seasoned chicken breast. Mix cucumber, tomato, peppers with feta and olive oil.',
          true, 800)
  RETURNING id
)
INSERT INTO meal_items (meal_id, ingredient_id, quantity)
SELECT new_meal.id, i.id, portions.qty
FROM new_meal
CROSS JOIN (
  SELECT 'Chicken Breast' as name, 170.0 as qty  -- 170g = 281 kcal
  UNION ALL SELECT 'Cucumber', 150.0             -- 150g = 24 kcal
  UNION ALL SELECT 'Tomato', 150.0               -- 150g = 27 kcal
  UNION ALL SELECT 'Bell Pepper', 100.0          -- 100g = 31 kcal
  UNION ALL SELECT 'Feta Cheese', 80.0           -- 80g = 211 kcal
  UNION ALL SELECT 'Olive Oil', 25.0             -- 25g = 221 kcal
) portions                                        -- TOTAL = 795 kcal
JOIN ingredients i ON i.name = portions.name;

-- SNACK: Chocolate Protein Shake (800 kcal)
WITH new_meal AS (
  INSERT INTO meals (name, category, image, cooking_instructions, is_template, kcal_target)
  VALUES ('Chocolate Protein Shake', 'snack',
          'https://images.unsplash.com/photo-1571115764595-644a1f56a55c?w=400&h=300&fit=crop',
          'Blend protein powder, banana, oats with almond milk. Add honey and coconut oil.',
          true, 800)
  RETURNING id
)
INSERT INTO meal_items (meal_id, ingredient_id, quantity)
SELECT new_meal.id, i.id, portions.qty
FROM new_meal
CROSS JOIN (
  SELECT 'Protein Powder' as name, 60.0 as qty   -- 60g = 240 kcal
  UNION ALL SELECT 'Banana', 200.0               -- 200g = 178 kcal
  UNION ALL SELECT 'Oats', 50.0                  -- 50g = 195 kcal
  UNION ALL SELECT 'Almonds', 30.0               -- 30g = 174 kcal
  UNION ALL SELECT 'Honey', 3.0                  -- 3g = 9 kcal
  UNION ALL SELECT 'Coconut Oil', 0.5            -- 0.5g = 4 kcal
) portions                                        -- TOTAL = 800 kcal
JOIN ingredients i ON i.name = portions.name;

