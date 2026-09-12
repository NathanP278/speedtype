import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://your-project-id.supabase.co' &&
  supabaseAnonKey !== 'your-anon-public-api-key-here'
);

// Fallback dummy URL/Key if not configured to prevent client constructor crashes
const fallbackUrl = 'https://placeholder.supabase.co';
const fallbackKey = 'placeholder-key';

const isOAuthPopup =
  typeof window !== 'undefined' &&
  (window.name === 'speedtype_google_oauth' ||
    (Boolean(window.opener) && window.name === 'speedtype_google_oauth'));

export const supabase: SupabaseClient = createClient(
  isSupabaseConfigured ? supabaseUrl! : fallbackUrl,
  isSupabaseConfigured ? supabaseAnonKey! : fallbackKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      // In OAuth popup window, do NOT consume PKCE authorization code;
      // the parent window that generated the code_verifier must exchange it.
      detectSessionInUrl: !isOAuthPopup,
    },
  }
);
