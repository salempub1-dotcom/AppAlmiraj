import { Linking } from 'react-native';
import { supabase } from '../services/supabase';

export const GOOGLE_REDIRECT_URL = 'almiraj://google-auth';

function extractOAuthParams(url: string) {
  const parsed = new URL(url);
  const hashParams = new URLSearchParams(parsed.hash.startsWith('#') ? parsed.hash.slice(1) : parsed.hash);
  const queryParams = parsed.searchParams;
  const get = (key: string) => hashParams.get(key) ?? queryParams.get(key);

  return {
    accessToken: get('access_token'),
    refreshToken: get('refresh_token'),
    code: get('code'),
    error: get('error_description') ?? get('error')
  };
}

async function finishOAuthFromUrl(url: string) {
  if (!url.startsWith(GOOGLE_REDIRECT_URL)) return null;

  const params = extractOAuthParams(url);
  if (params.error) throw new Error(params.error);

  if (params.accessToken && params.refreshToken) {
    const { data, error } = await supabase.auth.setSession({
      access_token: params.accessToken,
      refresh_token: params.refreshToken
    });
    if (error) throw error;
    return data;
  }

  if (params.code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(params.code);
    if (error) throw error;
    return data;
  }

  throw new Error('لم يتم استلام بيانات تسجيل الدخول من Google.');
}

async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: GOOGLE_REDIRECT_URL,
      skipBrowserRedirect: true,
      queryParams: {
        prompt: 'select_account',
        access_type: 'offline'
      }
    }
  });

  if (error) throw error;
  if (!data.url) throw new Error('تعذر فتح صفحة تسجيل الدخول بحساب Google.');

  const canOpen = await Linking.canOpenURL(data.url);
  if (!canOpen) throw new Error('تعذر فتح صفحة Google على هذا الجهاز.');

  await Linking.openURL(data.url);
  return { opened: true };
}

export const authRepository = {
  signUp: (email: string, password: string, fullName: string) =>
    supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } }),
  signIn: (email: string, password: string) =>
    supabase.auth.signInWithPassword({ email, password }),
  signInWithGoogle,
  finishOAuthFromUrl,
  signOut: () => supabase.auth.signOut(),
  getSession: () => supabase.auth.getSession(),
  onAuthStateChange: (callback: Parameters<typeof supabase.auth.onAuthStateChange>[0]) =>
    supabase.auth.onAuthStateChange(callback)
};
