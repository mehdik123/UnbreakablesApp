-- Add missing columns to your existing workout tables

-- Add missing columns to workout_programs
ALTER TABLE workout_programs 
ADD COLUMN IF NOT EXISTS category text,
ADD COLUMN IF NOT EXISTS days_per_week integer,
ADD COLUMN IF NOT EXISTS difficulty text,
ADD COLUMN IF NOT EXISTS duration_weeks integer DEFAULT 12,
ADD COLUMN IF NOT EXISTS created_by text,
ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Add missing columns to workout_exercises to link to exercises table
ALTER TABLE workout_exercises 
ADD COLUMN IF NOT EXISTS exercise_uuid uuid;

-- Add foreign key constraint to link exercises (we'll populate the uuid column via migration)
-- ALTER TABLE workout_exercises 
-- ADD CONSTRAINT workout_exercises_exercise_uuid_fkey 
-- FOREIGN KEY (exercise_uuid) REFERENCES exercises (id) ON DELETE SET NULL;

-- Add missing columns to workout_sets if needed
ALTER TABLE workout_sets 
ADD COLUMN IF NOT EXISTS rest_seconds integer DEFAULT 90,
ADD COLUMN IF NOT EXISTS notes text;

-- Verify the updated structure
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('workout_programs', 'workout_days', 'workout_exercises', 'workout_sets')
ORDER BY table_name, ordinal_position;
