-- Create or update workout_assignments table with all necessary fields
-- This table stores client workout assignments with week progression data

CREATE TABLE IF NOT EXISTS workout_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  coach_id uuid,
  program_id uuid,
  program_json jsonb NOT NULL, -- Stores the complete program with weeks array
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  duration_weeks integer NOT NULL DEFAULT 12,
  current_week integer NOT NULL DEFAULT 1,
  current_day integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  last_modified_by text NOT NULL DEFAULT 'coach',
  last_modified_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT workout_assignments_pkey PRIMARY KEY (id),
  CONSTRAINT workout_assignments_client_program_unique UNIQUE (client_id, program_id, is_active) DEFERRABLE INITIALLY DEFERRED
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_workout_assignments_client ON workout_assignments(client_id);
CREATE INDEX IF NOT EXISTS idx_workout_assignments_active ON workout_assignments(is_active);
CREATE INDEX IF NOT EXISTS idx_workout_assignments_modified ON workout_assignments(last_modified_at DESC);

-- Add foreign key constraints (assuming clients table exists)
-- ALTER TABLE workout_assignments ADD CONSTRAINT fk_workout_assignments_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;
-- ALTER TABLE workout_assignments ADD CONSTRAINT fk_workout_assignments_program FOREIGN KEY (program_id) REFERENCES workout_programs(id) ON DELETE SET NULL;

-- Update existing records to have proper last_modified_at if they don't have it
UPDATE workout_assignments 
SET last_modified_at = COALESCE(updated_at, created_at, now())
WHERE last_modified_at IS NULL;

-- Add last_modified_at column if it doesn't exist (for existing tables)
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

-- Add last_modified_by column if it doesn't exist (for existing tables)
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

-- Add current_week column if it doesn't exist (for existing tables)
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

-- Add current_day column if it doesn't exist (for existing tables)
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

-- Add duration_weeks column if it doesn't exist (for existing tables)
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

-- Add is_active column if it doesn't exist (for existing tables)
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

-- Add start_date column if it doesn't exist (for existing tables)
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

-- Add program_json column if it doesn't exist (for existing tables)
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

-- Add program_id column if it doesn't exist (for existing tables)
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

-- Add coach_id column if it doesn't exist (for existing tables)
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

-- Create a function to automatically update last_modified_at
CREATE OR REPLACE FUNCTION update_workout_assignments_modified_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_modified_at = now();
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update last_modified_at on updates
DROP TRIGGER IF EXISTS trigger_update_workout_assignments_modified_at ON workout_assignments;
CREATE TRIGGER trigger_update_workout_assignments_modified_at
    BEFORE UPDATE ON workout_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_workout_assignments_modified_at();

-- Add comments to document the table structure
COMMENT ON TABLE workout_assignments IS 'Stores client workout assignments with week progression tracking';
COMMENT ON COLUMN workout_assignments.program_json IS 'Complete program data including weeks array with unlocking status';
COMMENT ON COLUMN workout_assignments.current_week IS 'Current active week for the client';
COMMENT ON COLUMN workout_assignments.current_day IS 'Current active day within the week';
COMMENT ON COLUMN workout_assignments.last_modified_by IS 'Who last modified this assignment (coach or client)';
COMMENT ON COLUMN workout_assignments.last_modified_at IS 'When this assignment was last modified';





