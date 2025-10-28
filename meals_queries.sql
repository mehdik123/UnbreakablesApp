-- Useful queries for managing meals system
-- Run these in your Supabase SQL Editor after creating the meals system

-- 1. Get all meals with complete details (using the view)
SELECT * FROM public.meals_complete;

-- 2. Get meals by category
SELECT * FROM public.meals_complete WHERE category = 'breakfast';

-- 3. Get meals by difficulty level
SELECT * FROM public.meals_complete WHERE difficulty_level = 'easy';

-- 4. Get meals by cuisine type
SELECT * FROM public.meals_complete WHERE cuisine_type = 'mediterranean';

-- 5. Search meals by name or description
SELECT * FROM public.meals_complete 
WHERE name ILIKE '%chicken%' OR description ILIKE '%chicken%';

-- 6. Get meals with specific ingredients
SELECT DISTINCT m.* FROM public.meals m
JOIN public.meal_ingredients mi ON m.id = mi.meal_id
JOIN public.ingredients i ON mi.ingredient_id = i.id
WHERE i.name ILIKE '%chicken%';

-- 7. Get meals by calorie range
SELECT * FROM public.meals_complete 
WHERE calories_per_serving BETWEEN 300 AND 500;

-- 8. Get high protein meals
SELECT * FROM public.meals_complete 
WHERE protein_per_serving >= 25;

-- 9. Get meals by prep time
SELECT * FROM public.meals_complete 
WHERE prep_time_minutes <= 15;

-- 10. Get meals with specific tags
SELECT * FROM public.meals_complete 
WHERE 'high-protein' = ANY(tags);

-- 11. Insert a new meal with ingredients and instructions
-- Example: Greek Salad
INSERT INTO public.meals (name, description, category, cuisine_type, difficulty_level, prep_time_minutes, cook_time_minutes, total_time_minutes, servings, calories_per_serving, protein_per_serving, carbs_per_serving, fat_per_serving, fiber_per_serving, image_url, tags) 
VALUES ('Greek Salad', 'Fresh Mediterranean salad with feta cheese and olives', 'lunch', 'mediterranean', 'easy', 15, 0, 15, 2, 250, 12, 15, 18, 4, 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500', ARRAY['vegetarian', 'low-carb', 'antioxidant-rich']);

-- 12. Add ingredients to a meal
INSERT INTO public.meal_ingredients (meal_id, ingredient_id, quantity, unit, notes)
SELECT 
  m.id,
  i.id,
  mi.quantity,
  mi.unit,
  mi.notes
FROM public.meals m
CROSS JOIN (
  VALUES 
    ('Tomato', 200, 'g', 'cherry tomatoes, halved'),
    ('Onion', 50, 'g', 'red onion, thinly sliced'),
    ('Olive Oil', 30, 'ml', 'extra virgin'),
    ('Garlic', 1, 'clove', 'minced')
) AS mi(ingredient_name, quantity, unit, notes)
JOIN public.ingredients i ON i.name = mi.ingredient_name
WHERE m.name = 'Greek Salad';

-- 13. Add cooking instructions to a meal
INSERT INTO public.meal_instructions (meal_id, step_number, instruction, time_minutes)
SELECT 
  m.id,
  mi.step_number,
  mi.instruction,
  mi.time_minutes
FROM public.meals m
CROSS JOIN (
  VALUES 
    (1, 'Wash and cut cherry tomatoes in half.', 5, NULL),
    (2, 'Thinly slice red onion and soak in cold water for 5 minutes to reduce sharpness.', 5, NULL),
    (3, 'Make dressing by whisking olive oil, minced garlic, salt, and pepper.', 3, NULL),
    (4, 'Combine tomatoes, onions, and dressing in a large bowl. Toss gently.', 2, NULL),
    (5, 'Serve immediately or refrigerate for up to 2 hours.', 0, NULL)
) AS mi(step_number, instruction, time_minutes, temperature_celsius)
WHERE m.name = 'Greek Salad';

-- 14. Update meal nutrition
INSERT INTO public.meal_nutrition (meal_id, nutrition_type, calories, protein, carbohydrates, fat, saturated_fat, fiber, sugar, sodium)
SELECT 
  m.id,
  'per_serving',
  250,
  12,
  15,
  18,
  4.5,
  4,
  8,
  400
FROM public.meals m
WHERE m.name = 'Greek Salad';

-- 15. Get meal shopping list (ingredients needed for a meal)
SELECT 
  m.name as meal_name,
  i.name as ingredient_name,
  mi.quantity,
  mi.unit,
  i.category,
  mi.notes
FROM public.meals m
JOIN public.meal_ingredients mi ON m.id = mi.meal_id
JOIN public.ingredients i ON mi.ingredient_id = i.id
WHERE m.name = 'Grilled Chicken with Brown Rice'
ORDER BY i.category, i.name;

-- 16. Get nutrition summary for a meal
SELECT 
  m.name,
  m.calories_per_serving,
  m.protein_per_serving,
  m.carbs_per_serving,
  m.fat_per_serving,
  m.fiber_per_serving,
  m.servings,
  (m.calories_per_serving * m.servings) as total_calories
FROM public.meals m
WHERE m.name = 'Grilled Chicken with Brown Rice';

-- 17. Get all ingredients with their categories
SELECT 
  category,
  COUNT(*) as ingredient_count,
  array_agg(name ORDER BY name) as ingredients
FROM public.ingredients
GROUP BY category
ORDER BY category;

-- 18. Get meals by cooking time
SELECT 
  name,
  prep_time_minutes,
  cook_time_minutes,
  total_time_minutes,
  difficulty_level
FROM public.meals
ORDER BY total_time_minutes;

-- 19. Search meals by multiple criteria
SELECT * FROM public.meals_complete 
WHERE 
  category = 'dinner' 
  AND difficulty_level = 'easy'
  AND calories_per_serving BETWEEN 300 AND 600
  AND 'high-protein' = ANY(tags);

-- 20. Get meal preparation timeline
SELECT 
  m.name,
  inst.step_number,
  inst.instruction,
  inst.time_minutes,
  inst.temperature_celsius,
  SUM(inst.time_minutes) OVER (ORDER BY inst.step_number) as cumulative_time
FROM public.meals m
JOIN public.meal_instructions inst ON m.id = inst.meal_id
WHERE m.name = 'Grilled Chicken with Brown Rice'
ORDER BY inst.step_number;






