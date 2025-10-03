-- =====================================================
-- TEST: Add 1 meal using the exact same approach as coach interface
-- =====================================================

-- Step 1: Add the meal (exactly like dbAddMeal function)
INSERT INTO meals (name, is_template, kcal_target, image, cooking_instructions)
VALUES (
    'Test Cheesy Scrambled Eggs', 
    true, 
    800, 
    'https://images.unsplash.com/photo-1495214783159-3503fd1b572d?w=400&h=300&fit=crop', 
    'Beat eggs and blend them with finely chopped spinach. Heat a tablespoon of olive oil in a non-stick skillet, and pour in the egg mixture. As the eggs begin to set, sprinkle over the reduced amount of shredded cheese. Serve this alongside a slice of toasted whole bread and a cup of Milk'
);

-- Step 2: Get the meal ID (we need this for meal_items)
-- Let's check what we just inserted
SELECT id, name FROM meals WHERE name = 'Test Cheesy Scrambled Eggs';

-- Step 3: Add meal items (exactly like dbAddMealItem function)
-- First, let's check what ingredients we have available
SELECT name, id FROM ingredients WHERE name IN ('Eggs', 'Cheddar Cheese', 'Whole Wheat Bread', 'Spinach', 'Olive Oil', 'Whole Milk') LIMIT 10;

-- Step 4: Add meal items for our test meal
-- We'll use the meal ID from step 2 and ingredient IDs from step 3
INSERT INTO meal_items (meal_id, ingredient_id, quantity_g)
SELECT 
    (SELECT id FROM meals WHERE name = 'Test Cheesy Scrambled Eggs' LIMIT 1),
    i.id,
    portions.qty
FROM (
    SELECT 'Eggs' as name, 200.0 as qty
    UNION ALL SELECT 'Cheddar Cheese', 10.0
    UNION ALL SELECT 'Whole Wheat Bread', 120.0
    UNION ALL SELECT 'Spinach', 30.0
    UNION ALL SELECT 'Olive Oil', 5.0
    UNION ALL SELECT 'Whole Milk', 100.0
) portions
JOIN ingredients i ON i.name = portions.name;

-- Step 5: Verify what we created
SELECT 
    m.name as meal_name,
    m.is_template,
    m.kcal_target,
    COUNT(mi.id) as ingredient_count
FROM meals m
LEFT JOIN meal_items mi ON m.id = mi.meal_id
WHERE m.name = 'Test Cheesy Scrambled Eggs'
GROUP BY m.id, m.name, m.is_template, m.kcal_target;

-- Step 6: Show the meal items details
SELECT 
    m.name as meal_name,
    i.name as ingredient_name,
    mi.quantity_g
FROM meals m
JOIN meal_items mi ON m.id = mi.meal_id
JOIN ingredients i ON mi.ingredient_id = i.id
WHERE m.name = 'Test Cheesy Scrambled Eggs'
ORDER BY i.name;
