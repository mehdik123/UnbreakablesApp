-- =====================================================
-- COMPLETE MEALS FIX SCRIPT
-- This will properly link all meals to their ingredients
-- =====================================================

-- Step 1: Clear existing meal_items to start fresh
DELETE FROM meal_items;

-- Step 2: Add all meal_items for each meal with correct ingredient names
-- MEAL 1: Cheesy Scrambled Eggs
INSERT INTO meal_items (meal_id, ingredient_id, quantity_g)
SELECT 
    (SELECT id FROM meals WHERE name = 'Cheesy Scrambled Eggs' LIMIT 1),
    i.id,
    portions.qty
FROM (
    SELECT 'Eggs' as name, 200.0 as qty
    UNION ALL SELECT 'Cheddar Cheese', 10.0
    UNION ALL SELECT 'Whole-Wheat Bread', 120.0
    UNION ALL SELECT 'Spinach', 30.0
    UNION ALL SELECT 'Olive Oil', 5.0
    UNION ALL SELECT 'Whole Milk', 100.0
) portions
JOIN ingredients i ON i.name = portions.name;

-- MEAL 2: Scrambled Eggs With Oatmeal
INSERT INTO meal_items (meal_id, ingredient_id, quantity_g)
SELECT 
    (SELECT id FROM meals WHERE name = 'Scrambled Eggs With Oatmeal' LIMIT 1),
    i.id,
    portions.qty
FROM (
    SELECT 'Eggs' as name, 100.0 as qty
    UNION ALL SELECT 'Plain Oats, Raw', 50.0
    UNION ALL SELECT 'Whole Milk', 120.0
    UNION ALL SELECT 'Olive Oil', 5.0
    UNION ALL SELECT 'Blueberries', 20.0
    UNION ALL SELECT 'Whole-Wheat Bread', 100.0
    UNION ALL SELECT 'Peanut Butter', 15.0
) portions
JOIN ingredients i ON i.name = portions.name;

-- MEAL 3: Oatmeal With Milk and Banana
INSERT INTO meal_items (meal_id, ingredient_id, quantity_g)
SELECT 
    (SELECT id FROM meals WHERE name = 'Oatmeal With Milk and Banana' LIMIT 1),
    i.id,
    portions.qty
FROM (
    SELECT 'Peanut Butter' as name, 20.0 as qty
    UNION ALL SELECT 'Plain Oats, Raw', 100.0
    UNION ALL SELECT 'Whole Milk', 200.0
    UNION ALL SELECT 'Bananas', 100.0
    UNION ALL SELECT 'Mixed Nuts', 30.0
    UNION ALL SELECT 'Dark Chocolate, 70-85% Cacao', 20.0
) portions
JOIN ingredients i ON i.name = portions.name;

-- MEAL 4: Oatmeal And Eggs Pancakes
INSERT INTO meal_items (meal_id, ingredient_id, quantity_g)
SELECT 
    (SELECT id FROM meals WHERE name = 'Oatmeal And Eggs Pancakes' LIMIT 1),
    i.id,
    portions.qty
FROM (
    SELECT 'Plain Oats, Raw' as name, 70.0 as qty
    UNION ALL SELECT 'Eggs', 200.0
    UNION ALL SELECT 'Bananas', 60.0
    UNION ALL SELECT 'Honey', 5.0
    UNION ALL SELECT 'Dark Chocolate, 70-85% Cacao', 10.0
    UNION ALL SELECT 'Perly', 100.0
    UNION ALL SELECT 'Whole Milk', 100.0
) portions
JOIN ingredients i ON i.name = portions.name;

-- MEAL 5: Egg Omlet With Bread And Avocado
INSERT INTO meal_items (meal_id, ingredient_id, quantity_g)
SELECT 
    (SELECT id FROM meals WHERE name = 'Egg Omlet With Bread And Avocado' LIMIT 1),
    i.id,
    portions.qty
FROM (
    SELECT 'Eggs' as name, 150.0 as qty
    UNION ALL SELECT 'Peanut Butter', 15.0
    UNION ALL SELECT 'Whole-Wheat Bread', 80.0
    UNION ALL SELECT '1/2 Avocado', 100.0
    UNION ALL SELECT 'Olive Oil', 5.0
    UNION ALL SELECT 'Cheddar Cheese', 10.0
) portions
JOIN ingredients i ON i.name = portions.name;

-- MEAL 6: Oatmeal And Eggs With Whey Protein
INSERT INTO meal_items (meal_id, ingredient_id, quantity_g)
SELECT 
    (SELECT id FROM meals WHERE name = 'Oatmeal And Eggs With Whey Protein' LIMIT 1),
    i.id,
    portions.qty
FROM (
    SELECT 'Peanut Butter' as name, 10.0 as qty
    UNION ALL SELECT 'Plain Oats, Raw', 80.0
    UNION ALL SELECT 'Whole Milk', 150.0
    UNION ALL SELECT 'Bananas', 60.0
    UNION ALL SELECT 'Optimum Gold Standard Whey Protein Powder', 30.0
    UNION ALL SELECT 'Almonds', 15.0
) portions
JOIN ingredients i ON i.name = portions.name;

-- MEAL 7: Scrambled Eggs With Avocado And Cheese
INSERT INTO meal_items (meal_id, ingredient_id, quantity_g)
SELECT 
    (SELECT id FROM meals WHERE name = 'Scrambled Eggs With Avocado And Cheese' LIMIT 1),
    i.id,
    portions.qty
FROM (
    SELECT 'Eggs' as name, 200.0 as qty
    UNION ALL SELECT '1/2 Avocado', 100.0
    UNION ALL SELECT 'Cheddar Cheese', 10.0
    UNION ALL SELECT 'Whole-Wheat Bread', 120.0
    UNION ALL SELECT 'Olive Oil', 5.0
) portions
JOIN ingredients i ON i.name = portions.name;

-- MEAL 8: Egg & Bacon Omelet
INSERT INTO meal_items (meal_id, ingredient_id, quantity_g)
SELECT 
    (SELECT id FROM meals WHERE name = 'Egg & Bacon Omelet' LIMIT 1),
    i.id,
    portions.qty
FROM (
    SELECT 'Eggs' as name, 200.0 as qty
    UNION ALL SELECT 'Turkey, bacon', 50.0
    UNION ALL SELECT '1/2 Avocado', 100.0
    UNION ALL SELECT 'Spinach', 50.0
    UNION ALL SELECT 'Sweet Potato, Raw', 150.0
    UNION ALL SELECT 'Olive Oil', 5.0
    UNION ALL SELECT 'Apples', 100.0
) portions
JOIN ingredients i ON i.name = portions.name;

-- MEAL 9: Quinoa and Chicken Breast Salad
INSERT INTO meal_items (meal_id, ingredient_id, quantity_g)
SELECT 
    (SELECT id FROM meals WHERE name = 'Quinoa and Chicken Breast Salad' LIMIT 1),
    i.id,
    portions.qty
FROM (
    SELECT 'Quinoa, Raw' as name, 80.0 as qty
    UNION ALL SELECT 'Chicken, Breast', 100.0
    UNION ALL SELECT '1/2 Avocado', 100.0
    UNION ALL SELECT 'Almonds', 10.0
    UNION ALL SELECT 'Olive Oil', 5.0
    UNION ALL SELECT 'Apples', 100.0
) portions
JOIN ingredients i ON i.name = portions.name;

-- MEAL 10: Oatmeal & Fruits
INSERT INTO meal_items (meal_id, ingredient_id, quantity_g)
SELECT 
    (SELECT id FROM meals WHERE name = 'Oatmeal & Fruits' LIMIT 1),
    i.id,
    portions.qty
FROM (
    SELECT 'Plain Oats, Raw' as name, 70.0 as qty
    UNION ALL SELECT 'Water', 100.0
    UNION ALL SELECT 'Honey', 10.0
    UNION ALL SELECT 'Blueberries', 50.0
    UNION ALL SELECT 'Cinnamon', 1.0
    UNION ALL SELECT 'Optimum Gold Standard Whey Protein Powder', 40.0
    UNION ALL SELECT 'Bananas', 100.0
    UNION ALL SELECT 'Apples', 100.0
) portions
JOIN ingredients i ON i.name = portions.name;

-- MEAL 11: Ground Beef With Pasta And Avocado
INSERT INTO meal_items (meal_id, ingredient_id, quantity_g)
SELECT 
    (SELECT id FROM meals WHERE name = 'Ground Beef With Pasta And Avocado' LIMIT 1),
    i.id,
    portions.qty
FROM (
    SELECT 'Lean Ground Beef, Raw' as name, 150.0 as qty
    UNION ALL SELECT 'Pasta, Raw', 100.0
    UNION ALL SELECT '1/2 Avocado', 100.0
    UNION ALL SELECT 'Olive Oil', 5.0
    UNION ALL SELECT 'Cheddar Cheese', 10.0
    UNION ALL SELECT 'Onion', 50.0
) portions
JOIN ingredients i ON i.name = portions.name;

-- MEAL 12: Ground Beef With Rice And Avocado
INSERT INTO meal_items (meal_id, ingredient_id, quantity_g)
SELECT 
    (SELECT id FROM meals WHERE name = 'Ground Beef With Rice And Avocado' LIMIT 1),
    i.id,
    portions.qty
FROM (
    SELECT 'Lean Ground Beef, Raw' as name, 150.0 as qty
    UNION ALL SELECT 'Rice, Raw', 100.0
    UNION ALL SELECT 'Cheddar Cheese', 10.0
    UNION ALL SELECT 'Olive Oil', 5.0
    UNION ALL SELECT 'Onion', 50.0
    UNION ALL SELECT 'Pepper, sweet, green', 50.0
) portions
JOIN ingredients i ON i.name = portions.name;

-- MEAL 13: Rice & Chicken Breast With Green Beans
INSERT INTO meal_items (meal_id, ingredient_id, quantity_g)
SELECT 
    (SELECT id FROM meals WHERE name = 'Rice & Chicken Breast With Green Beans' LIMIT 1),
    i.id,
    portions.qty
FROM (
    SELECT 'Rice, Raw' as name, 70.0 as qty
    UNION ALL SELECT 'Chicken, Breast', 200.0
    UNION ALL SELECT 'Onion', 50.0
    UNION ALL SELECT 'Olive Oil', 5.0
    UNION ALL SELECT 'Green Bean', 100.0
    UNION ALL SELECT 'Cheese, Regular', 10.0
) portions
JOIN ingredients i ON i.name = portions.name;

-- MEAL 14: Sweet Potatoes With Chicken Breast
INSERT INTO meal_items (meal_id, ingredient_id, quantity_g)
SELECT 
    (SELECT id FROM meals WHERE name = 'Sweet Potatoes With Chicken Breast' LIMIT 1),
    i.id,
    portions.qty
FROM (
    SELECT 'Sweet Potato, Raw' as name, 200.0 as qty
    UNION ALL SELECT 'Chicken, Breast', 150.0
    UNION ALL SELECT 'Broccoli', 100.0
    UNION ALL SELECT 'Spinach', 50.0
    UNION ALL SELECT 'Olive Oil', 5.0
    UNION ALL SELECT '1 Avocado', 100.0
    UNION ALL SELECT 'Onion', 50.0
) portions
JOIN ingredients i ON i.name = portions.name;

-- MEAL 15: Rice & Chicken Breast With Broccoli
INSERT INTO meal_items (meal_id, ingredient_id, quantity_g)
SELECT 
    (SELECT id FROM meals WHERE name = 'Rice & Chicken Breast With Broccoli' LIMIT 1),
    i.id,
    portions.qty
FROM (
    SELECT 'Rice, Raw' as name, 80.0 as qty
    UNION ALL SELECT 'Chicken, Breast', 200.0
    UNION ALL SELECT 'Onion', 50.0
    UNION ALL SELECT 'Olive Oil', 5.0
    UNION ALL SELECT 'Broccoli', 100.0
    UNION ALL SELECT 'Cheddar Cheese', 15.0
) portions
JOIN ingredients i ON i.name = portions.name;

-- MEAL 16: Chicken Breast Salad
INSERT INTO meal_items (meal_id, ingredient_id, quantity_g)
SELECT 
    (SELECT id FROM meals WHERE name = 'Chicken Breast Salad' LIMIT 1),
    i.id,
    portions.qty
FROM (
    SELECT 'Green Bean' as name, 100.0 as qty
    UNION ALL SELECT 'Chicken, Breast', 200.0
    UNION ALL SELECT 'Cucumber', 100.0
    UNION ALL SELECT 'Onion', 50.0
    UNION ALL SELECT 'Carrots, raw', 100.0
    UNION ALL SELECT 'Apples', 100.0
    UNION ALL SELECT '1/2 Avocado', 50.0
) portions
JOIN ingredients i ON i.name = portions.name;

-- MEAL 17: Tuna With Ebly And Cheese
INSERT INTO meal_items (meal_id, ingredient_id, quantity_g)
SELECT 
    (SELECT id FROM meals WHERE name = 'Tuna With Ebly And Cheese' LIMIT 1),
    i.id,
    portions.qty
FROM (
    SELECT 'Tuna' as name, 150.0 as qty
    UNION ALL SELECT 'Ebly', 80.0
    UNION ALL SELECT 'Green Bean', 50.0
    UNION ALL SELECT '1/2 Avocado', 100.0
    UNION ALL SELECT 'Mayonnaise', 5.0
    UNION ALL SELECT 'Yellow Sweet Corn', 20.0
    UNION ALL SELECT 'Olive Oil', 5.0
) portions
JOIN ingredients i ON i.name = portions.name;

-- MEAL 18: Salmon With Sweet Potatoes
INSERT INTO meal_items (meal_id, ingredient_id, quantity_g)
SELECT 
    (SELECT id FROM meals WHERE name = 'Salmon With Sweet Potatoes' LIMIT 1),
    i.id,
    portions.qty
FROM (
    SELECT 'Salmon' as name, 200.0 as qty
    UNION ALL SELECT 'Sweet Potato, Raw', 200.0
    UNION ALL SELECT 'Broccoli', 100.0
    UNION ALL SELECT 'Butter', 20.0
    UNION ALL SELECT 'Garlic', 5.0
) portions
JOIN ingredients i ON i.name = portions.name;

-- MEAL 19: Greek Yogurt & Toast
INSERT INTO meal_items (meal_id, ingredient_id, quantity_g)
SELECT 
    (SELECT id FROM meals WHERE name = 'Greek Yogurt & Toast' LIMIT 1),
    i.id,
    portions.qty
FROM (
    SELECT 'Greek Yogurt, whole milk' as name, 100.0 as qty
    UNION ALL SELECT 'Whole-Wheat Bread', 120.0
    UNION ALL SELECT 'Cottage Cheese, 1% milkfat', 50.0
    UNION ALL SELECT 'Bananas', 150.0
    UNION ALL SELECT 'Blueberries', 30.0
    UNION ALL SELECT 'Chia Seeds', 10.0
) portions
JOIN ingredients i ON i.name = portions.name;

-- MEAL 20: Greek Yogurt & Fruit Salad
INSERT INTO meal_items (meal_id, ingredient_id, quantity_g)
SELECT 
    (SELECT id FROM meals WHERE name = 'Greek Yogurt & Fruit Salad' LIMIT 1),
    i.id,
    portions.qty
FROM (
    SELECT 'Greek Yogurt, whole milk' as name, 100.0 as qty
    UNION ALL SELECT 'Apples', 100.0
    UNION ALL SELECT 'Bananas', 100.0
    UNION ALL SELECT 'Kiwi', 100.0
    UNION ALL SELECT 'Blueberries', 50.0
    UNION ALL SELECT 'Mixed Nuts', 20.0
    UNION ALL SELECT 'Optimum Gold Standard Whey Protein Powder', 40.0
) portions
JOIN ingredients i ON i.name = portions.name;

-- Step 3: Verification query
SELECT 
    m.name as meal_name, 
    m.is_template,
    COUNT(mi.id) as ingredient_count,
    ROUND(SUM(mi.quantity_g * i.kcal / 100), 2) as calculated_calories
FROM meals m 
LEFT JOIN meal_items mi ON m.id = mi.meal_id 
LEFT JOIN ingredients i ON mi.ingredient_id = i.id
WHERE m.is_template = true 
GROUP BY m.id, m.name, m.is_template
ORDER BY m.name;
