-- Migration script to insert existing workout templates into database
-- Run this after creating the workout template tables

-- Insert workout templates
INSERT INTO workout_templates (id, name, description, category, days_per_week, difficulty, duration_weeks, is_custom) VALUES
('ppl-3-day', 'Push Pull Legs (3 Days)', 'Classic 3-day split focusing on push, pull, and leg movements', 'push-pull-legs', 3, 'intermediate', 12, false),
('ppl-6-day', 'Push Pull Legs (6 Days)', 'High-frequency 6-day split for advanced trainees', 'push-pull-legs', 6, 'advanced', 8, false),
('arnold-3-day', 'Arnold Split (3 Days)', 'Arnold Schwarzenegger''s classic 3-day split routine', 'arnold-split', 3, 'intermediate', 12, false),
('arnold-6-day', 'Arnold Split (6 Days)', 'High-frequency Arnold split for advanced bodybuilders', 'arnold-split', 6, 'advanced', 8, false),
('upper-lower-4-day', 'Upper/Lower (4 Days)', 'Balanced 4-day split alternating upper and lower body', 'upper-lower', 4, 'intermediate', 10, false),
('full-body-3-day', 'Full Body (3 Days)', 'Complete full-body workout 3 times per week', 'full-body', 3, 'beginner', 12, false),
('full-body-4-day', 'Full Body (4 Days)', 'High-frequency full-body training for intermediate trainees', 'full-body', 4, 'intermediate', 8, false);

-- Insert template days for Push Pull Legs (3 Days)
INSERT INTO template_days (template_id, name, day_order) VALUES
('ppl-3-day', 'Push Day', 1),
('ppl-3-day', 'Pull Day', 2),
('ppl-3-day', 'Legs Day', 3);

-- Insert template days for Push Pull Legs (6 Days)
INSERT INTO template_days (template_id, name, day_order) VALUES
('ppl-6-day', 'Push Day 1', 1),
('ppl-6-day', 'Pull Day 1', 2),
('ppl-6-day', 'Legs Day 1', 3),
('ppl-6-day', 'Push Day 2', 4),
('ppl-6-day', 'Pull Day 2', 5),
('ppl-6-day', 'Legs Day 2', 6);

-- Insert template days for Arnold Split (3 Days)
INSERT INTO template_days (template_id, name, day_order) VALUES
('arnold-3-day', 'Chest & Back', 1),
('arnold-3-day', 'Shoulders & Arms', 2),
('arnold-3-day', 'Legs', 3);

-- Insert template days for Arnold Split (6 Days)
INSERT INTO template_days (template_id, name, day_order) VALUES
('arnold-6-day', 'Chest & Back 1', 1),
('arnold-6-day', 'Shoulders & Arms 1', 2),
('arnold-6-day', 'Legs 1', 3),
('arnold-6-day', 'Chest & Back 2', 4),
('arnold-6-day', 'Shoulders & Arms 2', 5),
('arnold-6-day', 'Legs 2', 6);

-- Insert template days for Upper/Lower (4 Days)
INSERT INTO template_days (template_id, name, day_order) VALUES
('upper-lower-4-day', 'Upper Body 1', 1),
('upper-lower-4-day', 'Lower Body 1', 2),
('upper-lower-4-day', 'Upper Body 2', 3),
('upper-lower-4-day', 'Lower Body 2', 4);

-- Insert template days for Full Body (3 Days)
INSERT INTO template_days (template_id, name, day_order) VALUES
('full-body-3-day', 'Full Body 1', 1),
('full-body-3-day', 'Full Body 2', 2),
('full-body-3-day', 'Full Body 3', 3);

-- Insert template days for Full Body (4 Days)
INSERT INTO template_days (template_id, name, day_order) VALUES
('full-body-4-day', 'Full Body 1', 1),
('full-body-4-day', 'Full Body 2', 2),
('full-body-4-day', 'Full Body 3', 3),
('full-body-4-day', 'Full Body 4', 4);

-- Note: Exercise and set insertions will be done via a separate script
-- since they require matching exercise names with database IDs
-- This will be handled by the migration function in the application
