-- ============================================
-- DIAGNOSTIC SCRIPT - Check Supplements Tables
-- Run this to see what's in your database
-- ============================================

-- 1. Check if tables exist
SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public' 
AND table_name IN ('supplements', 'client_supplements', 'client_hydration')
ORDER BY table_name;

-- 2. Count supplements
SELECT 
    'supplements' as table_name,
    COUNT(*) as row_count
FROM supplements;

-- 3. List all supplement categories
SELECT 
    category,
    COUNT(*) as count
FROM supplements
GROUP BY category
ORDER BY count DESC;

-- 4. Check if client exists
SELECT 
    id,
    full_name,
    email
FROM clients
WHERE id = 'aa355375-4b38-486a-bce6-33d4c13c2ab1';

-- 5. Check RLS policies on supplements
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename IN ('supplements', 'client_supplements', 'client_hydration')
ORDER BY tablename, policyname;

-- 6. Sample 5 supplements
SELECT 
    name,
    category,
    recommended_timing
FROM supplements
LIMIT 5;

