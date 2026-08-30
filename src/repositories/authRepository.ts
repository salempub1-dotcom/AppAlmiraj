import { supabase } from '../services/supabase';

export const authRepository = {
  signUp: (email: string, password: string, fullName: string) =>
    supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } }),
  signIn: (email: string, password: string) =>
    supabase.auth.signInWithPassword({ email, password }),
  signOut: () => supabase.auth.signOut(),
  getSession: () => supabase.auth.getSession(),
  onAuthStateChange: (callback: Parameters<typeof supabase.auth.onAuthStateChange>[0]) =>
    supabase.auth.onAuthStateChange(callback)
};
