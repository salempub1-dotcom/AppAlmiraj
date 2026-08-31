import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useTheme } from '../../../context/ThemeProvider';

// Deliberately local to the community feature (mirrors admin/components/AdminChip.tsx)
// rather than a shared import, so Teacher Space stays a self-contained feature folder.
export function CommunityChip({
  label,
  active,
  onPress,
  icon
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: active ? colors.primary : colors.card,
          borderColor: active ? colors.primary : colors.border,
          opacity: pressed ? 0.86 : 1
        }
      ]}
    >
      {icon && <Ionicons name={icon} size={14} color={active ? '#0B1833' : colors.muted} />}
      <Text style={[styles.text, { color: active ? '#0B1833' : colors.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', gap: 6 },
  text: { fontWeight: '800', fontSize: 12.5 }
});
