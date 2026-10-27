import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = Boolean(url && publishableKey);

// The browser client only uses the publishable key. All user data is protected
// by the database policies in supabase/migrations; never put a service key here.
export const supabase =
  typeof window !== "undefined" && isSupabaseConfigured
    ? createClient(url, publishableKey, {
        auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true },
      })
    : null;
