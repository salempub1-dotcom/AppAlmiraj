import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../../components/Button';
import { Screen } from '../../../components/Screen';
import { TextField } from '../../../components/TextField';
import { useTheme } from '../../../context/ThemeProvider';
import { authRepository } from '../../../repositories/authRepository';
import { GoogleAuthButton } from '../GoogleAuthButton';

export function SignUpScreen({ navigation }: any) {
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  const submit = async () => {
    if (password.length < 6) return Alert.alert('كلمة المرور', 'استعمل 6 أحرف على الأقل.');
    const { data, error } = await authRepository.signUp(email.trim(), password, name.trim());
    if (error) return Alert.alert('تعذر إنشاء الحساب', error.message);
    Alert.alert('تم إنشاء الحساب', data.session ? 'تم تسجيل الدخول بنجاح.' : 'تحقق من بريدك الإلكتروني لتأكيد الحساب.');
    navigation.popToTop();
  };

  const continueWithGoogle = async () => {
    if (googleLoading) return;
    setGoogleLoading(true);
    try {
      await authRepository.signInWithGoogle();
    } catch (error: any) {
      Alert.alert('تعذر إنشاء الحساب بحساب Google', error?.message ?? 'حاول مرة أخرى.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <Screen scroll style={styles.page}>
      <Text style={[styles.title, { color: colors.text }]}>إنشاء حساب</Text>
      <Text style={[styles.subtitle, { color: colors.muted }]}>اختر حساب Google وسيتم إنشاء الحساب وتسجيل الدخول مباشرة بدون كلمة مرور جديدة.</Text>

      <GoogleAuthButton title="المتابعة باستخدام Google" loading={googleLoading} onPress={continueWithGoogle} />

      <View style={styles.dividerRow}>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <Text style={[styles.dividerText, { color: colors.muted }]}>أو بالبريد الإلكتروني</Text>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
      </View>

      <TextField label="الاسم الكامل" value={name} onChangeText={setName} />
      <TextField label="البريد الإلكتروني" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      <TextField label="كلمة المرور" value={password} onChangeText={setPassword} secureTextEntry />
      <Button title="إنشاء حساب بالبريد الإلكتروني" onPress={submit} />
      <Button title="لديك حساب بالفعل؟ تسجيل الدخول" secondary onPress={() => navigation.navigate('SignIn')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { gap: 16 },
  title: { fontSize: 30, fontWeight: '800', textAlign: 'right' },
  subtitle: { fontSize: 14, lineHeight: 22, textAlign: 'right', marginBottom: 8 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 2 },
  divider: { flex: 1, height: StyleSheet.hairlineWidth },
  dividerText: { fontSize: 12.5, fontWeight: '700' }
});
