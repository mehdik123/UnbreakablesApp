-- Fix: Green Bean (singular) — not "Green Beans"
-- Clear SQL editor, paste ONLY this, Run.
-- If RLS warning → Run without RLS.

-- Remove failed/partial meal if it exists without proper items
DELETE FROM meal_items
WHERE meal_id IN (
  SELECT id FROM meals WHERE name = 'Rice & Chicken Breast With Green Beans & Cucumber'
);

DELETE FROM meals
WHERE name = 'Rice & Chicken Breast With Green Beans & Cucumber';

INSERT INTO ingredients (name, kcal, protein, fat, carbs)
SELECT 'Basmati Rice', 360, 9, 2, 76
WHERE NOT EXISTS (
  SELECT 1 FROM ingredients WHERE lower(trim(name)) = 'basmati rice'
);

INSERT INTO meals (name, is_template, kcal_target, image, cooking_instructions)
VALUES (
  'Rice & Chicken Breast With Green Beans & Cucumber',
  true,
  550,
  'https://images.unsplash.com/photo-1598103442345-02627b0b0758?w=400&h=300&fit=crop',
  'Cook the basmati rice in boiled water until soft. Steam or boil the green beans until tender. Pan-fry the chicken breast in olive oil until golden and cooked through, then slice it. Serve the chicken over the rice with green beans, fresh cucumber, and grated cheese on top.'
);

INSERT INTO meal_items (meal_id, ingredient_id, quantity_g)
VALUES
(
  (SELECT id FROM meals WHERE name = 'Rice & Chicken Breast With Green Beans & Cucumber' LIMIT 1),
  (SELECT id FROM ingredients WHERE name = 'Basmati Rice' LIMIT 1),
  50
),
(
  (SELECT id FROM meals WHERE name = 'Rice & Chicken Breast With Green Beans & Cucumber' LIMIT 1),
  (SELECT id FROM ingredients WHERE name = 'Chicken Breast, Raw' LIMIT 1),
  200
),
(
  (SELECT id FROM meals WHERE name = 'Rice & Chicken Breast With Green Beans & Cucumber' LIMIT 1),
  (SELECT id FROM ingredients WHERE name = 'Cucumber' LIMIT 1),
  100
),
(
  (SELECT id FROM meals WHERE name = 'Rice & Chicken Breast With Green Beans & Cucumber' LIMIT 1),
  (SELECT id FROM ingredients WHERE name = 'Olive Oil' LIMIT 1),
  5
),
(
  (SELECT id FROM meals WHERE name = 'Rice & Chicken Breast With Green Beans & Cucumber' LIMIT 1),
  (SELECT id FROM ingredients WHERE name = 'Green Bean' LIMIT 1),
  100
),
(
  (SELECT id FROM meals WHERE name = 'Rice & Chicken Breast With Green Beans & Cucumber' LIMIT 1),
  (SELECT id FROM ingredients WHERE name = 'Cheese, Regular' LIMIT 1),
  25
);
