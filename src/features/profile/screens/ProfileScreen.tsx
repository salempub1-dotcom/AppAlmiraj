import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../../../components/Button';
import { Screen } from '../../../components/Screen';
import { useAuth } from '../../../context/AuthProvider';
import { useTheme } from '../../../context/ThemeProvider';

export function ProfileScreen({ navigation }: any) {
  const { session, isGuest, signOut } = useAuth();
  const { colors, preference, setPreference } = useTheme();

  return (
    <Screen scroll style={styles.page}>
      <Text style={[styles.title, { color: colors.text }]}>حسابي</Text>
      {isGuest ? (
        <>
          <Text style={[styles.hero, { color: colors.text }]}>سجّل الدخول للوصول إلى حسابك</Text>
          <Text style={{ color: colors.muted, textAlign: 'right' }}>يمكنك تصفح التطبيق كزائر، لكن الحفظ والطلبات والتفضيلات تحتاج حسابًا.</Text>
          <Button title="تسجيل الدخول" onPress={() => navigation.navigate('SignIn')} />
          <Button title="إنشاء حساب" secondary onPress={() => navigation.navigate('SignUp')} />
        </>
      ) : (
        <>
          <Text style={{ color: colors.text, textAlign: 'right' }}>{session?.user.email}</Text>
          <Button title="تعديل الملف الشخصي" secondary onPress={() => navigation.navigate('EditProfile')} />
          <Button title="تسجيل الخروج" onPress={() => signOut()} />
        </>
      )}
      <Text style={[styles.section, { color: colors.muted }]}>المظهر</Text>
      <View style={styles.row}>
        <Button title={preference === 'light' ? 'فاتح ✓' : 'فاتح'} secondary onPress={() => setPreference('light')} />
        <Button title={preference === 'dark' ? 'داكن ✓' : 'داكن'} secondary onPress={() => setPreference('dark')} />
        <Button title={preference === 'system' ? 'النظام ✓' : 'النظام'} secondary onPress={() => setPreference('system')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({ page: { gap: 18 }, title: { fontSize: 30, fontWeight: '800', textAlign: 'right' }, hero: { fontSize: 24, fontWeight: '700', textAlign: 'right', marginTop: 20 }, section: { textAlign: 'right', marginTop: 28 }, row: { gap: 10 } });
