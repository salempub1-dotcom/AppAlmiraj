import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLanguage } from '../context/LanguageProvider';
import { useTheme } from '../context/ThemeProvider';
import { signInWithGoogle } from '../services/googleSignIn';

export function GoogleSignInButton({ onSuccess }: { onSuccess: () => void }) {
  const { language } = useLanguage();
  const { colors } = useTheme();
  const [busy, setBusy] = useState(false);
  const locked = useRef(false);
  const ar = language === 'ar';

  if (Platform.OS !== 'android') return null;

  const submit = async () => {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    try {
      if (await signInWithGoogle() === 'success') onSuccess();
    } catch (error) {
      const code = error instanceof Error ? error.message : '';
      const message = code === 'GOOGLE_NOT_CONFIGURED'
        ? (ar ? 'تسجيل Google غير متاح حاليًا. يمكنك استخدام البريد وكلمة المرور.' : 'Google sign-in is unavailable. Please use email and password.')
        : code === 'GOOGLE_PLAY_SERVICES'
          ? (ar ? 'يرجى تحديث خدمات Google Play ثم المحاولة مجددًا.' : 'Please update Google Play services and try again.')
          : (ar ? 'تعذر إكمال تسجيل Google. حاول مجددًا أو استخدم البريد وكلمة المرور.' : 'Could not complete Google sign-in. Try again or use email and password.');
      Alert.alert(ar ? 'تسجيل الدخول' : 'Sign in', message);
    } finally {
      locked.current = false;
      setBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.divider}>
        <View style={[styles.line, { backgroundColor: colors.border }]} />
        <Text style={{ color: colors.muted }}>{ar ? 'أو' : 'or'}</Text>
        <View style={[styles.line, { backgroundColor: colors.border }]} />
      </View>
      <Pressable accessibilityRole="button" accessibilityState={{ disabled: busy, busy }} disabled={busy} onPress={submit}
        style={({ pressed }) => [styles.button, { opacity: pressed || busy ? 0.7 : 1 }]}>
        {busy ? <ActivityIndicator color="#1F1F1F" /> : <Ionicons name="logo-google" color="#1F1F1F" size={22} />}
        <Text style={styles.label}>{ar ? 'المتابعة باستخدام Google' : 'Continue with Google'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 16 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  line: { flex: 1, height: StyleSheet.hairlineWidth },
  button: { minHeight: 54, padding: 12, backgroundColor: '#FFFFFF', borderColor: '#747775', borderWidth: 1, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  label: { color: '#1F1F1F', fontSize: 15, fontWeight: '600', flexShrink: 1, textAlign: 'center' }
});
