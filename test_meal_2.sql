-- =====================================================
-- TEST 2: Add a different meal (Oatmeal With Milk and Banana)
-- Using exact same approach as coach interface
-- =====================================================

-- Step 1: Add the meal (exactly like dbAddMeal function)
INSERT INTO meals (name, is_template, kcal_target, image, cooking_instructions)
VALUES (
    'Test Oatmeal With Milk and Banana', 
    true, 
    800, 
    'https://images.unsplash.com/photo-1506128183184-207d8b0b5e40?w=400&h=300&fit=crop', 
    'To make your meal, boil milk and add oatmeal, cooking until soft. Stir in a tablespoon of peanut butter. Top the oatmeal with sliced banana, dark chocolate and mixed nuts.'
);

-- Step 2: Add meal items (exactly like dbAddMealItem function)
INSERT INTO meal_items (meal_id, ingredient_id, quantity_g)
SELECT 
    (SELECT id FROM meals WHERE name = 'Test Oatmeal With Milk and Banana' LIMIT 1),
    i.id,
    portions.qty
FROM (
    SELECT 'Peanut Butter' as name, 20.0 as qty
    UNION ALL SELECT 'Oats', 100.0
    UNION ALL SELECT 'Whole Milk', 200.0
    UNION ALL SELECT 'Bananas', 100.0
    UNION ALL SELECT 'Mixed Nuts', 30.0
    UNION ALL SELECT 'Dark Chocolate, 70-85% Cacao', 20.0
) portions
JOIN ingredients i ON i.name = portions.name;

-- Step 3: Verify what we created
SELECT 
    m.name as meal_name,
    m.is_template,
    m.kcal_target,
    COUNT(mi.id) as ingredient_count
FROM meals m
LEFT JOIN meal_items mi ON m.id = mi.meal_id
WHERE m.name = 'Test Oatmeal With Milk and Banana'
GROUP BY m.id, m.name, m.is_template, m.kcal_target;

-- Step 4: Show the meal items details
SELECT 
    m.name as meal_name,
    i.name as ingredient_name,
    mi.quantity_g
FROM meals m
JOIN meal_items mi ON m.id = mi.meal_id
JOIN ingredients i ON mi.ingredient_id = i.id
WHERE m.name = 'Test Oatmeal With Milk and Banana'
ORDER BY i.name;

-- Step 5: Show all test meals we've created
SELECT 
    m.name as meal_name,
    m.is_template,
    m.kcal_target,
    COUNT(mi.id) as ingredient_count
FROM meals m
LEFT JOIN meal_items mi ON m.id = mi.meal_id
WHERE m.name LIKE 'Test %'
GROUP BY m.id, m.name, m.is_template, m.kcal_target
ORDER BY m.name;
