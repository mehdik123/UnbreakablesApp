-- Run once in Supabase SQL editor to enable client archiving.
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS clients_is_archived_idx ON clients (is_archived);

COMMENT ON COLUMN clients.is_archived IS 'When true, client is hidden from the main coach list but data is retained.';
