-- =====================================================
-- Batch: 6 meals
-- Clear SQL editor, paste ONLY this, Run.
-- If RLS warning → Run without RLS.
-- Ingredients follow your sheets exactly (no extras from photos).
-- =====================================================

INSERT INTO ingredients (name, kcal, protein, fat, carbs)
SELECT 'Basmati Rice', 360, 9, 2, 76
WHERE NOT EXISTS (
  SELECT 1 FROM ingredients WHERE lower(trim(name)) = 'basmati rice'
);

INSERT INTO ingredients (name, kcal, protein, fat, carbs)
SELECT 'Whole Bread Toast', 256, 10, 3, 46
WHERE NOT EXISTS (
  SELECT 1 FROM ingredients WHERE lower(trim(name)) = 'whole bread toast'
);

-- ========== 1) Toast With Chicken Breast ==========
INSERT INTO meals (name, is_template, kcal_target, image, cooking_instructions)
VALUES (
  'Toast With Chicken Breast',
  true,
  650,
  'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400&h=300&fit=crop',
  'Pan-fry the chicken breast in olive oil until cooked through, then slice it. Toast the whole bread, top with sliced avocado, chicken, cheddar cheese, and onion. Serve warm.'
);

INSERT INTO meal_items (meal_id, ingredient_id, quantity_g)
VALUES
(
  (SELECT id FROM meals WHERE name = 'Toast With Chicken Breast' LIMIT 1),
  (SELECT id FROM ingredients WHERE name = 'Whole Bread Toast' LIMIT 1),
  60
),
(
  (SELECT id FROM meals WHERE name = 'Toast With Chicken Breast' LIMIT 1),
  (SELECT id FROM ingredients WHERE name = 'Chicken Breast, Raw' LIMIT 1),
  250
),
(
  (SELECT id FROM meals WHERE name = 'Toast With Chicken Breast' LIMIT 1),
  (SELECT id FROM ingredients WHERE name = 'Cheddar Cheese' LIMIT 1),
  20
),
(
  (SELECT id FROM meals WHERE name = 'Toast With Chicken Breast' LIMIT 1),
  (SELECT id FROM ingredients WHERE name = 'Onion' LIMIT 1),
  50
),
(
  (SELECT id FROM meals WHERE name = 'Toast With Chicken Breast' LIMIT 1),
  (SELECT id FROM ingredients WHERE name = 'Avocado' LIMIT 1),
  50
),
(
  (SELECT id FROM meals WHERE name = 'Toast With Chicken Breast' LIMIT 1),
  (SELECT id FROM ingredients WHERE name = 'Olive Oil' LIMIT 1),
  5
);

-- ========== 2) Toast With Eggs & Ground Beef ==========
INSERT INTO meals (name, is_template, kcal_target, image, cooking_instructions)
VALUES (
  'Toast With Eggs & Ground Beef',
  true,
  650,
  'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=400&h=300&fit=crop',
  'Cook the ground beef in olive oil until browned. Toast the whole bread and top with the beef. Fry or scramble the eggs and place them on top. Serve warm.'
);

INSERT INTO meal_items (meal_id, ingredient_id, quantity_g)
VALUES
(
  (SELECT id FROM meals WHERE name = 'Toast With Eggs & Ground Beef' LIMIT 1),
  (SELECT id FROM ingredients WHERE name = 'Whole Bread Toast' LIMIT 1),
  60
),
(
  (SELECT id FROM meals WHERE name = 'Toast With Eggs & Ground Beef' LIMIT 1),
  (SELECT id FROM ingredients WHERE name = 'Beef, Ground, 70% lean' LIMIT 1),
  200
),
(
  (SELECT id FROM meals WHERE name = 'Toast With Eggs & Ground Beef' LIMIT 1),
  (SELECT id FROM ingredients WHERE name = 'Eggs' LIMIT 1),
  100
),
(
  (SELECT id FROM meals WHERE name = 'Toast With Eggs & Ground Beef' LIMIT 1),
  (SELECT id FROM ingredients WHERE name = 'Olive Oil' LIMIT 1),
  5
);

-- ========== 3) Ground Beef With Rice And Avocado ==========
-- Note: avocado is in the title only; sheet ingredients have broccoli, not avocado.
INSERT INTO meals (name, is_template, kcal_target, image, cooking_instructions)
VALUES (
  'Ground Beef With Rice And Avocado',
  true,
  600,
  'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&h=300&fit=crop',
  'Cook the basmati rice in boiled water until soft. Pan-fry the lean ground beef with onion in olive oil until cooked, then add broccoli and cheddar cheese. Serve the beef mixture over the rice.'
);

INSERT INTO meal_items (meal_id, ingredient_id, quantity_g)
VALUES
(
  (SELECT id FROM meals WHERE name = 'Ground Beef With Rice And Avocado' LIMIT 1),
  (SELECT id FROM ingredients WHERE name = 'Lean Ground Beef, Raw' LIMIT 1),
  200
),
(
  (SELECT id FROM meals WHERE name = 'Ground Beef With Rice And Avocado' LIMIT 1),
  (SELECT id FROM ingredients WHERE name = 'Basmati Rice' LIMIT 1),
  50
),
(
  (SELECT id FROM meals WHERE name = 'Ground Beef With Rice And Avocado' LIMIT 1),
  (SELECT id FROM ingredients WHERE name = 'Cheddar Cheese' LIMIT 1),
  20
),
(
  (SELECT id FROM meals WHERE name = 'Ground Beef With Rice And Avocado' LIMIT 1),
  (SELECT id FROM ingredients WHERE name = 'Olive Oil' LIMIT 1),
  5
),
(
  (SELECT id FROM meals WHERE name = 'Ground Beef With Rice And Avocado' LIMIT 1),
  (SELECT id FROM ingredients WHERE name = 'Onion' LIMIT 1),
  50
),
(
  (SELECT id FROM meals WHERE name = 'Ground Beef With Rice And Avocado' LIMIT 1),
  (SELECT id FROM ingredients WHERE name = 'Broccoli' LIMIT 1),
  50
);

-- ========== 4) Sweet Potatoes With Chicken Breast ==========
INSERT INTO meals (name, is_template, kcal_target, image, cooking_instructions)
VALUES (
  'Sweet Potatoes With Chicken Breast',
  true,
  600,
  'https://images.unsplash.com/photo-1631100989904-a2d807a016f4?w=400&h=300&fit=crop',
  'Roast or boil the sweet potato until soft. Cook the chicken breast in olive oil until done, then slice it. Serve with fresh spinach and sliced avocado on the side.'
);

INSERT INTO meal_items (meal_id, ingredient_id, quantity_g)
VALUES
(
  (SELECT id FROM meals WHERE name = 'Sweet Potatoes With Chicken Breast' LIMIT 1),
  (SELECT id FROM ingredients WHERE name = 'Sweet Potato, Raw' LIMIT 1),
  200
),
(
  (SELECT id FROM meals WHERE name = 'Sweet Potatoes With Chicken Breast' LIMIT 1),
  (SELECT id FROM ingredients WHERE name = 'Chicken Breast, Raw' LIMIT 1),
  250
),
(
  (SELECT id FROM meals WHERE name = 'Sweet Potatoes With Chicken Breast' LIMIT 1),
  (SELECT id FROM ingredients WHERE name = 'Spinach' LIMIT 1),
  50
),
(
  (SELECT id FROM meals WHERE name = 'Sweet Potatoes With Chicken Breast' LIMIT 1),
  (SELECT id FROM ingredients WHERE name = 'Avocado' LIMIT 1),
  40
),
(
  (SELECT id FROM meals WHERE name = 'Sweet Potatoes With Chicken Breast' LIMIT 1),
  (SELECT id FROM ingredients WHERE name = 'Olive Oil' LIMIT 1),
  5
);

-- ========== 5) Basmati Rice with Ground Beef and Broccoli ==========
INSERT INTO meals (name, is_template, kcal_target, image, cooking_instructions)
VALUES (
  'Basmati Rice with Ground Beef and Broccoli',
  true,
  650,
  'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&h=300&fit=crop',
  'Cook the basmati rice in boiled water until soft. Pan-fry the ground beef in olive oil until browned, then add broccoli and cheese. Serve the beef and broccoli over the rice.'
);

INSERT INTO meal_items (meal_id, ingredient_id, quantity_g)
VALUES
(
  (SELECT id FROM meals WHERE name = 'Basmati Rice with Ground Beef and Broccoli' LIMIT 1),
  (SELECT id FROM ingredients WHERE name = 'Basmati Rice' LIMIT 1),
  60
),
(
  (SELECT id FROM meals WHERE name = 'Basmati Rice with Ground Beef and Broccoli' LIMIT 1),
  (SELECT id FROM ingredients WHERE name = 'Beef, Ground, 70% lean' LIMIT 1),
  200
),
(
  (SELECT id FROM meals WHERE name = 'Basmati Rice with Ground Beef and Broccoli' LIMIT 1),
  (SELECT id FROM ingredients WHERE name = 'Broccoli' LIMIT 1),
  50
),
(
  (SELECT id FROM meals WHERE name = 'Basmati Rice with Ground Beef and Broccoli' LIMIT 1),
  (SELECT id FROM ingredients WHERE name = 'Cheese, Regular' LIMIT 1),
  20
),
(
  (SELECT id FROM meals WHERE name = 'Basmati Rice with Ground Beef and Broccoli' LIMIT 1),
  (SELECT id FROM ingredients WHERE name = 'Olive Oil' LIMIT 1),
  5
);

-- ========== 6) Homemade Chicken Wrap ==========
INSERT INTO meals (name, is_template, kcal_target, image, cooking_instructions)
VALUES (
  'Homemade Chicken Wrap',
  true,
  550,
  'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400&h=300&fit=crop',
  'Warm the whole-wheat wrap. Fill it with sliced chicken breast, cucumber, grated carrots, and mashed avocado. Roll tightly and serve.'
);

INSERT INTO meal_items (meal_id, ingredient_id, quantity_g)
VALUES
(
  (SELECT id FROM meals WHERE name = 'Homemade Chicken Wrap' LIMIT 1),
  (SELECT id FROM ingredients WHERE name = 'Whole-Wheat Wrap' LIMIT 1),
  80
),
(
  (SELECT id FROM meals WHERE name = 'Homemade Chicken Wrap' LIMIT 1),
  (SELECT id FROM ingredients WHERE name = 'Chicken, Breast' LIMIT 1),
  150
),
(
  (SELECT id FROM meals WHERE name = 'Homemade Chicken Wrap' LIMIT 1),
  (SELECT id FROM ingredients WHERE name = 'Cucumber' LIMIT 1),
  50
),
(
  (SELECT id FROM meals WHERE name = 'Homemade Chicken Wrap' LIMIT 1),
  (SELECT id FROM ingredients WHERE name = 'Carrots, raw' LIMIT 1),
  50
),
(
  (SELECT id FROM meals WHERE name = 'Homemade Chicken Wrap' LIMIT 1),
  (SELECT id FROM ingredients WHERE name = 'Avocado' LIMIT 1),
  50
);
