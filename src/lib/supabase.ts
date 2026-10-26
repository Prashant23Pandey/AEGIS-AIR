import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  console.warn(
    '[AEGIS AIR] Supabase URL or publishable key missing. Check your .env file:\n' +
    'VITE_SUPABASE_URL=' + (supabaseUrl ? 'CONFIGURED' : 'MISSING') + '\n' +
    'VITE_SUPABASE_PUBLISHABLE_KEY=' + (supabasePublishableKey ? 'CONFIGURED' : 'MISSING')
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabasePublishableKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
  }
);
