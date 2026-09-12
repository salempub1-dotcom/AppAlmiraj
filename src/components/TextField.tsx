import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { useTheme } from '../context/ThemeProvider';
import { ui } from '../theme/ui';

type Props = TextInputProps & { label: string; compact?: boolean };

export function TextField({ label, compact = false, style, ...props }: Props) {
  const { colors } = useTheme();

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <Text style={[styles.label, compact && styles.labelCompact, { color: colors.text }]}>{label}</Text>
      <TextInput
        {...props}
        placeholderTextColor={colors.muted}
        selectionColor={colors.primary}
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
  wrap: { gap: 7 },
  wrapCompact: { gap: 6 },
  label: { fontSize: 13.5, fontWeight: '700', textAlign: 'right' },
  labelCompact: { fontSize: 13, fontWeight: '700' },
  input: {
    minHeight: ui.controlHeight,
    borderWidth: 1,
    borderRadius: ui.radius.md,
    paddingHorizontal: 14,
    fontSize: 15.5
  },
  inputCompact: {
    minHeight: ui.compactControlHeight,
    borderRadius: ui.radius.sm,
    fontSize: 15,
    paddingVertical: 8
  }
});
