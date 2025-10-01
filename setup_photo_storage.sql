-- Setup Supabase Storage for weekly photos
-- This creates a storage bucket and sets up proper policies

-- Create storage bucket for weekly photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('weekly-photos', 'weekly-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy to allow public access to view photos
CREATE POLICY "Public can view weekly photos" ON storage.objects
FOR SELECT USING (bucket_id = 'weekly-photos');

-- Create policy to allow public access to upload photos
CREATE POLICY "Public can upload weekly photos" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'weekly-photos');

-- Create policy to allow public access to update photos
CREATE POLICY "Public can update weekly photos" ON storage.objects
FOR UPDATE USING (bucket_id = 'weekly-photos');

-- Create policy to allow public access to delete photos
CREATE POLICY "Public can delete weekly photos" ON storage.objects
FOR DELETE USING (bucket_id = 'weekly-photos');

-- Verify bucket was created
SELECT * FROM storage.buckets WHERE id = 'weekly-photos';
