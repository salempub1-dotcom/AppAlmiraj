import { Ionicons } from '@expo/vector-icons';
import { useRef } from 'react';
import {
  Alert,
  Animated,
  Image,
  Pressable,
  Share,
  StyleSheet,
  Text,
  Vibration,
  View
} from 'react-native';
import { useLanguage } from '../../../context/LanguageProvider';
import { useTheme } from '../../../context/ThemeProvider';
import { getCommunityCopy } from '../../../i18n/communityCopy';
import type { CommunityPost, PublicTeacherProfile } from '../../../repositories/communityRepository';
import { formatRelativeTime } from '../../../utils/formatRelativeTime';
import { communityTypeIcons } from '../contentTypeIcons';
import { getCommunityTheme, getCommunityTypeTone } from '../communityTheme';

function getInitials(name?: string | null) {
  const clean = name?.trim();
  if (!clean) return '';
  const parts = clean.split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

function getAvatarColors(seed: string) {
  const palettes = [
    { bg: '#E8F0FE', fg: '#1A73E8' },
    { bg: '#FCE8E6', fg: '#C5221F' },
    { bg: '#E6F4EA', fg: '#137333' },
    { bg: '#FEF7E0', fg: '#B06000' },
    { bg: '#F3E8FD', fg: '#8430CE' },
    { bg: '#E0F2F1', fg: '#00796B' }
  ];
  const score = [...seed].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return palettes[score % palettes.length];
}

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
  const likeScale = useRef(new Animated.Value(1)).current;
  const align = isRTL ? ('right' as const) : ('left' as const);
  const row = isRTL ? ('row-reverse' as const) : ('row' as const);
  const typeTone = getCommunityTypeTone(post.type, community);
  const meta = [post.subject, ...(post.level ?? [])].filter(Boolean) as string[];
  const ar = language === 'ar';
  const initials = getInitials(author?.full_name);
  const avatarColors = getAvatarColors(author?.id ?? post.author_id);

  const handleOwnerMenu = () => {
    Alert.alert(copy.card.moreOptions, undefined, [
      { text: copy.owner.edit, onPress: onEdit },
      { text: post.status === 'hidden' ? copy.owner.show : copy.owner.hide, onPress: onToggleVisibility },
      { text: copy.owner.delete, style: 'destructive', onPress: onDeletePost },
      { text: copy.owner.cancel, style: 'cancel' }
    ]);
  };

  const pulseLike = () => {
    Animated.sequence([
      Animated.spring(likeScale, { toValue: 1.25, useNativeDriver: true, speed: 45, bounciness: 9 }),
      Animated.spring(likeScale, { toValue: 1, useNativeDriver: true, speed: 35, bounciness: 8 })
    ]).start();
  };

  const handleLike = () => {
    if (!onToggleLike || likePending) return;
    pulseLike();
    Vibration.vibrate(18);
    onToggleLike();
  };

  const handleComment = () => {
    Vibration.vibrate(10);
    onPress();
  };

  const handleShare = async () => {
    Vibration.vibrate(14);
    const message = [post.title, post.body, post.media?.url].filter(Boolean).join('\n\n');
    try {
      await Share.share({ message });
    } catch {
      // Native share sheets may be dismissed by the user.
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: community.surface, borderColor: community.border, shadowColor: community.shadow }]}> 
      <View style={[styles.authorRow, { flexDirection: row }]}> 
        <Pressable onPress={onPressAuthor} disabled={!onPressAuthor} style={[styles.authorLockup, { flexDirection: row }]}> 
          <View style={[styles.avatarRing, { borderColor: '#D4AF37' }]}> 
            <View style={[styles.avatar, { backgroundColor: author?.avatar_url ? community.primarySoft : avatarColors.bg }]}> 
              {author?.avatar_url ? (
                <Image source={{ uri: author.avatar_url }} style={styles.avatarImg} />
              ) : initials ? (
                <Text style={[styles.avatarInitials, { color: avatarColors.fg }]}>{initials}</Text>
              ) : (
                <Ionicons name="person" size={19} color={avatarColors.fg} />
              )}
            </View>
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
              {!!author?.subject && <Text style={[styles.dot, { color: community.textMuted }]}>·</Text>}
              <Text style={[styles.time, { color: community.textMuted }]}>{formatRelativeTime(post.created_at, language)}</Text>
            </View>
          </View>
        </Pressable>

        <Pressable
          onPress={isOwner ? handleOwnerMenu : undefined}
          disabled={!isOwner || ownerBusy}
          hitSlop={12}
          style={({ pressed }) => [styles.moreButton, { backgroundColor: pressed ? community.surfaceRaised : 'transparent' }]}
        >
          <Ionicons name="ellipsis-horizontal" size={21} color={community.textSecondary} />
        </Pressable>
      </View>

      {(showHiddenBadge || post.type) && (
        <View style={[styles.badgesRow, { flexDirection: row }]}> 
          <View style={[styles.typeBadge, { backgroundColor: typeTone.background, flexDirection: row }]}> 
            <Ionicons name={communityTypeIcons[post.type]} size={12} color={typeTone.foreground} />
            <Text style={[styles.typeText, { color: typeTone.foreground }]}>{copy.types[post.type]}</Text>
          </View>
          {showHiddenBadge && (
            <View style={[styles.hiddenBadge, { backgroundColor: `${community.danger}12`, flexDirection: row }]}> 
              <Ionicons name="eye-off-outline" size={12} color={community.danger} />
              <Text style={[styles.hiddenBadgeText, { color: community.danger }]}>{copy.card.hiddenBadge}</Text>
            </View>
          )}
        </View>
      )}

      <Pressable onPress={onPress} style={styles.contentArea}>
        {!!post.title && (
          <Text numberOfLines={3} style={[styles.title, { color: community.text, textAlign: align, writingDirection: isRTL ? 'rtl' : 'ltr' }]}> 
            {post.title}
          </Text>
        )}
        {!!post.body && (
          <Text numberOfLines={5} style={[styles.body, { color: community.textSecondary, textAlign: align, writingDirection: isRTL ? 'rtl' : 'ltr' }]}> 
            {post.body}
          </Text>
        )}
      </Pressable>

      {post.media?.type === 'image' && !!post.media.url && (
        <Pressable onPress={onPress} style={[styles.imageShell, { backgroundColor: community.imageBackdrop }]}> 
          <Image source={{ uri: post.media.url }} style={styles.imagePreview} resizeMode="cover" />
        </Pressable>
      )}

      {post.media?.type === 'pdf' && !!post.media.url && (
        <Pressable onPress={onPress} style={[styles.pdfCard, { backgroundColor: community.surfaceRaised, borderColor: community.border, flexDirection: row }]}> 
          <View style={[styles.pdfIcon, { backgroundColor: '#FFF7E2' }]}> 
            <Ionicons name="document-text-outline" size={21} color="#B98000" />
          </View>
          <View style={styles.pdfTextWrap}>
            <Text numberOfLines={1} style={[styles.pdfName, { color: community.text, textAlign: align }]}>
              {post.media.name || copy.card.openPdf}
            </Text>
            <Text style={[styles.pdfMeta, { color: community.textMuted, textAlign: align }]}>PDF</Text>
          </View>
          <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={18} color={community.textMuted} />
        </Pressable>
      )}

      {meta.length > 0 && (
        <View style={[styles.metaWrap, { flexDirection: row }]}> 
          {meta.map((item) => (
            <View key={item} style={[styles.metaChip, { backgroundColor: community.surfaceRaised }]}> 
              <Text style={[styles.metaText, { color: community.textSecondary }]}>#{item.replace(/\s+/g, '')}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={[styles.footerDivider, { backgroundColor: community.divider }]} />

      <View style={[styles.actionsRow, { flexDirection: row }]}> 
        <Pressable onPress={handleLike} disabled={!onToggleLike || likePending} hitSlop={10} style={styles.actionButton}>
          <Animated.View style={{ transform: [{ scale: likeScale }] }}>
            <Ionicons name={liked ? 'heart' : 'heart-outline'} size={24} color={liked ? '#ED4956' : community.textSecondary} />
          </Animated.View>
          <Text style={[styles.actionCount, { color: community.textSecondary }]}>{post.likes_count}</Text>
        </Pressable>

        <Pressable onPress={handleComment} hitSlop={10} style={styles.actionButton}>
          <Ionicons name="chatbubble-outline" size={22} color={community.textSecondary} />
          <Text style={[styles.actionCount, { color: community.textSecondary }]}>{post.comments_count}</Text>
        </Pressable>

        <Pressable onPress={handleShare} hitSlop={10} style={styles.iconOnlyButton}>
          <Ionicons name="paper-plane-outline" size={22} color={community.textSecondary} />
        </Pressable>

        <View style={styles.actionsSpacer} />

        <Pressable
          onPress={() => {
            if (!onToggleSave || savePending) return;
            Vibration.vibrate(10);
            onToggleSave();
          }}
          disabled={!onToggleSave || savePending}
          hitSlop={10}
          style={styles.iconOnlyButton}
        >
          <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={23} color={saved ? '#D4AF37' : community.textSecondary} />
        </Pressable>
      </View>

      {post.comments_count > 0 && (
        <Pressable onPress={handleComment} style={styles.commentsLink}>
          <Text style={[styles.commentsText, { color: community.textMuted, textAlign: align }]}> 
            {ar ? `عرض كل التعليقات (${post.comments_count})` : `View all ${post.comments_count} comments`}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 12,
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 22,
    paddingTop: 12,
    paddingBottom: 10,
    overflow: 'hidden',
    shadowOpacity: 0.035,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1
  },
  authorRow: { minHeight: 48, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'space-between' },
  authorLockup: { flex: 1, minWidth: 0, alignItems: 'center', gap: 10 },
  avatarRing: { width: 42, height: 42, borderRadius: 21, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImg: { width: 36, height: 36, borderRadius: 18 },
  avatarInitials: { fontSize: 13, fontWeight: '900' },
  authorText: { flex: 1, minWidth: 0 },
  authorName: { fontWeight: '900', fontSize: 14.5 },
  authorMetaRow: { marginTop: 2, alignItems: 'center', gap: 4 },
  authorMeta: { fontSize: 11.5, fontWeight: '600', maxWidth: 155 },
  dot: { fontSize: 11 },
  time: { fontSize: 10.5, fontWeight: '600' },
  moreButton: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  badgesRow: { paddingHorizontal: 14, paddingTop: 7, gap: 7, flexWrap: 'wrap' },
  typeBadge: { alignItems: 'center', gap: 5, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  typeText: { fontWeight: '800', fontSize: 10.5 },
  hiddenBadge: { alignItems: 'center', gap: 4, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  hiddenBadgeText: { fontWeight: '800', fontSize: 10 },
  contentArea: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 11, gap: 5 },
  title: { fontWeight: '900', fontSize: 16.5, lineHeight: 23 },
  body: { fontSize: 14, lineHeight: 21, fontWeight: '400' },
  imageShell: { marginHorizontal: 10, borderRadius: 16, overflow: 'hidden' },
  imagePreview: { width: '100%', aspectRatio: 1.18 },
  pdfCard: { marginHorizontal: 14, borderWidth: 1, borderRadius: 15, minHeight: 66, paddingHorizontal: 11, paddingVertical: 9, alignItems: 'center', gap: 10 },
  pdfIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  pdfTextWrap: { flex: 1, minWidth: 0 },
  pdfName: { fontWeight: '800', fontSize: 13 },
  pdfMeta: { marginTop: 2, fontSize: 10.5, fontWeight: '700' },
  metaWrap: { paddingHorizontal: 14, paddingTop: 9, gap: 6, flexWrap: 'wrap' },
  metaChip: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  metaText: { fontSize: 10.5, fontWeight: '700' },
  footerDivider: { height: StyleSheet.hairlineWidth, marginTop: 11, marginHorizontal: 14 },
  actionsRow: { paddingHorizontal: 10, paddingTop: 6, alignItems: 'center' },
  actionButton: { minWidth: 50, height: 40, paddingHorizontal: 7, flexDirection: 'row', gap: 5, alignItems: 'center', justifyContent: 'center' },
  iconOnlyButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  actionCount: { fontSize: 11.5, fontWeight: '700' },
  actionsSpacer: { flex: 1 },
  commentsLink: { paddingHorizontal: 14, paddingTop: 1, paddingBottom: 2 },
  commentsText: { fontSize: 11.5, fontWeight: '600' }
});
