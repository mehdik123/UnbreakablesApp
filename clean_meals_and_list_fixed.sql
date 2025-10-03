-- =====================================================
-- CLEAN MEALS AND LIST REMAINING
-- Remove meals with 0 ingredients and list the rest
-- =====================================================

-- Step 1: Remove all meals that have 0 ingredients
DELETE FROM meals 
WHERE id IN (
    SELECT m.id 
    FROM meals m 
    LEFT JOIN meal_items mi ON m.id = mi.meal_id 
    WHERE mi.meal_id IS NULL
);

-- Step 2: List all remaining meals with their details
SELECT 
    m.name as meal_name, 
    m.is_template,
    m.kcal_target,
    COUNT(mi.id) as ingredient_count,
    ROUND(SUM(mi.quantity_g * i.kcal / 100), 2) as calculated_calories,
    ROUND(SUM(mi.quantity_g * i.protein / 100), 2) as calculated_protein,
    ROUND(SUM(mi.quantity_g * i.fat / 100), 2) as calculated_fat,
    ROUND(SUM(mi.quantity_g * i.carbs / 100), 2) as calculated_carbs
FROM meals m 
LEFT JOIN meal_items mi ON m.id = mi.meal_id 
LEFT JOIN ingredients i ON mi.ingredient_id = i.id
WHERE m.is_template = true 
GROUP BY m.id, m.name, m.is_template, m.kcal_target
ORDER BY m.name;

-- Step 3: Show total count of remaining meals
SELECT COUNT(*) as total_meals_remaining FROM meals WHERE is_template = true;
