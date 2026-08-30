import { Pressable, StyleSheet, Text } from 'react-native';
import { useTheme } from '../context/ThemeProvider';

export function Button({ title, onPress, secondary = false }: { title: string; onPress: () => void; secondary?: boolean }) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} style={[styles.button, { backgroundColor: secondary ? colors.card : colors.primary, borderColor: colors.border }]}>
      <Text style={[styles.text, { color: colors.text }]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { minHeight: 52, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  text: { fontSize: 17, fontWeight: '700' }
});
