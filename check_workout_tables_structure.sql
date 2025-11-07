-- Check the ACTUAL structure of workout tables in your database
-- Run this in Supabase SQL Editor and share the results with me

-- 1. Check workout_programs table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'workout_programs'
ORDER BY ordinal_position;

-- 2. Check workout_days table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'workout_days'
ORDER BY ordinal_position;

-- 3. Check workout_exercises table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'workout_exercises'
ORDER BY ordinal_position;

-- 4. Check workout_sets table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'workout_sets'
ORDER BY ordinal_position;

-- 5. Check exercises table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'exercises'
ORDER BY ordinal_position;

-- 6. List all workout programs currently in database
SELECT * FROM workout_programs LIMIT 10;

-- 7. Sample data from workout_days (if exists)
SELECT * FROM workout_days LIMIT 5;

-- 8. Sample data from workout_exercises (if exists)
SELECT * FROM workout_exercises LIMIT 5;

-- 9. Sample data from workout_sets (if exists)
SELECT * FROM workout_sets LIMIT 5;

