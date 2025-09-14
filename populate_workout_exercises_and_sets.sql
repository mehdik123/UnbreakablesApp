-- Populate workout templates with exercises and sets from your exercise database
-- This script adds the actual exercises to each workout program

-- First, let's check what workout programs and days we have
-- SELECT wp.id, wp.name, wd.id as day_id, wd.name as day_name, wd.day_order 
-- FROM workout_programs wp 
-- JOIN workout_days wd ON wp.id = wd.program_id 
-- ORDER BY wp.name, wd.day_order;

-- Push Pull Legs (3 Days) - PUSH DAY exercises
WITH push_day AS (
  SELECT wd.id as day_id 
  FROM workout_programs wp 
  JOIN workout_days wd ON wp.id = wd.program_id 
  WHERE wp.name = 'Push Pull Legs (3 Days)' AND wd.name = 'Push Day'
)
INSERT INTO workout_exercises (day_id, exercise_id, ex_order, rest, notes)
SELECT 
  pd.day_id,
  e.name,
  ROW_NUMBER() OVER (ORDER BY CASE e.name
    WHEN 'Flat Barbell Bench Press' THEN 1
    WHEN 'Incline Barbell Bench Press' THEN 2
    WHEN 'Incline Dumbbell Flyes' THEN 3
    WHEN 'Seated Barbell Overhead Press' THEN 4
    WHEN 'Standing Dumbbell Lateral Raises' THEN 5
    WHEN 'Dips' THEN 6
  END) as ex_order,
  '90 seconds',
  'Standard push day exercise'
FROM push_day pd
CROSS JOIN exercises e
WHERE e.name IN (
  'Flat Barbell Bench Press', 
  'Incline Barbell Bench Press', 
  'Incline Dumbbell Flyes', 
  'Seated Barbell Overhead Press', 
  'Standing Dumbbell Lateral Raises', 
  'Dips'
);

-- Push Pull Legs (3 Days) - PULL DAY exercises
WITH pull_day AS (
  SELECT wd.id as day_id 
  FROM workout_programs wp 
  JOIN workout_days wd ON wp.id = wd.program_id 
  WHERE wp.name = 'Push Pull Legs (3 Days)' AND wd.name = 'Pull Day'
)
INSERT INTO workout_exercises (day_id, exercise_id, ex_order, rest, notes)
SELECT 
  pd.day_id,
  e.name,
  ROW_NUMBER() OVER (ORDER BY CASE e.name
    WHEN 'Deadlifts' THEN 1
    WHEN 'Pull Ups' THEN 2
    WHEN 'Barbell Bent Over Rows' THEN 3
    WHEN 'Wide Grip Lat Pulldowns' THEN 4
    WHEN 'Dumbbell Rear Delt Raises' THEN 5
    WHEN 'Straight Bar Bicep Curls' THEN 6
  END) as ex_order,
  '90 seconds',
  'Standard pull day exercise'
FROM pull_day pd
CROSS JOIN exercises e
WHERE e.name IN (
  'Deadlifts', 
  'Pull Ups', 
  'Barbell Bent Over Rows', 
  'Wide Grip Lat Pulldowns', 
  'Dumbbell Rear Delt Raises', 
  'Straight Bar Bicep Curls'
);

-- Push Pull Legs (3 Days) - LEGS DAY exercises
WITH legs_day AS (
  SELECT wd.id as day_id 
  FROM workout_programs wp 
  JOIN workout_days wd ON wp.id = wd.program_id 
  WHERE wp.name = 'Push Pull Legs (3 Days)' AND wd.name = 'Legs Day'
)
INSERT INTO workout_exercises (day_id, exercise_id, ex_order, rest, notes)
SELECT 
  ld.day_id,
  e.name,
  ROW_NUMBER() OVER (ORDER BY CASE e.name
    WHEN 'High Bar Back Squats' THEN 1
    WHEN 'Leg Press' THEN 2
    WHEN 'Dumbbell Romanian Deadlifts' THEN 3
    WHEN 'Dumbbell Lunges' THEN 4
    WHEN 'Plank' THEN 5
    WHEN 'Crunches' THEN 6
  END) as ex_order,
  '90 seconds',
  'Standard legs day exercise'
FROM legs_day ld
CROSS JOIN exercises e
WHERE e.name IN (
  'High Bar Back Squats', 
  'Leg Press', 
  'Dumbbell Romanian Deadlifts', 
  'Dumbbell Lunges', 
  'Plank', 
  'Crunches'
);

-- Now add sets for all workout exercises (3 sets each with 8 reps, 50kg default weight)
INSERT INTO workout_sets (workout_exercise_id, set_order, reps, weight)
SELECT 
  we.id,
  s.set_number,
  8 as reps,
  50 as weight
FROM workout_exercises we
CROSS JOIN (
  SELECT 1 as set_number
  UNION ALL SELECT 2
  UNION ALL SELECT 3
) s
WHERE we.day_id IN (
  SELECT wd.id 
  FROM workout_programs wp 
  JOIN workout_days wd ON wp.id = wd.program_id 
  WHERE wp.name = 'Push Pull Legs (3 Days)'
);

-- Verification query
SELECT 
  wp.name as program_name,
  wd.name as day_name,
  we.exercise_id as exercise_name,
  we.ex_order,
  COUNT(ws.id) as num_sets
FROM workout_programs wp
JOIN workout_days wd ON wp.id = wd.program_id
JOIN workout_exercises we ON wd.id = we.day_id
LEFT JOIN workout_sets ws ON we.id = ws.workout_exercise_id
WHERE wp.name = 'Push Pull Legs (3 Days)'
GROUP BY wp.name, wd.name, we.exercise_id, we.ex_order, wd.day_order
ORDER BY wd.day_order, we.ex_order;
