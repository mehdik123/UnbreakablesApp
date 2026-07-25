-- =====================================================
-- 1) Fix Avocado ingredient
-- 2) Add meal: Scrambled Eggs With Avocado And Philadelphia
-- Clear SQL editor, paste ONLY this, Run.
-- If RLS warning appears → Run without RLS (false positive).
-- =====================================================

-- --- A) Avocado cleanup ---
-- Create Avocado using macros from "1 Avocado" (240 / 3 / 22 / 13)
INSERT INTO ingredients (name, kcal, protein, fat, carbs)
SELECT 'Avocado', 240, 3, 22, 13
WHERE NOT EXISTS (
  SELECT 1 FROM ingredients WHERE lower(trim(name)) = 'avocado'
);

UPDATE ingredients
SET kcal = 240, protein = 3, fat = 22, carbs = 13
WHERE lower(trim(name)) = 'avocado';

-- Repoint any meal_items still using 1 Avocado / 1/2 Avocado
UPDATE meal_items
SET ingredient_id = (SELECT id FROM ingredients WHERE lower(trim(name)) = 'avocado' LIMIT 1)
WHERE ingredient_id IN (
  SELECT id FROM ingredients
  WHERE lower(trim(name)) IN ('1 avocado', '1/2 avocado')
);

DELETE FROM ingredients
WHERE lower(trim(name)) IN ('1 avocado', '1/2 avocado');

-- --- B) Ensure meal-specific ingredients exist (skip if already there) ---
INSERT INTO ingredients (name, kcal, protein, fat, carbs)
SELECT 'Philadelphia', 146, 8, 10, 7
WHERE NOT EXISTS (
  SELECT 1 FROM ingredients WHERE lower(trim(name)) = 'philadelphia'
);

INSERT INTO ingredients (name, kcal, protein, fat, carbs)
SELECT 'Whole Bread Toast', 256, 10, 3, 46
WHERE NOT EXISTS (
  SELECT 1 FROM ingredients WHERE lower(trim(name)) = 'whole bread toast'
);

-- --- C) Insert meal ---
INSERT INTO meals (name, is_template, kcal_target, image, cooking_instructions)
VALUES (
  'Scrambled Eggs With Avocado And Philadelphia',
  true,
  600,
  'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400&h=300&fit=crop',
  'Heat the olive oil in a non-stick skillet and scramble the eggs with a splash of whole milk until soft and creamy. Toast the whole bread, spread Philadelphia over it, and top with sliced avocado and the scrambled eggs. Serve warm.'
);

INSERT INTO meal_items (meal_id, ingredient_id, quantity_g)
VALUES
(
  (SELECT id FROM meals WHERE name = 'Scrambled Eggs With Avocado And Philadelphia' LIMIT 1),
  (SELECT id FROM ingredients WHERE name = 'Eggs' LIMIT 1),
  150
),
(
  (SELECT id FROM meals WHERE name = 'Scrambled Eggs With Avocado And Philadelphia' LIMIT 1),
  (SELECT id FROM ingredients WHERE name = 'Avocado' LIMIT 1),
  50
),
(
  (SELECT id FROM meals WHERE name = 'Scrambled Eggs With Avocado And Philadelphia' LIMIT 1),
  (SELECT id FROM ingredients WHERE name = 'Philadelphia' LIMIT 1),
  30
),
(
  (SELECT id FROM meals WHERE name = 'Scrambled Eggs With Avocado And Philadelphia' LIMIT 1),
  (SELECT id FROM ingredients WHERE name = 'Whole Bread Toast' LIMIT 1),
  30
),
(
  (SELECT id FROM meals WHERE name = 'Scrambled Eggs With Avocado And Philadelphia' LIMIT 1),
  (SELECT id FROM ingredients WHERE name = 'Olive Oil' LIMIT 1),
  5
),
(
  (SELECT id FROM meals WHERE name = 'Scrambled Eggs With Avocado And Philadelphia' LIMIT 1),
  (SELECT id FROM ingredients WHERE name = 'Whole Milk' LIMIT 1),
  150
);
