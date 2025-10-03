-- =====================================================
-- FINAL MEALS POPULATION SCRIPT
-- Compatible with your database structure
-- Uses WHERE NOT EXISTS instead of ON CONFLICT
-- =====================================================

-- First, let's add the missing ingredients from your CSV
INSERT INTO ingredients (name, kcal, protein, fat, carbs)
SELECT name, 0, 0, 0, 0
FROM (VALUES
    ('Jalapeno'),
    ('1 Avocado'),
    ('1/2 Avocado'),
    ('Almond Butter'),
    ('Almond Milk (unsweetened)'),
    ('Almond Oil'),
    ('Almonds'),
    ('American Cheese'),
    ('Anchovy'),
    ('Apple'),
    ('Apples'),
    ('Artichoke'),
    ('Arugula'),
    ('Asparagus'),
    ('Avocado Oil'),
    ('Balsamic Vinegar'),
    ('Bananas'),
    ('Barley, Raw'),
    ('Bass'),
    ('Beans, Raw'),
    ('Beef, Corned'),
    ('Beef, Ground, 70% lean'),
    ('Beef, Ground, 80% lean'),
    ('Beef, Ground, 90% lean'),
    ('Beef, Hot Dog/Frankfurter'),
    ('Beef, Pastrami'),
    ('Beef, Ribs'),
    ('Beef, Roast'),
    ('Beef, Sausage'),
    ('Beef, Steak, Filet Mignon'),
    ('Beef, Steak, Ribeye'),
    ('Beef, Steak, Round'),
    ('Beef, Steak, Sirloin'),
    ('Beef, Steak, Striploin'),
    ('Beef, Tongue'),
    ('Beets'),
    ('Bell Pepper, raw'),
    ('Blackberries'),
    ('Blackberry'),
    ('Blue Cheese'),
    ('Blueberries'),
    ('Bok Choy'),
    ('Brazil Nuts'),
    ('Brazilnuts'),
    ('Broccoli'),
    ('Broccoli Rabe'),
    ('Brussel Sprouts'),
    ('Brussels Sprouts'),
    ('Buckwheat, Raw'),
    ('Bulgur, Raw'),
    ('Bun'),
    ('Burbot'),
    ('Butter'),
    ('Butter (unsalted)'),
    ('Cabbage'),
    ('Candy'),
    ('Canned Tuna in Water'),
    ('Canola Oil'),
    ('Carp'),
    ('Carrots'),
    ('Carrots, raw'),
    ('Cashew Nuts'),
    ('Cashews'),
    ('Cauliflower'),
    ('Cauliflower, raw'),
    ('Cavier'),
    ('Celeriac'),
    ('Celery'),
    ('Cereal'),
    ('Chard'),
    ('Cheddar Cheese'),
    ('Cheese, Feta'),
    ('Cheese, Low-Fat Cottage'),
    ('Cheese, Mozzarella'),
    ('Cheese, Regular'),
    ('Chia Seeds'),
    ('Chicken Breast, Raw'),
    ('Chicken, Breast'),
    ('Chicken, Legs'),
    ('Chicken, Wings'),
    ('Chicory Greens'),
    ('Chili Sauce'),
    ('Chocolate'),
    ('Clams'),
    ('Cocoa Butter'),
    ('Coconut'),
    ('Coconut Cream'),
    ('Coconut Milk (unsweetened)'),
    ('Coconut Oil'),
    ('Cod, Raw'),
    ('Cookies'),
    ('Corn')
) AS new_ingredients(name)
WHERE NOT EXISTS (
    SELECT 1 FROM ingredients WHERE ingredients.name = new_ingredients.name
);

-- Now add the meals
INSERT INTO meals (name, is_template, kcal_target, image, cooking_instructions)
SELECT name, is_template, kcal_target, image, cooking_instructions
FROM (VALUES
    ('Cheesy Scrambled Eggs', true, 800, 'https://images.unsplash.com/photo-1495214783159-3503fd1b572d?w=400&h=300&fit=crop', 'Beat eggs and blend them with finely chopped spinach. Heat a tablespoon of olive oil in a non-stick skillet, and pour in the egg mixture. As the eggs begin to set, sprinkle over the reduced amount of shredded cheese. Serve this alongside a slice of toasted whole bread and a cup of Milk'),
    ('Scrambled Eggs With Oatmeal', true, 800, 'https://images.unsplash.com/photo-1584042839955-f79a32194639?w=400&h=300&fit=crop', 'Start by cooking the oatmeal in milk until creamy and soft. While the oatmeal is cooking, beat the eggs and then scramble them in a skillet with a tablespoon of olive oil, ensuring they remain fluffy and light. Once both the oatmeal and eggs are ready, stir a tablespoon of peanut butter into the oatmeal for extra richness. Serve the scrambled eggs alongside the oatmeal and sprinkle the blueberries over the oatmeal for a burst of freshness and sweetness.'),
    ('Oatmeal With Milk and Banana', true, 800, 'https://images.unsplash.com/photo-1506128183184-207d8b0b5e40?w=400&h=300&fit=crop', 'To make your meal, boil milk and add oatmeal, cooking until soft. Stir in a tablespoon of peanut butter. Top the oatmeal with sliced banana, dark chocolate and mixed nuts.'),
    ('Oatmeal And Eggs Pancakes', true, 800, 'https://images.unsplash.com/photo-1557088421-ee4fa299e52c?w=400&h=300&fit=crop', 'Create a pancake batter by mixing the oatmeal, milk, whole eggs, and egg whites. Mash the banana and incorporate it into the batter along with the peanut butter and honey for natural sweetness. Cook the pancakes in a non-stick skillet over medium heat until bubbles form and the edges appear dry, then flip to cook the other side. Serve the pancakes with a dollop of Perly yogurt on top and sprinkle with shaved dark chocolate.'),
    ('Egg Omlet With Bread And Avocado', true, 800, 'https://images.unsplash.com/photo-1541544453-66444983a50a?w=400&h=300&fit=crop', 'Whisk three large eggs and scramble them in a non-stick skillet over medium heat until they are fully cooked but still moist. While the eggs are cooking, toast a slice of whole bread and spread a tablespoon of peanut butter over it. Top the toast with sliced avocado. On the side, arrange half a sliced banana. Serve the creamy scrambled eggs alongside the peanut butter and avocado toast, creating a nutritious and satisfying meal.'),
    ('Oatmeal And Eggs With Whey Protein', true, 800, 'https://images.unsplash.com/photo-1596799562445-53865611052b?w=400&h=300&fit=crop', 'To make your meal, boil milk and add oatmeal, cooking until soft. Stir in a tablespoon of peanut butter. Cut Bananas into small slices and add them with a scoop of whey protein to the mixture . Finally add some almonds for taste and magnesium boost.'),
    ('Scrambled Eggs With Avocado And Cheese', true, 800, 'https://images.unsplash.com/photo-1626202029598-9366113885d7?w=400&h=300&fit=crop', 'Heat a tablespoon of olive oil in a pan and scramble eggs until they are set but still creamy. Meanwhile, mash avocado and spread it evenly over slices of whole bread. Lay the scrambled eggs on top of the mashed avocado, and top with sliced cheddar cheese.'),
    ('Egg & Bacon Omelet', true, 800, 'https://images.unsplash.com/photo-1582512422033-4ab34b4044b7?w=400&h=300&fit=crop', 'To prepare your meal, heat olive oil in a pan and cook the turkey bacon and egg until done. Roast or steam the sweet potato until tender. In a bowl, combine spinach with sliced avocado and apple, then top with the bacon, egg, and sweet potato. Enjoy your meal.'),
    ('Quinoa and Chicken Breast Salad', true, 800, 'https://images.unsplash.com/photo-1594998703358-13a48c6a6f13?w=400&h=300&fit=crop', 'To make your meal, cook the quinoa until tender and pan-fry the chicken in olive oil until golden. In a bowl, dice the apple and avocado and toss with almonds.'),
    ('Oatmeal & Fruits', true, 800, 'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=400&h=300&fit=crop', 'Cook the raw oats with water until soft. Mix in the whey protein powder, honey, and cinnamon. Top with fresh blueberries, sliced bananas, and diced apples.'),
    ('Ground Beef With Pasta And Avocado', true, 800, 'https://images.unsplash.com/photo-1621996346565-e326e22e3824?w=400&h=300&fit=crop', 'Cook the pasta in Boiled Water and add you favourite seasonning. Add olive oil to a frying pan to avoid sticking and cook the beef and onion, when cooked, add the cheese, cut avocado and lettuce to small slices and mix everything.'),
    ('Ground Beef With Rice And Avocado', true, 800, 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&h=300&fit=crop', 'Cook the rice in Boiled Water and add you favourite seasonning. Add olive oil to a frying pan to avoid sticking and cook the beef and onion, when cooked, add the cheese, cut avocado to small slices and mix everything.'),
    ('Rice & Chicken Breast With Green Beans', true, 800, 'https://images.unsplash.com/photo-1598103442345-02627b0b0758?w=400&h=300&fit=crop', 'Cook the rice and beans in Boiled Water and add you favourite seasonning. Add olive oil to a frying pan to avoid sticking and cook the chicken breast and onion, when cooked, add the cheese and mix everything in a bowl.'),
    ('Sweet Potatoes With Chicken Breast', true, 800, 'https://images.unsplash.com/photo-1631100989904-a2d807a016f4?w=400&h=300&fit=crop', 'To make your meal, boil potatoes and broccoli, cooking until soft. Stir in a tablespoon of olive oil. Cook the chicken breast in the oven, keep the onion fresh and cut it into small slices, same for the avocado then mix everything in a bowl.'),
    ('Rice & Chicken Breast With Broccoli', true, 800, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop', 'Cook the rice and broccoli in Boiled Water and add you favourite seasonning. Add olive oil to a frying pan to avoid sticking and cook the chicken breast and onion, when cooked, add the cheese and mix everything in a bowl.'),
    ('Chicken Breast Salad', true, 800, 'https://images.unsplash.com/photo-1540420773420-28507da66d68?w=400&h=300&fit=crop', 'Cook the chicken breast and slice it. Combine with steamed green beans, and freshly sliced cucumber, onion, carrots, apples, and avocado to create a large salad.'),
    ('Tuna With Ebly And Cheese', true, 800, 'https://images.unsplash.com/photo-1598515213692-5f282436df20?w=400&h=300&fit=crop', 'Cook the Ebly (wheat berries) according to package directions. Steam or boil the green beans. In a bowl, combine the cooked Ebly, tuna, green beans, corn, and sliced avocado. Mix in mayonnaise and a drizzle of olive oil to create a salad.'),
    ('Salmon With Sweet Potatoes', true, 800, 'https://images.unsplash.com/photo-1607584196443-c05244519782?w=400&h=300&fit=crop', 'Season the salmon fillet. Chop the sweet potato and broccoli, toss with melted butter and minced garlic, and roast until tender. Bake or pan-sear the salmon until cooked through. Serve together.'),
    ('Greek Yogurt & Toast', true, 800, 'https://images.unsplash.com/photo-1584515933487-be72835aa71f?w=400&h=300&fit=crop', 'Top the whole wheat toast with fresh cottage cheese, banana slices, blueberries, and take the greek Yogurt separalty.'),
    ('Greek Yogurt & Fruit Salad', true, 800, 'https://images.unsplash.com/photo-1552010292-56414343e3d9?w=400&h=300&fit=crop', 'In a bowl, mix the whey protein powder into the Greek yogurt until smooth. Top with sliced apples, bananas, kiwi, blueberries, and mixed nuts.')
) AS new_meals(name, is_template, kcal_target, image, cooking_instructions)
WHERE NOT EXISTS (
    SELECT 1 FROM meals WHERE meals.name = new_meals.name
);

-- Now add meal items for each meal
-- MEAL 1: Cheesy Scrambled Eggs
INSERT INTO meal_items (meal_id, ingredient_id, quantity_g)
SELECT m.id, i.id, portions.qty
FROM (SELECT id FROM meals WHERE name = 'Cheesy Scrambled Eggs' LIMIT 1) m
CROSS JOIN (
    SELECT 'Eggs' as name, 200.0 as qty
    UNION ALL SELECT 'Cheddar Cheese', 10.0
    UNION ALL SELECT 'Whole Wheat Bread', 120.0
    UNION ALL SELECT 'Spinach', 30.0
    UNION ALL SELECT 'Olive Oil', 5.0
    UNION ALL SELECT 'Whole Milk', 100.0
) portions
JOIN ingredients i ON i.name = portions.name
WHERE NOT EXISTS (
    SELECT 1 FROM meal_items mi 
    WHERE mi.meal_id = m.id AND mi.ingredient_id = i.id
);

-- MEAL 2: Scrambled Eggs With Oatmeal
INSERT INTO meal_items (meal_id, ingredient_id, quantity_g)
SELECT m.id, i.id, portions.qty
FROM (SELECT id FROM meals WHERE name = 'Scrambled Eggs With Oatmeal' LIMIT 1) m
CROSS JOIN (
    SELECT 'Eggs' as name, 100.0 as qty
    UNION ALL SELECT 'Oats', 50.0
    UNION ALL SELECT 'Whole Milk', 120.0
    UNION ALL SELECT 'Olive Oil', 5.0
    UNION ALL SELECT 'Blueberries', 20.0
    UNION ALL SELECT 'Whole Wheat Bread', 100.0
) portions
JOIN ingredients i ON i.name = portions.name
WHERE NOT EXISTS (
    SELECT 1 FROM meal_items mi 
    WHERE mi.meal_id = m.id AND mi.ingredient_id = i.id
);

-- MEAL 3: Oatmeal With Milk and Banana
INSERT INTO meal_items (meal_id, ingredient_id, quantity_g)
SELECT m.id, i.id, portions.qty
FROM (SELECT id FROM meals WHERE name = 'Oatmeal With Milk and Banana' LIMIT 1) m
CROSS JOIN (
    SELECT 'Peanut Butter' as name, 20.0 as qty
    UNION ALL SELECT 'Oats', 100.0
    UNION ALL SELECT 'Whole Milk', 200.0
    UNION ALL SELECT 'Bananas', 100.0
    UNION ALL SELECT 'Mixed Nuts', 30.0
    UNION ALL SELECT 'Dark Chocolate, 70-85% Cacao', 20.0
) portions
JOIN ingredients i ON i.name = portions.name
WHERE NOT EXISTS (
    SELECT 1 FROM meal_items mi 
    WHERE mi.meal_id = m.id AND mi.ingredient_id = i.id
);

-- MEAL 4: Oatmeal And Eggs Pancakes
INSERT INTO meal_items (meal_id, ingredient_id, quantity_g)
SELECT m.id, i.id, portions.qty
FROM (SELECT id FROM meals WHERE name = 'Oatmeal And Eggs Pancakes' LIMIT 1) m
CROSS JOIN (
    SELECT 'Oats' as name, 70.0 as qty
    UNION ALL SELECT 'Eggs', 200.0
    UNION ALL SELECT 'Bananas', 60.0
    UNION ALL SELECT 'Honey', 5.0
    UNION ALL SELECT 'Dark Chocolate, 70-85% Cacao', 10.0
    UNION ALL SELECT 'Perly', 100.0
) portions
JOIN ingredients i ON i.name = portions.name
WHERE NOT EXISTS (
    SELECT 1 FROM meal_items mi 
    WHERE mi.meal_id = m.id AND mi.ingredient_id = i.id
);

-- MEAL 5: Egg Omlet With Bread And Avocado
INSERT INTO meal_items (meal_id, ingredient_id, quantity_g)
SELECT m.id, i.id, portions.qty
FROM (SELECT id FROM meals WHERE name = 'Egg Omlet With Bread And Avocado' LIMIT 1) m
CROSS JOIN (
    SELECT 'Eggs' as name, 150.0 as qty
    UNION ALL SELECT 'Peanut Butter', 15.0
    UNION ALL SELECT 'Whole Wheat Bread', 80.0
    UNION ALL SELECT '1/2 Avocado', 100.0
    UNION ALL SELECT 'Olive Oil', 5.0
    UNION ALL SELECT 'Cheddar Cheese', 10.0
) portions
JOIN ingredients i ON i.name = portions.name
WHERE NOT EXISTS (
    SELECT 1 FROM meal_items mi 
    WHERE mi.meal_id = m.id AND mi.ingredient_id = i.id
);

-- MEAL 6: Oatmeal And Eggs With Whey Protein
INSERT INTO meal_items (meal_id, ingredient_id, quantity_g)
SELECT m.id, i.id, portions.qty
FROM (SELECT id FROM meals WHERE name = 'Oatmeal And Eggs With Whey Protein' LIMIT 1) m
CROSS JOIN (
    SELECT 'Peanut Butter' as name, 10.0 as qty
    UNION ALL SELECT 'Oats', 80.0
    UNION ALL SELECT 'Whole Milk', 150.0
    UNION ALL SELECT 'Bananas', 60.0
    UNION ALL SELECT 'Optimum Gold Standard Whey Protein Powder', 30.0
    UNION ALL SELECT 'Almonds', 15.0
) portions
JOIN ingredients i ON i.name = portions.name
WHERE NOT EXISTS (
    SELECT 1 FROM meal_items mi 
    WHERE mi.meal_id = m.id AND mi.ingredient_id = i.id
);

-- MEAL 7: Scrambled Eggs With Avocado And Cheese
INSERT INTO meal_items (meal_id, ingredient_id, quantity_g)
SELECT m.id, i.id, portions.qty
FROM (SELECT id FROM meals WHERE name = 'Scrambled Eggs With Avocado And Cheese' LIMIT 1) m
CROSS JOIN (
    SELECT 'Eggs' as name, 200.0 as qty
    UNION ALL SELECT '1/2 Avocado', 100.0
    UNION ALL SELECT 'Cheddar Cheese', 10.0
    UNION ALL SELECT 'Whole Wheat Bread', 120.0
    UNION ALL SELECT 'Olive Oil', 5.0
) portions
JOIN ingredients i ON i.name = portions.name
WHERE NOT EXISTS (
    SELECT 1 FROM meal_items mi 
    WHERE mi.meal_id = m.id AND mi.ingredient_id = i.id
);

-- MEAL 8: Egg & Bacon Omelet
INSERT INTO meal_items (meal_id, ingredient_id, quantity_g)
SELECT m.id, i.id, portions.qty
FROM (SELECT id FROM meals WHERE name = 'Egg & Bacon Omelet' LIMIT 1) m
CROSS JOIN (
    SELECT 'Eggs' as name, 200.0 as qty
    UNION ALL SELECT 'Turkey Bacon', 50.0
    UNION ALL SELECT '1/2 Avocado', 100.0
    UNION ALL SELECT 'Spinach', 50.0
    UNION ALL SELECT 'Sweet Potato, Raw', 150.0
    UNION ALL SELECT 'Olive Oil', 5.0
    UNION ALL SELECT 'Apples', 100.0
) portions
JOIN ingredients i ON i.name = portions.name
WHERE NOT EXISTS (
    SELECT 1 FROM meal_items mi 
    WHERE mi.meal_id = m.id AND mi.ingredient_id = i.id
);

-- MEAL 9: Quinoa and Chicken Breast Salad
INSERT INTO meal_items (meal_id, ingredient_id, quantity_g)
SELECT m.id, i.id, portions.qty
FROM (SELECT id FROM meals WHERE name = 'Quinoa and Chicken Breast Salad' LIMIT 1) m
CROSS JOIN (
    SELECT 'Quinoa, Raw' as name, 80.0 as qty
    UNION ALL SELECT 'Chicken Breast', 100.0
    UNION ALL SELECT '1/2 Avocado', 100.0
    UNION ALL SELECT 'Almonds', 10.0
    UNION ALL SELECT 'Olive Oil', 5.0
    UNION ALL SELECT 'Apples', 100.0
) portions
JOIN ingredients i ON i.name = portions.name
WHERE NOT EXISTS (
    SELECT 1 FROM meal_items mi 
    WHERE mi.meal_id = m.id AND mi.ingredient_id = i.id
);

-- MEAL 10: Oatmeal & Fruits
INSERT INTO meal_items (meal_id, ingredient_id, quantity_g)
SELECT m.id, i.id, portions.qty
FROM (SELECT id FROM meals WHERE name = 'Oatmeal & Fruits' LIMIT 1) m
CROSS JOIN (
    SELECT 'Oats' as name, 70.0 as qty
    UNION ALL SELECT 'Water', 100.0
    UNION ALL SELECT 'Honey', 10.0
    UNION ALL SELECT 'Blueberries', 50.0
    UNION ALL SELECT 'Cinnamon', 1.0
    UNION ALL SELECT 'Optimum Gold Standard Whey Protein Powder', 40.0
    UNION ALL SELECT 'Bananas', 100.0
    UNION ALL SELECT 'Apples', 100.0
) portions
JOIN ingredients i ON i.name = portions.name
WHERE NOT EXISTS (
    SELECT 1 FROM meal_items mi 
    WHERE mi.meal_id = m.id AND mi.ingredient_id = i.id
);

-- MEAL 11: Ground Beef With Pasta And Avocado
INSERT INTO meal_items (meal_id, ingredient_id, quantity_g)
SELECT m.id, i.id, portions.qty
FROM (SELECT id FROM meals WHERE name = 'Ground Beef With Pasta And Avocado' LIMIT 1) m
CROSS JOIN (
    SELECT 'Lean Ground Beef' as name, 150.0 as qty
    UNION ALL SELECT 'Pasta, Raw', 100.0
    UNION ALL SELECT '1/2 Avocado', 100.0
    UNION ALL SELECT 'Olive Oil', 5.0
    UNION ALL SELECT 'Cheddar Cheese', 10.0
    UNION ALL SELECT 'Onion', 50.0
) portions
JOIN ingredients i ON i.name = portions.name
WHERE NOT EXISTS (
    SELECT 1 FROM meal_items mi 
    WHERE mi.meal_id = m.id AND mi.ingredient_id = i.id
);

-- MEAL 12: Ground Beef With Rice And Avocado
INSERT INTO meal_items (meal_id, ingredient_id, quantity_g)
SELECT m.id, i.id, portions.qty
FROM (SELECT id FROM meals WHERE name = 'Ground Beef With Rice And Avocado' LIMIT 1) m
CROSS JOIN (
    SELECT 'Lean Ground Beef' as name, 150.0 as qty
    UNION ALL SELECT 'Rice', 100.0
    UNION ALL SELECT 'Cheddar Cheese', 10.0
    UNION ALL SELECT 'Olive Oil', 5.0
    UNION ALL SELECT 'Onion', 50.0
    UNION ALL SELECT 'Bell Pepper, raw', 50.0
) portions
JOIN ingredients i ON i.name = portions.name
WHERE NOT EXISTS (
    SELECT 1 FROM meal_items mi 
    WHERE mi.meal_id = m.id AND mi.ingredient_id = i.id
);

-- MEAL 13: Rice & Chicken Breast With Green Beans
INSERT INTO meal_items (meal_id, ingredient_id, quantity_g)
SELECT m.id, i.id, portions.qty
FROM (SELECT id FROM meals WHERE name = 'Rice & Chicken Breast With Green Beans' LIMIT 1) m
CROSS JOIN (
    SELECT 'Rice' as name, 70.0 as qty
    UNION ALL SELECT 'Chicken Breast', 200.0
    UNION ALL SELECT 'Onion', 50.0
    UNION ALL SELECT 'Olive Oil', 5.0
    UNION ALL SELECT 'Green Beans', 100.0
    UNION ALL SELECT 'Cheese, Regular', 10.0
) portions
JOIN ingredients i ON i.name = portions.name
WHERE NOT EXISTS (
    SELECT 1 FROM meal_items mi 
    WHERE mi.meal_id = m.id AND mi.ingredient_id = i.id
);

-- MEAL 14: Sweet Potatoes With Chicken Breast
INSERT INTO meal_items (meal_id, ingredient_id, quantity_g)
SELECT m.id, i.id, portions.qty
FROM (SELECT id FROM meals WHERE name = 'Sweet Potatoes With Chicken Breast' LIMIT 1) m
CROSS JOIN (
    SELECT 'Sweet Potato, Raw' as name, 200.0 as qty
    UNION ALL SELECT 'Chicken Breast', 150.0
    UNION ALL SELECT 'Broccoli', 100.0
    UNION ALL SELECT 'Spinach', 50.0
    UNION ALL SELECT 'Olive Oil', 5.0
    UNION ALL SELECT '1 Avocado', 100.0
) portions
JOIN ingredients i ON i.name = portions.name
WHERE NOT EXISTS (
    SELECT 1 FROM meal_items mi 
    WHERE mi.meal_id = m.id AND mi.ingredient_id = i.id
);

-- MEAL 15: Rice & Chicken Breast With Broccoli
INSERT INTO meal_items (meal_id, ingredient_id, quantity_g)
SELECT m.id, i.id, portions.qty
FROM (SELECT id FROM meals WHERE name = 'Rice & Chicken Breast With Broccoli' LIMIT 1) m
CROSS JOIN (
    SELECT 'Rice' as name, 80.0 as qty
    UNION ALL SELECT 'Chicken Breast', 200.0
    UNION ALL SELECT 'Onion', 50.0
    UNION ALL SELECT 'Olive Oil', 5.0
    UNION ALL SELECT 'Broccoli', 100.0
    UNION ALL SELECT 'Cheddar Cheese', 15.0
) portions
JOIN ingredients i ON i.name = portions.name
WHERE NOT EXISTS (
    SELECT 1 FROM meal_items mi 
    WHERE mi.meal_id = m.id AND mi.ingredient_id = i.id
);

-- MEAL 16: Chicken Breast Salad
INSERT INTO meal_items (meal_id, ingredient_id, quantity_g)
SELECT m.id, i.id, portions.qty
FROM (SELECT id FROM meals WHERE name = 'Chicken Breast Salad' LIMIT 1) m
CROSS JOIN (
    SELECT 'Green Beans' as name, 100.0 as qty
    UNION ALL SELECT 'Chicken Breast', 200.0
    UNION ALL SELECT 'Cucumber', 100.0
    UNION ALL SELECT 'Onion', 50.0
    UNION ALL SELECT 'Carrots, raw', 100.0
    UNION ALL SELECT 'Apples', 100.0
    UNION ALL SELECT '1/2 Avocado', 50.0
) portions
JOIN ingredients i ON i.name = portions.name
WHERE NOT EXISTS (
    SELECT 1 FROM meal_items mi 
    WHERE mi.meal_id = m.id AND mi.ingredient_id = i.id
);

-- MEAL 17: Tuna With Ebly And Cheese
INSERT INTO meal_items (meal_id, ingredient_id, quantity_g)
SELECT m.id, i.id, portions.qty
FROM (SELECT id FROM meals WHERE name = 'Tuna With Ebly And Cheese' LIMIT 1) m
CROSS JOIN (
    SELECT 'Tuna' as name, 150.0 as qty
    UNION ALL SELECT 'Ebly', 80.0
    UNION ALL SELECT 'Green Beans', 50.0
    UNION ALL SELECT '1/2 Avocado', 100.0
    UNION ALL SELECT 'Mayonnaise', 5.0
    UNION ALL SELECT 'Yellow Sweet Corn', 20.0
    UNION ALL SELECT 'Olive Oil', 5.0
) portions
JOIN ingredients i ON i.name = portions.name
WHERE NOT EXISTS (
    SELECT 1 FROM meal_items mi 
    WHERE mi.meal_id = m.id AND mi.ingredient_id = i.id
);

-- MEAL 18: Salmon With Sweet Potatoes
INSERT INTO meal_items (meal_id, ingredient_id, quantity_g)
SELECT m.id, i.id, portions.qty
FROM (SELECT id FROM meals WHERE name = 'Salmon With Sweet Potatoes' LIMIT 1) m
CROSS JOIN (
    SELECT 'Salmon Fillet, Raw' as name, 200.0 as qty
    UNION ALL SELECT 'Sweet Potato, Raw', 200.0
    UNION ALL SELECT 'Broccoli', 100.0
    UNION ALL SELECT 'Butter', 20.0
    UNION ALL SELECT 'Garlic', 5.0
) portions
JOIN ingredients i ON i.name = portions.name
WHERE NOT EXISTS (
    SELECT 1 FROM meal_items mi 
    WHERE mi.meal_id = m.id AND mi.ingredient_id = i.id
);

-- MEAL 19: Greek Yogurt & Toast
INSERT INTO meal_items (meal_id, ingredient_id, quantity_g)
SELECT m.id, i.id, portions.qty
FROM (SELECT id FROM meals WHERE name = 'Greek Yogurt & Toast' LIMIT 1) m
CROSS JOIN (
    SELECT 'Greek Yogurt, whole milk' as name, 100.0 as qty
    UNION ALL SELECT 'Whole Wheat Bread', 120.0
    UNION ALL SELECT 'Cottage Cheese, 1% milkfat', 50.0
    UNION ALL SELECT 'Bananas', 150.0
    UNION ALL SELECT 'Blueberries', 30.0
    UNION ALL SELECT 'Chia Seeds', 10.0
) portions
JOIN ingredients i ON i.name = portions.name
WHERE NOT EXISTS (
    SELECT 1 FROM meal_items mi 
    WHERE mi.meal_id = m.id AND mi.ingredient_id = i.id
);

-- MEAL 20: Greek Yogurt & Fruit Salad
INSERT INTO meal_items (meal_id, ingredient_id, quantity_g)
SELECT m.id, i.id, portions.qty
FROM (SELECT id FROM meals WHERE name = 'Greek Yogurt & Fruit Salad' LIMIT 1) m
CROSS JOIN (
    SELECT 'Plain Low-Fat Greek Yogurt' as name, 100.0 as qty
    UNION ALL SELECT 'Apples', 100.0
    UNION ALL SELECT 'Bananas', 100.0
    UNION ALL SELECT 'Kiwi', 100.0
    UNION ALL SELECT 'Blueberries', 50.0
    UNION ALL SELECT 'Mixed Nuts', 20.0
    UNION ALL SELECT 'Optimum Gold Standard Whey Protein Powder', 40.0
) portions
JOIN ingredients i ON i.name = portions.name
WHERE NOT EXISTS (
    SELECT 1 FROM meal_items mi 
    WHERE mi.meal_id = m.id AND mi.ingredient_id = i.id
);

-- Final verification query
SELECT 
    m.name as meal_name, 
    m.is_template,
    COUNT(mi.id) as ingredient_count,
    SUM(mi.quantity_g * i.kcal / 100) as calculated_calories
FROM meals m 
LEFT JOIN meal_items mi ON m.id = mi.meal_id 
LEFT JOIN ingredients i ON mi.ingredient_id = i.id
WHERE m.is_template = true 
GROUP BY m.id, m.name, m.is_template
ORDER BY m.name;
