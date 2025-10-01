-- SIMPLE VERSION: Add missing columns to workout_assignments table
-- This version is completely safe and only adds missing columns

-- Add last_modified_at column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'workout_assignments' 
        AND column_name = 'last_modified_at'
    ) THEN
        ALTER TABLE workout_assignments 
        ADD COLUMN last_modified_at timestamp with time zone NOT NULL DEFAULT now();
    END IF;
END $$;

-- Add last_modified_by column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'workout_assignments' 
        AND column_name = 'last_modified_by'
    ) THEN
        ALTER TABLE workout_assignments 
        ADD COLUMN last_modified_by text NOT NULL DEFAULT 'coach';
    END IF;
END $$;

-- Add current_week column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'workout_assignments' 
        AND column_name = 'current_week'
    ) THEN
        ALTER TABLE workout_assignments 
        ADD COLUMN current_week integer NOT NULL DEFAULT 1;
    END IF;
END $$;

-- Add current_day column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'workout_assignments' 
        AND column_name = 'current_day'
    ) THEN
        ALTER TABLE workout_assignments 
        ADD COLUMN current_day integer NOT NULL DEFAULT 1;
    END IF;
END $$;

-- Add duration_weeks column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'workout_assignments' 
        AND column_name = 'duration_weeks'
    ) THEN
        ALTER TABLE workout_assignments 
        ADD COLUMN duration_weeks integer NOT NULL DEFAULT 12;
    END IF;
END $$;

-- Add is_active column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'workout_assignments' 
        AND column_name = 'is_active'
    ) THEN
        ALTER TABLE workout_assignments 
        ADD COLUMN is_active boolean NOT NULL DEFAULT true;
    END IF;
END $$;

-- Add start_date column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'workout_assignments' 
        AND column_name = 'start_date'
    ) THEN
        ALTER TABLE workout_assignments 
        ADD COLUMN start_date date NOT NULL DEFAULT CURRENT_DATE;
    END IF;
END $$;

-- Add program_json column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'workout_assignments' 
        AND column_name = 'program_json'
    ) THEN
        ALTER TABLE workout_assignments 
        ADD COLUMN program_json jsonb NOT NULL DEFAULT '{}';
    END IF;
END $$;

-- Add program_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'workout_assignments' 
        AND column_name = 'program_id'
    ) THEN
        ALTER TABLE workout_assignments 
        ADD COLUMN program_id uuid;
    END IF;
END $$;

-- Add coach_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'workout_assignments' 
        AND column_name = 'coach_id'
    ) THEN
        ALTER TABLE workout_assignments 
        ADD COLUMN coach_id uuid;
    END IF;
END $$;

-- Create indexes for better performance (these are safe)
CREATE INDEX IF NOT EXISTS idx_workout_assignments_client ON workout_assignments(client_id);
CREATE INDEX IF NOT EXISTS idx_workout_assignments_active ON workout_assignments(is_active);
CREATE INDEX IF NOT EXISTS idx_workout_assignments_modified ON workout_assignments(last_modified_at DESC);

-- Add comments to document the table structure (safe)
COMMENT ON TABLE workout_assignments IS 'Stores client workout assignments with week progression tracking';
COMMENT ON COLUMN workout_assignments.program_json IS 'Complete program data including weeks array with unlocking status';
COMMENT ON COLUMN workout_assignments.current_week IS 'Current active week for the client';
COMMENT ON COLUMN workout_assignments.current_day IS 'Current active day within the week';
COMMENT ON COLUMN workout_assignments.last_modified_by IS 'Who last modified this assignment (coach or client)';
COMMENT ON COLUMN workout_assignments.last_modified_at IS 'When this assignment was last modified';





