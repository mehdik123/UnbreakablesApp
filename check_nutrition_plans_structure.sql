-- Check the actual structure of your nutrition_plans table
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'nutrition_plans' 
ORDER BY ordinal_position;
