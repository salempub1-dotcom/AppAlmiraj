const supabaseUrl = 'https://szgvpajhmqvxugoeoidc.supabase.co';
const supabaseAnonKey = 'sb_publishable_KHZ4BVg-R-mT9Lu_2xexrA_rtlMlfb1';

// Keep the teacher-space app pinned to its own Supabase project so EAS
// preview/production environment variables cannot accidentally point auth
// at the separate store project.
export const env = { supabaseUrl, supabaseAnonKey } as const;
