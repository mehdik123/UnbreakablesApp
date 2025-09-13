-- Add missing columns to nutrition_plans table
ALTER TABLE nutrition_plans 
ADD COLUMN IF NOT EXISTS plan_json jsonb,
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Create unique constraint on client_id (only if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'nutrition_plans_client_id_unique'
    ) THEN
        ALTER TABLE nutrition_plans 
        ADD CONSTRAINT nutrition_plans_client_id_unique UNIQUE (client_id);
    END IF;
END $$;

-- Update the existing records to have a default plan_json if they don't have one
UPDATE nutrition_plans 
SET plan_json = '{}' 
WHERE plan_json IS NULL;
