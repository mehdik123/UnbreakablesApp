-- Create missing workout tables to complete the system

-- 1. Create workout_programs table if it doesn't exist (your templates)
CREATE TABLE IF NOT EXISTS workout_programs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text, -- 'push-pull-legs', 'full-body', 'upper-lower', etc.
  days_per_week integer NOT NULL,
  difficulty text, -- 'beginner', 'intermediate', 'advanced'  
  duration_weeks integer DEFAULT 12,
  is_custom boolean DEFAULT false,
  created_by text NULL, -- coach ID
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT workout_programs_pkey PRIMARY KEY (id)
);

-- 2. Create workout_sets table if it doesn't exist
CREATE TABLE IF NOT EXISTS workout_sets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  exercise_id uuid NOT NULL,
  set_order integer NOT NULL,
  reps integer NOT NULL,
  weight numeric DEFAULT 0,
  rest_seconds integer DEFAULT 90,
  notes text,
  CONSTRAINT workout_sets_pkey PRIMARY KEY (id),
  CONSTRAINT workout_sets_exercise_id_set_order_key UNIQUE (exercise_id, set_order),
  CONSTRAINT workout_sets_exercise_id_fkey FOREIGN KEY (exercise_id) REFERENCES workout_exercises (id) ON DELETE CASCADE
);

-- 3. Update workout_exercises to link to exercises table properly
-- Check if exercise_id is text and needs to be changed to uuid
DO $$ 
BEGIN
    -- Check if exercise_id column exists and is text type
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'workout_exercises' 
        AND column_name = 'exercise_id' 
        AND data_type = 'text'
    ) THEN
        -- Add new uuid column
        ALTER TABLE workout_exercises ADD COLUMN IF NOT EXISTS exercise_uuid uuid;
        
        -- We'll populate this via migration script since we need to match names
        -- For now, just add the foreign key constraint structure
        -- ALTER TABLE workout_exercises ADD CONSTRAINT workout_exercises_exercise_uuid_fkey 
        -- FOREIGN KEY (exercise_uuid) REFERENCES exercises (id) ON DELETE SET NULL;
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_workout_days_program_id ON workout_days(program_id);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_day_id ON workout_exercises(day_id);
CREATE INDEX IF NOT EXISTS idx_workout_sets_exercise_id ON workout_sets(exercise_id);
