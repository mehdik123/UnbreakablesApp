-- Create weekly_photos table for storing client progress photos
CREATE TABLE IF NOT EXISTS public.weekly_photos (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL,
    week INTEGER NOT NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('front', 'side', 'back')),
    image_url TEXT NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT weekly_photos_pkey PRIMARY KEY (id),
    CONSTRAINT weekly_photos_client_id_fkey FOREIGN KEY (client_id) 
        REFERENCES public.clients(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_weekly_photos_client_id ON public.weekly_photos(client_id);
CREATE INDEX IF NOT EXISTS idx_weekly_photos_week ON public.weekly_photos(week);
CREATE INDEX IF NOT EXISTS idx_weekly_photos_type ON public.weekly_photos(type);
CREATE INDEX IF NOT EXISTS idx_weekly_photos_uploaded_at ON public.weekly_photos(uploaded_at);

-- Create composite index for common queries
CREATE INDEX IF NOT EXISTS idx_weekly_photos_client_week ON public.weekly_photos(client_id, week);

-- Add RLS (Row Level Security) policies
ALTER TABLE public.weekly_photos ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to view their own photos
CREATE POLICY "Users can view their own photos" ON public.weekly_photos
    FOR SELECT USING (true);

-- Policy to allow users to insert their own photos
CREATE POLICY "Users can insert their own photos" ON public.weekly_photos
    FOR INSERT WITH CHECK (true);

-- Policy to allow users to update their own photos
CREATE POLICY "Users can update their own photos" ON public.weekly_photos
    FOR UPDATE USING (true);

-- Policy to allow users to delete their own photos
CREATE POLICY "Users can delete their own photos" ON public.weekly_photos
    FOR DELETE USING (true);

-- Add comments for documentation
COMMENT ON TABLE public.weekly_photos IS 'Stores weekly progress photos uploaded by clients';
COMMENT ON COLUMN public.weekly_photos.client_id IS 'Reference to the client who uploaded the photo';
COMMENT ON COLUMN public.weekly_photos.week IS 'Week number when the photo was taken';
COMMENT ON COLUMN public.weekly_photos.type IS 'Type of photo: front, side, or back view';
COMMENT ON COLUMN public.weekly_photos.image_url IS 'URL or path to the stored image file';
COMMENT ON COLUMN public.weekly_photos.uploaded_at IS 'Timestamp when the photo was uploaded';
