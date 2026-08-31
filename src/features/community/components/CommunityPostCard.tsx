import { Ionicons } from '@expo/vector-icons';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLanguage } from '../../../context/LanguageProvider';
import { useTheme } from '../../../context/ThemeProvider';
import { getCommunityCopy } from '../../../i18n/communityCopy';
import type { CommunityPost, PublicTeacherProfile } from '../../../repositories/communityRepository';
import { formatRelativeTime } from '../../../utils/formatRelativeTime';
import { communityTypeIcons } from '../contentTypeIcons';
import { getCommunityTheme, getCommunityTypeTone } from '../communityTheme';

// Like/save are controlled props supplied by screens using the existing batched
// interaction hooks. This component remains UI-only and never talks to Supabase.
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
  savePending,
  isOwner,
  onEdit,
  onDeletePost,
  onToggleVisibility,
  ownerBusy,
  showHiddenBadge
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
  isOwner?: boolean;
  onEdit?: () => void;
  onDeletePost?: () => void;
  onToggleVisibility?: () => void;
  ownerBusy?: boolean;
  showHiddenBadge?: boolean;
}) {
  const { colors } = useTheme();
  const community = getCommunityTheme(colors);
  const { language, isRTL } = useLanguage();
  const copy = getCommunityCopy(language);
  const align = isRTL ? ('right' as const) : ('left' as const);
  const row = isRTL ? ('row-reverse' as const) : ('row' as const);
  const typeTone = getCommunityTypeTone(post.type, community);
  const meta = [post.subject, ...(post.level ?? [])].filter(Boolean) as string[];

  const handleOwnerMenu = () => {
    Alert.alert(copy.card.moreOptions, undefined, [
      { text: copy.owner.edit, onPress: onEdit },
      { text: post.status === 'hidden' ? copy.owner.show : copy.owner.hide, onPress: onToggleVisibility },
      { text: copy.owner.delete, style: 'destructive', onPress: onDeletePost },
      { text: copy.owner.cancel, style: 'cancel' }
    ]);
  };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: community.surface,
          borderColor: community.border,
          shadowColor: community.shadow,
          opacity: pressed ? 0.97 : 1,
          transform: [{ scale: pressed ? 0.995 : 1 }]
        }
      ]}
    >
      <View style={[styles.authorRow, { flexDirection: row }]}>
        <Pressable onPress={onPressAuthor} disabled={!onPressAuthor} style={[styles.authorLockup, { flexDirection: row }]}>
          <View style={[styles.avatar, { backgroundColor: community.primarySoft, borderColor: community.border }]}>
            {author?.avatar_url ? (
              <Image source={{ uri: author.avatar_url }} style={styles.avatarImg} />
            ) : (
              <Ionicons name="person" size={20} color={community.primary} />
            )}
          </View>

          <View style={styles.authorText}>
            <Text numberOfLines={1} style={[styles.authorName, { color: community.text, textAlign: align }]}>
              {author?.full_name ?? '…'}
            </Text>

            <View style={[styles.authorMetaRow, { flexDirection: row }]}>
              {!!author?.subject && (
                <Text numberOfLines={1} style={[styles.authorMeta, { color: community.textSecondary, textAlign: align }]}>
                  {author.subject}
                </Text>
              )}
              {!!author?.subject && <View style={[styles.metaDot, { backgroundColor: community.textMuted }]} />}
              <Text style={[styles.time, { color: community.textMuted }]}>
                {formatRelativeTime(post.created_at, language)}
              </Text>
            </View>
          </View>
        </Pressable>

        {isOwner && (
          <Pressable
            onPress={handleOwnerMenu}
            disabled={ownerBusy}
            hitSlop={10}
            accessibilityLabel={copy.card.moreOptions}
            style={({ pressed }) => [
              styles.moreButton,
              {
                backgroundColor: pressed ? community.primarySoft : 'transparent',
                opacity: ownerBusy ? 0.5 : 1
              }
            ]}
          >
            <Ionicons name="ellipsis-horizontal" size={20} color={community.textSecondary} />
          </Pressable>
        )}
      </View>

      <View style={[styles.badgesRow, { flexDirection: row }]}>
        <View style={[styles.typeBadge, { backgroundColor: typeTone.background, flexDirection: row }]}>
          <Ionicons name={communityTypeIcons[post.type]} size={14} color={typeTone.foreground} />
          <Text style={[styles.typeText, { color: typeTone.foreground }]}>{copy.types[post.type]}</Text>
        </View>

        {showHiddenBadge && (
          <View style={[styles.hiddenBadge, { backgroundColor: `${community.danger}14`, flexDirection: row }]}>
            <Ionicons name="eye-off-outline" size={12} color={community.danger} />
            <Text style={[styles.hiddenBadgeText, { color: community.danger }]}>{copy.card.hiddenBadge}</Text>
          </View>
        )}
      </View>

      {!!post.title && (
        <Text
          numberOfLines={3}
          style={[
            styles.title,
            {
              color: community.text,
              textAlign: align,
              writingDirection: isRTL ? 'rtl' : 'ltr'
            }
          ]}
        >
          {post.title}
        </Text>
      )}

      {!!post.body && (
        <Text
          numberOfLines={5}
          style={[
            styles.body,
            {
              color: community.textSecondary,
              textAlign: align,
              writingDirection: isRTL ? 'rtl' : 'ltr'
            }
          ]}
        >
          {post.body}
        </Text>
      )}

      {post.media?.type === 'image' && !!post.media.url && (
        <View style={[styles.imageShell, { backgroundColor: community.imageBackdrop }]}>
          <Image source={{ uri: post.media.url }} style={styles.imagePreview} resizeMode="cover" />
        </View>
      )}

      {post.media?.type === 'pdf' && !!post.media.url && (
        <View
          style={[
            styles.pdfCard,
            {
              backgroundColor: community.isDark ? community.surfaceRaised : '#F8FAFC',
              borderColor: community.border,
              flexDirection: row
            }
          ]}
        >
          <View style={[styles.pdfIcon, { backgroundColor: community.primarySoft }]}>
            <Ionicons name="document-text-outline" size={22} color={community.primary} />
          </View>

          <View style={styles.pdfTextWrap}>
            <Text numberOfLines={1} style={[styles.pdfName, { color: community.text, textAlign: align }]}>
              {post.media.name || copy.card.openPdf}
            </Text>
            <Text style={[styles.pdfMeta, { color: community.textMuted, textAlign: align }]}>PDF</Text>
          </View>

          <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={18} color={community.textMuted} />
        </View>
      )}

      {meta.length > 0 && (
        <View style={[styles.metaWrap, { flexDirection: row }]}>
          {meta.map((item) => (
            <View key={item} style={[styles.metaChip, { backgroundColor: community.primarySoft }]}>
              <Text style={[styles.metaText, { color: community.primaryStrong }]}>{item}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={[styles.divider, { backgroundColor: community.divider }]} />

      <View style={[styles.actionsRow, { flexDirection: row }]}>
        <InteractionButton
          icon={liked ? 'heart' : 'heart-outline'}
          value={post.likes_count}
          active={liked}
          activeColor={community.primary}
          inactiveColor={community.textSecondary}
          activeBackground={community.primarySoft}
          onPress={onToggleLike}
          disabled={likePending}
        />

        <InteractionButton
          icon="chatbubble-outline"
          value={post.comments_count}
          active={false}
          activeColor={community.primary}
          inactiveColor={community.textSecondary}
          activeBackground={community.primarySoft}
          onPress={onPress}
        />

        <InteractionButton
          icon={saved ? 'bookmark' : 'bookmark-outline'}
          value={post.saves_count}
          active={saved}
          activeColor={community.primary}
          inactiveColor={community.textSecondary}
          activeBackground={community.primarySoft}
          onPress={onToggleSave}
          disabled={savePending}
        />
      </View>
    </Pressable>
  );
}

function InteractionButton({
  icon,
  value,
  active,
  activeColor,
  inactiveColor,
  activeBackground,
  onPress,
  disabled
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: number;
  active?: boolean;
  activeColor: string;
  inactiveColor: string;
  activeBackground: string;
  onPress?: () => void;
  disabled?: boolean;
}) {
  const color = active ? activeColor : inactiveColor;

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress || disabled}
      hitSlop={6}
      style={({ pressed }) => [
        styles.actionButton,
        {
          backgroundColor: active ? activeBackground : 'transparent',
          opacity: disabled ? 0.45 : pressed ? 0.72 : 1
        }
      ]}
    >
      <Ionicons name={icon} size={19} color={color} />
      <Text style={[styles.actionCount, { color }]}>{value}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 15,
    paddingBottom: 10,
    gap: 12,
    overflow: 'hidden',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2
  },
  authorRow: {
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  authorLockup: {
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  avatarImg: {
    width: 44,
    height: 44,
    borderRadius: 22
  },
  authorText: {
    flex: 1,
    minWidth: 0
  },
  authorName: {
    fontWeight: '900',
    fontSize: 14.5
  },
  authorMetaRow: {
    marginTop: 3,
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap'
  },
  authorMeta: {
    fontSize: 11.5,
    fontWeight: '600',
    maxWidth: 130
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 999
  },
  time: {
    fontSize: 11,
    fontWeight: '600'
  },
  moreButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center'
  },
  badgesRow: {
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap'
  },
  typeBadge: {
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  typeText: {
    fontWeight: '800',
    fontSize: 11.5
  },
  hiddenBadge: {
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5
  },
  hiddenBadgeText: {
    fontWeight: '800',
    fontSize: 10.5
  },
  title: {
    fontWeight: '900',
    fontSize: 17,
    lineHeight: 25
  },
  body: {
    lineHeight: 23,
    fontSize: 14.25,
    fontWeight: '500'
  },
  imageShell: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden'
  },
  imagePreview: {
    width: '100%',
    height: 210
  },
  pdfCard: {
    borderWidth: 1,
    borderRadius: 16,
    minHeight: 66,
    paddingHorizontal: 11,
    paddingVertical: 9,
    alignItems: 'center',
    gap: 10
  },
  pdfIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center'
  },
  pdfTextWrap: {
    flex: 1,
    minWidth: 0
  },
  pdfName: {
    fontWeight: '800',
    fontSize: 13
  },
  pdfMeta: {
    marginTop: 2,
    fontSize: 10.5,
    fontWeight: '700'
  },
  metaWrap: {
    flexWrap: 'wrap',
    gap: 6
  },
  metaChip: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5
  },
  metaText: {
    fontSize: 11,
    fontWeight: '800'
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginTop: 1
  },
  actionsRow: {
    justifyContent: 'space-around',
    alignItems: 'center'
  },
  actionButton: {
    minWidth: 72,
    minHeight: 38,
    borderRadius: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6
  },
  actionCount: {
    fontSize: 12,
    fontWeight: '800'
  }
});
