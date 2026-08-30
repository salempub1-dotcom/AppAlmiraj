import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { useTheme } from '../context/ThemeProvider';

export function TextField({ label, ...props }: TextInputProps & { label: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: colors.muted }]}>{label}</Text>
      <TextInput
        {...props}
        placeholderTextColor={colors.muted}
        style={[styles.input, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border }]}
        textAlign="right"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  label: { fontSize: 15, textAlign: 'right' },
  input: { minHeight: 54, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, fontSize: 16 }
});
