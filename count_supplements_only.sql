-- Just count supplements
SELECT COUNT(*) as total_supplements FROM supplements;

-- Show first 5 if any exist
SELECT name, category FROM supplements LIMIT 5;

