-- Create weekly_volume_tracking table
CREATE TABLE IF NOT EXISTS weekly_volume_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  muscle_group VARCHAR(100) NOT NULL,
  volume DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique combination of client, week, and muscle group
  UNIQUE(client_id, week_number, muscle_group)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_weekly_volume_client_week ON weekly_volume_tracking(client_id, week_number);
CREATE INDEX IF NOT EXISTS idx_weekly_volume_muscle_group ON weekly_volume_tracking(muscle_group);
CREATE INDEX IF NOT EXISTS idx_weekly_volume_created_at ON weekly_volume_tracking(created_at);

-- Add RLS (Row Level Security) policies
ALTER TABLE weekly_volume_tracking ENABLE ROW LEVEL SECURITY;

-- Policy to allow all operations for authenticated users
CREATE POLICY "Allow all operations for authenticated users" ON weekly_volume_tracking
  FOR ALL USING (auth.role() = 'authenticated');

-- Policy to allow public read access (if needed)
CREATE POLICY "Allow public read access" ON weekly_volume_tracking
  FOR SELECT USING (true);

-- Add comments
COMMENT ON TABLE weekly_volume_tracking IS 'Tracks weekly training volume for each muscle group per client';
COMMENT ON COLUMN weekly_volume_tracking.client_id IS 'Reference to the client';
COMMENT ON COLUMN weekly_volume_tracking.week_number IS 'Week number in the training program (1-12)';
COMMENT ON COLUMN weekly_volume_tracking.muscle_group IS 'Muscle group name (e.g., Chest, Back, Shoulders)';
COMMENT ON COLUMN weekly_volume_tracking.volume IS 'Total volume in kg for this muscle group in this week';


