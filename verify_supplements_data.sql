-- ============================================
-- VERIFY SUPPLEMENTS DATA
-- Run this to check if data really exists
-- ============================================

-- 1. Count supplements
SELECT COUNT(*) as total_supplements FROM supplements;

-- 2. Show first 10 supplements
SELECT 
    id,
    name,
    category,
    recommended_timing
FROM supplements
LIMIT 10;

-- 3. Count by category
SELECT 
    category,
    COUNT(*) as count
FROM supplements
GROUP BY category
ORDER BY count DESC;

-- 4. Check table structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'supplements'
ORDER BY ordinal_position;

