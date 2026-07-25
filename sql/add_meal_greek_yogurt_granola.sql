-- Greek Yogurt With Fruits and Whole Granola
-- Clear the SQL editor first, paste ONLY this, then Run.

INSERT INTO meals (name, is_template, kcal_target, image, cooking_instructions)
VALUES (
  'Greek Yogurt With Fruits and Whole Granola',
  true,
  600,
  'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=300&fit=crop',
  'Spoon the Greek yogurt into a bowl. Top with granola, sliced banana, blueberries, chopped dark chocolate, and mixed nuts. Serve cold.'
);

INSERT INTO meal_items (meal_id, ingredient_id, quantity_g)
VALUES
(
  (SELECT id FROM meals WHERE name = 'Greek Yogurt With Fruits and Whole Granola' LIMIT 1),
  (SELECT id FROM ingredients WHERE name = 'Plain Low-Fat Greek Yoghurt' LIMIT 1),
  150
),
(
  (SELECT id FROM meals WHERE name = 'Greek Yogurt With Fruits and Whole Granola' LIMIT 1),
  (SELECT id FROM ingredients WHERE name = 'Granola' LIMIT 1),
  40
),
(
  (SELECT id FROM meals WHERE name = 'Greek Yogurt With Fruits and Whole Granola' LIMIT 1),
  (SELECT id FROM ingredients WHERE name = 'Bananas' LIMIT 1),
  100
),
(
  (SELECT id FROM meals WHERE name = 'Greek Yogurt With Fruits and Whole Granola' LIMIT 1),
  (SELECT id FROM ingredients WHERE name = 'Blueberries' LIMIT 1),
  30
),
(
  (SELECT id FROM meals WHERE name = 'Greek Yogurt With Fruits and Whole Granola' LIMIT 1),
  (SELECT id FROM ingredients WHERE name = 'Dark Chocolate, 70-85% Cacao' LIMIT 1),
  20
),
(
  (SELECT id FROM meals WHERE name = 'Greek Yogurt With Fruits and Whole Granola' LIMIT 1),
  (SELECT id FROM ingredients WHERE name = 'Mixed Nuts' LIMIT 1),
  15
);
