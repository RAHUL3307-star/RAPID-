import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[RAPID] Supabase credentials not found in environment variables.\n' +
    'Running in DEMO MODE with simulated data.\n' +
    'Create a .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to connect to real Supabase.'
  );
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        params: { eventsPerSecond: 10 },
      },
    })
  : null;

export const isDemoMode = !supabaseUrl || !supabaseAnonKey;
