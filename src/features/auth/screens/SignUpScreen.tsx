import { Ionicons } from '@expo/vector-icons';
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

  const goToTeacherSpace = () => {
    const tabs = navigation.getParent?.();
    if (tabs?.navigate) tabs.navigate('Community');
    else navigation.popToTop();
  };

  const submit = async () => {
    if (password.length < 6) return Alert.alert('كلمة المرور', 'استعمل 6 أحرف على الأقل.');
    const { data, error } = await authRepository.signUp(email.trim(), password, name.trim());
    if (error) return Alert.alert('تعذر إنشاء الحساب', error.message);

    if (data.session) {
      goToTeacherSpace();
      return;
    }

    Alert.alert('تم إنشاء الحساب', 'تحقق من بريدك الإلكتروني لتأكيد الحساب.');
  };

  const continueWithGoogle = async () => {
    if (googleLoading) return;
    setGoogleLoading(true);
    try {
      await authRepository.signInWithGoogle();
      goToTeacherSpace();
    } catch (error: any) {
      Alert.alert('تعذر إنشاء الحساب بحساب Google', error?.message ?? 'حاول مرة أخرى.');
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
        <Text style={[styles.title, { color: colors.text }]}>إنشاء حساب</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>انضم إلى مجتمع المعراج التعليمي.</Text>
      </View>

      <GoogleAuthButton title="المتابعة باستخدام Google" loading={googleLoading} onPress={continueWithGoogle} />

      <View style={styles.dividerRow}>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <Text style={[styles.dividerText, { color: colors.muted }]}>أو</Text>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
      </View>

      <View style={styles.formBlock}>
        <TextField compact label="الاسم الكامل" value={name} onChangeText={setName} />
        <TextField compact label="البريد الإلكتروني" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <TextField compact label="كلمة المرور" value={password} onChangeText={setPassword} secureTextEntry />
      </View>

      <Button title="إنشاء حساب" onPress={submit} />

      <Text style={[styles.terms, { color: colors.muted }]}>بإنشاء حسابك، أنت توافق على شروط الاستخدام وسياسة الخصوصية.</Text>

      <View style={styles.bottomPrompt}>
        <Text style={[styles.promptText, { color: colors.muted }]}>لديك حساب بالفعل؟</Text>
        <Text onPress={() => navigation.navigate('SignIn')} style={styles.promptLink}> تسجيل الدخول</Text>
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
  introBlock: { gap: 4, marginBottom: 3 },
  title: { fontSize: 25, fontWeight: '900', textAlign: 'right' },
  subtitle: { fontSize: 13.5, lineHeight: 21, textAlign: 'right' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 1 },
  divider: { flex: 1, height: StyleSheet.hairlineWidth },
  dividerText: { fontSize: 12, fontWeight: '700' },
  formBlock: { gap: 11 },
  terms: { fontSize: 10.8, lineHeight: 17, textAlign: 'center', paddingHorizontal: 10 },
  bottomPrompt: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  promptText: { fontSize: 12.5 },
  promptLink: { color: '#1F5A96', fontSize: 12.5, fontWeight: '900' }
});
