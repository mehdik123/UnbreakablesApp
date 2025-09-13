-- Create nutrition_plans table for client-specific meal plans
CREATE TABLE IF NOT EXISTS nutrition_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id TEXT NOT NULL,
  plan_json JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create unique index on client_id for upsert operations
CREATE UNIQUE INDEX IF NOT EXISTS idx_nutrition_plans_client_id ON nutrition_plans(client_id);

-- Enable RLS (optional - disable if you want open access)
ALTER TABLE nutrition_plans ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (you can restrict this later)
CREATE POLICY IF NOT EXISTS "Allow all operations on nutrition_plans" ON nutrition_plans
FOR ALL USING (true) WITH CHECK (true);

-- Add nutrition_plans to realtime publication for real-time updates
ALTER PUBLICATION supabase_realtime ADD TABLE nutrition_plans;

