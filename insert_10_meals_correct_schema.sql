-- Insert 10 sample meals with correct schema matching your database
-- Based on console output: id, name, is_template, kcal_target, meal_items

-- First, ensure we have some basic ingredients (if they don't exist)
INSERT INTO ingredients (name, kcal, protein, fat, carbs) VALUES
('Chicken Breast', 165, 31, 3.6, 0),
('Brown Rice', 123, 2.6, 0.9, 23),
('Broccoli', 34, 2.8, 0.4, 7),
('Olive Oil', 884, 0, 100, 0),
('Eggs', 155, 13, 11, 1.1),
('Whole Wheat Bread', 247, 13, 4.2, 41),
('Avocado', 160, 2, 15, 9),
('Greek Yogurt', 59, 10, 0.4, 3.6),
('Oats', 389, 16.9, 6.9, 66.3),
('Banana', 89, 1.1, 0.3, 23),
('Salmon', 208, 20, 12, 0),
('Sweet Potato', 86, 1.6, 0.1, 20),
('Spinach', 23, 2.9, 0.4, 3.6),
('Almonds', 579, 21, 50, 22),
('Quinoa', 368, 14, 6, 64),
('Turkey Breast', 135, 30, 1, 0),
('Bell Pepper', 31, 1, 0.3, 7),
('Cucumber', 16, 0.7, 0.1, 4),
('Tomato', 18, 0.9, 0.2, 3.9),
('Feta Cheese', 264, 14, 21, 4),
('Pasta', 131, 5, 1.1, 25),
('Mozzarella', 300, 22, 22, 2.2),
('Coconut Oil', 862, 0, 100, 0),
('Protein Powder', 400, 80, 5, 10),
('Berries Mix', 57, 0.7, 0.3, 14),
('Honey', 304, 0.3, 0, 82)
ON CONFLICT (name) DO NOTHING;

-- Insert meals with your schema structure
INSERT INTO meals (name, category, image, cooking_instructions, is_template, kcal_target) VALUES
('Mediterranean Chicken Bowl', 'lunch', 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop', 'Season chicken with herbs, grill until cooked through. Cook quinoa according to package instructions. Sauté vegetables with olive oil. Combine in bowl and serve.', true, 800),
('Protein Pancake Stack', 'breakfast', 'https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=400&h=300&fit=crop', 'Mix oats, protein powder, and egg. Cook pancakes in coconut oil. Top with berries and honey drizzle.', true, 800),
('Salmon Power Salad', 'dinner', 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=300&fit=crop', 'Grill salmon with lemon and herbs. Mix spinach, avocado, and vegetables. Dress with olive oil and serve with sweet potato.', true, 800),
('Energy Smoothie Bowl', 'breakfast', 'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?w=400&h=300&fit=crop', 'Blend Greek yogurt, banana, and berries. Top with oats, almonds, and honey. Serve chilled.', true, 800),
('Turkey Avocado Wrap', 'lunch', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop', 'Layer turkey, avocado, and vegetables in whole wheat tortilla. Add Greek yogurt sauce and wrap tightly.', true, 800),
('Pasta Primavera', 'dinner', 'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=400&h=300&fit=crop', 'Cook pasta al dente. Sauté mixed vegetables with garlic and olive oil. Toss with pasta and top with mozzarella.', true, 800),
('Quinoa Power Bowl', 'lunch', 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop', 'Cook quinoa with herbs. Roast sweet potato and broccoli. Combine with feta cheese and almonds.', true, 800),
('Chocolate Protein Shake', 'snack', 'https://images.unsplash.com/photo-1571115764595-644a1f56a55c?w=400&h=300&fit=crop', 'Blend protein powder, banana, oats, and almond milk. Add honey to taste and serve over ice.', true, 800),
('Greek Chicken Salad', 'dinner', 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&h=300&fit=crop', 'Grill seasoned chicken breast. Mix cucumber, tomato, bell pepper with feta. Dress with olive oil and lemon.', true, 800),
('Breakfast Power Bowl', 'breakfast', 'https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?w=400&h=300&fit=crop', 'Cook oats with banana. Top with Greek yogurt, almonds, and berries. Drizzle with honey and coconut oil.', true, 800);

-- Now add meal_items for each meal to reach ~800 kcal
-- Meal 1: Mediterranean Chicken Bowl
WITH meal_id AS (SELECT id FROM meals WHERE name = 'Mediterranean Chicken Bowl' LIMIT 1)
INSERT INTO meal_items (meal_id, ingredient_id, quantity)
SELECT meal_id.id, i.id, quantities.qty
FROM meal_id
CROSS JOIN (
  SELECT 'Chicken Breast' as ing_name, 150 as qty
  UNION ALL SELECT 'Quinoa', 80
  UNION ALL SELECT 'Bell Pepper', 100
  UNION ALL SELECT 'Cucumber', 50
  UNION ALL SELECT 'Olive Oil', 15
  UNION ALL SELECT 'Feta Cheese', 30
) quantities
JOIN ingredients i ON i.name = quantities.ing_name;

-- Meal 2: Protein Pancake Stack
WITH meal_id AS (SELECT id FROM meals WHERE name = 'Protein Pancake Stack' LIMIT 1)
INSERT INTO meal_items (meal_id, ingredient_id, quantity)
SELECT meal_id.id, i.id, quantities.qty
FROM meal_id
CROSS JOIN (
  SELECT 'Oats' as ing_name, 80 as qty
  UNION ALL SELECT 'Protein Powder', 60
  UNION ALL SELECT 'Eggs', 100
  UNION ALL SELECT 'Berries Mix', 150
  UNION ALL SELECT 'Honey', 25
  UNION ALL SELECT 'Coconut Oil', 10
) quantities
JOIN ingredients i ON i.name = quantities.ing_name;

-- Meal 3: Salmon Power Salad
WITH meal_id AS (SELECT id FROM meals WHERE name = 'Salmon Power Salad' LIMIT 1)
INSERT INTO meal_items (meal_id, ingredient_id, quantity)
SELECT meal_id.id, i.id, quantities.qty
FROM meal_id
CROSS JOIN (
  SELECT 'Salmon' as ing_name, 150 as qty
  UNION ALL SELECT 'Avocado', 100
  UNION ALL SELECT 'Spinach', 150
  UNION ALL SELECT 'Sweet Potato', 200
  UNION ALL SELECT 'Olive Oil', 15
  UNION ALL SELECT 'Almonds', 30
) quantities
JOIN ingredients i ON i.name = quantities.ing_name;

-- Meal 4: Energy Smoothie Bowl
WITH meal_id AS (SELECT id FROM meals WHERE name = 'Energy Smoothie Bowl' LIMIT 1)
INSERT INTO meal_items (meal_id, ingredient_id, quantity)
SELECT meal_id.id, i.id, quantities.qty
FROM meal_id
CROSS JOIN (
  SELECT 'Greek Yogurt' as ing_name, 200 as qty
  UNION ALL SELECT 'Banana', 150
  UNION ALL SELECT 'Berries Mix', 100
  UNION ALL SELECT 'Oats', 60
  UNION ALL SELECT 'Almonds', 40
  UNION ALL SELECT 'Honey', 30
) quantities
JOIN ingredients i ON i.name = quantities.ing_name;

-- Meal 5: Turkey Avocado Wrap
WITH meal_id AS (SELECT id FROM meals WHERE name = 'Turkey Avocado Wrap' LIMIT 1)
INSERT INTO meal_items (meal_id, ingredient_id, quantity)
SELECT meal_id.id, i.id, quantities.qty
FROM meal_id
CROSS JOIN (
  SELECT 'Turkey Breast' as ing_name, 150 as qty
  UNION ALL SELECT 'Avocado', 100
  UNION ALL SELECT 'Whole Wheat Bread', 80
  UNION ALL SELECT 'Greek Yogurt', 100
  UNION ALL SELECT 'Spinach', 50
  UNION ALL SELECT 'Tomato', 50
) quantities
JOIN ingredients i ON i.name = quantities.ing_name;

-- Meal 6: Pasta Primavera
WITH meal_id AS (SELECT id FROM meals WHERE name = 'Pasta Primavera' LIMIT 1)
INSERT INTO meal_items (meal_id, ingredient_id, quantity)
SELECT meal_id.id, i.id, quantities.qty
FROM meal_id
CROSS JOIN (
  SELECT 'Pasta' as ing_name, 120 as qty
  UNION ALL SELECT 'Bell Pepper', 100
  UNION ALL SELECT 'Broccoli', 100
  UNION ALL SELECT 'Mozzarella', 60
  UNION ALL SELECT 'Olive Oil', 20
) quantities
JOIN ingredients i ON i.name = quantities.ing_name;

-- Meal 7: Quinoa Power Bowl
WITH meal_id AS (SELECT id FROM meals WHERE name = 'Quinoa Power Bowl' LIMIT 1)
INSERT INTO meal_items (meal_id, ingredient_id, quantity)
SELECT meal_id.id, i.id, quantities.qty
FROM meal_id
CROSS JOIN (
  SELECT 'Quinoa' as ing_name, 80 as qty
  UNION ALL SELECT 'Sweet Potato', 200
  UNION ALL SELECT 'Broccoli', 150
  UNION ALL SELECT 'Feta Cheese', 50
  UNION ALL SELECT 'Almonds', 30
  UNION ALL SELECT 'Olive Oil', 15
) quantities
JOIN ingredients i ON i.name = quantities.ing_name;

-- Meal 8: Chocolate Protein Shake
WITH meal_id AS (SELECT id FROM meals WHERE name = 'Chocolate Protein Shake' LIMIT 1)
INSERT INTO meal_items (meal_id, ingredient_id, quantity)
SELECT meal_id.id, i.id, quantities.qty
FROM meal_id
CROSS JOIN (
  SELECT 'Protein Powder' as ing_name, 80 as qty
  UNION ALL SELECT 'Banana', 150
  UNION ALL SELECT 'Oats', 60
  UNION ALL SELECT 'Almonds', 40
  UNION ALL SELECT 'Honey', 30
  UNION ALL SELECT 'Coconut Oil', 10
) quantities
JOIN ingredients i ON i.name = quantities.ing_name;

-- Meal 9: Greek Chicken Salad
WITH meal_id AS (SELECT id FROM meals WHERE name = 'Greek Chicken Salad' LIMIT 1)
INSERT INTO meal_items (meal_id, ingredient_id, quantity)
SELECT meal_id.id, i.id, quantities.qty
FROM meal_id
CROSS JOIN (
  SELECT 'Chicken Breast' as ing_name, 150 as qty
  UNION ALL SELECT 'Cucumber', 100
  UNION ALL SELECT 'Tomato', 100
  UNION ALL SELECT 'Bell Pepper', 80
  UNION ALL SELECT 'Feta Cheese', 60
  UNION ALL SELECT 'Olive Oil', 20
) quantities
JOIN ingredients i ON i.name = quantities.ing_name;

-- Meal 10: Breakfast Power Bowl
WITH meal_id AS (SELECT id FROM meals WHERE name = 'Breakfast Power Bowl' LIMIT 1)
INSERT INTO meal_items (meal_id, ingredient_id, quantity)
SELECT meal_id.id, i.id, quantities.qty
FROM meal_id
CROSS JOIN (
  SELECT 'Oats' as ing_name, 80 as qty
  UNION ALL SELECT 'Banana', 150
  UNION ALL SELECT 'Greek Yogurt', 150
  UNION ALL SELECT 'Almonds', 40
  UNION ALL SELECT 'Berries Mix', 100
  UNION ALL SELECT 'Honey', 25
  UNION ALL SELECT 'Coconut Oil', 10
) quantities
JOIN ingredients i ON i.name = quantities.ing_name;

