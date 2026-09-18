const EXPECTED_SUPABASE_HOST = 'kgtgfxjpwfbtlegrquiy.supabase.co';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase environment variables are missing.');
}

let supabaseHost = '';
try {
  supabaseHost = new URL(supabaseUrl).host;
} catch {
  throw new Error('EXPO_PUBLIC_SUPABASE_URL is invalid.');
}

if (supabaseHost !== EXPECTED_SUPABASE_HOST) {
  throw new Error(`Unexpected Supabase project: ${supabaseHost}`);
}

export const env = { supabaseUrl, supabaseAnonKey } as const;
