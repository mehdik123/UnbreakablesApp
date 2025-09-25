-- Create weekly_volume_history table for storing historical volume data
CREATE TABLE IF NOT EXISTS weekly_volume_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  muscle_group VARCHAR(50) NOT NULL,
  volume DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique combination of client, week, and muscle group
  UNIQUE(client_id, week_number, muscle_group)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_weekly_volume_history_client_week 
ON weekly_volume_history(client_id, week_number);

CREATE INDEX IF NOT EXISTS idx_weekly_volume_history_muscle_group 
ON weekly_volume_history(muscle_group);

-- Add RLS (Row Level Security) if needed
-- ALTER TABLE weekly_volume_history ENABLE ROW LEVEL SECURITY;

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_weekly_volume_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_weekly_volume_history_updated_at
  BEFORE UPDATE ON weekly_volume_history
  FOR EACH ROW
  EXECUTE FUNCTION update_weekly_volume_history_updated_at();

-- Insert some sample data for testing (optional)
-- INSERT INTO weekly_volume_history (client_id, week_number, muscle_group, volume) VALUES
-- ('your-client-id-here', 1, 'Back', 1500.00),
-- ('your-client-id-here', 1, 'Chest', 1200.00),
-- ('your-client-id-here', 2, 'Back', 1650.00),
-- ('your-client-id-here', 2, 'Chest', 1350.00);
