-- Check all existing workout programs
SELECT 
    id,
    name,
    description,
    created_at
FROM workout_programs
ORDER BY name;

-- Count total programs
SELECT COUNT(*) as total_programs FROM workout_programs;

-- Check program days and exercises
SELECT 
    wp.name as program_name,
    wd.day_name,
    wd.day_order,
    COUNT(we.id) as exercises_count
FROM workout_programs wp
LEFT JOIN workout_days wd ON wp.id = wd.program_id
LEFT JOIN workout_exercises we ON wd.id = we.day_id
GROUP BY wp.id, wp.name, wd.id, wd.day_name, wd.day_order
ORDER BY wp.name, wd.day_order;

