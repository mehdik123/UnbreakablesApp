-- =====================================================
-- DEBUG NaN ISSUE - Check actual data in database
-- =====================================================

-- Check ingredients that might have NULL or invalid nutritional values
SELECT 
    name,
    kcal,
    protein,
    fat,
    carbs,
    CASE 
        WHEN kcal IS NULL THEN 'NULL kcal'
        WHEN kcal = 0 THEN 'Zero kcal'
        WHEN kcal::text = 'NaN' THEN 'NaN kcal'
        ELSE 'Valid kcal'
    END as kcal_status,
    CASE 
        WHEN protein IS NULL THEN 'NULL protein'
        WHEN protein = 0 THEN 'Zero protein'
        WHEN protein::text = 'NaN' THEN 'NaN protein'
        ELSE 'Valid protein'
    END as protein_status
FROM ingredients 
WHERE name IN (
    'Chicken, Breast', '1 Avocado', 'Olive Oil', 'Broccoli', 
    'Spinach', 'Onion', 'Sweet Potato, Raw'
)
ORDER BY name;

-- Check meal_items for these specific ingredients
SELECT 
    m.name as meal_name,
    i.name as ingredient_name,
    mi.quantity_g,
    i.kcal,
    i.protein,
    i.fat,
    i.carbs,
    (mi.quantity_g * i.kcal / 100) as calculated_kcal,
    (mi.quantity_g * i.protein / 100) as calculated_protein
FROM meals m
JOIN meal_items mi ON m.id = mi.meal_id
JOIN ingredients i ON mi.ingredient_id = i.id
WHERE i.name IN (
    'Chicken, Breast', '1 Avocado', 'Olive Oil', 'Broccoli', 
    'Spinach', 'Onion', 'Sweet Potato, Raw'
)
ORDER BY m.name, i.name;

-- Check for any ingredients with NULL values
SELECT 
    name,
    kcal,
    protein,
    fat,
    carbs
FROM ingredients 
WHERE kcal IS NULL 
   OR protein IS NULL 
   OR fat IS NULL 
   OR carbs IS NULL
   OR kcal::text = 'NaN'
   OR protein::text = 'NaN'
   OR fat::text = 'NaN'
   OR carbs::text = 'NaN'
ORDER BY name;
