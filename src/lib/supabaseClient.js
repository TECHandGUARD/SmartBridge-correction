import { createClient } from '@supabase/supabase-js';

import { appConfig, configurationError } from './config.js';
export { configurationError };
const supabaseUrl = appConfig.supabaseUrl;
const supabaseAnonKey = appConfig.supabaseKey;

// Create Supabase client
export const supabase = configurationError ? null : createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window === 'undefined' ? undefined : window.localStorage,
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
  if (!supabase) return false;
  const { data: { session } } = await supabase.auth.getSession();
  return !!session;
};

// Optional: Helper function to get current user
export const getCurrentUser = async () => {
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};
