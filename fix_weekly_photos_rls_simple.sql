-- Simple fix for weekly_photos RLS policies
-- This removes conflicting policies and keeps only public access

-- Drop all existing policies to avoid conflicts
DROP POLICY IF EXISTS "Clients can view and upload their own photos" ON public.weekly_photos;
DROP POLICY IF EXISTS "Coaches can view all client photos" ON public.weekly_photos;
DROP POLICY IF EXISTS "Allow public read access to weekly_photos" ON public.weekly_photos;
DROP POLICY IF EXISTS "Allow public insert access to weekly_photos" ON public.weekly_photos;
DROP POLICY IF EXISTS "Allow public update access to weekly_photos" ON public.weekly_photos;
DROP POLICY IF EXISTS "Allow public delete access to weekly_photos" ON public.weekly_photos;

-- Create clean, simple public access policies
CREATE POLICY "public_read_weekly_photos" ON public.weekly_photos
    FOR SELECT USING (true);

CREATE POLICY "public_insert_weekly_photos" ON public.weekly_photos
    FOR INSERT WITH CHECK (true);

CREATE POLICY "public_update_weekly_photos" ON public.weekly_photos
    FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "public_delete_weekly_photos" ON public.weekly_photos
    FOR DELETE USING (true);

-- Verify the policies were created correctly
SELECT 
    policyname,
    cmd,
    permissive,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'weekly_photos'
ORDER BY policyname;
