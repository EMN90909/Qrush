import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL or Anon Key is not defined in environment variables.");
  // Fallback or error handling if environment variables are missing
  // For development, you might want to throw an error or use dummy values.
  // For production, ensure these are correctly configured.
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);