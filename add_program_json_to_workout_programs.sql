-- Store the full workout program (days -> exercises -> sets, including
-- supersets, dropsets and rest periods) as JSON so custom templates created
-- in the coach editor can be saved and reused exactly as designed.
-- Run this in your Supabase SQL Editor.

ALTER TABLE workout_programs
  ADD COLUMN IF NOT EXISTS program_json jsonb;

ALTER TABLE workout_programs
  ADD COLUMN IF NOT EXISTS is_custom boolean DEFAULT false;

COMMENT ON COLUMN workout_programs.program_json IS 'Full WorkoutProgram JSON (days/exercises/sets, supersets, dropsets, rest). When present it is the source of truth for the template.';
COMMENT ON COLUMN workout_programs.is_custom IS 'True for coach-created custom templates (saved from the workout editor).';

-- Verify
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'workout_programs'
ORDER BY ordinal_position;
