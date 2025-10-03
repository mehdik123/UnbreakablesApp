-- =====================================================
-- TEST: Add ingredients first, then 1 meal
-- Using exact same approach as coach interface
-- =====================================================

-- Step 1: Add missing ingredients (simple INSERT, no conflicts)
INSERT INTO ingredients (name, kcal, protein, fat, carbs)
VALUES 
    ('Cheddar Cheese', 0, 0, 0, 0),
    ('Whole Milk', 0, 0, 0, 0),
    ('Turkey Bacon', 0, 0, 0, 0),
    ('Optimum Gold Standard Whey Protein Powder', 0, 0, 0, 0),
    ('Perly', 0, 0, 0, 0),
    ('Lean Ground Beef', 0, 0, 0, 0),
    ('Rice', 0, 0, 0, 0),
    ('Green Beans', 0, 0, 0, 0),
    ('Cheese, Regular', 0, 0, 0, 0),
    ('Tuna', 0, 0, 0, 0),
    ('Ebly', 0, 0, 0, 0),
    ('Mayonnaise', 0, 0, 0, 0),
    ('Yellow Sweet Corn', 0, 0, 0, 0),
    ('Butter', 0, 0, 0, 0),
    ('Cottage Cheese, 1% milkfat', 0, 0, 0, 0),
    ('Kiwi', 0, 0, 0, 0),
    ('Chia Seeds', 0, 0, 0, 0),
    ('Blueberries', 0, 0, 0, 0),
    ('Bananas', 0, 0, 0, 0),
    ('Apples', 0, 0, 0, 0),
    ('Mixed Nuts', 0, 0, 0, 0),
    ('Bell Pepper, raw', 0, 0, 0, 0),
    ('Carrots, raw', 0, 0, 0, 0),
    ('Dark Chocolate, 70-85% Cacao', 0, 0, 0, 0),
    ('Peanut Butter', 0, 0, 0, 0),
    ('Cinnamon', 0, 0, 0, 0),
    ('Water', 0, 0, 0, 0);

-- Step 2: Add the meal (exactly like dbAddMeal function)
INSERT INTO meals (name, is_template, kcal_target, image, cooking_instructions)
VALUES (
    'Test Cheesy Scrambled Eggs', 
    true, 
    800, 
    'https://images.unsplash.com/photo-1495214783159-3503fd1b572d?w=400&h=300&fit=crop', 
    'Beat eggs and blend them with finely chopped spinach. Heat a tablespoon of olive oil in a non-stick skillet, and pour in the egg mixture. As the eggs begin to set, sprinkle over the reduced amount of shredded cheese. Serve this alongside a slice of toasted whole bread and a cup of Milk'
);

-- Step 3: Add meal items (exactly like dbAddMealItem function)
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

-- Step 4: Verify what we created
SELECT 
    m.name as meal_name,
    m.is_template,
    m.kcal_target,
    COUNT(mi.id) as ingredient_count
FROM meals m
LEFT JOIN meal_items mi ON m.id = mi.meal_id
WHERE m.name = 'Test Cheesy Scrambled Eggs'
GROUP BY m.id, m.name, m.is_template, m.kcal_target;

-- Step 5: Show the meal items details
SELECT 
    m.name as meal_name,
    i.name as ingredient_name,
    mi.quantity_g
FROM meals m
JOIN meal_items mi ON m.id = mi.meal_id
JOIN ingredients i ON mi.ingredient_id = i.id
WHERE m.name = 'Test Cheesy Scrambled Eggs'
ORDER BY i.name;
