-- Migration script to populate your existing workout tables with frontend templates
-- This works with your current table structure

-- First, insert workout programs (templates) - using proper UUIDs
INSERT INTO workout_programs (name, description, is_template) VALUES
('Push Pull Legs (3 Days)', 'Classic 3-day split focusing on push, pull, and leg movements', true),
('Push Pull Legs (6 Days)', 'High-frequency 6-day split for advanced trainees', true),
('Arnold Split (3 Days)', 'Arnold Schwarzenegger''s classic 3-day split routine', true),
('Arnold Split (6 Days)', 'High-frequency Arnold split for advanced bodybuilders', true),
('Upper/Lower (4 Days)', 'Balanced 4-day split alternating upper and lower body', true),
('Full Body (3 Days)', 'Complete full-body workout 3 times per week', true),
('Full Body (4 Days)', 'High-frequency full-body training for intermediate trainees', true);

-- Update with additional columns if they exist (will only work after running add_missing_workout_columns.sql)
UPDATE workout_programs SET 
  category = 'push-pull-legs', 
  days_per_week = 3, 
  difficulty = 'intermediate', 
  duration_weeks = 12
WHERE name = 'Push Pull Legs (3 Days)';

UPDATE workout_programs SET 
  category = 'push-pull-legs', 
  days_per_week = 6, 
  difficulty = 'advanced', 
  duration_weeks = 8
WHERE name = 'Push Pull Legs (6 Days)';

UPDATE workout_programs SET 
  category = 'arnold-split', 
  days_per_week = 3, 
  difficulty = 'intermediate', 
  duration_weeks = 12
WHERE name = 'Arnold Split (3 Days)';

UPDATE workout_programs SET 
  category = 'arnold-split', 
  days_per_week = 6, 
  difficulty = 'advanced', 
  duration_weeks = 8
WHERE name = 'Arnold Split (6 Days)';

UPDATE workout_programs SET 
  category = 'upper-lower', 
  days_per_week = 4, 
  difficulty = 'intermediate', 
  duration_weeks = 10
WHERE name = 'Upper/Lower (4 Days)';

UPDATE workout_programs SET 
  category = 'full-body', 
  days_per_week = 3, 
  difficulty = 'beginner', 
  duration_weeks = 12
WHERE name = 'Full Body (3 Days)';

UPDATE workout_programs SET 
  category = 'full-body', 
  days_per_week = 4, 
  difficulty = 'intermediate', 
  duration_weeks = 8
WHERE name = 'Full Body (4 Days)';

-- Insert workout days using program lookups
-- Push Pull Legs (3 Days)
INSERT INTO workout_days (program_id, name, day_order) 
SELECT id, 'Push Day', 1 FROM workout_programs WHERE name = 'Push Pull Legs (3 Days)'
UNION ALL
SELECT id, 'Pull Day', 2 FROM workout_programs WHERE name = 'Push Pull Legs (3 Days)'
UNION ALL
SELECT id, 'Legs Day', 3 FROM workout_programs WHERE name = 'Push Pull Legs (3 Days)';

-- Push Pull Legs (6 Days)
INSERT INTO workout_days (program_id, name, day_order) 
SELECT id, 'Push Day 1', 1 FROM workout_programs WHERE name = 'Push Pull Legs (6 Days)'
UNION ALL
SELECT id, 'Pull Day 1', 2 FROM workout_programs WHERE name = 'Push Pull Legs (6 Days)'
UNION ALL
SELECT id, 'Legs Day 1', 3 FROM workout_programs WHERE name = 'Push Pull Legs (6 Days)'
UNION ALL
SELECT id, 'Push Day 2', 4 FROM workout_programs WHERE name = 'Push Pull Legs (6 Days)'
UNION ALL
SELECT id, 'Pull Day 2', 5 FROM workout_programs WHERE name = 'Push Pull Legs (6 Days)'
UNION ALL
SELECT id, 'Legs Day 2', 6 FROM workout_programs WHERE name = 'Push Pull Legs (6 Days)';

-- Arnold Split (3 Days)
INSERT INTO workout_days (program_id, name, day_order) 
SELECT id, 'Chest & Back', 1 FROM workout_programs WHERE name = 'Arnold Split (3 Days)'
UNION ALL
SELECT id, 'Shoulders & Arms', 2 FROM workout_programs WHERE name = 'Arnold Split (3 Days)'
UNION ALL
SELECT id, 'Legs', 3 FROM workout_programs WHERE name = 'Arnold Split (3 Days)';

-- Arnold Split (6 Days)
INSERT INTO workout_days (program_id, name, day_order) 
SELECT id, 'Chest & Back 1', 1 FROM workout_programs WHERE name = 'Arnold Split (6 Days)'
UNION ALL
SELECT id, 'Shoulders & Arms 1', 2 FROM workout_programs WHERE name = 'Arnold Split (6 Days)'
UNION ALL
SELECT id, 'Legs 1', 3 FROM workout_programs WHERE name = 'Arnold Split (6 Days)'
UNION ALL
SELECT id, 'Chest & Back 2', 4 FROM workout_programs WHERE name = 'Arnold Split (6 Days)'
UNION ALL
SELECT id, 'Shoulders & Arms 2', 5 FROM workout_programs WHERE name = 'Arnold Split (6 Days)'
UNION ALL
SELECT id, 'Legs 2', 6 FROM workout_programs WHERE name = 'Arnold Split (6 Days)';

-- Upper/Lower (4 Days)
INSERT INTO workout_days (program_id, name, day_order) 
SELECT id, 'Upper Body 1', 1 FROM workout_programs WHERE name = 'Upper/Lower (4 Days)'
UNION ALL
SELECT id, 'Lower Body 1', 2 FROM workout_programs WHERE name = 'Upper/Lower (4 Days)'
UNION ALL
SELECT id, 'Upper Body 2', 3 FROM workout_programs WHERE name = 'Upper/Lower (4 Days)'
UNION ALL
SELECT id, 'Lower Body 2', 4 FROM workout_programs WHERE name = 'Upper/Lower (4 Days)';

-- Full Body (3 Days)
INSERT INTO workout_days (program_id, name, day_order) 
SELECT id, 'Full Body 1', 1 FROM workout_programs WHERE name = 'Full Body (3 Days)'
UNION ALL
SELECT id, 'Full Body 2', 2 FROM workout_programs WHERE name = 'Full Body (3 Days)'
UNION ALL
SELECT id, 'Full Body 3', 3 FROM workout_programs WHERE name = 'Full Body (3 Days)';

-- Full Body (4 Days)
INSERT INTO workout_days (program_id, name, day_order) 
SELECT id, 'Full Body 1', 1 FROM workout_programs WHERE name = 'Full Body (4 Days)'
UNION ALL
SELECT id, 'Full Body 2', 2 FROM workout_programs WHERE name = 'Full Body (4 Days)'
UNION ALL
SELECT id, 'Full Body 3', 3 FROM workout_programs WHERE name = 'Full Body (4 Days)'
UNION ALL
SELECT id, 'Full Body 4', 4 FROM workout_programs WHERE name = 'Full Body (4 Days)';

-- Verification query
SELECT 
  wp.name as program_name,
  wp.days_per_week,
  wd.name as day_name,
  wd.day_order
FROM workout_programs wp
LEFT JOIN workout_days wd ON wp.id = wd.program_id
ORDER BY wp.name, wd.day_order;
