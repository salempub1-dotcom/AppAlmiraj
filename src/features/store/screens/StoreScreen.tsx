import { Text } from 'react-native';
import { Screen } from '../../../components/Screen';
import { useTheme } from '../../../context/ThemeProvider';
export function StoreScreen() { const { colors } = useTheme(); return <Screen><Text style={{ color: colors.text, fontSize: 30, fontWeight: '800', textAlign: 'right' }}>المتجر</Text><Text style={{ color: colors.muted, textAlign: 'right', marginTop: 16 }}>سيستخدم نفس منتجات وطلبات متجر المعراج الحالي، بدون قاعدة بيانات ثانية.</Text></Screen>; }
