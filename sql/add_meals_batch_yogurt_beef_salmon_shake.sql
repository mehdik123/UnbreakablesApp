-- =====================================================
-- Batch: 9 meals
-- Clear SQL editor, paste ONLY this, Run.
-- If RLS warning → Run without RLS.
--
-- MISSING INGREDIENT (not linked yet):
--   Orange Juice — not in your ingredients DB.
--   Meal "Scrambled Eggs With Avocado And Shrimps" is inserted
--   WITHOUT orange juice. Tell me macros (+ confirm 1 cup = ? g)
--   and I’ll add that line.
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

INSERT INTO ingredients (name, kcal, protein, fat, carbs)
SELECT 'Shrimps', 100, 23, 2, 2
WHERE NOT EXISTS (
  SELECT 1 FROM ingredients WHERE lower(trim(name)) = 'shrimps'
);

-- ========== 1) Beef & Sweet Potatoes with Eggs ==========
INSERT INTO meals (name, is_template, kcal_target, image, cooking_instructions)
VALUES (
  'Beef & Sweet Potatoes with Eggs',
  true,
  650,
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop',
  'Cook the lean ground beef in olive oil until browned. Roast or boil the sweet potato until soft. Fry the eggs and serve everything together with grated cheese on top.'
);

INSERT INTO meal_items (meal_id, ingredient_id, quantity_g)
VALUES
(
  (SELECT id FROM meals WHERE name = 'Beef & Sweet Potatoes with Eggs' LIMIT 1),
  (SELECT id FROM ingredients WHERE name = 'Lean Ground Beef, Raw' LIMIT 1),
  200
),
(
  (SELECT id FROM meals WHERE name = 'Beef & Sweet Potatoes with Eggs' LIMIT 1),
  (SELECT id FROM ingredients WHERE name = 'Sweet Potato, Raw' LIMIT 1),
  200
),
(
  (SELECT id FROM meals WHERE name = 'Beef & Sweet Potatoes with Eggs' LIMIT 1),
  (SELECT id FROM ingredients WHERE name = 'Cheese, Regular' LIMIT 1),
  20
),
(
  (SELECT id FROM meals WHERE name = 'Beef & Sweet Potatoes with Eggs' LIMIT 1),
  (SELECT id FROM ingredients WHERE name = 'Olive Oil' LIMIT 1),
  5
),
(
  (SELECT id FROM meals WHERE name = 'Beef & Sweet Potatoes with Eggs' LIMIT 1),
  (SELECT id FROM ingredients WHERE name = 'Eggs' LIMIT 1),
  50
);

-- ========== 2) Greek Yogurt With Granola & Nuts ==========
-- Sheet lists yoghurt, granola, blueberries only (no nuts line).
INSERT INTO meals (name, is_template, kcal_target, image, cooking_instructions)
VALUES (
  'Greek Yogurt With Granola & Nuts',
  true,
  350,
  'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=300&fit=crop',
  'Spoon the Greek yogurt into a bowl. Top with granola and fresh blueberries. Serve cold.'
);

INSERT INTO meal_items (meal_id, ingredient_id, quantity_g)
VALUES
(
  (SELECT id FROM meals WHERE name = 'Greek Yogurt With Granola & Nuts' LIMIT 1),
  (SELECT id FROM ingredients WHERE name = 'Plain Low-Fat Greek Yoghurt' LIMIT 1),
  150
),
(
  (SELECT id FROM meals WHERE name = 'Greek Yogurt With Granola & Nuts' LIMIT 1),
  (SELECT id FROM ingredients WHERE name = 'Granola' LIMIT 1),
  25
),
(
  (SELECT id FROM meals WHERE name = 'Greek Yogurt With Granola & Nuts' LIMIT 1),
  (SELECT id FROM ingredients WHERE name = 'Blueberries' LIMIT 1),
  30
);

-- ========== 3) Greek Yogurt & Dark Chocolate ==========
INSERT INTO meals (name, is_template, kcal_target, image, cooking_instructions)
VALUES (
  'Greek Yogurt & Dark Chocolate',
  true,
  300,
  'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=300&fit=crop',
  'Spoon the Greek yogurt into a bowl. Top with chopped dark chocolate and fresh blueberries. Serve cold.'
);

INSERT INTO meal_items (meal_id, ingredient_id, quantity_g)
VALUES
(
  (SELECT id FROM meals WHERE name = 'Greek Yogurt & Dark Chocolate' LIMIT 1),
  (SELECT id FROM ingredients WHERE name = 'Plain Low-Fat Greek Yoghurt' LIMIT 1),
  150
),
(
  (SELECT id FROM meals WHERE name = 'Greek Yogurt & Dark Chocolate' LIMIT 1),
  (SELECT id FROM ingredients WHERE name = 'Dark Chocolate, 70-85% Cacao' LIMIT 1),
  15
),
(
  (SELECT id FROM meals WHERE name = 'Greek Yogurt & Dark Chocolate' LIMIT 1),
  (SELECT id FROM ingredients WHERE name = 'Blueberries' LIMIT 1),
  30
);

-- ========== 4) Beef With Basmati Rice ==========
INSERT INTO meals (name, is_template, kcal_target, image, cooking_instructions)
VALUES (
  'Beef With Basmati Rice',
  true,
  800,
  'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&h=300&fit=crop',
  'Cook the basmati rice in boiled water until soft. Pan-fry the lean ground beef in olive oil with broccoli until cooked, then add cheddar cheese and raisins. Serve the beef mixture over the rice.'
);

INSERT INTO meal_items (meal_id, ingredient_id, quantity_g)
VALUES
(
  (SELECT id FROM meals WHERE name = 'Beef With Basmati Rice' LIMIT 1),
  (SELECT id FROM ingredients WHERE name = 'Lean Ground Beef, Raw' LIMIT 1),
  250
),
(
  (SELECT id FROM meals WHERE name = 'Beef With Basmati Rice' LIMIT 1),
  (SELECT id FROM ingredients WHERE name = 'Basmati Rice' LIMIT 1),
  80
),
(
  (SELECT id FROM meals WHERE name = 'Beef With Basmati Rice' LIMIT 1),
  (SELECT id FROM ingredients WHERE name = 'Broccoli' LIMIT 1),
  100
),
(
  (SELECT id FROM meals WHERE name = 'Beef With Basmati Rice' LIMIT 1),
  (SELECT id FROM ingredients WHERE name = 'Cheddar Cheese' LIMIT 1),
  20
),
(
  (SELECT id FROM meals WHERE name = 'Beef With Basmati Rice' LIMIT 1),
  (SELECT id FROM ingredients WHERE name = 'Olive Oil' LIMIT 1),
  10
),
(
  (SELECT id FROM meals WHERE name = 'Beef With Basmati Rice' LIMIT 1),
  (SELECT id FROM ingredients WHERE name = 'Raisins' LIMIT 1),
  40
);

-- ========== 5) High Protein Beef Sandwich ==========
INSERT INTO meals (name, is_template, kcal_target, image, cooking_instructions)
VALUES (
  'High Protein Beef Sandwich',
  true,
  750,
  'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400&h=300&fit=crop',
  'Cook the ground beef in olive oil until browned. Warm the whole-wheat wrap, fill with the beef, cheddar cheese, and mashed avocado. Roll tightly and serve.'
);

INSERT INTO meal_items (meal_id, ingredient_id, quantity_g)
VALUES
(
  (SELECT id FROM meals WHERE name = 'High Protein Beef Sandwich' LIMIT 1),
  (SELECT id FROM ingredients WHERE name = 'Whole-Wheat Wrap' LIMIT 1),
  120
),
(
  (SELECT id FROM meals WHERE name = 'High Protein Beef Sandwich' LIMIT 1),
  (SELECT id FROM ingredients WHERE name = 'Beef, Ground, 70% lean' LIMIT 1),
  200
),
(
  (SELECT id FROM meals WHERE name = 'High Protein Beef Sandwich' LIMIT 1),
  (SELECT id FROM ingredients WHERE name = 'Cheddar Cheese' LIMIT 1),
  30
),
(
  (SELECT id FROM meals WHERE name = 'High Protein Beef Sandwich' LIMIT 1),
  (SELECT id FROM ingredients WHERE name = 'Avocado' LIMIT 1),
  100
),
(
  (SELECT id FROM meals WHERE name = 'High Protein Beef Sandwich' LIMIT 1),
  (SELECT id FROM ingredients WHERE name = 'Olive Oil' LIMIT 1),
  5
);

-- ========== 6) Chicken Breast Salad ==========
-- Remove old version if present, then insert fresh from your sheet
DELETE FROM meal_items
WHERE meal_id IN (SELECT id FROM meals WHERE name = 'Chicken Breast Salad');
DELETE FROM meals WHERE name = 'Chicken Breast Salad';

INSERT INTO meals (name, is_template, kcal_target, image, cooking_instructions)
VALUES (
  'Chicken Breast Salad',
  true,
  700,
  'https://images.unsplash.com/photo-1540420773420-28507da66d68?w=400&h=300&fit=crop',
  'Cook the chicken breast and slice it. Cook the Ebly according to package directions. In a bowl, combine chicken, Ebly, cucumber, avocado, cheddar cheese, and a drizzle of olive oil.'
);

INSERT INTO meal_items (meal_id, ingredient_id, quantity_g)
VALUES
(
  (SELECT id FROM meals WHERE name = 'Chicken Breast Salad' LIMIT 1),
  (SELECT id FROM ingredients WHERE name = 'Avocado' LIMIT 1),
  100
),
(
  (SELECT id FROM meals WHERE name = 'Chicken Breast Salad' LIMIT 1),
  (SELECT id FROM ingredients WHERE name = 'Chicken Breast, Raw' LIMIT 1),
  300
),
(
  (SELECT id FROM meals WHERE name = 'Chicken Breast Salad' LIMIT 1),
  (SELECT id FROM ingredients WHERE name = 'Cucumber' LIMIT 1),
  100
),
(
  (SELECT id FROM meals WHERE name = 'Chicken Breast Salad' LIMIT 1),
  (SELECT id FROM ingredients WHERE name = 'Cheddar Cheese' LIMIT 1),
  20
),
(
  (SELECT id FROM meals WHERE name = 'Chicken Breast Salad' LIMIT 1),
  (SELECT id FROM ingredients WHERE name = 'Ebly' LIMIT 1),
  80
),
(
  (SELECT id FROM meals WHERE name = 'Chicken Breast Salad' LIMIT 1),
  (SELECT id FROM ingredients WHERE name = 'Olive Oil' LIMIT 1),
  10
);

-- ========== 7) Scrambled Eggs With Avocado And Shrimps ==========
-- Orange Juice skipped (missing from ingredients DB)
INSERT INTO meals (name, is_template, kcal_target, image, cooking_instructions)
VALUES (
  'Scrambled Eggs With Avocado And Shrimps',
  true,
  700,
  'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400&h=300&fit=crop',
  'Scramble the eggs in butter until soft. Toast the whole bread, top with mashed avocado and cooked shrimps. Serve warm with a glass of orange juice on the side.'
);

INSERT INTO meal_items (meal_id, ingredient_id, quantity_g)
VALUES
(
  (SELECT id FROM meals WHERE name = 'Scrambled Eggs With Avocado And Shrimps' LIMIT 1),
  (SELECT id FROM ingredients WHERE name = 'Eggs' LIMIT 1),
  200
),
(
  (SELECT id FROM meals WHERE name = 'Scrambled Eggs With Avocado And Shrimps' LIMIT 1),
  (SELECT id FROM ingredients WHERE name = 'Avocado' LIMIT 1),
  100
),
(
  (SELECT id FROM meals WHERE name = 'Scrambled Eggs With Avocado And Shrimps' LIMIT 1),
  (SELECT id FROM ingredients WHERE name = 'Shrimps' LIMIT 1),
  50
),
(
  (SELECT id FROM meals WHERE name = 'Scrambled Eggs With Avocado And Shrimps' LIMIT 1),
  (SELECT id FROM ingredients WHERE name = 'Whole Bread Toast' LIMIT 1),
  120
),
(
  (SELECT id FROM meals WHERE name = 'Scrambled Eggs With Avocado And Shrimps' LIMIT 1),
  (SELECT id FROM ingredients WHERE name = 'Butter' LIMIT 1),
  5
);

-- ========== 8) Salmon With Sweet Potatoes ==========
DELETE FROM meal_items
WHERE meal_id IN (SELECT id FROM meals WHERE name = 'Salmon With Sweet Potatoes');
DELETE FROM meals WHERE name = 'Salmon With Sweet Potatoes';

INSERT INTO meals (name, is_template, kcal_target, image, cooking_instructions)
VALUES (
  'Salmon With Sweet Potatoes',
  true,
  800,
  'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=300&fit=crop',
  'Season the salmon fillet and bake or pan-sear until cooked through. Chop the sweet potato, peppers, and onion, toss with melted butter, and roast until tender. Serve together.'
);

INSERT INTO meal_items (meal_id, ingredient_id, quantity_g)
VALUES
(
  (SELECT id FROM meals WHERE name = 'Salmon With Sweet Potatoes' LIMIT 1),
  (SELECT id FROM ingredients WHERE name = 'Salmon Fillet, Raw' LIMIT 1),
  250
),
(
  (SELECT id FROM meals WHERE name = 'Salmon With Sweet Potatoes' LIMIT 1),
  (SELECT id FROM ingredients WHERE name = 'Sweet Potato, Raw' LIMIT 1),
  400
),
(
  (SELECT id FROM meals WHERE name = 'Salmon With Sweet Potatoes' LIMIT 1),
  (SELECT id FROM ingredients WHERE name = 'Pepper, sweet, red' LIMIT 1),
  50
),
(
  (SELECT id FROM meals WHERE name = 'Salmon With Sweet Potatoes' LIMIT 1),
  (SELECT id FROM ingredients WHERE name = 'Pepper, sweet, yellow' LIMIT 1),
  50
),
(
  (SELECT id FROM meals WHERE name = 'Salmon With Sweet Potatoes' LIMIT 1),
  (SELECT id FROM ingredients WHERE name = 'Onion' LIMIT 1),
  50
),
(
  (SELECT id FROM meals WHERE name = 'Salmon With Sweet Potatoes' LIMIT 1),
  (SELECT id FROM ingredients WHERE name = 'Butter' LIMIT 1),
  10
);

-- ========== 9) Fruits Shake ==========
INSERT INTO meals (name, is_template, kcal_target, image, cooking_instructions)
VALUES (
  'Fruits Shake',
  true,
  700,
  'https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=400&h=300&fit=crop',
  'Blend the whole milk with banana, apple, peanut butter, mixed nuts, and raw oats until smooth. Serve cold.'
);

INSERT INTO meal_items (meal_id, ingredient_id, quantity_g)
VALUES
(
  (SELECT id FROM meals WHERE name = 'Fruits Shake' LIMIT 1),
  (SELECT id FROM ingredients WHERE name = 'Whole Milk' LIMIT 1),
  400
),
(
  (SELECT id FROM meals WHERE name = 'Fruits Shake' LIMIT 1),
  (SELECT id FROM ingredients WHERE name = 'Bananas' LIMIT 1),
  100
),
(
  (SELECT id FROM meals WHERE name = 'Fruits Shake' LIMIT 1),
  (SELECT id FROM ingredients WHERE name = 'Apples' LIMIT 1),
  100
),
(
  (SELECT id FROM meals WHERE name = 'Fruits Shake' LIMIT 1),
  (SELECT id FROM ingredients WHERE name = 'Peanut Butter' LIMIT 1),
  25
),
(
  (SELECT id FROM meals WHERE name = 'Fruits Shake' LIMIT 1),
  (SELECT id FROM ingredients WHERE name = 'Mixed Nuts' LIMIT 1),
  50
),
(
  (SELECT id FROM meals WHERE name = 'Fruits Shake' LIMIT 1),
  (SELECT id FROM ingredients WHERE name = 'Plain Oats, Raw' LIMIT 1),
  40
);
