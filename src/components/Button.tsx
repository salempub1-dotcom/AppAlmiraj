import { Pressable, StyleSheet, Text } from 'react-native';
import { useTheme } from '../context/ThemeProvider';

export function Button({ title, onPress, secondary = false }: { title: string; onPress: () => void; secondary?: boolean }) {
  const { colors } = useTheme();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.button, { backgroundColor: secondary ? colors.card : colors.primary, borderColor: secondary ? colors.border : colors.primary, opacity: pressed ? 0.8 : 1 }]}>
      <Text style={[styles.text, { color: secondary ? colors.text : colors.onPrimary }]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { minHeight: 54, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  text: { fontSize: 16, fontWeight: '800', textAlign: 'center' }
});
