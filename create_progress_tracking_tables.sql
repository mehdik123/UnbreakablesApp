-- Enhanced database schema for comprehensive progress tracking
-- This creates tables for weight logs, PRs, training volume tracking, and weekly performance

-- 1. Client Weight Logs Table
CREATE TABLE IF NOT EXISTS client_weight_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  date date NOT NULL,
  weight numeric(5,2) NOT NULL, -- kg with 2 decimal places
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT client_weight_logs_pkey PRIMARY KEY (id),
  CONSTRAINT client_weight_logs_client_date_unique UNIQUE (client_id, date)
);

-- 2. Weekly Training Volume Table
CREATE TABLE IF NOT EXISTS weekly_training_volume (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  week_number integer NOT NULL,
  muscle_group text NOT NULL, -- 'chest', 'back', 'legs', 'shoulders', 'arms', 'core'
  total_sets integer DEFAULT 0,
  total_reps integer DEFAULT 0,
  total_volume numeric(10,2) DEFAULT 0, -- weight * reps total
  volume_change_percent numeric(5,2), -- percentage change from previous week
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT weekly_training_volume_pkey PRIMARY KEY (id),
  CONSTRAINT weekly_training_volume_unique UNIQUE (client_id, week_number, muscle_group)
);

-- 3. Personal Records (PRs) Table
CREATE TABLE IF NOT EXISTS client_personal_records (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  exercise_name text NOT NULL, -- 'bench_press', 'squat', 'deadlift', 'pull_ups', 'dips', 'bicep_curls'
  week_number integer NOT NULL,
  best_set_weight numeric(5,2) NOT NULL,
  best_set_reps integer NOT NULL,
  total_volume numeric(10,2) NOT NULL, -- weight * reps for the best set
  date_achieved date NOT NULL,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT client_personal_records_pkey PRIMARY KEY (id),
  CONSTRAINT client_prs_unique UNIQUE (client_id, exercise_name, week_number)
);

-- 4. Weekly Performance Summary Table
CREATE TABLE IF NOT EXISTS weekly_performance_summary (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  week_number integer NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  is_completed boolean DEFAULT false,
  completed_at timestamp with time zone,
  total_workouts_completed integer DEFAULT 0,
  total_sets_completed integer DEFAULT 0,
  total_volume numeric(10,2) DEFAULT 0,
  average_weight numeric(5,2), -- average weight for the week
  weight_change numeric(5,2), -- weight change from previous week
  pr_count integer DEFAULT 0, -- number of PRs achieved this week
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT weekly_performance_summary_pkey PRIMARY KEY (id),
  CONSTRAINT weekly_performance_unique UNIQUE (client_id, week_number)
);

-- 5. Exercise Performance Tracking (detailed set-by-set tracking)
CREATE TABLE IF NOT EXISTS exercise_performance_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  workout_assignment_id uuid,
  exercise_name text NOT NULL,
  muscle_group text NOT NULL,
  week_number integer NOT NULL,
  day_number integer NOT NULL,
  set_number integer NOT NULL,
  planned_reps integer NOT NULL,
  actual_reps integer NOT NULL,
  planned_weight numeric(5,2) NOT NULL,
  actual_weight numeric(5,2) NOT NULL,
  rpe integer, -- Rate of Perceived Exertion (1-10)
  notes text,
  logged_at timestamp with time zone DEFAULT now(),
  CONSTRAINT exercise_performance_logs_pkey PRIMARY KEY (id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_weight_logs_client_date ON client_weight_logs(client_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_training_volume_client_week ON weekly_training_volume(client_id, week_number);
CREATE INDEX IF NOT EXISTS idx_prs_client_exercise ON client_personal_records(client_id, exercise_name, week_number DESC);
CREATE INDEX IF NOT EXISTS idx_performance_summary_client ON weekly_performance_summary(client_id, week_number DESC);
CREATE INDEX IF NOT EXISTS idx_exercise_logs_client_week ON exercise_performance_logs(client_id, week_number, day_number);

-- Add foreign key constraints (assuming clients table exists)
-- ALTER TABLE client_weight_logs ADD CONSTRAINT fk_weight_logs_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;
-- ALTER TABLE weekly_training_volume ADD CONSTRAINT fk_training_volume_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;
-- ALTER TABLE client_personal_records ADD CONSTRAINT fk_prs_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;
-- ALTER TABLE weekly_performance_summary ADD CONSTRAINT fk_performance_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;
-- ALTER TABLE exercise_performance_logs ADD CONSTRAINT fk_exercise_logs_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

-- Insert muscle group mappings for common exercises
CREATE TABLE IF NOT EXISTS exercise_muscle_groups (
  exercise_name text PRIMARY KEY,
  primary_muscle_group text NOT NULL,
  secondary_muscle_groups text[], -- array of secondary muscle groups
  is_compound boolean DEFAULT false
);

-- Insert common exercise mappings
INSERT INTO exercise_muscle_groups (exercise_name, primary_muscle_group, secondary_muscle_groups, is_compound) VALUES
('bench_press', 'chest', ARRAY['shoulders', 'arms'], true),
('incline_bench_press', 'chest', ARRAY['shoulders', 'arms'], true),
('squat', 'legs', ARRAY['core'], true),
('deadlift', 'back', ARRAY['legs', 'core'], true),
('pull_ups', 'back', ARRAY['arms'], true),
('dips', 'chest', ARRAY['arms', 'shoulders'], true),
('bicep_curls', 'arms', ARRAY[], false),
('overhead_press', 'shoulders', ARRAY['arms', 'core'], true),
('rows', 'back', ARRAY['arms'], true),
('leg_press', 'legs', ARRAY[], false),
('lat_pulldown', 'back', ARRAY['arms'], true)
ON CONFLICT (exercise_name) DO NOTHING;
