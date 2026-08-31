import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useTheme } from '../../../context/ThemeProvider';
import { getCommunityTheme } from '../communityTheme';

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
  const community = getCommunityTheme(colors);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: active ? community.primary : community.surface,
          borderColor: active ? community.primary : community.border,
          opacity: pressed ? 0.76 : 1
        }
      ]}
    >
      {icon && <Ionicons name={icon} size={14} color={active ? '#FFFFFF' : community.textMuted} />}
      <Text style={[styles.text, { color: active ? '#FFFFFF' : community.textSecondary }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  text: { fontWeight: '800', fontSize: 12 }
});
