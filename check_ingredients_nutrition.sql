-- Check the nutritional values of ingredients in your database
SELECT 
    name,
    kcal,
    protein,
    fat,
    carbs,
    CASE 
        WHEN kcal IS NULL THEN 'NULL kcal'
        WHEN kcal = 0 THEN 'Zero kcal'
        ELSE 'Has kcal'
    END as kcal_status,
    CASE 
        WHEN protein IS NULL THEN 'NULL protein'
        WHEN protein = 0 THEN 'Zero protein'
        ELSE 'Has protein'
    END as protein_status
FROM ingredients 
WHERE name IN (
    'Eggs', 'Cheddar Cheese', 'Whole Wheat Bread', 'Spinach', 
    'Olive Oil', 'Whole Milk', 'Oats', 'Blueberries', 'Bananas',
    'Peanut Butter', 'Mixed Nuts', 'Dark Chocolate, 70-85% Cacao'
)
ORDER BY name;
