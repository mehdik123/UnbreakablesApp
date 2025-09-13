-- Insert 10 sample meals with 800 kcal each across different categories
-- First, let's insert some sample ingredients if they don't exist

INSERT INTO ingredients (name, kcal, protein, fat, carbs) VALUES
('Chicken Breast', 165, 31, 3.6, 0),
('Brown Rice', 123, 2.6, 0.9, 23),
('Broccoli', 34, 2.8, 0.4, 7),
('Olive Oil', 884, 0, 100, 0),
('Eggs', 155, 13, 11, 1.1),
('Whole Wheat Bread', 247, 13, 4.2, 41),
('Avocado', 160, 2, 15, 9),
('Greek Yogurt', 59, 10, 0.4, 3.6),
('Oats', 389, 16.9, 6.9, 66.3),
('Banana', 89, 1.1, 0.3, 23),
('Salmon', 208, 20, 12, 0),
('Sweet Potato', 86, 1.6, 0.1, 20),
('Spinach', 23, 2.9, 0.4, 3.6),
('Almonds', 579, 21, 50, 22),
('Quinoa', 368, 14, 6, 64),
('Turkey Breast', 135, 30, 1, 0),
('Bell Pepper', 31, 1, 0.3, 7),
('Cucumber', 16, 0.7, 0.1, 4),
('Tomato', 18, 0.9, 0.2, 3.9),
('Feta Cheese', 264, 14, 21, 4),
('Lemon', 29, 1.1, 0.3, 9),
('Garlic', 149, 6.4, 0.5, 33),
('Onion', 40, 1.1, 0.1, 9.3),
('Pasta', 131, 5, 1.1, 25),
('Mozzarella', 300, 22, 22, 2.2),
('Basil', 22, 3.2, 0.6, 2.6),
('Coconut Oil', 862, 0, 100, 0),
('Protein Powder', 400, 80, 5, 10),
('Berries Mix', 57, 0.7, 0.3, 14),
('Honey', 304, 0.3, 0, 82)
ON CONFLICT (name) DO NOTHING;

-- Now insert the meals
INSERT INTO meals (name, category, image, cooking_instructions) VALUES
('Mediterranean Chicken Bowl', 'lunch', 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop', 'Season chicken with herbs, grill until cooked through. Cook quinoa according to package instructions. Sauté vegetables with olive oil. Combine in bowl and serve.'),
('Protein Pancake Stack', 'breakfast', 'https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=400&h=300&fit=crop', 'Mix oats, protein powder, and egg. Cook pancakes in coconut oil. Top with berries and honey drizzle.'),
('Salmon Power Salad', 'dinner', 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=300&fit=crop', 'Grill salmon with lemon and herbs. Mix spinach, avocado, and vegetables. Dress with olive oil and serve with sweet potato.'),
('Energy Smoothie Bowl', 'breakfast', 'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?w=400&h=300&fit=crop', 'Blend Greek yogurt, banana, and berries. Top with oats, almonds, and honey. Serve chilled.'),
('Turkey Avocado Wrap', 'lunch', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop', 'Layer turkey, avocado, and vegetables in whole wheat tortilla. Add Greek yogurt sauce and wrap tightly.'),
('Pasta Primavera', 'dinner', 'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=400&h=300&fit=crop', 'Cook pasta al dente. Sauté mixed vegetables with garlic and olive oil. Toss with pasta and top with mozzarella.'),
('Quinoa Power Bowl', 'lunch', 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop', 'Cook quinoa with herbs. Roast sweet potato and broccoli. Combine with feta cheese and almonds.'),
('Chocolate Protein Shake', 'snack', 'https://images.unsplash.com/photo-1571115764595-644a1f56a55c?w=400&h=300&fit=crop', 'Blend protein powder, banana, oats, and almond milk. Add honey to taste and serve over ice.'),
('Greek Chicken Salad', 'dinner', 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&h=300&fit=crop', 'Grill seasoned chicken breast. Mix cucumber, tomato, bell pepper with feta. Dress with olive oil and lemon.'),
('Breakfast Power Bowl', 'breakfast', 'https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?w=400&h=300&fit=crop', 'Cook oats with banana. Top with Greek yogurt, almonds, and berries. Drizzle with honey and coconut oil.')
ON CONFLICT (name) DO NOTHING;

-- Get meal IDs for inserting meal_items
-- Meal 1: Mediterranean Chicken Bowl (800 kcal)
INSERT INTO meal_items (meal_id, ingredient_id, quantity) 
SELECT m.id, i.id, 150 FROM meals m, ingredients i WHERE m.name = 'Mediterranean Chicken Bowl' AND i.name = 'Chicken Breast'
UNION ALL
SELECT m.id, i.id, 80 FROM meals m, ingredients i WHERE m.name = 'Mediterranean Chicken Bowl' AND i.name = 'Quinoa'
UNION ALL
SELECT m.id, i.id, 100 FROM meals m, ingredients i WHERE m.name = 'Mediterranean Chicken Bowl' AND i.name = 'Bell Pepper'
UNION ALL
SELECT m.id, i.id, 50 FROM meals m, ingredients i WHERE m.name = 'Mediterranean Chicken Bowl' AND i.name = 'Cucumber'
UNION ALL
SELECT m.id, i.id, 15 FROM meals m, ingredients i WHERE m.name = 'Mediterranean Chicken Bowl' AND i.name = 'Olive Oil'
UNION ALL
SELECT m.id, i.id, 30 FROM meals m, ingredients i WHERE m.name = 'Mediterranean Chicken Bowl' AND i.name = 'Feta Cheese';

-- Meal 2: Protein Pancake Stack (800 kcal)
INSERT INTO meal_items (meal_id, ingredient_id, quantity)
SELECT m.id, i.id, 80 FROM meals m, ingredients i WHERE m.name = 'Protein Pancake Stack' AND i.name = 'Oats'
UNION ALL
SELECT m.id, i.id, 60 FROM meals m, ingredients i WHERE m.name = 'Protein Pancake Stack' AND i.name = 'Protein Powder'
UNION ALL
SELECT m.id, i.id, 100 FROM meals m, ingredients i WHERE m.name = 'Protein Pancake Stack' AND i.name = 'Eggs'
UNION ALL
SELECT m.id, i.id, 150 FROM meals m, ingredients i WHERE m.name = 'Protein Pancake Stack' AND i.name = 'Berries Mix'
UNION ALL
SELECT m.id, i.id, 25 FROM meals m, ingredients i WHERE m.name = 'Protein Pancake Stack' AND i.name = 'Honey'
UNION ALL
SELECT m.id, i.id, 10 FROM meals m, ingredients i WHERE m.name = 'Protein Pancake Stack' AND i.name = 'Coconut Oil';

-- Meal 3: Salmon Power Salad (800 kcal)
INSERT INTO meal_items (meal_id, ingredient_id, quantity)
SELECT m.id, i.id, 150 FROM meals m, ingredients i WHERE m.name = 'Salmon Power Salad' AND i.name = 'Salmon'
UNION ALL
SELECT m.id, i.id, 100 FROM meals m, ingredients i WHERE m.name = 'Salmon Power Salad' AND i.name = 'Avocado'
UNION ALL
SELECT m.id, i.id, 150 FROM meals m, ingredients i WHERE m.name = 'Salmon Power Salad' AND i.name = 'Spinach'
UNION ALL
SELECT m.id, i.id, 200 FROM meals m, ingredients i WHERE m.name = 'Salmon Power Salad' AND i.name = 'Sweet Potato'
UNION ALL
SELECT m.id, i.id, 15 FROM meals m, ingredients i WHERE m.name = 'Salmon Power Salad' AND i.name = 'Olive Oil'
UNION ALL
SELECT m.id, i.id, 30 FROM meals m, ingredients i WHERE m.name = 'Salmon Power Salad' AND i.name = 'Almonds';

-- Meal 4: Energy Smoothie Bowl (800 kcal)
INSERT INTO meal_items (meal_id, ingredient_id, quantity)
SELECT m.id, i.id, 200 FROM meals m, ingredients i WHERE m.name = 'Energy Smoothie Bowl' AND i.name = 'Greek Yogurt'
UNION ALL
SELECT m.id, i.id, 150 FROM meals m, ingredients i WHERE m.name = 'Energy Smoothie Bowl' AND i.name = 'Banana'
UNION ALL
SELECT m.id, i.id, 100 FROM meals m, ingredients i WHERE m.name = 'Energy Smoothie Bowl' AND i.name = 'Berries Mix'
UNION ALL
SELECT m.id, i.id, 60 FROM meals m, ingredients i WHERE m.name = 'Energy Smoothie Bowl' AND i.name = 'Oats'
UNION ALL
SELECT m.id, i.id, 40 FROM meals m, ingredients i WHERE m.name = 'Energy Smoothie Bowl' AND i.name = 'Almonds'
UNION ALL
SELECT m.id, i.id, 30 FROM meals m, ingredients i WHERE m.name = 'Energy Smoothie Bowl' AND i.name = 'Honey';

-- Meal 5: Turkey Avocado Wrap (800 kcal)
INSERT INTO meal_items (meal_id, ingredient_id, quantity)
SELECT m.id, i.id, 150 FROM meals m, ingredients i WHERE m.name = 'Turkey Avocado Wrap' AND i.name = 'Turkey Breast'
UNION ALL
SELECT m.id, i.id, 100 FROM meals m, ingredients i WHERE m.name = 'Turkey Avocado Wrap' AND i.name = 'Avocado'
UNION ALL
SELECT m.id, i.id, 80 FROM meals m, ingredients i WHERE m.name = 'Turkey Avocado Wrap' AND i.name = 'Whole Wheat Bread'
UNION ALL
SELECT m.id, i.id, 100 FROM meals m, ingredients i WHERE m.name = 'Turkey Avocado Wrap' AND i.name = 'Greek Yogurt'
UNION ALL
SELECT m.id, i.id, 50 FROM meals m, ingredients i WHERE m.name = 'Turkey Avocado Wrap' AND i.name = 'Spinach'
UNION ALL
SELECT m.id, i.id, 50 FROM meals m, ingredients i WHERE m.name = 'Turkey Avocado Wrap' AND i.name = 'Tomato';

-- Meal 6: Pasta Primavera (800 kcal)
INSERT INTO meal_items (meal_id, ingredient_id, quantity)
SELECT m.id, i.id, 120 FROM meals m, ingredients i WHERE m.name = 'Pasta Primavera' AND i.name = 'Pasta'
UNION ALL
SELECT m.id, i.id, 100 FROM meals m, ingredients i WHERE m.name = 'Pasta Primavera' AND i.name = 'Bell Pepper'
UNION ALL
SELECT m.id, i.id, 100 FROM meals m, ingredients i WHERE m.name = 'Pasta Primavera' AND i.name = 'Broccoli'
UNION ALL
SELECT m.id, i.id, 60 FROM meals m, ingredients i WHERE m.name = 'Pasta Primavera' AND i.name = 'Mozzarella'
UNION ALL
SELECT m.id, i.id, 20 FROM meals m, ingredients i WHERE m.name = 'Pasta Primavera' AND i.name = 'Olive Oil'
UNION ALL
SELECT m.id, i.id, 10 FROM meals m, ingredients i WHERE m.name = 'Pasta Primavera' AND i.name = 'Garlic';

-- Meal 7: Quinoa Power Bowl (800 kcal)
INSERT INTO meal_items (meal_id, ingredient_id, quantity)
SELECT m.id, i.id, 80 FROM meals m, ingredients i WHERE m.name = 'Quinoa Power Bowl' AND i.name = 'Quinoa'
UNION ALL
SELECT m.id, i.id, 200 FROM meals m, ingredients i WHERE m.name = 'Quinoa Power Bowl' AND i.name = 'Sweet Potato'
UNION ALL
SELECT m.id, i.id, 150 FROM meals m, ingredients i WHERE m.name = 'Quinoa Power Bowl' AND i.name = 'Broccoli'
UNION ALL
SELECT m.id, i.id, 50 FROM meals m, ingredients i WHERE m.name = 'Quinoa Power Bowl' AND i.name = 'Feta Cheese'
UNION ALL
SELECT m.id, i.id, 30 FROM meals m, ingredients i WHERE m.name = 'Quinoa Power Bowl' AND i.name = 'Almonds'
UNION ALL
SELECT m.id, i.id, 15 FROM meals m, ingredients i WHERE m.name = 'Quinoa Power Bowl' AND i.name = 'Olive Oil';

-- Meal 8: Chocolate Protein Shake (800 kcal)
INSERT INTO meal_items (meal_id, ingredient_id, quantity)
SELECT m.id, i.id, 80 FROM meals m, ingredients i WHERE m.name = 'Chocolate Protein Shake' AND i.name = 'Protein Powder'
UNION ALL
SELECT m.id, i.id, 150 FROM meals m, ingredients i WHERE m.name = 'Chocolate Protein Shake' AND i.name = 'Banana'
UNION ALL
SELECT m.id, i.id, 60 FROM meals m, ingredients i WHERE m.name = 'Chocolate Protein Shake' AND i.name = 'Oats'
UNION ALL
SELECT m.id, i.id, 40 FROM meals m, ingredients i WHERE m.name = 'Chocolate Protein Shake' AND i.name = 'Almonds'
UNION ALL
SELECT m.id, i.id, 30 FROM meals m, ingredients i WHERE m.name = 'Chocolate Protein Shake' AND i.name = 'Honey'
UNION ALL
SELECT m.id, i.id, 10 FROM meals m, ingredients i WHERE m.name = 'Chocolate Protein Shake' AND i.name = 'Coconut Oil';

-- Meal 9: Greek Chicken Salad (800 kcal)
INSERT INTO meal_items (meal_id, ingredient_id, quantity)
SELECT m.id, i.id, 150 FROM meals m, ingredients i WHERE m.name = 'Greek Chicken Salad' AND i.name = 'Chicken Breast'
UNION ALL
SELECT m.id, i.id, 100 FROM meals m, ingredients i WHERE m.name = 'Greek Chicken Salad' AND i.name = 'Cucumber'
UNION ALL
SELECT m.id, i.id, 100 FROM meals m, ingredients i WHERE m.name = 'Greek Chicken Salad' AND i.name = 'Tomato'
UNION ALL
SELECT m.id, i.id, 80 FROM meals m, ingredients i WHERE m.name = 'Greek Chicken Salad' AND i.name = 'Bell Pepper'
UNION ALL
SELECT m.id, i.id, 60 FROM meals m, ingredients i WHERE m.name = 'Greek Chicken Salad' AND i.name = 'Feta Cheese'
UNION ALL
SELECT m.id, i.id, 20 FROM meals m, ingredients i WHERE m.name = 'Greek Chicken Salad' AND i.name = 'Olive Oil';

-- Meal 10: Breakfast Power Bowl (800 kcal)
INSERT INTO meal_items (meal_id, ingredient_id, quantity)
SELECT m.id, i.id, 80 FROM meals m, ingredients i WHERE m.name = 'Breakfast Power Bowl' AND i.name = 'Oats'
UNION ALL
SELECT m.id, i.id, 150 FROM meals m, ingredients i WHERE m.name = 'Breakfast Power Bowl' AND i.name = 'Banana'
UNION ALL
SELECT m.id, i.id, 150 FROM meals m, ingredients i WHERE m.name = 'Breakfast Power Bowl' AND i.name = 'Greek Yogurt'
UNION ALL
SELECT m.id, i.id, 40 FROM meals m, ingredients i WHERE m.name = 'Breakfast Power Bowl' AND i.name = 'Almonds'
UNION ALL
SELECT m.id, i.id, 100 FROM meals m, ingredients i WHERE m.name = 'Breakfast Power Bowl' AND i.name = 'Berries Mix'
UNION ALL
SELECT m.id, i.id, 25 FROM meals m, ingredients i WHERE m.name = 'Breakfast Power Bowl' AND i.name = 'Honey'
UNION ALL
SELECT m.id, i.id, 10 FROM meals m, ingredients i WHERE m.name = 'Breakfast Power Bowl' AND i.name = 'Coconut Oil';

