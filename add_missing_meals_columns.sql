-- Add missing columns to meals table
ALTER TABLE meals 
ADD COLUMN IF NOT EXISTS image TEXT,
ADD COLUMN IF NOT EXISTS cooking_instructions TEXT;
