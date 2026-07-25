-- Add missing Orange Juice + link to Scrambled Eggs With Avocado And Shrimps
-- Clear editor, paste ONLY this, Run. If RLS warning → Run without RLS.
-- Macros: USDA unsweetened OJ per 100g. 1 cup = 249g.

INSERT INTO ingredients (name, kcal, protein, fat, carbs)
SELECT 'Orange Juice', 47, 1, 0, 11
WHERE NOT EXISTS (
  SELECT 1 FROM ingredients WHERE lower(trim(name)) = 'orange juice'
);

INSERT INTO meal_items (meal_id, ingredient_id, quantity_g)
SELECT m.id, i.id, 249
FROM meals m
JOIN ingredients i ON i.name = 'Orange Juice'
WHERE m.name = 'Scrambled Eggs With Avocado And Shrimps'
  AND NOT EXISTS (
    SELECT 1 FROM meal_items mi
    WHERE mi.meal_id = m.id AND mi.ingredient_id = i.id
  );
