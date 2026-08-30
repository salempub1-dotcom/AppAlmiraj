import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { useLanguage } from '../../../context/LanguageProvider';
import { useTheme } from '../../../context/ThemeProvider';

type Props = TextInputProps & { label: string; hint?: string; required?: boolean };

export function AdminField({ label, hint, required, style, ...props }: Props) {
  const { colors } = useTheme();
  const { isRTL } = useLanguage();
  const align = isRTL ? ('right' as const) : ('left' as const);

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: colors.muted, textAlign: align }]}>
        {label}
        {required ? ' *' : ''}
      </Text>
      <TextInput
        {...props}
        placeholderTextColor={colors.muted}
        textAlign={align}
        style={[
          styles.input,
          { color: colors.text, backgroundColor: colors.card, borderColor: colors.border },
          props.multiline ? styles.multiline : null,
          style
        ]}
      />
      {!!hint && <Text style={[styles.hint, { color: colors.muted, textAlign: align }]}>{hint}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  label: { fontSize: 13.5, fontWeight: '800' },
  input: { minHeight: 52, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15.5 },
  multiline: { minHeight: 110, paddingTop: 12, textAlignVertical: 'top' },
  hint: { fontSize: 11.5, lineHeight: 16 }
});
