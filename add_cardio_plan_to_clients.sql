-- Cardio plans per client (same pattern as nutrition_plans).
-- Run this in Supabase SQL Editor if cardio save fails.

CREATE TABLE IF NOT EXISTS cardio_plans (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL,
  plan_json jsonb NOT NULL DEFAULT '{"items":[]}'::jsonb,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS cardio_plans_client_id_idx ON cardio_plans(client_id);

-- Optional: saved coach templates (for "Save as template")
CREATE TABLE IF NOT EXISTS cardio_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  template_json jsonb NOT NULL,
  is_custom boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
