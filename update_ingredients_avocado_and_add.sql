-- Remove fractional avocado ingredients, add per-100g Avocado + new ingredients from coach list
-- Safe to re-run: skips names that already exist

-- Ensure Avocado (per 100g) exists before re-pointing meal_items
INSERT INTO ingredients (name, kcal, protein, fat, carbs)
SELECT 'Avocado', 240, 3, 22, 13
WHERE NOT EXISTS (
  SELECT 1 FROM ingredients WHERE lower(trim(name)) = 'avocado'
);

-- Point meals that used 1 Avocado / 1/2 Avocado to the standard Avocado entry
UPDATE meal_items mi
SET ingredient_id = av.id
FROM ingredients av
WHERE lower(trim(av.name)) = 'avocado'
  AND mi.ingredient_id IN (
    SELECT id FROM ingredients
    WHERE lower(trim(name)) IN ('1 avocado', '1/2 avocado')
  );

DELETE FROM ingredients
WHERE lower(trim(name)) IN ('1 avocado', '1/2 avocado');

INSERT INTO ingredients (name, kcal, protein, fat, carbs)
SELECT v.name, v.kcal, v.protein, v.fat, v.carbs
FROM (VALUES
  ('Whole Bread Toast', 256, 10, 3, 46),
  ('Shrimps', 100, 23, 2, 2),
  ('Basmati Rice', 360, 9, 2, 76),
  ('Pineapple', 83, 1, 0, 22),
  ('Dark Chocolate, 90%', 590, 14, 91, 12),
  ('Philadelphia', 146, 8, 10, 7),
  ('Smoked Salmon', 184, 13, 10, 0),
  ('Mass Gainer Superior', 360, 28, 2, 58),
  ('Perly', 97, 8, 3, 9)
) AS v(name, kcal, protein, fat, carbs)
WHERE NOT EXISTS (
  SELECT 1 FROM ingredients e WHERE lower(trim(e.name)) = lower(trim(v.name))
);

-- Refresh Avocado macros if an older row exists with different values
UPDATE ingredients
SET kcal = 240, protein = 3, fat = 22, carbs = 13
WHERE lower(trim(name)) = 'avocado';
