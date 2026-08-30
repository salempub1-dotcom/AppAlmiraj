import { I18nManager } from 'react-native';

/**
 * Enable RTL without triggering automatic reloads.
 * Expo Go can enter a reload loop when reloadAsync() is called here.
 */
export async function ensureRTL(): Promise<boolean> {
  if (I18nManager.isRTL) return false;
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
  return false;
}
