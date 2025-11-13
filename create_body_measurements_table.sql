-- ============================================
-- BODY MEASUREMENTS TRACKING TABLE
-- ============================================
-- This table stores weekly body measurements for clients
-- Tracks circumferences, body fat %, and calculates changes

CREATE TABLE IF NOT EXISTS body_measurements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  measurement_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Body Composition
  body_fat_percentage DECIMAL(5,2), -- e.g., 18.50%
  
  -- Upper Body Measurements (in cm)
  neck DECIMAL(5,2),
  chest DECIMAL(5,2),
  shoulders DECIMAL(5,2),
  bicep_left DECIMAL(5,2),
  bicep_right DECIMAL(5,2),
  forearm_left DECIMAL(5,2),
  forearm_right DECIMAL(5,2),
  
  -- Core Measurements (in cm)
  waist DECIMAL(5,2),
  hips DECIMAL(5,2),
  
  -- Lower Body Measurements (in cm)
  thigh_left DECIMAL(5,2),
  thigh_right DECIMAL(5,2),
  calf_left DECIMAL(5,2),
  calf_right DECIMAL(5,2),
  
  -- Notes
  notes TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one measurement per client per week
  UNIQUE(client_id, week_number)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_body_measurements_client ON body_measurements(client_id);
CREATE INDEX IF NOT EXISTS idx_body_measurements_week ON body_measurements(client_id, week_number);
CREATE INDEX IF NOT EXISTS idx_body_measurements_date ON body_measurements(measurement_date);

-- Enable RLS (Row Level Security)
ALTER TABLE body_measurements ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow all operations for authenticated users" 
  ON body_measurements FOR ALL 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow public read access" 
  ON body_measurements FOR SELECT 
  USING (true);

-- Comments
COMMENT ON TABLE body_measurements IS 'Stores weekly body measurements for tracking body composition changes';
COMMENT ON COLUMN body_measurements.client_id IS 'Reference to the client';
COMMENT ON COLUMN body_measurements.week_number IS 'Week number in the training program';
COMMENT ON COLUMN body_measurements.body_fat_percentage IS 'Body fat percentage (from smart scale or caliper)';
COMMENT ON COLUMN body_measurements.neck IS 'Neck circumference in cm';
COMMENT ON COLUMN body_measurements.chest IS 'Chest circumference in cm';
COMMENT ON COLUMN body_measurements.waist IS 'Waist circumference in cm';
COMMENT ON COLUMN body_measurements.hips IS 'Hip circumference in cm';

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_body_measurements_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER body_measurements_updated_at
  BEFORE UPDATE ON body_measurements
  FOR EACH ROW
  EXECUTE FUNCTION update_body_measurements_timestamp();

