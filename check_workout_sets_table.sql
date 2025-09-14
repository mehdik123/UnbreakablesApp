-- Check if workout_sets table exists and create if missing

-- Check current table structure
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('workout_programs', 'workout_days', 'workout_exercises', 'workout_sets')
ORDER BY table_name, ordinal_position;
