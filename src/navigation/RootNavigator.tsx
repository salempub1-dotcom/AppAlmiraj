import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { useTheme } from '../context/ThemeProvider';
import { BottomTabs } from './BottomTabs';

export function RootNavigator() {
  const { mode, colors } = useTheme();
  const base = mode === 'dark' ? DarkTheme : DefaultTheme;
  const theme = { ...base, colors: { ...base.colors, background: colors.background, card: colors.card, text: colors.text, border: colors.border, primary: colors.primary } };
  return <NavigationContainer theme={theme}><BottomTabs /></NavigationContainer>;
}
