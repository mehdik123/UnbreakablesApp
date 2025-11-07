-- Add missing columns to workout_sets table for dropset and paused reps features
-- Run this in your Supabase SQL Editor

-- Add is_dropset column if it doesn't exist
ALTER TABLE workout_sets 
ADD COLUMN IF NOT EXISTS is_dropset BOOLEAN DEFAULT false;

-- Add is_paused_reps column if it doesn't exist
ALTER TABLE workout_sets 
ADD COLUMN IF NOT EXISTS is_paused_reps BOOLEAN DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN workout_sets.is_dropset IS 'Indicates if this set is a dropset (reduce weight and continue)';
COMMENT ON COLUMN workout_sets.is_paused_reps IS 'Indicates if this set uses paused reps technique';

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'workout_sets'
ORDER BY ordinal_position;

