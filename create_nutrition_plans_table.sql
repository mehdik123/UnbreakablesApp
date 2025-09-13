-- Create nutrition_plans table if it doesn't exist
CREATE TABLE IF NOT EXISTS nutrition_plans (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL,
  plan_json jsonb NOT NULL,
  updated_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- Create unique index on client_id for upsert functionality
CREATE UNIQUE INDEX IF NOT EXISTS nutrition_plans_client_id_idx ON nutrition_plans(client_id);

-- Enable Row Level Security (optional)
-- ALTER TABLE nutrition_plans ENABLE ROW LEVEL SECURITY;
