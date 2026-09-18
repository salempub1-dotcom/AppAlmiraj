import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes
} from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';
import { supabase } from './supabase';

let requestInFlight = false;

function getWebClientId() {
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim();
  if (!webClientId) {
    throw new Error('Google Sign-In غير مهيأ بعد لهذا الإصدار.');
  }
  return webClientId;
}

export async function signInWithGoogleNative(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    throw new Error('تسجيل Google الأصلي مفعّل حاليًا على Android فقط.');
  }

  if (requestInFlight) return false;
  requestInFlight = true;

  try {
    GoogleSignin.configure({
      webClientId: getWebClientId(),
      offlineAccess: false
    });

    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();

    if (!isSuccessResponse(response)) return false;

    const idToken = response.data.idToken;
    if (!idToken) {
      throw new Error('لم يتم استلام رمز هوية Google.');
    }

    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken
    });

    if (error) throw error;
    return true;
  } catch (error) {
    if (isErrorWithCode(error)) {
      if (error.code === statusCodes.IN_PROGRESS) return false;
      if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new Error('خدمات Google Play غير متاحة أو تحتاج إلى تحديث.');
      }
    }
    throw error;
  } finally {
    requestInFlight = false;
  }
}
