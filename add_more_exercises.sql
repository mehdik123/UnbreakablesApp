-- Add chest, shoulder, and arm exercises to the exercise database
-- Run in Supabase SQL Editor (safe to re-run: skips names that already exist)

INSERT INTO exercises (name, muscle_group, video_url)
SELECT v.name, v.muscle_group, v.video_url
FROM (VALUES
  ('Incline Bench Cable Flyes', 'Chest', 'https://www.youtube.com/watch?v=LGDCjwO-hFg'),
  ('Seated Machine Press', 'Shoulders', 'https://www.youtube.com/watch?v=WvLMauqrnK8'),
  ('Spider Curls', 'Arms', 'https://www.youtube.com/watch?v=QtbULWz2Fjg')
) AS v(name, muscle_group, video_url)
WHERE NOT EXISTS (
  SELECT 1 FROM exercises e WHERE lower(trim(e.name)) = lower(trim(v.name))
);
