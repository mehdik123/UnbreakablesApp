-- ============================================
-- DISABLE RLS FOR BODY MEASUREMENTS (TESTING ONLY)
-- ============================================
-- Run this to temporarily disable RLS for testing

-- Drop existing policies
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON body_measurements;
DROP POLICY IF EXISTS "Allow public read access" ON body_measurements;

-- Disable RLS
ALTER TABLE body_measurements DISABLE ROW LEVEL SECURITY;

-- Verify
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'body_measurements';

