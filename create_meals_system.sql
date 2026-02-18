-- Create comprehensive meals system with ingredients, instructions, and portions
-- Run this in your Supabase SQL Editor

-- 1. Create ingredients table (if not exists)
CREATE TABLE IF NOT EXISTS public.ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category TEXT, -- e.g., 'protein', 'vegetable', 'grain', 'dairy', 'spice'
  nutrition_per_100g JSONB, -- Store nutrition data as JSON
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create meals table with comprehensive details
CREATE TABLE IF NOT EXISTS public.meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT, -- e.g., 'breakfast', 'lunch', 'dinner', 'snack'
  cuisine_type TEXT, -- e.g., 'mediterranean', 'asian', 'mexican', 'italian'
  difficulty_level TEXT CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
  prep_time_minutes INTEGER,
  cook_time_minutes INTEGER,
  total_time_minutes INTEGER, -- prep + cook time
  servings INTEGER DEFAULT 1,
  calories_per_serving INTEGER,
  protein_per_serving DECIMAL(5,2), -- grams
  carbs_per_serving DECIMAL(5,2), -- grams
  fat_per_serving DECIMAL(5,2), -- grams
  fiber_per_serving DECIMAL(5,2), -- grams
  image_url TEXT,
  video_url TEXT, -- Optional cooking video
  tags TEXT[], -- Array of tags like ['high-protein', 'low-carb', 'vegetarian']
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create meal_ingredients junction table (many-to-many)
CREATE TABLE IF NOT EXISTS public.meal_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id UUID NOT NULL REFERENCES public.meals(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
  quantity DECIMAL(8,2) NOT NULL, -- Amount needed
  unit TEXT NOT NULL, -- e.g., 'g', 'ml', 'cups', 'tbsp', 'tsp', 'pieces'
  notes TEXT, -- Optional notes like "chopped", "diced", "optional"
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(meal_id, ingredient_id)
);

-- 4. Create cooking instructions table
CREATE TABLE IF NOT EXISTS public.meal_instructions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id UUID NOT NULL REFERENCES public.meals(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  instruction TEXT NOT NULL,
  image_url TEXT, -- Optional step-by-step image
  time_minutes INTEGER, -- Time for this step
  temperature_celsius INTEGER, -- Cooking temperature
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(meal_id, step_number)
);

-- 5. Create meal_nutrition table for detailed nutrition breakdown
CREATE TABLE IF NOT EXISTS public.meal_nutrition (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id UUID NOT NULL REFERENCES public.meals(id) ON DELETE CASCADE,
  nutrition_type TEXT NOT NULL, -- e.g., 'per_serving', 'per_100g', 'total'
  calories DECIMAL(8,2),
  protein DECIMAL(8,2),
  carbohydrates DECIMAL(8,2),
  fat DECIMAL(8,2),
  saturated_fat DECIMAL(8,2),
  fiber DECIMAL(8,2),
  sugar DECIMAL(8,2),
  sodium DECIMAL(8,2),
  cholesterol DECIMAL(8,2),
  vitamin_a DECIMAL(8,2),
  vitamin_c DECIMAL(8,2),
  calcium DECIMAL(8,2),
  iron DECIMAL(8,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(meal_id, nutrition_type)
);

-- 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_meals_category ON public.meals(category);
CREATE INDEX IF NOT EXISTS idx_meals_cuisine_type ON public.meals(cuisine_type);
CREATE INDEX IF NOT EXISTS idx_meals_difficulty ON public.meals(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_meals_calories ON public.meals(calories_per_serving);
CREATE INDEX IF NOT EXISTS idx_meals_active ON public.meals(is_active);
CREATE INDEX IF NOT EXISTS idx_ingredients_category ON public.ingredients(category);
CREATE INDEX IF NOT EXISTS idx_meal_ingredients_meal_id ON public.meal_ingredients(meal_id);
CREATE INDEX IF NOT EXISTS idx_meal_ingredients_ingredient_id ON public.meal_ingredients(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_meal_instructions_meal_id ON public.meal_instructions(meal_id);
CREATE INDEX IF NOT EXISTS idx_meal_nutrition_meal_id ON public.meal_nutrition(meal_id);

-- 7. Enable RLS (Row Level Security)
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_instructions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_nutrition ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policies (allow all for now, adjust as needed)
CREATE POLICY "Allow all operations on ingredients" ON public.ingredients FOR ALL USING (true);
CREATE POLICY "Allow all operations on meals" ON public.meals FOR ALL USING (true);
CREATE POLICY "Allow all operations on meal_ingredients" ON public.meal_ingredients FOR ALL USING (true);
CREATE POLICY "Allow all operations on meal_instructions" ON public.meal_instructions FOR ALL USING (true);
CREATE POLICY "Allow all operations on meal_nutrition" ON public.meal_nutrition FOR ALL USING (true);

-- 9. Create update triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ingredients_updated_at BEFORE UPDATE ON public.ingredients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_meals_updated_at BEFORE UPDATE ON public.meals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10. Insert sample ingredients
INSERT INTO public.ingredients (name, category, nutrition_per_100g) VALUES
('Chicken Breast', 'protein', '{"calories": 165, "protein": 31, "fat": 3.6, "carbs": 0}'),
('Brown Rice', 'grain', '{"calories": 111, "protein": 2.6, "fat": 0.9, "carbs": 23}'),
('Broccoli', 'vegetable', '{"calories": 34, "protein": 2.8, "fat": 0.4, "carbs": 7}'),
('Olive Oil', 'fat', '{"calories": 884, "protein": 0, "fat": 100, "carbs": 0}'),
('Garlic', 'spice', '{"calories": 149, "protein": 6.4, "fat": 0.5, "carbs": 33}'),
('Onion', 'vegetable', '{"calories": 40, "protein": 1.1, "fat": 0.1, "carbs": 9}'),
('Tomato', 'vegetable', '{"calories": 18, "protein": 0.9, "fat": 0.2, "carbs": 4}'),
('Eggs', 'protein', '{"calories": 155, "protein": 13, "fat": 11, "carbs": 1.1}'),
('Oats', 'grain', '{"calories": 389, "protein": 17, "fat": 7, "carbs": 66}'),
('Banana', 'fruit', '{"calories": 89, "protein": 1.1, "fat": 0.3, "carbs": 23}');

-- 11. Insert sample meals
INSERT INTO public.meals (name, description, category, cuisine_type, difficulty_level, prep_time_minutes, cook_time_minutes, total_time_minutes, servings, calories_per_serving, protein_per_serving, carbs_per_serving, fat_per_serving, fiber_per_serving, image_url, tags) VALUES
('Grilled Chicken with Brown Rice', 'Healthy grilled chicken breast served with brown rice and steamed broccoli', 'dinner', 'mediterranean', 'easy', 15, 25, 40, 2, 450, 35, 45, 12, 6, 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=500', ARRAY['high-protein', 'low-fat', 'gluten-free']),
('Protein Oatmeal Bowl', 'Nutritious oatmeal with banana and eggs for a complete breakfast', 'breakfast', 'american', 'easy', 5, 10, 15, 1, 320, 18, 45, 8, 7, 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=500', ARRAY['high-protein', 'fiber-rich', 'quick']),
('Mediterranean Quinoa Salad', 'Fresh quinoa salad with tomatoes, onions, and olive oil dressing', 'lunch', 'mediterranean', 'medium', 20, 15, 35, 3, 280, 12, 35, 10, 8, 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500', ARRAY['vegetarian', 'high-fiber', 'antioxidant-rich']);

-- 12. Insert meal ingredients for the first meal (Grilled Chicken)
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
    ('Chicken Breast', 200, 'g', 'boneless, skinless'),
    ('Brown Rice', 150, 'g', 'dry weight'),
    ('Broccoli', 200, 'g', 'fresh, cut into florets'),
    ('Olive Oil', 15, 'ml', 'extra virgin'),
    ('Garlic', 2, 'cloves', 'minced'),
    ('Onion', 50, 'g', 'diced')
) AS mi(ingredient_name, quantity, unit, notes)
JOIN public.ingredients i ON i.name = mi.ingredient_name
WHERE m.name = 'Grilled Chicken with Brown Rice';

-- 13. Insert cooking instructions for the first meal
INSERT INTO public.meal_instructions (meal_id, step_number, instruction, time_minutes, temperature_celsius)
SELECT 
  m.id,
  mi.step_number,
  mi.instruction,
  mi.time_minutes,
  mi.temperature_celsius
FROM public.meals m
CROSS JOIN (
  VALUES 
    (1, 'Season chicken breast with salt, pepper, and minced garlic. Let marinate for 10 minutes.', 10, NULL),
    (2, 'Heat olive oil in a pan over medium-high heat. Cook chicken for 6-7 minutes per side until golden brown and cooked through.', 15, 180),
    (3, 'Meanwhile, cook brown rice according to package instructions (usually 20-25 minutes).', 25, 100),
    (4, 'Steam broccoli for 5-7 minutes until tender but still crisp.', 7, 100),
    (5, 'Sauté diced onion in the same pan used for chicken until translucent.', 5, 120),
    (6, 'Serve grilled chicken over brown rice with steamed broccoli and sautéed onions on the side.', 2, NULL)
) AS mi(step_number, instruction, time_minutes, temperature_celsius)
WHERE m.name = 'Grilled Chicken with Brown Rice';

-- 14. Insert detailed nutrition for the first meal
INSERT INTO public.meal_nutrition (meal_id, nutrition_type, calories, protein, carbohydrates, fat, saturated_fat, fiber, sugar, sodium, cholesterol)
SELECT 
  m.id,
  'per_serving',
  450,
  35,
  45,
  12,
  2.5,
  6,
  8,
  650,
  85
FROM public.meals m
WHERE m.name = 'Grilled Chicken with Brown Rice';

-- 15. Create a view for easy meal querying with all details
CREATE OR REPLACE VIEW public.meals_complete AS
SELECT 
  m.*,
  COALESCE(
    json_agg(
      DISTINCT jsonb_build_object(
        'ingredient_id', i.id,
        'ingredient_name', i.name,
        'category', i.category,
        'quantity', mi.quantity,
        'unit', mi.unit,
        'notes', mi.notes,
        'nutrition', i.nutrition_per_100g
      )
    ) FILTER (WHERE i.id IS NOT NULL),
    '[]'::json
  ) as ingredients,
  COALESCE(
    json_agg(
      DISTINCT jsonb_build_object(
        'step_number', inst.step_number,
        'instruction', inst.instruction,
        'time_minutes', inst.time_minutes,
        'temperature_celsius', inst.temperature_celsius,
        'image_url', inst.image_url
      ) ORDER BY inst.step_number
    ) FILTER (WHERE inst.id IS NOT NULL),
    '[]'::json
  ) as instructions,
  COALESCE(
    json_agg(
      DISTINCT jsonb_build_object(
        'nutrition_type', n.nutrition_type,
        'calories', n.calories,
        'protein', n.protein,
        'carbohydrates', n.carbohydrates,
        'fat', n.fat,
        'saturated_fat', n.saturated_fat,
        'fiber', n.fiber,
        'sugar', n.sugar,
        'sodium', n.sodium,
        'cholesterol', n.cholesterol
      )
    ) FILTER (WHERE n.id IS NOT NULL),
    '[]'::json
  ) as nutrition_details
FROM public.meals m
LEFT JOIN public.meal_ingredients mi ON m.id = mi.meal_id
LEFT JOIN public.ingredients i ON mi.ingredient_id = i.id
LEFT JOIN public.meal_instructions inst ON m.id = inst.meal_id
LEFT JOIN public.meal_nutrition n ON m.id = n.meal_id
WHERE m.is_active = true
GROUP BY m.id;

-- Success message
SELECT 'Meals system created successfully! Tables: ingredients, meals, meal_ingredients, meal_instructions, meal_nutrition' as result;















