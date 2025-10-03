-- Fix nutritional values for ingredients that are missing them
-- This will update ingredients with proper nutritional data

UPDATE ingredients 
SET kcal = 155, protein = 13, fat = 11, carbs = 1.1
WHERE name = 'Eggs' AND (kcal IS NULL OR kcal = 0);

UPDATE ingredients 
SET kcal = 403, protein = 25, fat = 33, carbs = 1.3
WHERE name = 'Cheddar Cheese' AND (kcal IS NULL OR kcal = 0);

UPDATE ingredients 
SET kcal = 247, protein = 13, fat = 4.2, carbs = 41
WHERE name = 'Whole Wheat Bread' AND (kcal IS NULL OR kcal = 0);

UPDATE ingredients 
SET kcal = 23, protein = 2.9, fat = 0.4, carbs = 3.6
WHERE name = 'Spinach' AND (kcal IS NULL OR kcal = 0);

UPDATE ingredients 
SET kcal = 884, protein = 0, fat = 100, carbs = 0
WHERE name = 'Olive Oil' AND (kcal IS NULL OR kcal = 0);

UPDATE ingredients 
SET kcal = 61, protein = 3.2, fat = 3.3, carbs = 4.8
WHERE name = 'Whole Milk' AND (kcal IS NULL OR kcal = 0);

UPDATE ingredients 
SET kcal = 389, protein = 16.9, fat = 6.9, carbs = 66.3
WHERE name = 'Oats' AND (kcal IS NULL OR kcal = 0);

UPDATE ingredients 
SET kcal = 57, protein = 0.7, fat = 0.3, carbs = 14
WHERE name = 'Blueberries' AND (kcal IS NULL OR kcal = 0);

UPDATE ingredients 
SET kcal = 89, protein = 1.1, fat = 0.3, carbs = 23
WHERE name = 'Bananas' AND (kcal IS NULL OR kcal = 0);

UPDATE ingredients 
SET kcal = 588, protein = 25, fat = 50, carbs = 20
WHERE name = 'Peanut Butter' AND (kcal IS NULL OR kcal = 0);

UPDATE ingredients 
SET kcal = 607, protein = 20, fat = 54, carbs = 21
WHERE name = 'Mixed Nuts' AND (kcal IS NULL OR kcal = 0);

UPDATE ingredients 
SET kcal = 598, protein = 7.8, fat = 43, carbs = 46
WHERE name = 'Dark Chocolate, 70-85% Cacao' AND (kcal IS NULL OR kcal = 0);

-- Check the results
SELECT 
    name,
    kcal,
    protein,
    fat,
    carbs
FROM ingredients 
WHERE name IN (
    'Eggs', 'Cheddar Cheese', 'Whole Wheat Bread', 'Spinach', 
    'Olive Oil', 'Whole Milk', 'Oats', 'Blueberries', 'Bananas',
    'Peanut Butter', 'Mixed Nuts', 'Dark Chocolate, 70-85% Cacao'
)
ORDER BY name;
