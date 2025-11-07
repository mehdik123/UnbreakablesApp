-- ==========================================
-- DELETE ALL USERS EXCEPT "h"
-- ==========================================

-- Step 1: First, let's see all current users
SELECT 
    id,
    email,
    full_name,
    role
FROM clients
ORDER BY full_name;

-- Step 2: See which users will be KEPT (the one called "h")
-- Uncomment the query below to check:
/*
SELECT 
    id,
    email,
    full_name,
    role
FROM clients
WHERE LOWER(full_name) = 'h' 
   OR LOWER(email) LIKE '%h%'
ORDER BY full_name;
*/

-- Step 3: See which users will be DELETED (everyone except "h")
-- Uncomment the query below to check:
/*
SELECT 
    id,
    email,
    full_name,
    role
FROM clients
WHERE LOWER(full_name) != 'h' 
  AND NOT (LOWER(email) LIKE '%h%' AND LOWER(full_name) = 'h')
ORDER BY full_name;
*/

-- Step 4: DELETE all users except "h"
-- ⚠️ WARNING: This will permanently delete users!
-- Only run this after you've verified the above queries!
-- Uncomment the lines below to execute the deletion:
/*
DELETE FROM clients
WHERE LOWER(full_name) != 'h' 
  AND id NOT IN (
    SELECT id FROM clients WHERE LOWER(full_name) = 'h' LIMIT 1
  );

-- Show remaining users after deletion
SELECT 
    id,
    email,
    full_name,
    role
FROM clients
ORDER BY full_name;
*/

-- ==========================================
-- SAFER ALTERNATIVE: Delete by specific IDs
-- ==========================================
-- If you want more control, first get all user IDs from Step 1,
-- then delete specific IDs like this:
/*
DELETE FROM clients
WHERE id IN (
    'uuid-of-user-1',
    'uuid-of-user-2',
    'uuid-of-user-3'
    -- Add more IDs as needed
);
*/

