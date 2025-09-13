import { createClient, SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// Debug environment variables
console.log('Environment check:', {
  url: url ? `${url.substring(0, 20)}...` : 'MISSING',
  anon: anon ? `${anon.substring(0, 20)}...` : 'MISSING',
  ready: Boolean(url && anon)
});

export const isSupabaseReady: boolean = Boolean(url && anon);

export const supabase: SupabaseClient | null = isSupabaseReady
  ? createClient(url as string, anon as string)
  : null;



