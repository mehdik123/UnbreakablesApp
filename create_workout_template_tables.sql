-- Create workout template system tables

-- 1. Workout Templates (main template info)
CREATE TABLE IF NOT EXISTS workout_templates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  category text, -- 'push-pull-legs', 'full-body', 'upper-lower', etc.
  days_per_week integer NOT NULL,
  difficulty text, -- 'beginner', 'intermediate', 'advanced'
  duration_weeks integer DEFAULT 12,
  is_custom boolean DEFAULT false,
  created_by uuid REFERENCES clients(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 2. Template Days (each day in the template)
CREATE TABLE IF NOT EXISTS template_days (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id uuid REFERENCES workout_templates(id) ON DELETE CASCADE,
  name text NOT NULL, -- 'Push Day', 'Pull Day', 'Legs Day', etc.
  day_order integer NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- 3. Template Exercises (exercises in each day)
CREATE TABLE IF NOT EXISTS template_exercises (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  day_id uuid REFERENCES template_days(id) ON DELETE CASCADE,
  exercise_id uuid REFERENCES exercises(id) ON DELETE CASCADE,
  exercise_order integer NOT NULL,
  rest_seconds integer DEFAULT 90,
  notes text,
  created_at timestamp with time zone DEFAULT now()
);

-- 4. Template Sets (default sets for each exercise)
CREATE TABLE IF NOT EXISTS template_sets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  template_exercise_id uuid REFERENCES template_exercises(id) ON DELETE CASCADE,
  set_order integer NOT NULL,
  reps integer NOT NULL,
  weight numeric DEFAULT 0, -- Default weight (can be 0 for bodyweight)
  rest_seconds integer DEFAULT 90,
  created_at timestamp with time zone DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_template_days_template_id ON template_days(template_id);
CREATE INDEX IF NOT EXISTS idx_template_exercises_day_id ON template_exercises(day_id);
CREATE INDEX IF NOT EXISTS idx_template_sets_exercise_id ON template_sets(template_exercise_id);

-- Create unique constraints
ALTER TABLE template_days ADD CONSTRAINT unique_template_day_order UNIQUE (template_id, day_order);
ALTER TABLE template_exercises ADD CONSTRAINT unique_day_exercise_order UNIQUE (day_id, exercise_order);
ALTER TABLE template_sets ADD CONSTRAINT unique_exercise_set_order UNIQUE (template_exercise_id, set_order);
