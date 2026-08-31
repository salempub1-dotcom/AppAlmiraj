import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLanguage } from '../../../context/LanguageProvider';
import { useTheme } from '../../../context/ThemeProvider';
import { getCommunityCopy } from '../../../i18n/communityCopy';
import type { CommunityPost, PublicTeacherProfile } from '../../../repositories/communityRepository';
import { formatRelativeTime } from '../../../utils/formatRelativeTime';
import { communityTypeIcons } from '../contentTypeIcons';

// Like/save are wired here (Phase D) as controlled props - `liked`/`saved`
// come from the screen's batched useCommunityLikedIds/useCommunitySavedIds
// lookups, and the toggle callbacks call the screen's single shared
// useCommunityLike/useCommunitySave mutation. The card itself never talks
// to Supabase directly (Screen -> Hook -> Repository stays intact), and
// every prop here is optional so the card still renders sensibly (as
// static, non-interactive counters) anywhere it's used without them.
export function CommunityPostCard({
  post,
  author,
  onPress,
  onPressAuthor,
  liked,
  saved,
  onToggleLike,
  onToggleSave,
  likePending,
  savePending
}: {
  post: CommunityPost;
  author?: PublicTeacherProfile | null;
  onPress: () => void;
  onPressAuthor?: () => void;
  liked?: boolean;
  saved?: boolean;
  onToggleLike?: () => void;
  onToggleSave?: () => void;
  likePending?: boolean;
  savePending?: boolean;
}) {
  const { colors } = useTheme();
  const { language, isRTL } = useLanguage();
  const copy = getCommunityCopy(language);
  const align = isRTL ? ('right' as const) : ('left' as const);
  const row = isRTL ? ('row-reverse' as const) : ('row' as const);

  const meta = [post.subject, ...(post.level ?? [])].filter(Boolean) as string[];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.94 : 1 }]}
    >
      <View style={[styles.authorRow, { flexDirection: row }]}>
        <Pressable onPress={onPressAuthor} disabled={!onPressAuthor} style={[styles.authorLockup, { flexDirection: row }]}>
          <View style={[styles.avatar, { backgroundColor: `${colors.primary}18` }]}>
            {author?.avatar_url ? (
              <Image source={{ uri: author.avatar_url }} style={styles.avatarImg} />
            ) : (
              <Ionicons name="person" size={18} color={colors.primary} />
            )}
          </View>
          <View>
            <Text numberOfLines={1} style={[styles.authorName, { color: colors.text, textAlign: align }]}>
              {author?.full_name ?? '…'}
            </Text>
            {!!author?.subject && (
              <Text numberOfLines={1} style={[styles.authorMeta, { color: colors.muted, textAlign: align }]}>
                {author.subject}
              </Text>
            )}
          </View>
        </Pressable>
        <Text style={[styles.time, { color: colors.muted }]}>{formatRelativeTime(post.created_at, language)}</Text>
      </View>

      <View style={[styles.typeBadge, { backgroundColor: `${colors.primary}18`, flexDirection: row, alignSelf: isRTL ? 'flex-end' : 'flex-start' }]}>
        <Ionicons name={communityTypeIcons[post.type]} size={14} color={colors.primary} />
        <Text style={[styles.typeText, { color: colors.primary }]}>{copy.types[post.type]}</Text>
      </View>

      {!!post.title && (
        <Text numberOfLines={3} style={[styles.title, { color: colors.text, textAlign: align, writingDirection: isRTL ? 'rtl' : 'ltr' }]}>
          {post.title}
        </Text>
      )}

      {!!post.body && (
        <Text numberOfLines={4} style={[styles.body, { color: colors.text, textAlign: align, writingDirection: isRTL ? 'rtl' : 'ltr' }]}>
          {post.body}
        </Text>
      )}

      {post.media?.type === 'image' && !!post.media.url && (
        <Image source={{ uri: post.media.url }} style={styles.imagePreview} resizeMode="cover" />
      )}

      {post.media?.type === 'pdf' && !!post.media.url && (
        <View style={[styles.pdfCard, { backgroundColor: `${colors.muted}10`, borderColor: colors.border, flexDirection: row }]}>
          <Ionicons name="document-attach-outline" size={20} color={colors.primary} />
          <Text numberOfLines={1} style={[styles.pdfName, { color: colors.text, textAlign: align }]}>
            {post.media.name || copy.card.openPdf}
          </Text>
          <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={16} color={colors.muted} />
        </View>
      )}

      {meta.length > 0 && (
        <View style={[styles.metaWrap, { flexDirection: row }]}>
          {meta.map((item) => (
            <View key={item} style={[styles.metaChip, { backgroundColor: `${colors.muted}10`, borderColor: colors.border }]}>
              <Text style={[styles.metaText, { color: colors.muted }]}>{item}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <View style={[styles.footer, { flexDirection: row }]}>
        <View style={[styles.countersRow, { flexDirection: row }]}>
          <InteractionButton
            icon={liked ? 'heart' : 'heart-outline'}
            value={post.likes_count}
            color={liked ? colors.danger : colors.muted}
            onPress={onToggleLike}
            disabled={likePending}
          />
          <InteractionButton icon="chatbubble-outline" value={post.comments_count} color={colors.muted} onPress={onPress} />
          <InteractionButton
            icon={saved ? 'bookmark' : 'bookmark-outline'}
            value={post.saves_count}
            color={saved ? colors.primary : colors.muted}
            onPress={onToggleSave}
            disabled={savePending}
          />
        </View>
        <View style={[styles.openRow, { flexDirection: row }]}>
          <Text style={[styles.open, { color: colors.primary }]}>{copy.card.viewDetails}</Text>
          <Ionicons name={isRTL ? 'arrow-back' : 'arrow-forward'} size={15} color={colors.primary} />
        </View>
      </View>
    </Pressable>
  );
}

function InteractionButton({
  icon,
  value,
  color,
  onPress,
  disabled
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: number;
  color: string;
  onPress?: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable onPress={onPress} disabled={!onPress || disabled} hitSlop={8} style={[styles.counter, { opacity: disabled ? 0.5 : 1 }]}>
      <Ionicons name={icon} size={14} color={color} />
      <Text style={[styles.counterText, { color }]}>{value}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 24, padding: 17, gap: 11, overflow: 'hidden' },
  authorRow: { justifyContent: 'space-between', alignItems: 'center' },
  authorLockup: { alignItems: 'center', gap: 9, flexShrink: 1 },
  avatar: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImg: { width: 36, height: 36, borderRadius: 12 },
  authorName: { fontWeight: '900', fontSize: 13.5, maxWidth: 160 },
  authorMeta: { fontSize: 11, marginTop: 1 },
  time: { fontSize: 11, fontWeight: '700' },
  typeBadge: { alignItems: 'center', gap: 6, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  typeText: { fontWeight: '900', fontSize: 11.5 },
  title: { fontWeight: '900', fontSize: 17, lineHeight: 27 },
  body: { lineHeight: 23, fontSize: 14 },
  imagePreview: { width: '100%', height: 170, borderRadius: 17 },
  pdfCard: { borderWidth: 1, borderRadius: 14, minHeight: 50, paddingHorizontal: 12, alignItems: 'center', gap: 9 },
  pdfName: { flex: 1, fontWeight: '700', fontSize: 13 },
  metaWrap: { flexWrap: 'wrap', gap: 6 },
  metaChip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 },
  metaText: { fontSize: 11.5, fontWeight: '700' },
  divider: { height: StyleSheet.hairlineWidth, marginTop: 2 },
  footer: { justifyContent: 'space-between', alignItems: 'center' },
  countersRow: { gap: 14, alignItems: 'center' },
  counter: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  counterText: { fontSize: 12, fontWeight: '700' },
  openRow: { alignItems: 'center', gap: 5 },
  open: { fontWeight: '900', fontSize: 12 }
});
