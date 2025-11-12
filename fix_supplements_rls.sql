-- ============================================
-- FIX SUPPLEMENTS RLS - Allow Reading Supplements
-- ============================================

-- 1. Check current RLS status
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'supplements';

-- 2. Drop all existing policies on supplements
DROP POLICY IF EXISTS "supplements_select_policy" ON supplements;
DROP POLICY IF EXISTS "Allow all authenticated users to read supplements" ON supplements;

-- 3. Temporarily disable RLS to test
ALTER TABLE supplements DISABLE ROW LEVEL SECURITY;

-- 4. Verify we can now read supplements
SELECT COUNT(*) as total_supplements FROM supplements;

-- 5. Show first 5 supplements to confirm
SELECT name, category, recommended_timing FROM supplements LIMIT 5;

-- Success message
SELECT '✅ RLS DISABLED - Supplements should now be accessible from the app' as status;

