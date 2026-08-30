import { useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import { Button } from '../../../components/Button';
import { Screen } from '../../../components/Screen';
import { TextField } from '../../../components/TextField';
import { useTheme } from '../../../context/ThemeProvider';
import { authRepository } from '../../../repositories/authRepository';

export function SignInScreen({ navigation }: any) {
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const submit = async () => {
    const { error } = await authRepository.signIn(email.trim(), password);
    if (error) Alert.alert('تعذر تسجيل الدخول', error.message);
    else navigation.popToTop();
  };

  return (
    <Screen scroll style={styles.page}>
      <Text style={[styles.title, { color: colors.text }]}>تسجيل الدخول</Text>
      <TextField label="البريد الإلكتروني" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      <TextField label="كلمة المرور" value={password} onChangeText={setPassword} secureTextEntry />
      <Button title="تسجيل الدخول" onPress={submit} />
      <Button title="إنشاء حساب جديد" secondary onPress={() => navigation.navigate('SignUp')} />
    </Screen>
  );
}

const styles = StyleSheet.create({ page: { gap: 18 }, title: { fontSize: 30, fontWeight: '800', textAlign: 'right', marginBottom: 12 } });
