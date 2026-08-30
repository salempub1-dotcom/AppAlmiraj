import { StyleSheet, Text } from 'react-native';
import { Screen } from '../../../components/Screen';
import { useTheme } from '../../../context/ThemeProvider';

export function HomeScreen() {
  const { colors } = useTheme();
  return <Screen><Text style={[styles.title, { color: colors.text }]}>الرئيسية</Text><Text style={{ color: colors.muted, textAlign: 'right' }}>قريبًا: المحتوى المخصص، جديد المعراج، والوصول السريع.</Text></Screen>;
}
const styles = StyleSheet.create({ title: { fontSize: 30, fontWeight: '800', textAlign: 'right', marginBottom: 16 } });
