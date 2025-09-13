-- Check the actual structure of your meal_items table
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'meal_items' 
ORDER BY ordinal_position;
