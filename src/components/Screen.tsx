import { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeProvider';
import { ui } from '../theme/ui';

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
              paddingTop: Math.max(insets.top + 10, 20),
              paddingBottom: Math.max(insets.bottom + 88, 104)
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
  scrollContent: {
    flexGrow: 1,
    width: '100%',
    maxWidth: ui.contentMaxWidth,
    alignSelf: 'center',
    paddingHorizontal: 18,
    gap: 0
  },
  staticContent: {
    flex: 1,
    width: '100%',
    maxWidth: ui.contentMaxWidth,
    alignSelf: 'center',
    paddingHorizontal: 18,
    paddingVertical: 16
  }
});
