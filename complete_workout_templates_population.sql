-- Complete population of all workout templates with exercises and sets
-- This populates Push Pull Legs, Arnold Split, Upper/Lower, and Full Body programs

-- =============================================================================
-- PUSH PULL LEGS (3 Days)
-- =============================================================================

-- PUSH DAY
WITH push_day AS (
  SELECT wd.id as day_id FROM workout_programs wp 
  JOIN workout_days wd ON wp.id = wd.program_id 
  WHERE wp.name = 'Push Pull Legs (3 Days)' AND wd.name = 'Push Day'
)
INSERT INTO workout_exercises (day_id, exercise_id, ex_order, rest, notes)
SELECT pd.day_id, exercise_name, ex_order, '90 seconds', 'Push day exercise'
FROM push_day pd
CROSS JOIN (VALUES
  ('Flat Barbell Bench Press', 1),
  ('Incline Barbell Bench Press', 2),
  ('Incline Dumbbell Flyes', 3),
  ('Seated Barbell Overhead Press', 4),
  ('Standing Dumbbell Lateral Raises', 5),
  ('Dips', 6)
) AS exercises(exercise_name, ex_order)
WHERE EXISTS (SELECT 1 FROM exercises e WHERE e.name = exercise_name);

-- PULL DAY
WITH pull_day AS (
  SELECT wd.id as day_id FROM workout_programs wp 
  JOIN workout_days wd ON wp.id = wd.program_id 
  WHERE wp.name = 'Push Pull Legs (3 Days)' AND wd.name = 'Pull Day'
)
INSERT INTO workout_exercises (day_id, exercise_id, ex_order, rest, notes)
SELECT pd.day_id, exercise_name, ex_order, '90 seconds', 'Pull day exercise'
FROM pull_day pd
CROSS JOIN (VALUES
  ('Deadlifts', 1),
  ('Pull Ups', 2),
  ('Barbell Bent Over Rows', 3),
  ('Wide Grip Lat Pulldowns', 4),
  ('Dumbbell Rear Delt Raises', 5),
  ('Straight Bar Bicep Curls', 6)
) AS exercises(exercise_name, ex_order)
WHERE EXISTS (SELECT 1 FROM exercises e WHERE e.name = exercise_name);

-- LEGS DAY
WITH legs_day AS (
  SELECT wd.id as day_id FROM workout_programs wp 
  JOIN workout_days wd ON wp.id = wd.program_id 
  WHERE wp.name = 'Push Pull Legs (3 Days)' AND wd.name = 'Legs Day'
)
INSERT INTO workout_exercises (day_id, exercise_id, ex_order, rest, notes)
SELECT ld.day_id, exercise_name, ex_order, '90 seconds', 'Legs day exercise'
FROM legs_day ld
CROSS JOIN (VALUES
  ('High Bar Back Squats', 1),
  ('Leg Press', 2),
  ('Dumbbell Romanian Deadlifts', 3),
  ('Dumbbell Lunges', 4),
  ('Plank', 5),
  ('Crunches', 6)
) AS exercises(exercise_name, ex_order)
WHERE EXISTS (SELECT 1 FROM exercises e WHERE e.name = exercise_name);

-- =============================================================================
-- ARNOLD SPLIT (3 Days)
-- =============================================================================

-- CHEST & BACK
WITH chest_back_day AS (
  SELECT wd.id as day_id FROM workout_programs wp 
  JOIN workout_days wd ON wp.id = wd.program_id 
  WHERE wp.name = 'Arnold Split (3 Days)' AND wd.name = 'Chest & Back'
)
INSERT INTO workout_exercises (day_id, exercise_id, ex_order, rest, notes)
SELECT cbd.day_id, exercise_name, ex_order, '90 seconds', 'Chest & back exercise'
FROM chest_back_day cbd
CROSS JOIN (VALUES
  ('Flat Barbell Bench Press', 1),
  ('Barbell Bent Over Rows', 2),
  ('Incline Barbell Bench Press', 3),
  ('Wide Grip Lat Pulldowns', 4),
  ('Chest Flyes', 5),
  ('Pull Ups', 6)
) AS exercises(exercise_name, ex_order)
WHERE EXISTS (SELECT 1 FROM exercises e WHERE e.name = exercise_name);

-- SHOULDERS & ARMS
WITH shoulders_arms_day AS (
  SELECT wd.id as day_id FROM workout_programs wp 
  JOIN workout_days wd ON wp.id = wd.program_id 
  WHERE wp.name = 'Arnold Split (3 Days)' AND wd.name = 'Shoulders & Arms'
)
INSERT INTO workout_exercises (day_id, exercise_id, ex_order, rest, notes)
SELECT sad.day_id, exercise_name, ex_order, '90 seconds', 'Shoulders & arms exercise'
FROM shoulders_arms_day sad
CROSS JOIN (VALUES
  ('Seated Barbell Overhead Press', 1),
  ('Standing Dumbbell Lateral Raises', 2),
  ('Dumbbell Rear Delt Raises', 3),
  ('Straight Bar Bicep Curls', 4),
  ('Dips', 5),
  ('Dumbbell Hammer Curls', 6)
) AS exercises(exercise_name, ex_order)
WHERE EXISTS (SELECT 1 FROM exercises e WHERE e.name = exercise_name);

-- LEGS (Arnold)
WITH arnold_legs_day AS (
  SELECT wd.id as day_id FROM workout_programs wp 
  JOIN workout_days wd ON wp.id = wd.program_id 
  WHERE wp.name = 'Arnold Split (3 Days)' AND wd.name = 'Legs'
)
INSERT INTO workout_exercises (day_id, exercise_id, ex_order, rest, notes)
SELECT ald.day_id, exercise_name, ex_order, '90 seconds', 'Arnold legs exercise'
FROM arnold_legs_day ald
CROSS JOIN (VALUES
  ('High Bar Back Squats', 1),
  ('Dumbbell Romanian Deadlifts', 2),
  ('Leg Press', 3),
  ('Dumbbell Lunges', 4),
  ('Calf Raises', 5),
  ('Plank', 6)
) AS exercises(exercise_name, ex_order)
WHERE EXISTS (SELECT 1 FROM exercises e WHERE e.name = exercise_name);

-- =============================================================================
-- FULL BODY (3 Days)
-- =============================================================================

-- FULL BODY 1
WITH full_body_1 AS (
  SELECT wd.id as day_id FROM workout_programs wp 
  JOIN workout_days wd ON wp.id = wd.program_id 
  WHERE wp.name = 'Full Body (3 Days)' AND wd.name = 'Full Body 1'
)
INSERT INTO workout_exercises (day_id, exercise_id, ex_order, rest, notes)
SELECT fb1.day_id, exercise_name, ex_order, '90 seconds', 'Full body exercise'
FROM full_body_1 fb1
CROSS JOIN (VALUES
  ('High Bar Back Squats', 1),
  ('Flat Barbell Bench Press', 2),
  ('Barbell Bent Over Rows', 3),
  ('Seated Barbell Overhead Press', 4),
  ('Straight Bar Bicep Curls', 5),
  ('Dips', 6),
  ('Plank', 7)
) AS exercises(exercise_name, ex_order)
WHERE EXISTS (SELECT 1 FROM exercises e WHERE e.name = exercise_name);

-- FULL BODY 2
WITH full_body_2 AS (
  SELECT wd.id as day_id FROM workout_programs wp 
  JOIN workout_days wd ON wp.id = wd.program_id 
  WHERE wp.name = 'Full Body (3 Days)' AND wd.name = 'Full Body 2'
)
INSERT INTO workout_exercises (day_id, exercise_id, ex_order, rest, notes)
SELECT fb2.day_id, exercise_name, ex_order, '90 seconds', 'Full body exercise'
FROM full_body_2 fb2
CROSS JOIN (VALUES
  ('Deadlifts', 1),
  ('Incline Barbell Bench Press', 2),
  ('Wide Grip Lat Pulldowns', 3),
  ('Standing Dumbbell Lateral Raises', 4),
  ('Dumbbell Hammer Curls', 5),
  ('Rope Triceps Extensions', 6),
  ('Crunches', 7)
) AS exercises(exercise_name, ex_order)
WHERE EXISTS (SELECT 1 FROM exercises e WHERE e.name = exercise_name);

-- FULL BODY 3
WITH full_body_3 AS (
  SELECT wd.id as day_id FROM workout_programs wp 
  JOIN workout_days wd ON wp.id = wd.program_id 
  WHERE wp.name = 'Full Body (3 Days)' AND wd.name = 'Full Body 3'
)
INSERT INTO workout_exercises (day_id, exercise_id, ex_order, rest, notes)
SELECT fb3.day_id, exercise_name, ex_order, '90 seconds', 'Full body exercise'
FROM full_body_3 fb3
CROSS JOIN (VALUES
  ('Leg Press', 1),
  ('Push Ups', 2),
  ('Pull Ups', 3),
  ('Dumbbell Rear Delt Raises', 4),
  ('Wide Grip EZ Bar Curls', 5),
  ('Overhead Cable Triceps Extensions', 6),
  ('Mountain Climbers', 7)
) AS exercises(exercise_name, ex_order)
WHERE EXISTS (SELECT 1 FROM exercises e WHERE e.name = exercise_name);

-- =============================================================================
-- ADD SETS FOR ALL EXERCISES (3 sets each)
-- =============================================================================
INSERT INTO workout_sets (workout_exercise_id, set_order, reps, weight)
SELECT 
  we.id,
  s.set_number,
  CASE 
    WHEN we.exercise_id IN ('Plank', 'Mountain Climbers') THEN 30 -- seconds for isometric
    WHEN we.exercise_id IN ('Pull Ups', 'Push Ups', 'Dips') THEN 10 -- bodyweight exercises
    ELSE 8 -- standard reps
  END as reps,
  CASE 
    WHEN we.exercise_id IN ('Plank', 'Mountain Climbers', 'Pull Ups', 'Push Ups', 'Dips') THEN 0 -- bodyweight
    WHEN we.exercise_id LIKE '%Dumbbell%' THEN 25 -- lighter for dumbbells
    ELSE 50 -- standard weight
  END as weight
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
  WHERE wp.name IN (
    'Push Pull Legs (3 Days)', 
    'Arnold Split (3 Days)', 
    'Full Body (3 Days)'
  )
);

-- =============================================================================
-- VERIFICATION QUERY
-- =============================================================================
SELECT 
  wp.name as program_name,
  wd.name as day_name,
  we.exercise_id as exercise_name,
  we.ex_order,
  COUNT(ws.id) as num_sets,
  MAX(ws.reps) as reps,
  MAX(ws.weight) as weight
FROM workout_programs wp
JOIN workout_days wd ON wp.id = wd.program_id
JOIN workout_exercises we ON wd.id = we.day_id
LEFT JOIN workout_sets ws ON we.id = ws.workout_exercise_id
WHERE wp.name IN ('Push Pull Legs (3 Days)', 'Arnold Split (3 Days)', 'Full Body (3 Days)')
GROUP BY wp.name, wd.name, we.exercise_id, we.ex_order, wd.day_order
ORDER BY wp.name, wd.day_order, we.ex_order;
