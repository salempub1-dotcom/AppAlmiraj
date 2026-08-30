import { Text } from 'react-native';
import { Screen } from '../../../components/Screen';
import { useTheme } from '../../../context/ThemeProvider';
export function ToolsScreen() { const { colors } = useTheme(); return <Screen><Text style={{ color: colors.text, fontSize: 30, fontWeight: '800', textAlign: 'right' }}>الأدوات</Text><Text style={{ color: colors.muted, textAlign: 'right', marginTop: 16 }}>لاحقًا: المؤقت، اختيار تلميذ عشوائي، وتقسيم المجموعات.</Text></Screen>; }
