-- Cardio plans per client (same pattern as nutrition_plans).
-- Stores CardioPlan JSON: { items: CardioItem[] }.

CREATE TABLE IF NOT EXISTS cardio_plans (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL,
  plan_json jsonb NOT NULL DEFAULT '{"items":[]}'::jsonb,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS cardio_plans_client_id_idx ON cardio_plans(client_id);

COMMENT ON TABLE cardio_plans IS 'Per-client cardio prescription. One row per client; coach edits in Cardio tab.';
