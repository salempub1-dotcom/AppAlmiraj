import { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeProvider';

type Props = PropsWithChildren<{ scroll?: boolean; style?: ViewStyle }>;

export function Screen({ children, scroll = false, style }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  if (scroll) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: Math.max(insets.top + 14, 24),
              paddingBottom: Math.max(insets.bottom + 96, 112)
            },
            style
          ]}
        >
          {children}
        </ScrollView>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <View style={[styles.staticContent, style]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 20, gap: 0 },
  staticContent: { flex: 1, paddingHorizontal: 20, paddingVertical: 20 }
});
