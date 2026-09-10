import { Platform } from 'react-native';
import { supabase } from './supabase';

let running = false;
let configured = false;

// Android integration. A new native build and Google/Supabase configuration
// are required; never publish this module to the earlier APK via OTA.
export async function signInWithGoogle(): Promise<'success' | 'cancelled'> {
  if (running) return 'cancelled';
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  if (Platform.OS !== 'android' || !webClientId?.endsWith('.apps.googleusercontent.com')) {
    throw new Error('GOOGLE_NOT_CONFIGURED');
  }

  running = true;
  try {
    // Loaded only after a user requests Google sign-in.
    const { GoogleSignin, isSuccessResponse, isErrorWithCode, statusCodes } =
      await import('@react-native-google-signin/google-signin');
    if (!configured) {
      GoogleSignin.configure({ webClientId, offlineAccess: false });
      configured = true;
    }
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const response = await GoogleSignin.signIn();
      if (!isSuccessResponse(response)) return 'cancelled';
      if (!response.data.idToken) throw new Error('GOOGLE_MISSING_TOKEN');

      // The server verifies Google's token. Never create app sessions from
      // the profile/email reported by the native client itself.
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: response.data.idToken
      });
      if (error || !data.session) throw new Error('GOOGLE_SESSION_FAILED');
      return 'success';
    } catch (error) {
      if (isErrorWithCode(error)) {
        if (error.code === statusCodes.SIGN_IN_CANCELLED || error.code === statusCodes.IN_PROGRESS) {
          return 'cancelled';
        }
        if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
          throw new Error('GOOGLE_PLAY_SERVICES');
        }
      }
      throw error;
    }
  } finally {
    running = false;
  }
}
