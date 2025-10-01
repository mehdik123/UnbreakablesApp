-- Temporarily disable RLS for weekly_photos table to test uploads
-- This will allow uploads to work immediately

-- Disable RLS on weekly_photos table
ALTER TABLE public.weekly_photos DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'weekly_photos';

-- Note: This makes the table publicly accessible
-- Re-enable RLS later with: ALTER TABLE public.weekly_photos ENABLE ROW LEVEL SECURITY;
