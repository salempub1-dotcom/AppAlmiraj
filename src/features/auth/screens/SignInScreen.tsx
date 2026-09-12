import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../../components/Button';
import { Screen } from '../../../components/Screen';
import { TextField } from '../../../components/TextField';
import { useTheme } from '../../../context/ThemeProvider';
import { authRepository } from '../../../repositories/authRepository';
import { GoogleAuthButton } from '../GoogleAuthButton';

export function SignInScreen({ navigation }: any) {
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  const goToTeacherSpace = () => {
    const tabs = navigation.getParent?.();
    if (tabs?.navigate) tabs.navigate('Community');
    else navigation.popToTop();
  };

  const submit = async () => {
    const { error } = await authRepository.signIn(email.trim(), password);
    if (error) Alert.alert('تعذر تسجيل الدخول', error.message);
    else goToTeacherSpace();
  };

  const signInWithGoogle = async () => {
    if (googleLoading) return;
    setGoogleLoading(true);
    try {
      await authRepository.signInWithGoogle();
      goToTeacherSpace();
    } catch (error: any) {
      Alert.alert('تعذر تسجيل الدخول بحساب Google', error?.message ?? 'حاول مرة أخرى.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <Screen scroll style={styles.page}>
      <View style={styles.brandRow}>
        <View style={styles.brandDot} />
        <Text style={styles.brandText}>Al Miraj Education</Text>
      </View>

      <View style={styles.introBlock}>
        <Text style={[styles.title, { color: colors.text }]}>مرحبًا بعودتك</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>سجّل الدخول للعودة مباشرة إلى فضاء الأستاذ.</Text>
      </View>

      <GoogleAuthButton title="المتابعة باستخدام Google" loading={googleLoading} onPress={signInWithGoogle} />

      <View style={styles.dividerRow}>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <Text style={[styles.dividerText, { color: colors.muted }]}>أو بالبريد الإلكتروني</Text>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
      </View>

      <View style={styles.formBlock}>
        <TextField compact label="البريد الإلكتروني" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <TextField compact label="كلمة المرور" value={password} onChangeText={setPassword} secureTextEntry />
      </View>

      <View style={styles.actionsBlock}>
        <Button title="تسجيل الدخول بالبريد الإلكتروني" onPress={submit} />
        <Button title="إنشاء حساب جديد" secondary onPress={() => navigation.navigate('SignUp')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { gap: 14, paddingTop: 18, paddingBottom: 34 },
  brandRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, alignSelf: 'flex-end', marginBottom: 2 },
  brandDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#D4AF37' },
  brandText: { color: '#0B1833', fontSize: 12.5, fontWeight: '800', letterSpacing: 0.2 },
  introBlock: { gap: 5, marginBottom: 2 },
  title: { fontSize: 26, fontWeight: '900', textAlign: 'right' },
  subtitle: { fontSize: 13.5, lineHeight: 21, textAlign: 'right' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 2 },
  divider: { flex: 1, height: StyleSheet.hairlineWidth },
  dividerText: { fontSize: 12, fontWeight: '700' },
  formBlock: { gap: 12 },
  actionsBlock: { gap: 10, marginTop: 2 }
});
