-- Correctly list all workout programs with their structure
-- Based on ACTUAL table schema

-- 1. List all workout programs
SELECT 
    id,
    name,
    description
FROM workout_programs
ORDER BY name;

-- 2. List workout days for each program
SELECT 
    wp.name as program_name,
    wd.id as day_id,
    wd.name as day_name,
    wd.day_order
FROM workout_programs wp
LEFT JOIN workout_days wd ON wp.id = wd.program_id
ORDER BY wp.name, wd.day_order;

-- 3. List exercises in each day (exercise_id is TEXT - the exercise name!)
SELECT 
    wp.name as program_name,
    wd.name as day_name,
    we.exercise_id as exercise_name,
    we.ex_order,
    we.rest,
    we.notes,
    e.muscle_group
FROM workout_programs wp
JOIN workout_days wd ON wp.id = wd.program_id
JOIN workout_exercises we ON wd.id = we.day_id
LEFT JOIN exercises e ON we.exercise_id = e.name
ORDER BY wp.name, wd.day_order, we.ex_order
LIMIT 50;

-- 4. List sets for exercises (if any)
SELECT 
    wp.name as program_name,
    wd.name as day_name,
    we.exercise_id as exercise_name,
    ws.set_order,
    ws.reps,
    ws.weight,
    ws.rest_seconds,
    ws.notes
FROM workout_programs wp
JOIN workout_days wd ON wp.id = wd.program_id
JOIN workout_exercises we ON wd.id = we.day_id
JOIN workout_sets ws ON we.id = ws.exercise_id
ORDER BY wp.name, wd.day_order, we.ex_order, ws.set_order
LIMIT 50;

