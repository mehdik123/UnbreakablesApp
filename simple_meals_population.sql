-- Simple meal population script - No conflicts, just basic INSERTs
-- Run this script in your Supabase SQL editor

-- Step 1: Add ingredients (ignore if they already exist)
INSERT INTO ingredients (name, kcal, protein, fat, carbs) VALUES
('Cheddar Cheese', 403, 25, 33, 1.3),
('Whole Milk', 42, 3.4, 1, 5),
('Turkey Bacon', 541, 8.5, 52, 0.1),
('Optimum Gold Standard Whey Protein Powder', 400, 80, 5, 10),
('Perly', 59, 10, 0.4, 3.6),
('Lean Ground Beef', 250, 26, 15, 0),
('Rice', 130, 2.7, 0.3, 28),
('Green Beans', 31, 1.8, 0.1, 7),
('Cheese, Regular', 300, 22, 22, 2.2),
('Tuna', 132, 28, 1.3, 0),
('Ebly', 130, 4, 0.5, 25),
('Mayonnaise', 680, 1, 75, 0.6),
('Yellow Sweet Corn', 86, 3.3, 1.2, 19),
('Butter', 717, 0.9, 81, 0.1),
('Cottage Cheese, 1% milkfat', 72, 12, 1, 4),
('Kiwi', 61, 1.1, 0.5, 15),
('Chia Seeds', 486, 17, 31, 42),
('Blueberries', 57, 0.7, 0.3, 14),
('Bananas', 89, 1.1, 0.3, 23),
('Apples', 52, 0.3, 0.2, 14),
('Mixed Nuts', 607, 20, 54, 21),
('Bell Pepper', 31, 1, 0.3, 7),
('Carrots', 41, 0.9, 0.2, 10),
('Dark Chocolate, 70-85% Cacao', 598, 7.8, 43, 46),
('Peanut Butter', 588, 25, 50, 20),
('Cinnamon', 247, 4, 1.2, 81),
('Water', 0, 0, 0, 0);

-- Step 2: Add meals
INSERT INTO meals (name, category, image, cooking_instructions, is_template, kcal_target) VALUES
('Cheesy Scrambled Eggs', 'breakfast', 'https://images.unsplash.com/photo-1495214783159-3503fd1b572d?w=400&h=300&fit=crop', 'Beat eggs and blend them with finely chopped spinach. Heat a tablespoon of olive oil in a non-stick skillet, and pour in the egg mixture. As the eggs begin to set, sprinkle over the reduced amount of shredded cheese. Serve this alongside a slice of toasted whole bread and a cup of Milk', true, 800),
('Scrambled Eggs With Oatmeal', 'breakfast', 'https://images.unsplash.com/photo-1584042839955-f79a32194639?w=400&h=300&fit=crop', 'Start by cooking the oatmeal in milk until creamy and soft. While the oatmeal is cooking, beat the eggs and then scramble them in a skillet with a tablespoon of olive oil, ensuring they remain fluffy and light. Once both the oatmeal and eggs are ready, stir a tablespoon of peanut butter into the oatmeal for extra richness. Serve the scrambled eggs alongside the oatmeal and sprinkle the blueberries over the oatmeal for a burst of freshness and sweetness.', true, 800),
('Oatmeal With Milk and Banana', 'breakfast', 'https://images.unsplash.com/photo-1506128183184-207d8b0b5e40?w=400&h=300&fit=crop', 'To make your meal, boil milk and add oatmeal, cooking until soft. Stir in a tablespoon of peanut butter. Top the oatmeal with sliced banana, dark chocolate and mixed nuts.', true, 800),
('Oatmeal And Eggs Pancakes', 'breakfast', 'https://images.unsplash.com/photo-1557088421-ee4fa299e52c?w=400&h=300&fit=crop', 'Create a pancake batter by mixing the oatmeal, milk, whole eggs, and egg whites. Mash the banana and incorporate it into the batter along with the peanut butter and honey for natural sweetness. Cook the pancakes in a non-stick skillet over medium heat until bubbles form and the edges appear dry, then flip to cook the other side. Serve the pancakes with a dollop of Perly yogurt on top and sprinkle with shaved dark chocolate.', true, 800),
('Egg Omlet With Bread And Avocado', 'breakfast', 'https://images.unsplash.com/photo-1541544453-66444983a50a?w=400&h=300&fit=crop', 'Whisk three large eggs and scramble them in a non-stick skillet over medium heat until they are fully cooked but still moist. While the eggs are cooking, toast a slice of whole bread and spread a tablespoon of peanut butter over it. Top the toast with sliced avocado. On the side, arrange half a sliced banana. Serve the creamy scrambled eggs alongside the peanut butter and avocado toast, creating a nutritious and satisfying meal.', true, 800),
('Oatmeal And Eggs With Whey Protein', 'breakfast', 'https://images.unsplash.com/photo-1596799562445-53865611052b?w=400&h=300&fit=crop', 'To make your meal, boil milk and add oatmeal, cooking until soft. Stir in a tablespoon of peanut butter. Cut Bananas into small slices and add them with a scoop of whey protein to the mixture . Finally add some almonds for taste and magnesium boost.', true, 800),
('Scrambled Eggs With Avocado And Cheese', 'breakfast', 'https://images.unsplash.com/photo-1626202029598-9366113885d7?w=400&h=300&fit=crop', 'Heat a tablespoon of olive oil in a pan and scramble eggs until they are set but still creamy. Meanwhile, mash avocado and spread it evenly over slices of whole bread. Lay the scrambled eggs on top of the mashed avocado, and top with sliced cheddar cheese.', true, 800),
('Egg & Bacon Omelet', 'breakfast', 'https://images.unsplash.com/photo-1582512422033-4ab34b4044b7?w=400&h=300&fit=crop', 'To prepare your meal, heat olive oil in a pan and cook the turkey bacon and egg until done. Roast or steam the sweet potato until tender. In a bowl, combine spinach with sliced avocado and apple, then top with the bacon, egg, and sweet potato. Enjoy your meal.', true, 800),
('Quinoa and Chicken Breast Salad', 'lunch', 'https://images.unsplash.com/photo-1594998703358-13a48c6a6f13?w=400&h=300&fit=crop', 'To make your meal, cook the quinoa until tender and pan-fry the chicken in olive oil until golden. In a bowl, dice the apple and avocado and toss with almonds.', true, 800),
('Oatmeal & Fruits', 'breakfast', 'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=400&h=300&fit=crop', 'Cook the raw oats with water until soft. Mix in the whey protein powder, honey, and cinnamon. Top with fresh blueberries, sliced bananas, and diced apples.', true, 800),
('Ground Beef With Pasta And Avocado', 'lunch', 'https://images.unsplash.com/photo-1621996346565-e326e22e3824?w=400&h=300&fit=crop', 'Cook the pasta in Boiled Water and add you favourite seasonning. Add olive oil to a frying pan to avoid sticking and cook the beef and onion, when cooked, add the cheese, cut avocado and lettuce to small slices and mix everything.', true, 800),
('Ground Beef With Rice And Avocado', 'lunch', 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&h=300&fit=crop', 'Cook the rice in Boiled Water and add you favourite seasonning. Add olive oil to a frying pan to avoid sticking and cook the beef and onion, when cooked, add the cheese, cut avocado to small slices and mix everything.', true, 800),
('Rice & Chicken Breast With Green Beans', 'lunch', 'https://images.unsplash.com/photo-1598103442345-02627b0b0758?w=400&h=300&fit=crop', 'Cook the rice and beans in Boiled Water and add you favourite seasonning. Add olive oil to a frying pan to avoid sticking and cook the chicken breast and onion, when cooked, add the cheese and mix everything in a bowl.', true, 800),
('Sweet Potatoes With Chicken Breast', 'dinner', 'https://images.unsplash.com/photo-1631100989904-a2d807a016f4?w=400&h=300&fit=crop', 'To make your meal, boil potatoes and broccoli, cooking until soft. Stir in a tablespoon of olive oil. Cook the chicken breast in the oven, keep the onion fresh and cut it into small slices, same for the avocado then mix everything in a bowl.', true, 800),
('Rice & Chicken Breast With Broccoli', 'lunch', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop', 'Cook the rice and broccoli in Boiled Water and add you favourite seasonning. Add olive oil to a frying pan to avoid sticking and cook the chicken breast and onion, when cooked, add the cheese and mix everything in a bowl.', true, 800),
('Chicken Breast Salad', 'lunch', 'https://images.unsplash.com/photo-1540420773420-28507da66d68?w=400&h=300&fit=crop', 'Cook the chicken breast and slice it. Combine with steamed green beans, and freshly sliced cucumber, onion, carrots, apples, and avocado to create a large salad.', true, 800),
('Tuna With Ebly And Cheese', 'lunch', 'https://images.unsplash.com/photo-1598515213692-5f282436df20?w=400&h=300&fit=crop', 'Cook the Ebly (wheat berries) according to package directions. Steam or boil the green beans. In a bowl, combine the cooked Ebly, tuna, green beans, corn, and sliced avocado. Mix in mayonnaise and a drizzle of olive oil to create a salad.', true, 800),
('Salmon With Sweet Potatoes', 'dinner', 'https://images.unsplash.com/photo-1607584196443-c05244519782?w=400&h=300&fit=crop', 'Season the salmon fillet. Chop the sweet potato and broccoli, toss with melted butter and minced garlic, and roast until tender. Bake or pan-sear the salmon until cooked through. Serve together.', true, 800),
('Greek Yogurt & Toast', 'snack', 'https://images.unsplash.com/photo-1584515933487-be72835aa71f?w=400&h=300&fit=crop', 'Top the whole wheat toast with fresh cottage cheese, banana slices, blueberries, and take the greek Yogurt separalty.', true, 800),
('Greek Yogurt & Fruit Salad', 'snack', 'https://images.unsplash.com/photo-1552010292-56414343e3d9?w=400&h=300&fit=crop', 'In a bowl, mix the whey protein powder into the Greek yogurt until smooth. Top with sliced apples, bananas, kiwi, blueberries, and mixed nuts.', true, 800);

-- Step 3: Add meal items for each meal
-- MEAL 1: Cheesy Scrambled Eggs
INSERT INTO meal_items (meal_id, ingredient_id, quantity_g)
SELECT m.id, i.id, 200.0 FROM meals m, ingredients i WHERE m.name = 'Cheesy Scrambled Eggs' AND i.name = 'Eggs'
UNION ALL SELECT m.id, i.id, 10.0 FROM meals m, ingredients i WHERE m.name = 'Cheesy Scrambled Eggs' AND i.name = 'Cheddar Cheese'
UNION ALL SELECT m.id, i.id, 120.0 FROM meals m, ingredients i WHERE m.name = 'Cheesy Scrambled Eggs' AND i.name = 'Whole Wheat Bread'
UNION ALL SELECT m.id, i.id, 30.0 FROM meals m, ingredients i WHERE m.name = 'Cheesy Scrambled Eggs' AND i.name = 'Spinach'
UNION ALL SELECT m.id, i.id, 5.0 FROM meals m, ingredients i WHERE m.name = 'Cheesy Scrambled Eggs' AND i.name = 'Olive Oil'
UNION ALL SELECT m.id, i.id, 100.0 FROM meals m, ingredients i WHERE m.name = 'Cheesy Scrambled Eggs' AND i.name = 'Whole Milk';

-- MEAL 2: Scrambled Eggs With Oatmeal
INSERT INTO meal_items (meal_id, ingredient_id, quantity_g)
SELECT m.id, i.id, 100.0 FROM meals m, ingredients i WHERE m.name = 'Scrambled Eggs With Oatmeal' AND i.name = 'Eggs'
UNION ALL SELECT m.id, i.id, 50.0 FROM meals m, ingredients i WHERE m.name = 'Scrambled Eggs With Oatmeal' AND i.name = 'Oats'
UNION ALL SELECT m.id, i.id, 120.0 FROM meals m, ingredients i WHERE m.name = 'Scrambled Eggs With Oatmeal' AND i.name = 'Whole Milk'
UNION ALL SELECT m.id, i.id, 5.0 FROM meals m, ingredients i WHERE m.name = 'Scrambled Eggs With Oatmeal' AND i.name = 'Olive Oil'
UNION ALL SELECT m.id, i.id, 20.0 FROM meals m, ingredients i WHERE m.name = 'Scrambled Eggs With Oatmeal' AND i.name = 'Blueberries'
UNION ALL SELECT m.id, i.id, 100.0 FROM meals m, ingredients i WHERE m.name = 'Scrambled Eggs With Oatmeal' AND i.name = 'Whole Wheat Bread';

-- MEAL 3: Oatmeal With Milk and Banana
INSERT INTO meal_items (meal_id, ingredient_id, quantity_g)
SELECT m.id, i.id, 20.0 FROM meals m, ingredients i WHERE m.name = 'Oatmeal With Milk and Banana' AND i.name = 'Peanut Butter'
UNION ALL SELECT m.id, i.id, 100.0 FROM meals m, ingredients i WHERE m.name = 'Oatmeal With Milk and Banana' AND i.name = 'Oats'
UNION ALL SELECT m.id, i.id, 200.0 FROM meals m, ingredients i WHERE m.name = 'Oatmeal With Milk and Banana' AND i.name = 'Whole Milk'
UNION ALL SELECT m.id, i.id, 100.0 FROM meals m, ingredients i WHERE m.name = 'Oatmeal With Milk and Banana' AND i.name = 'Bananas'
UNION ALL SELECT m.id, i.id, 30.0 FROM meals m, ingredients i WHERE m.name = 'Oatmeal With Milk and Banana' AND i.name = 'Mixed Nuts'
UNION ALL SELECT m.id, i.id, 20.0 FROM meals m, ingredients i WHERE m.name = 'Oatmeal With Milk and Banana' AND i.name = 'Dark Chocolate, 70-85% Cacao';

-- MEAL 4: Oatmeal And Eggs Pancakes
INSERT INTO meal_items (meal_id, ingredient_id, quantity_g)
SELECT m.id, i.id, 70.0 FROM meals m, ingredients i WHERE m.name = 'Oatmeal And Eggs Pancakes' AND i.name = 'Oats'
UNION ALL SELECT m.id, i.id, 200.0 FROM meals m, ingredients i WHERE m.name = 'Oatmeal And Eggs Pancakes' AND i.name = 'Eggs'
UNION ALL SELECT m.id, i.id, 60.0 FROM meals m, ingredients i WHERE m.name = 'Oatmeal And Eggs Pancakes' AND i.name = 'Bananas'
UNION ALL SELECT m.id, i.id, 5.0 FROM meals m, ingredients i WHERE m.name = 'Oatmeal And Eggs Pancakes' AND i.name = 'Honey'
UNION ALL SELECT m.id, i.id, 10.0 FROM meals m, ingredients i WHERE m.name = 'Oatmeal And Eggs Pancakes' AND i.name = 'Dark Chocolate, 70-85% Cacao'
UNION ALL SELECT m.id, i.id, 100.0 FROM meals m, ingredients i WHERE m.name = 'Oatmeal And Eggs Pancakes' AND i.name = 'Perly';

-- MEAL 5: Egg Omlet With Bread And Avocado
INSERT INTO meal_items (meal_id, ingredient_id, quantity_g)
SELECT m.id, i.id, 150.0 FROM meals m, ingredients i WHERE m.name = 'Egg Omlet With Bread And Avocado' AND i.name = 'Eggs'
UNION ALL SELECT m.id, i.id, 15.0 FROM meals m, ingredients i WHERE m.name = 'Egg Omlet With Bread And Avocado' AND i.name = 'Peanut Butter'
UNION ALL SELECT m.id, i.id, 80.0 FROM meals m, ingredients i WHERE m.name = 'Egg Omlet With Bread And Avocado' AND i.name = 'Whole Wheat Bread'
UNION ALL SELECT m.id, i.id, 100.0 FROM meals m, ingredients i WHERE m.name = 'Egg Omlet With Bread And Avocado' AND i.name = 'Avocado'
UNION ALL SELECT m.id, i.id, 5.0 FROM meals m, ingredients i WHERE m.name = 'Egg Omlet With Bread And Avocado' AND i.name = 'Olive Oil'
UNION ALL SELECT m.id, i.id, 10.0 FROM meals m, ingredients i WHERE m.name = 'Egg Omlet With Bread And Avocado' AND i.name = 'Cheddar Cheese';

-- MEAL 6: Oatmeal And Eggs With Whey Protein
INSERT INTO meal_items (meal_id, ingredient_id, quantity_g)
SELECT m.id, i.id, 10.0 FROM meals m, ingredients i WHERE m.name = 'Oatmeal And Eggs With Whey Protein' AND i.name = 'Peanut Butter'
UNION ALL SELECT m.id, i.id, 80.0 FROM meals m, ingredients i WHERE m.name = 'Oatmeal And Eggs With Whey Protein' AND i.name = 'Oats'
UNION ALL SELECT m.id, i.id, 150.0 FROM meals m, ingredients i WHERE m.name = 'Oatmeal And Eggs With Whey Protein' AND i.name = 'Whole Milk'
UNION ALL SELECT m.id, i.id, 60.0 FROM meals m, ingredients i WHERE m.name = 'Oatmeal And Eggs With Whey Protein' AND i.name = 'Bananas'
UNION ALL SELECT m.id, i.id, 30.0 FROM meals m, ingredients i WHERE m.name = 'Oatmeal And Eggs With Whey Protein' AND i.name = 'Optimum Gold Standard Whey Protein Powder'
UNION ALL SELECT m.id, i.id, 15.0 FROM meals m, ingredients i WHERE m.name = 'Oatmeal And Eggs With Whey Protein' AND i.name = 'Almonds';

-- MEAL 7: Scrambled Eggs With Avocado And Cheese
INSERT INTO meal_items (meal_id, ingredient_id, quantity_g)
SELECT m.id, i.id, 200.0 FROM meals m, ingredients i WHERE m.name = 'Scrambled Eggs With Avocado And Cheese' AND i.name = 'Eggs'
UNION ALL SELECT m.id, i.id, 100.0 FROM meals m, ingredients i WHERE m.name = 'Scrambled Eggs With Avocado And Cheese' AND i.name = 'Avocado'
UNION ALL SELECT m.id, i.id, 10.0 FROM meals m, ingredients i WHERE m.name = 'Scrambled Eggs With Avocado And Cheese' AND i.name = 'Cheddar Cheese'
UNION ALL SELECT m.id, i.id, 120.0 FROM meals m, ingredients i WHERE m.name = 'Scrambled Eggs With Avocado And Cheese' AND i.name = 'Whole Wheat Bread'
UNION ALL SELECT m.id, i.id, 5.0 FROM meals m, ingredients i WHERE m.name = 'Scrambled Eggs With Avocado And Cheese' AND i.name = 'Olive Oil';

-- MEAL 8: Egg & Bacon Omelet
INSERT INTO meal_items (meal_id, ingredient_id, quantity_g)
SELECT m.id, i.id, 200.0 FROM meals m, ingredients i WHERE m.name = 'Egg & Bacon Omelet' AND i.name = 'Eggs'
UNION ALL SELECT m.id, i.id, 50.0 FROM meals m, ingredients i WHERE m.name = 'Egg & Bacon Omelet' AND i.name = 'Turkey Bacon'
UNION ALL SELECT m.id, i.id, 100.0 FROM meals m, ingredients i WHERE m.name = 'Egg & Bacon Omelet' AND i.name = 'Avocado'
UNION ALL SELECT m.id, i.id, 50.0 FROM meals m, ingredients i WHERE m.name = 'Egg & Bacon Omelet' AND i.name = 'Spinach'
UNION ALL SELECT m.id, i.id, 150.0 FROM meals m, ingredients i WHERE m.name = 'Egg & Bacon Omelet' AND i.name = 'Sweet Potato'
UNION ALL SELECT m.id, i.id, 5.0 FROM meals m, ingredients i WHERE m.name = 'Egg & Bacon Omelet' AND i.name = 'Olive Oil'
UNION ALL SELECT m.id, i.id, 100.0 FROM meals m, ingredients i WHERE m.name = 'Egg & Bacon Omelet' AND i.name = 'Apples';

-- MEAL 9: Quinoa and Chicken Breast Salad
INSERT INTO meal_items (meal_id, ingredient_id, quantity_g)
SELECT m.id, i.id, 80.0 FROM meals m, ingredients i WHERE m.name = 'Quinoa and Chicken Breast Salad' AND i.name = 'Quinoa'
UNION ALL SELECT m.id, i.id, 100.0 FROM meals m, ingredients i WHERE m.name = 'Quinoa and Chicken Breast Salad' AND i.name = 'Chicken Breast'
UNION ALL SELECT m.id, i.id, 100.0 FROM meals m, ingredients i WHERE m.name = 'Quinoa and Chicken Breast Salad' AND i.name = 'Avocado'
UNION ALL SELECT m.id, i.id, 10.0 FROM meals m, ingredients i WHERE m.name = 'Quinoa and Chicken Breast Salad' AND i.name = 'Almonds'
UNION ALL SELECT m.id, i.id, 5.0 FROM meals m, ingredients i WHERE m.name = 'Quinoa and Chicken Breast Salad' AND i.name = 'Olive Oil'
UNION ALL SELECT m.id, i.id, 100.0 FROM meals m, ingredients i WHERE m.name = 'Quinoa and Chicken Breast Salad' AND i.name = 'Apples';

-- MEAL 10: Oatmeal & Fruits
INSERT INTO meal_items (meal_id, ingredient_id, quantity_g)
SELECT m.id, i.id, 70.0 FROM meals m, ingredients i WHERE m.name = 'Oatmeal & Fruits' AND i.name = 'Oats'
UNION ALL SELECT m.id, i.id, 100.0 FROM meals m, ingredients i WHERE m.name = 'Oatmeal & Fruits' AND i.name = 'Water'
UNION ALL SELECT m.id, i.id, 10.0 FROM meals m, ingredients i WHERE m.name = 'Oatmeal & Fruits' AND i.name = 'Honey'
UNION ALL SELECT m.id, i.id, 50.0 FROM meals m, ingredients i WHERE m.name = 'Oatmeal & Fruits' AND i.name = 'Blueberries'
UNION ALL SELECT m.id, i.id, 1.0 FROM meals m, ingredients i WHERE m.name = 'Oatmeal & Fruits' AND i.name = 'Cinnamon'
UNION ALL SELECT m.id, i.id, 40.0 FROM meals m, ingredients i WHERE m.name = 'Oatmeal & Fruits' AND i.name = 'Optimum Gold Standard Whey Protein Powder'
UNION ALL SELECT m.id, i.id, 100.0 FROM meals m, ingredients i WHERE m.name = 'Oatmeal & Fruits' AND i.name = 'Bananas'
UNION ALL SELECT m.id, i.id, 100.0 FROM meals m, ingredients i WHERE m.name = 'Oatmeal & Fruits' AND i.name = 'Apples';

-- MEAL 12: Ground Beef With Pasta And Avocado
INSERT INTO meal_items (meal_id, ingredient_id, quantity_g)
SELECT m.id, i.id, 150.0 FROM meals m, ingredients i WHERE m.name = 'Ground Beef With Pasta And Avocado' AND i.name = 'Lean Ground Beef'
UNION ALL SELECT m.id, i.id, 100.0 FROM meals m, ingredients i WHERE m.name = 'Ground Beef With Pasta And Avocado' AND i.name = 'Pasta'
UNION ALL SELECT m.id, i.id, 100.0 FROM meals m, ingredients i WHERE m.name = 'Ground Beef With Pasta And Avocado' AND i.name = 'Avocado'
UNION ALL SELECT m.id, i.id, 5.0 FROM meals m, ingredients i WHERE m.name = 'Ground Beef With Pasta And Avocado' AND i.name = 'Olive Oil'
UNION ALL SELECT m.id, i.id, 10.0 FROM meals m, ingredients i WHERE m.name = 'Ground Beef With Pasta And Avocado' AND i.name = 'Cheddar Cheese'
UNION ALL SELECT m.id, i.id, 50.0 FROM meals m, ingredients i WHERE m.name = 'Ground Beef With Pasta And Avocado' AND i.name = 'Onion';

-- MEAL 13: Ground Beef With Rice And Avocado
INSERT INTO meal_items (meal_id, ingredient_id, quantity_g)
SELECT m.id, i.id, 150.0 FROM meals m, ingredients i WHERE m.name = 'Ground Beef With Rice And Avocado' AND i.name = 'Lean Ground Beef'
UNION ALL SELECT m.id, i.id, 100.0 FROM meals m, ingredients i WHERE m.name = 'Ground Beef With Rice And Avocado' AND i.name = 'Rice'
UNION ALL SELECT m.id, i.id, 10.0 FROM meals m, ingredients i WHERE m.name = 'Ground Beef With Rice And Avocado' AND i.name = 'Cheddar Cheese'
UNION ALL SELECT m.id, i.id, 5.0 FROM meals m, ingredients i WHERE m.name = 'Ground Beef With Rice And Avocado' AND i.name = 'Olive Oil'
UNION ALL SELECT m.id, i.id, 50.0 FROM meals m, ingredients i WHERE m.name = 'Ground Beef With Rice And Avocado' AND i.name = 'Onion'
UNION ALL SELECT m.id, i.id, 50.0 FROM meals m, ingredients i WHERE m.name = 'Ground Beef With Rice And Avocado' AND i.name = 'Bell Pepper';

-- MEAL 14: Rice & Chicken Breast With Green Beans
INSERT INTO meal_items (meal_id, ingredient_id, quantity_g)
SELECT m.id, i.id, 70.0 FROM meals m, ingredients i WHERE m.name = 'Rice & Chicken Breast With Green Beans' AND i.name = 'Rice'
UNION ALL SELECT m.id, i.id, 200.0 FROM meals m, ingredients i WHERE m.name = 'Rice & Chicken Breast With Green Beans' AND i.name = 'Chicken Breast'
UNION ALL SELECT m.id, i.id, 50.0 FROM meals m, ingredients i WHERE m.name = 'Rice & Chicken Breast With Green Beans' AND i.name = 'Onion'
UNION ALL SELECT m.id, i.id, 5.0 FROM meals m, ingredients i WHERE m.name = 'Rice & Chicken Breast With Green Beans' AND i.name = 'Olive Oil'
UNION ALL SELECT m.id, i.id, 100.0 FROM meals m, ingredients i WHERE m.name = 'Rice & Chicken Breast With Green Beans' AND i.name = 'Green Beans'
UNION ALL SELECT m.id, i.id, 10.0 FROM meals m, ingredients i WHERE m.name = 'Rice & Chicken Breast With Green Beans' AND i.name = 'Cheese, Regular';

-- MEAL 15: Sweet Potatoes With Chicken Breast
INSERT INTO meal_items (meal_id, ingredient_id, quantity_g)
SELECT m.id, i.id, 200.0 FROM meals m, ingredients i WHERE m.name = 'Sweet Potatoes With Chicken Breast' AND i.name = 'Sweet Potato'
UNION ALL SELECT m.id, i.id, 150.0 FROM meals m, ingredients i WHERE m.name = 'Sweet Potatoes With Chicken Breast' AND i.name = 'Chicken Breast'
UNION ALL SELECT m.id, i.id, 100.0 FROM meals m, ingredients i WHERE m.name = 'Sweet Potatoes With Chicken Breast' AND i.name = 'Broccoli'
UNION ALL SELECT m.id, i.id, 50.0 FROM meals m, ingredients i WHERE m.name = 'Sweet Potatoes With Chicken Breast' AND i.name = 'Spinach'
UNION ALL SELECT m.id, i.id, 5.0 FROM meals m, ingredients i WHERE m.name = 'Sweet Potatoes With Chicken Breast' AND i.name = 'Olive Oil'
UNION ALL SELECT m.id, i.id, 100.0 FROM meals m, ingredients i WHERE m.name = 'Sweet Potatoes With Chicken Breast' AND i.name = 'Avocado';

-- MEAL 16: Rice & Chicken Breast With Broccoli
INSERT INTO meal_items (meal_id, ingredient_id, quantity_g)
SELECT m.id, i.id, 80.0 FROM meals m, ingredients i WHERE m.name = 'Rice & Chicken Breast With Broccoli' AND i.name = 'Rice'
UNION ALL SELECT m.id, i.id, 200.0 FROM meals m, ingredients i WHERE m.name = 'Rice & Chicken Breast With Broccoli' AND i.name = 'Chicken Breast'
UNION ALL SELECT m.id, i.id, 50.0 FROM meals m, ingredients i WHERE m.name = 'Rice & Chicken Breast With Broccoli' AND i.name = 'Onion'
UNION ALL SELECT m.id, i.id, 5.0 FROM meals m, ingredients i WHERE m.name = 'Rice & Chicken Breast With Broccoli' AND i.name = 'Olive Oil'
UNION ALL SELECT m.id, i.id, 100.0 FROM meals m, ingredients i WHERE m.name = 'Rice & Chicken Breast With Broccoli' AND i.name = 'Broccoli'
UNION ALL SELECT m.id, i.id, 15.0 FROM meals m, ingredients i WHERE m.name = 'Rice & Chicken Breast With Broccoli' AND i.name = 'Cheddar Cheese';

-- MEAL 17: Chicken Breast Salad
INSERT INTO meal_items (meal_id, ingredient_id, quantity_g)
SELECT m.id, i.id, 100.0 FROM meals m, ingredients i WHERE m.name = 'Chicken Breast Salad' AND i.name = 'Green Beans'
UNION ALL SELECT m.id, i.id, 200.0 FROM meals m, ingredients i WHERE m.name = 'Chicken Breast Salad' AND i.name = 'Chicken Breast'
UNION ALL SELECT m.id, i.id, 100.0 FROM meals m, ingredients i WHERE m.name = 'Chicken Breast Salad' AND i.name = 'Cucumber'
UNION ALL SELECT m.id, i.id, 50.0 FROM meals m, ingredients i WHERE m.name = 'Chicken Breast Salad' AND i.name = 'Onion'
UNION ALL SELECT m.id, i.id, 100.0 FROM meals m, ingredients i WHERE m.name = 'Chicken Breast Salad' AND i.name = 'Carrots'
UNION ALL SELECT m.id, i.id, 100.0 FROM meals m, ingredients i WHERE m.name = 'Chicken Breast Salad' AND i.name = 'Apples'
UNION ALL SELECT m.id, i.id, 50.0 FROM meals m, ingredients i WHERE m.name = 'Chicken Breast Salad' AND i.name = 'Avocado';

-- MEAL 18: Tuna With Ebly And Cheese
INSERT INTO meal_items (meal_id, ingredient_id, quantity_g)
SELECT m.id, i.id, 150.0 FROM meals m, ingredients i WHERE m.name = 'Tuna With Ebly And Cheese' AND i.name = 'Tuna'
UNION ALL SELECT m.id, i.id, 80.0 FROM meals m, ingredients i WHERE m.name = 'Tuna With Ebly And Cheese' AND i.name = 'Ebly'
UNION ALL SELECT m.id, i.id, 50.0 FROM meals m, ingredients i WHERE m.name = 'Tuna With Ebly And Cheese' AND i.name = 'Green Beans'
UNION ALL SELECT m.id, i.id, 100.0 FROM meals m, ingredients i WHERE m.name = 'Tuna With Ebly And Cheese' AND i.name = 'Avocado'
UNION ALL SELECT m.id, i.id, 5.0 FROM meals m, ingredients i WHERE m.name = 'Tuna With Ebly And Cheese' AND i.name = 'Mayonnaise'
UNION ALL SELECT m.id, i.id, 20.0 FROM meals m, ingredients i WHERE m.name = 'Tuna With Ebly And Cheese' AND i.name = 'Yellow Sweet Corn'
UNION ALL SELECT m.id, i.id, 5.0 FROM meals m, ingredients i WHERE m.name = 'Tuna With Ebly And Cheese' AND i.name = 'Olive Oil';

-- MEAL 19: Salmon With Sweet Potatoes
INSERT INTO meal_items (meal_id, ingredient_id, quantity_g)
SELECT m.id, i.id, 200.0 FROM meals m, ingredients i WHERE m.name = 'Salmon With Sweet Potatoes' AND i.name = 'Salmon'
UNION ALL SELECT m.id, i.id, 200.0 FROM meals m, ingredients i WHERE m.name = 'Salmon With Sweet Potatoes' AND i.name = 'Sweet Potato'
UNION ALL SELECT m.id, i.id, 100.0 FROM meals m, ingredients i WHERE m.name = 'Salmon With Sweet Potatoes' AND i.name = 'Broccoli'
UNION ALL SELECT m.id, i.id, 20.0 FROM meals m, ingredients i WHERE m.name = 'Salmon With Sweet Potatoes' AND i.name = 'Butter'
UNION ALL SELECT m.id, i.id, 5.0 FROM meals m, ingredients i WHERE m.name = 'Salmon With Sweet Potatoes' AND i.name = 'Garlic';

-- MEAL 20: Greek Yogurt & Toast
INSERT INTO meal_items (meal_id, ingredient_id, quantity_g)
SELECT m.id, i.id, 100.0 FROM meals m, ingredients i WHERE m.name = 'Greek Yogurt & Toast' AND i.name = 'Greek Yogurt'
UNION ALL SELECT m.id, i.id, 120.0 FROM meals m, ingredients i WHERE m.name = 'Greek Yogurt & Toast' AND i.name = 'Whole Wheat Bread'
UNION ALL SELECT m.id, i.id, 50.0 FROM meals m, ingredients i WHERE m.name = 'Greek Yogurt & Toast' AND i.name = 'Cottage Cheese, 1% milkfat'
UNION ALL SELECT m.id, i.id, 150.0 FROM meals m, ingredients i WHERE m.name = 'Greek Yogurt & Toast' AND i.name = 'Bananas'
UNION ALL SELECT m.id, i.id, 30.0 FROM meals m, ingredients i WHERE m.name = 'Greek Yogurt & Toast' AND i.name = 'Blueberries'
UNION ALL SELECT m.id, i.id, 10.0 FROM meals m, ingredients i WHERE m.name = 'Greek Yogurt & Toast' AND i.name = 'Chia Seeds';

-- MEAL 21: Greek Yogurt & Fruit Salad
INSERT INTO meal_items (meal_id, ingredient_id, quantity_g)
SELECT m.id, i.id, 100.0 FROM meals m, ingredients i WHERE m.name = 'Greek Yogurt & Fruit Salad' AND i.name = 'Greek Yogurt'
UNION ALL SELECT m.id, i.id, 100.0 FROM meals m, ingredients i WHERE m.name = 'Greek Yogurt & Fruit Salad' AND i.name = 'Apples'
UNION ALL SELECT m.id, i.id, 100.0 FROM meals m, ingredients i WHERE m.name = 'Greek Yogurt & Fruit Salad' AND i.name = 'Bananas'
UNION ALL SELECT m.id, i.id, 100.0 FROM meals m, ingredients i WHERE m.name = 'Greek Yogurt & Fruit Salad' AND i.name = 'Kiwi'
UNION ALL SELECT m.id, i.id, 50.0 FROM meals m, ingredients i WHERE m.name = 'Greek Yogurt & Fruit Salad' AND i.name = 'Blueberries'
UNION ALL SELECT m.id, i.id, 20.0 FROM meals m, ingredients i WHERE m.name = 'Greek Yogurt & Fruit Salad' AND i.name = 'Mixed Nuts'
UNION ALL SELECT m.id, i.id, 40.0 FROM meals m, ingredients i WHERE m.name = 'Greek Yogurt & Fruit Salad' AND i.name = 'Optimum Gold Standard Whey Protein Powder';

-- Step 4: Verify the meals were created successfully
SELECT 
  m.name as meal_name,
  m.category,
  m.kcal_target,
  COUNT(mi.id) as ingredient_count,
  ROUND(SUM(i.kcal * mi.quantity_g / 100), 0) as calculated_kcal
FROM meals m
LEFT JOIN meal_items mi ON m.id = mi.meal_id
LEFT JOIN ingredients i ON mi.ingredient_id = i.id
WHERE m.name IN (
  'Cheesy Scrambled Eggs',
  'Scrambled Eggs With Oatmeal', 
  'Oatmeal With Milk and Banana',
  'Oatmeal And Eggs Pancakes',
  'Egg Omlet With Bread And Avocado',
  'Oatmeal And Eggs With Whey Protein',
  'Scrambled Eggs With Avocado And Cheese',
  'Egg & Bacon Omelet',
  'Quinoa and Chicken Breast Salad',
  'Oatmeal & Fruits',
  'Ground Beef With Pasta And Avocado',
  'Ground Beef With Rice And Avocado',
  'Rice & Chicken Breast With Green Beans',
  'Sweet Potatoes With Chicken Breast',
  'Rice & Chicken Breast With Broccoli',
  'Chicken Breast Salad',
  'Tuna With Ebly And Cheese',
  'Salmon With Sweet Potatoes',
  'Greek Yogurt & Toast',
  'Greek Yogurt & Fruit Salad'
)
GROUP BY m.id, m.name, m.category, m.kcal_target
ORDER BY m.name;
