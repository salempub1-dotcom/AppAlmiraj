import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLanguage } from '../../../context/LanguageProvider';
import { useTheme } from '../../../context/ThemeProvider';
import { getAdminCopy } from '../../../i18n/adminCopy';
import type { ContentPost } from '../../../repositories/contentRepository';
import { contentTypeIcons, statusColors, statusIcons } from '../contentTypeIcons';

type Props = {
  post: ContentPost;
  onEdit: () => void;
  onPreview: () => void;
  onTogglePublish: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  busy?: boolean;
};

export function AdminContentRow({ post, onEdit, onPreview, onTogglePublish, onDuplicate, onDelete, busy }: Props) {
  const { colors } = useTheme();
  const { language, isRTL } = useLanguage();
  const copy = getAdminCopy(language);
  const row = isRTL ? ('row-reverse' as const) : ('row' as const);
  const align = isRTL ? ('right' as const) : ('left' as const);

  const title = (language === 'en' && post.title_en) || post.title;
  const meta = [post.subject, post.level, post.term, post.sequence].filter(Boolean) as string[];
  const status = statusColors[post.status];
  const updatedAt = new Date(post.updated_at).toLocaleDateString(language === 'ar' ? 'ar-DZ' : 'en-GB', {
    day: '2-digit',
    month: 'short'
  });

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Pressable onPress={onEdit} style={[styles.topRow, { flexDirection: row }]}>
        <View style={[styles.typeIcon, { backgroundColor: `${colors.primary}18` }]}>
          <Ionicons name={contentTypeIcons[post.post_type]} size={18} color={colors.primary} />
        </View>
        <View style={styles.titleWrap}>
          <Text numberOfLines={2} style={[styles.title, { color: colors.text, textAlign: align }]}>
            {title}
          </Text>
          <View style={[styles.badgeRow, { flexDirection: row }]}>
            <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
              <Ionicons name={statusIcons[post.status]} size={11} color={status.fg} />
              <Text style={[styles.statusText, { color: status.fg }]}>{copy.statuses[post.status]}</Text>
            </View>
            <Text style={[styles.typeText, { color: colors.muted }]}>{copy.types[post.post_type]}</Text>
            {post.is_official && (
              <View style={[styles.officialBadge, { backgroundColor: `${colors.primary}18` }]}>
                <Ionicons name="shield-checkmark" size={10} color={colors.primary} />
              </View>
            )}
          </View>
        </View>
      </Pressable>

      {meta.length > 0 && (
        <View style={[styles.metaWrap, { flexDirection: row }]}>
          {meta.map((item) => (
            <View key={item} style={[styles.metaChip, { borderColor: colors.border }]}>
              <Text style={[styles.metaText, { color: colors.muted }]}>{item}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={[styles.footer, { borderTopColor: colors.border, flexDirection: row }]}>
        <Text style={[styles.updatedText, { color: colors.muted }]}>
          {copy.card.updatedAt} {updatedAt}
        </Text>
        <View style={[styles.actions, { flexDirection: row }]}>
          <ActionIcon icon="eye-outline" onPress={onPreview} disabled={busy} />
          <ActionIcon icon="create-outline" onPress={onEdit} disabled={busy} />
          <ActionIcon icon="copy-outline" onPress={onDuplicate} disabled={busy} />
          <ActionIcon
            icon={post.status === 'approved' ? 'eye-off-outline' : 'cloud-upload-outline'}
            onPress={onTogglePublish}
            disabled={busy}
            highlight
          />
          <ActionIcon icon="trash-outline" onPress={onDelete} disabled={busy} danger />
        </View>
      </View>
    </View>
  );
}

function ActionIcon({
  icon,
  onPress,
  disabled,
  danger,
  highlight
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  disabled?: boolean;
  danger?: boolean;
  highlight?: boolean;
}) {
  const { colors } = useTheme();
  const color = danger ? colors.danger : highlight ? colors.primary : colors.muted;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={6}
      style={({ pressed }) => [
        styles.actionIcon,
        { backgroundColor: `${color}14`, opacity: disabled ? 0.4 : pressed ? 0.7 : 1 }
      ]}
    >
      <Ionicons name={icon} size={16} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 22, padding: 15, gap: 11 },
  topRow: { alignItems: 'flex-start', gap: 11 },
  typeIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  titleWrap: { flex: 1, gap: 6 },
  title: { fontWeight: '900', fontSize: 15.5, lineHeight: 21 },
  badgeRow: { alignItems: 'center', gap: 7, flexWrap: 'wrap' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontWeight: '800', fontSize: 10.5 },
  typeText: { fontWeight: '700', fontSize: 11 },
  officialBadge: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  metaWrap: { flexWrap: 'wrap', gap: 6 },
  metaChip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  metaText: { fontSize: 10.5, fontWeight: '700' },
  footer: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 10, alignItems: 'center', justifyContent: 'space-between' },
  updatedText: { fontSize: 10.5, fontWeight: '600' },
  actions: { alignItems: 'center', gap: 6 },
  actionIcon: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }
});
