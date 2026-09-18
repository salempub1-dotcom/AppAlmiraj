const EXPECTED_SUPABASE_URL = 'https://szgvpajhmqvxugoeoidc.supabase.co';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim().replace(/\/$/, '');
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase environment variables are missing.');
}

if (supabaseUrl !== EXPECTED_SUPABASE_URL) {
  throw new Error(`Unexpected Supabase project: ${supabaseUrl}`);
}

export const env = { supabaseUrl, supabaseAnonKey } as const;
