import { Ionicons } from '@expo/vector-icons';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLanguage } from '../../../context/LanguageProvider';
import { useTheme } from '../../../context/ThemeProvider';
import { getCommunityCopy } from '../../../i18n/communityCopy';
import type { CommunityComment, PublicTeacherProfile } from '../../../repositories/communityRepository';
import { formatRelativeTime } from '../../../utils/formatRelativeTime';

// Single flat comment row (Phase D). No nested replies, no reactions, no
// editing - matches the V1 scope exactly. Own comments get a delete
// button (with a confirm step); other teachers' comments get a report
// button instead - never both on the same row.
export function CommentRow({
  comment,
  author,
  isOwn,
  onDelete,
  onReport
}: {
  comment: CommunityComment;
  author?: PublicTeacherProfile | null;
  isOwn: boolean;
  onDelete: () => void;
  onReport: () => void;
}) {
  const { colors } = useTheme();
  const { language, isRTL } = useLanguage();
  const copy = getCommunityCopy(language);
  const align = isRTL ? ('right' as const) : ('left' as const);
  const row = isRTL ? ('row-reverse' as const) : ('row' as const);

  const handleMenu = () => {
    if (isOwn) {
      Alert.alert(copy.comments.deleteConfirmTitle, copy.comments.deleteConfirmText, [
        { text: copy.comments.cancel, style: 'cancel' },
        { text: copy.comments.delete, style: 'destructive', onPress: onDelete }
      ]);
    } else {
      Alert.alert(copy.comments.moreOptions, undefined, [
        { text: copy.comments.cancel, style: 'cancel' },
        { text: copy.comments.report, onPress: onReport }
      ]);
    }
  };

  return (
    <View style={[styles.row, { flexDirection: row, borderColor: colors.border }]}>
      <View style={[styles.avatar, { backgroundColor: `${colors.primary}18` }]}>
        {author?.avatar_url ? (
          <Image source={{ uri: author.avatar_url }} style={styles.avatarImg} />
        ) : (
          <Ionicons name="person" size={16} color={colors.primary} />
        )}
      </View>
      <View style={styles.body}>
        <View style={[styles.headerRow, { flexDirection: row }]}>
          <Text numberOfLines={1} style={[styles.name, { color: colors.text, textAlign: align }]}>
            {author?.full_name ?? '…'}
          </Text>
          <Text style={[styles.time, { color: colors.muted }]}>{formatRelativeTime(comment.created_at, language)}</Text>
        </View>
        <Text numberOfLines={8} style={[styles.text, { color: colors.text, textAlign: align, writingDirection: isRTL ? 'rtl' : 'ltr' }]}>
          {comment.body}
        </Text>
      </View>
      <Pressable onPress={handleMenu} hitSlop={10} style={styles.menuButton}>
        <Ionicons name="ellipsis-horizontal" size={16} color={colors.muted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 12, gap: 10, alignItems: 'flex-start' },
  avatar: { width: 32, height: 32, borderRadius: 11, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImg: { width: 32, height: 32, borderRadius: 11 },
  body: { flex: 1, gap: 3 },
  headerRow: { justifyContent: 'space-between', alignItems: 'center' },
  name: { fontWeight: '900', fontSize: 13 },
  time: { fontSize: 10.5, fontWeight: '700' },
  text: { fontSize: 13.5, lineHeight: 20 },
  menuButton: { padding: 4 }
});
