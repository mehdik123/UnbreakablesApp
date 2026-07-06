-- Add glute-focused exercises to the exercise database
-- Run in Supabase SQL Editor (safe to re-run: skips names that already exist)

INSERT INTO exercises (name, muscle_group, video_url)
SELECT v.name, v.muscle_group, v.video_url
FROM (VALUES
  ('Hip Thrusts', 'Legs', 'https://www.youtube.com/watch?v=pUdIL5x0fWg'),
  ('Glute Cable Step Up', 'Legs', 'https://www.youtube.com/watch?v=wdb2Ku4Yrx4'),
  ('Abductor Curls', 'Legs', 'https://www.youtube.com/watch?v=oLOkB5o4xr4'),
  ('Bulgarian Split Squat (Glutes Focused)', 'Legs', 'https://www.youtube.com/shorts/jWJZphJpRwk'),
  ('Glute Cable Kickbacks', 'Legs', 'https://www.youtube.com/watch?v=SqO-VUEak2M'),
  ('Dumbbell Deep Squat', 'Legs', 'https://www.youtube.com/shorts/sQ-lwJtpwUc')
) AS v(name, muscle_group, video_url)
WHERE NOT EXISTS (
  SELECT 1 FROM exercises e WHERE lower(trim(e.name)) = lower(trim(v.name))
);
