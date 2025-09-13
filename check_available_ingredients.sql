-- Check what ingredients are available in your database
SELECT name, kcal, protein, fat, carbs 
FROM ingredients 
ORDER BY name 
LIMIT 20;
