import { PropsWithChildren } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../context/ThemeProvider';

type Props = PropsWithChildren<{ scroll?: boolean; style?: ViewStyle }>;

export function Screen({ children, scroll = false, style }: Props) {
  const { colors } = useTheme();
  const base = [styles.root, { backgroundColor: colors.background }, style];
  if (scroll) return <ScrollView contentContainerStyle={base}>{children}</ScrollView>;
  return <SafeAreaView style={base}>{children}</SafeAreaView>;
}

const styles = StyleSheet.create({ root: { flexGrow: 1, padding: 20 } });
