import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { useTheme } from '../context/ThemeProvider';

type Props = TextInputProps & { label: string; compact?: boolean };

export function TextField({ label, compact = false, style, ...props }: Props) {
  const { colors } = useTheme();
  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <Text style={[styles.label, compact && styles.labelCompact, { color: colors.muted }]}>{label}</Text>
      <TextInput
        {...props}
        placeholderTextColor={colors.muted}
        style={[
          styles.input,
          compact && styles.inputCompact,
          { color: colors.text, backgroundColor: colors.card, borderColor: colors.border },
          style
        ]}
        textAlign="right"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  wrapCompact: { gap: 6 },
  label: { fontSize: 15, textAlign: 'right' },
  labelCompact: { fontSize: 13.5, fontWeight: '600' },
  input: { minHeight: 54, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, fontSize: 16 },
  inputCompact: { minHeight: 48, borderRadius: 12, fontSize: 15, paddingVertical: 9 }
});
