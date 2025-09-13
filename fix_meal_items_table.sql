-- Add missing quantity column to meal_items table
ALTER TABLE meal_items 
ADD COLUMN IF NOT EXISTS quantity NUMERIC DEFAULT 100;
