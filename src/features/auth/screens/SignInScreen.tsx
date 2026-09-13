import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../../components/Button';
import { Screen } from '../../../components/Screen';
import { TextField } from '../../../components/TextField';
import { useAuth } from '../../../context/AuthProvider';
import { useTheme } from '../../../context/ThemeProvider';
import { authRepository } from '../../../repositories/authRepository';
import { GoogleAuthButton } from '../GoogleAuthButton';

export function SignInScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { session, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  const goToTeacherSpace = () => {
    const tabs = navigation.getParent?.();
    if (tabs?.navigate) tabs.navigate('Community');
    else navigation.popToTop();
  };

  useEffect(() => {
    if (!loading && session) goToTeacherSpace();
  }, [loading, session]);

  if (loading || session) return null;

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
      <View style={styles.brandBlock}>
        <View style={styles.logoMark}>
          <Ionicons name="school-outline" size={34} color="#C89522" />
        </View>
        <Text style={styles.brandArabic}>المعراج</Text>
        <Text style={styles.brandEnglish}>AL MIRAJ</Text>
        <Text style={styles.brandEducation}>Education</Text>
      </View>

      <View style={styles.introBlock}>
        <Text style={[styles.title, { color: colors.text }]}>مرحبًا بعودتك!</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>سجّل الدخول لمتابعة رحلتك التعليمية.</Text>
      </View>

      <View style={styles.formBlock}>
        <TextField compact label="البريد الإلكتروني" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <TextField compact label="كلمة المرور" value={password} onChangeText={setPassword} secureTextEntry />
      </View>

      <Text style={styles.forgot}>نسيت كلمة المرور؟</Text>
      <Button title="تسجيل الدخول" onPress={submit} />

      <View style={styles.dividerRow}>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <Text style={[styles.dividerText, { color: colors.muted }]}>أو</Text>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
      </View>

      <GoogleAuthButton title="المتابعة باستخدام Google" loading={googleLoading} onPress={signInWithGoogle} />

      <View style={styles.bottomPrompt}>
        <Text style={[styles.promptText, { color: colors.muted }]}>ليس لديك حساب؟</Text>
        <Text onPress={() => navigation.navigate('SignUp')} style={styles.promptLink}> إنشاء حساب</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { gap: 13, paddingTop: 12, paddingBottom: 34, justifyContent: 'center' },
  brandBlock: { alignItems: 'center', marginBottom: 8 },
  logoMark: { width: 62, height: 62, borderRadius: 22, backgroundColor: '#FFF9EA', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E9D7A6' },
  brandArabic: { marginTop: 7, color: '#0B1833', fontSize: 24, fontWeight: '900' },
  brandEnglish: { color: '#0B1833', fontSize: 13, fontWeight: '900', letterSpacing: 2.5 },
  brandEducation: { color: '#C89522', fontSize: 9.5, fontWeight: '700', letterSpacing: 1.2, marginTop: 1 },
  introBlock: { gap: 4, marginBottom: 4 },
  title: { fontSize: 25, fontWeight: '900', textAlign: 'right' },
  subtitle: { fontSize: 13.5, lineHeight: 21, textAlign: 'right' },
  formBlock: { gap: 11 },
  forgot: { color: '#1F5A96', fontSize: 12.5, fontWeight: '800', textAlign: 'right', marginTop: -3 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 1 },
  divider: { flex: 1, height: StyleSheet.hairlineWidth },
  dividerText: { fontSize: 12, fontWeight: '700' },
  bottomPrompt: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', marginTop: 3 },
  promptText: { fontSize: 12.5 },
  promptLink: { color: '#1F5A96', fontSize: 12.5, fontWeight: '900' }
});
