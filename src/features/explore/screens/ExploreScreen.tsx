import { Text } from 'react-native';
import { Screen } from '../../../components/Screen';
import { useTheme } from '../../../context/ThemeProvider';
export function ExploreScreen() { const { colors } = useTheme(); return <Screen><Text style={{ color: colors.text, fontSize: 30, fontWeight: '800', textAlign: 'right' }}>استكشف</Text><Text style={{ color: colors.muted, textAlign: 'right', marginTop: 16 }}>الفيديوهات، النصائح، المشاكل، الفروض والاختبارات ستُبنى في Phase 2.</Text></Screen>; }
