-- Custom cardio templates (coach-saved presets for reuse across clients).
-- Built-in templates live in code; only custom templates are stored here.

CREATE TABLE IF NOT EXISTS cardio_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  template_json jsonb NOT NULL,
  is_custom boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE cardio_templates IS 'Coach-saved cardio presets. template_json matches CardioTemplateData shape.';
