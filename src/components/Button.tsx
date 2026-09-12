import { Pressable, StyleSheet, Text } from 'react-native';
import { useTheme } from '../context/ThemeProvider';
import { ui } from '../theme/ui';

export function Button({ title, onPress, secondary = false }: { title: string; onPress: () => void; secondary?: boolean }) {
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: secondary ? colors.card : colors.primary,
          borderColor: secondary ? colors.border : colors.primary,
          transform: [{ scale: pressed ? 0.985 : 1 }],
          opacity: pressed ? 0.9 : 1
        }
      ]}
    >
      <Text style={[styles.text, { color: secondary ? colors.text : colors.onPrimary }]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: ui.controlHeight,
    borderRadius: ui.radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 11
  },
  text: {
    fontSize: 15.5,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.1
  }
});
