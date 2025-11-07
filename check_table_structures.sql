-- ==========================================
-- CHECK TABLE STRUCTURES FIRST
-- ==========================================
-- Run this to see what columns exist in each table

-- Check meals table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'meals' 
ORDER BY ordinal_position;

-- Check meal_items table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'meal_items' 
ORDER BY ordinal_position;

-- Check ingredients table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'ingredients' 
ORDER BY ordinal_position;

-- Check workout_templates table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'workout_templates' 
ORDER BY ordinal_position;

-- Check users table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

