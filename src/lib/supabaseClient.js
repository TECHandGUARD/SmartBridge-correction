import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const validConnectionUrl = (() => {
  try { const url = new URL(supabaseUrl); return url.protocol === 'https:' && !!url.hostname; }
  catch { return false; }
})();
export const configurationError = !supabaseUrl || !supabaseAnonKey
  ? 'The app is missing its connection settings. Please contact support.'
  : !validConnectionUrl ? 'The app connection address is invalid. Please contact support.' : null;

// Create Supabase client
export const supabase = configurationError ? null : createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: localStorage,
  },
  db: {
    schema: 'public',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Optional: Helper function to check if user is authenticated
export const isAuthenticated = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return !!session;
};

// Optional: Helper function to get current user
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};
