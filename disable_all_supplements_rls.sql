-- ============================================
-- DISABLE RLS ON ALL SUPPLEMENTS TABLES
-- This will allow full access for testing
-- ============================================

-- 1. Disable RLS on all 3 tables
ALTER TABLE supplements DISABLE ROW LEVEL SECURITY;
ALTER TABLE client_supplements DISABLE ROW LEVEL SECURITY;
ALTER TABLE client_hydration DISABLE ROW LEVEL SECURITY;

-- 2. Drop all existing policies (they're blocking access)
DROP POLICY IF EXISTS "supplements_select_policy" ON supplements;
DROP POLICY IF EXISTS "client_supplements_all_policy" ON client_supplements;
DROP POLICY IF EXISTS "client_hydration_all_policy" ON client_hydration;
DROP POLICY IF EXISTS "Allow all authenticated users to read supplements" ON supplements;
DROP POLICY IF EXISTS "Allow authenticated users to read client supplements" ON client_supplements;
DROP POLICY IF EXISTS "Allow authenticated users to insert client supplements" ON client_supplements;
DROP POLICY IF EXISTS "Allow authenticated users to update client supplements" ON client_supplements;
DROP POLICY IF EXISTS "Allow authenticated users to delete client supplements" ON client_supplements;
DROP POLICY IF EXISTS "Allow authenticated users to read hydration" ON client_hydration;
DROP POLICY IF EXISTS "Allow authenticated users to insert hydration" ON client_hydration;
DROP POLICY IF EXISTS "Allow authenticated users to update hydration" ON client_hydration;

-- 3. Verify RLS is disabled
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('supplements', 'client_supplements', 'client_hydration')
ORDER BY tablename;

-- Success message
SELECT '✅ RLS DISABLED ON ALL SUPPLEMENTS TABLES - Full access now available' as status;

