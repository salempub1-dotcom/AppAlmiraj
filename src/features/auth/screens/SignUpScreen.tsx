import { useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import { Button } from '../../../components/Button';
import { Screen } from '../../../components/Screen';
import { TextField } from '../../../components/TextField';
import { useTheme } from '../../../context/ThemeProvider';
import { authRepository } from '../../../repositories/authRepository';

export function SignUpScreen({ navigation }: any) {
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const submit = async () => {
    if (password.length < 6) return Alert.alert('كلمة المرور', 'استعمل 6 أحرف على الأقل.');
    const { data, error } = await authRepository.signUp(email.trim(), password, name.trim());
    if (error) return Alert.alert('تعذر إنشاء الحساب', error.message);
    Alert.alert('تم إنشاء الحساب', data.session ? 'تم تسجيل الدخول بنجاح.' : 'تحقق من بريدك الإلكتروني لتأكيد الحساب.');
    navigation.popToTop();
  };

  return (
    <Screen scroll style={styles.page}>
      <Text style={[styles.title, { color: colors.text }]}>إنشاء حساب</Text>
      <TextField label="الاسم الكامل" value={name} onChangeText={setName} />
      <TextField label="البريد الإلكتروني" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      <TextField label="كلمة المرور" value={password} onChangeText={setPassword} secureTextEntry />
      <Button title="إنشاء حساب" onPress={submit} />
      <Button title="لديك حساب بالفعل؟ تسجيل الدخول" secondary onPress={() => navigation.navigate('SignIn')} />
    </Screen>
  );
}

const styles = StyleSheet.create({ page: { gap: 18 }, title: { fontSize: 30, fontWeight: '800', textAlign: 'right', marginBottom: 12 } });
