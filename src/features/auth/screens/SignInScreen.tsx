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

  const submit = async () => {
    const { error } = await authRepository.signIn(email.trim(), password);
    if (error) Alert.alert('تعذر تسجيل الدخول', error.message);
    else navigation.popToTop();
  };

  const signInWithGoogle = async () => {
    if (googleLoading) return;
    setGoogleLoading(true);
    try {
      await authRepository.signInWithGoogle();
    } catch (error: any) {
      Alert.alert('تعذر تسجيل الدخول بحساب Google', error?.message ?? 'حاول مرة أخرى.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <Screen scroll style={styles.page}>
      <Text style={[styles.title, { color: colors.text }]}>تسجيل الدخول</Text>
      <Text style={[styles.subtitle, { color: colors.muted }]}>اختر حساب Google للدخول مباشرة، أو استعمل بريدك الإلكتروني.</Text>

      <GoogleAuthButton title="المتابعة باستخدام Google" loading={googleLoading} onPress={signInWithGoogle} />

      <View style={styles.dividerRow}>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <Text style={[styles.dividerText, { color: colors.muted }]}>أو</Text>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
      </View>

      <TextField label="البريد الإلكتروني" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      <TextField label="كلمة المرور" value={password} onChangeText={setPassword} secureTextEntry />
      <Button title="تسجيل الدخول بالبريد الإلكتروني" onPress={submit} />
      <Button title="إنشاء حساب جديد" secondary onPress={() => navigation.navigate('SignUp')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { gap: 16 },
  title: { fontSize: 30, fontWeight: '800', textAlign: 'right' },
  subtitle: { fontSize: 14, lineHeight: 22, textAlign: 'right', marginBottom: 8 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 2 },
  divider: { flex: 1, height: StyleSheet.hairlineWidth },
  dividerText: { fontSize: 13, fontWeight: '700' }
});
