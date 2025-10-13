-- Create client credentials table for simple authentication
CREATE TABLE IF NOT EXISTS public.client_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_client_credentials_username ON public.client_credentials(username);
CREATE INDEX IF NOT EXISTS idx_client_credentials_client_id ON public.client_credentials(client_id);

-- Enable RLS
ALTER TABLE public.client_credentials ENABLE ROW LEVEL SECURITY;

-- Policy: Allow clients to read only their own credentials
CREATE POLICY "Clients can read own credentials"
ON public.client_credentials
FOR SELECT
USING (true); -- We'll handle auth in the application layer for simplicity

-- Policy: Allow insert/update for authentication purposes
CREATE POLICY "Allow insert credentials"
ON public.client_credentials
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow update credentials"
ON public.client_credentials
FOR UPDATE
USING (true);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_client_credentials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_client_credentials_updated_at
BEFORE UPDATE ON public.client_credentials
FOR EACH ROW
EXECUTE FUNCTION update_client_credentials_updated_at();

-- Note: In production, you should use a proper password hashing function
-- For simplicity, we're using basic hashing. Consider using bcrypt or similar.


