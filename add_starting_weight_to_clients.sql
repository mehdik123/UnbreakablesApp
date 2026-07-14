-- Starting body weight set by the coach when creating a client.
-- Used on the client home screen to compare the latest logged weight vs this baseline.
-- Run once in the Supabase SQL Editor.

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS starting_weight numeric(5,2);

COMMENT ON COLUMN clients.starting_weight IS
  'Coach-set baseline body weight (kg) at client creation. Home compares latest client_weight_logs.weight against this.';
