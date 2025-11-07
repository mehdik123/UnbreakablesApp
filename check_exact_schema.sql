-- Check EXACT schema of each table

-- 1. workout_programs columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'workout_programs' 
ORDER BY ordinal_position;

-- 2. workout_days columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'workout_days' 
ORDER BY ordinal_position;

-- 3. workout_exercises columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'workout_exercises' 
ORDER BY ordinal_position;

-- 4. workout_sets columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'workout_sets' 
ORDER BY ordinal_position;

-- 5. Now list all programs (using ONLY confirmed columns)
SELECT * FROM workout_programs;

-- 6. Sample workout days
SELECT * FROM workout_days LIMIT 10;

-- 7. Sample workout exercises
SELECT * FROM workout_exercises LIMIT 10;

