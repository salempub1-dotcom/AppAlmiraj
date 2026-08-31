import { Ionicons } from '@expo/vector-icons';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLanguage } from '../../../context/LanguageProvider';
import { useTheme } from '../../../context/ThemeProvider';
import { getCommunityCopy } from '../../../i18n/communityCopy';
import type { CommunityComment, PublicTeacherProfile } from '../../../repositories/communityRepository';
import { formatRelativeTime } from '../../../utils/formatRelativeTime';
import { getCommunityTheme } from '../communityTheme';

// Flat comments remain V1: no nested replies, no comment reactions.
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
  const community = getCommunityTheme(colors);
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
    <View style={[styles.row, { flexDirection: row }]}>
      <View style={[styles.avatar, { backgroundColor: community.primarySoft, borderColor: community.border }]}>
        {author?.avatar_url ? (
          <Image source={{ uri: author.avatar_url }} style={styles.avatarImg} />
        ) : (
          <Ionicons name="person" size={16} color={community.primary} />
        )}
      </View>

      <View style={styles.content}>
        <View
          style={[
            styles.bubble,
            {
              backgroundColor: community.isDark ? community.surfaceRaised : '#F3F6FA',
              borderColor: community.border
            }
          ]}
        >
          <View style={[styles.headerRow, { flexDirection: row }]}>
            <Text numberOfLines={1} style={[styles.name, { color: community.text, textAlign: align }]}>
              {author?.full_name ?? '…'}
            </Text>
            <Pressable onPress={handleMenu} hitSlop={10} style={styles.menuButton}>
              <Ionicons name="ellipsis-horizontal" size={16} color={community.textMuted} />
            </Pressable>
          </View>

          <Text
            numberOfLines={8}
            style={[
              styles.text,
              {
                color: community.textSecondary,
                textAlign: align,
                writingDirection: isRTL ? 'rtl' : 'ltr'
              }
            ]}
          >
            {comment.body}
          </Text>
        </View>

        <Text style={[styles.time, { color: community.textMuted, textAlign: align }]}>
          {formatRelativeTime(comment.created_at, language)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 9,
    alignItems: 'flex-start',
    paddingVertical: 4
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  avatarImg: {
    width: 34,
    height: 34,
    borderRadius: 17
  },
  content: {
    flex: 1,
    gap: 4
  },
  bubble: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingTop: 9,
    paddingBottom: 10,
    gap: 4
  },
  headerRow: {
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  name: {
    flex: 1,
    fontWeight: '900',
    fontSize: 12.5
  },
  text: {
    fontSize: 13.5,
    lineHeight: 20
  },
  time: {
    fontSize: 10.5,
    fontWeight: '600',
    paddingHorizontal: 4
  },
  menuButton: {
    padding: 3
  }
});
