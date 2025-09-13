-- Quick fix: Add one properly calculated meal to test the system

-- First, let's add some basic ingredients if they don't exist
INSERT INTO ingredients (name, kcal, protein, fat, carbs) VALUES
('Chicken Breast', 165, 31, 3.6, 0),
('Brown Rice', 123, 2.6, 0.9, 23),
('Broccoli', 34, 2.8, 0.4, 7),
('Olive Oil', 884, 0, 100, 0)
ON CONFLICT (name) DO NOTHING;

-- Add one test meal with proper calculation
INSERT INTO meals (name, category, image, cooking_instructions, is_template, kcal_target)
VALUES (
  'Chicken Rice Bowl',
  'lunch',
  'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop',
  'Grill chicken breast. Steam rice and broccoli. Drizzle with olive oil.',
  true,
  800
);

-- Get the meal ID and add ingredients
WITH meal_id AS (
  SELECT id FROM meals WHERE name = 'Chicken Rice Bowl' ORDER BY id DESC LIMIT 1
)
INSERT INTO meal_items (meal_id, ingredient_id, quantity)
SELECT 
  meal_id.id,
  i.id,
  CASE 
    WHEN i.name = 'Chicken Breast' THEN 200.0  -- 200g = 330 kcal
    WHEN i.name = 'Brown Rice' THEN 150.0      -- 150g = 185 kcal
    WHEN i.name = 'Broccoli' THEN 200.0        -- 200g = 68 kcal
    WHEN i.name = 'Olive Oil' THEN 25.0        -- 25g = 221 kcal
  END as quantity                              -- TOTAL = 804 kcal
FROM meal_id
CROSS JOIN ingredients i
WHERE i.name IN ('Chicken Breast', 'Brown Rice', 'Broccoli', 'Olive Oil');

