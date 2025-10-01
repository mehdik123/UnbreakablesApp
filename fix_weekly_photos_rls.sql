-- Fix RLS policies for weekly_photos table
-- This script addresses the 401 Unauthorized error when uploading photos

-- First, drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own photos" ON public.weekly_photos;
DROP POLICY IF EXISTS "Users can insert their own photos" ON public.weekly_photos;
DROP POLICY IF EXISTS "Users can update their own photos" ON public.weekly_photos;
DROP POLICY IF EXISTS "Users can delete their own photos" ON public.weekly_photos;

-- Create new policies that allow public access (since this is a demo app)
-- In production, you would want to restrict access based on user authentication

-- Policy to allow public read access
CREATE POLICY "Allow public read access to weekly_photos" ON public.weekly_photos
    FOR SELECT USING (true);

-- Policy to allow public insert access
CREATE POLICY "Allow public insert access to weekly_photos" ON public.weekly_photos
    FOR INSERT WITH CHECK (true);

-- Policy to allow public update access
CREATE POLICY "Allow public update access to weekly_photos" ON public.weekly_photos
    FOR UPDATE USING (true) WITH CHECK (true);

-- Policy to allow public delete access
CREATE POLICY "Allow public delete access to weekly_photos" ON public.weekly_photos
    FOR DELETE USING (true);

-- Verify the table structure and RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'weekly_photos';

-- Check if RLS is enabled on the table
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'weekly_photos';

-- Check existing policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'weekly_photos';
