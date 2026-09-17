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
    <View
      style={[
        styles.card,
        {
          backgroundColor: community.surface,
          borderColor: community.isDark ? community.border : '#E7EFF8',
          shadowColor: community.isDark ? '#000000' : '#3576BA'
        }
      ]}
    >
      {!community.isDark && (
        <View pointerEvents="none" style={styles.decorations}>
          <View style={styles.waveA} />
          <View style={styles.waveB} />
          <View style={styles.waveC} />
          <View style={styles.waveLineA} />
          <View style={styles.waveLineB} />
        </View>
      )}
      <View style={[styles.cardAccent, { backgroundColor: community.isDark ? '#294979' : '#DCE8F5' }]} />

      <View style={[styles.authorRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}> 
        <Pressable
          onPress={onPressAuthor}
          disabled={!onPressAuthor}
          style={({ pressed }) => [
            styles.authorLockup,
            { flexDirection: isRTL ? 'row-reverse' : 'row', opacity: pressed ? 0.82 : 1 }
          ]}
        >
          <View style={[styles.avatarRing, { borderColor: community.isDark ? community.primary : '#062D5B' }]}> 
            <View style={[styles.avatar, { backgroundColor: author?.avatar_url ? community.primarySoft : avatarColors.bg }]}> 
              {author?.avatar_url ? (
                <Image source={{ uri: author.avatar_url }} style={styles.avatarImg} />
              ) : initials ? (
                <Text style={[styles.avatarInitials, { color: avatarColors.fg }]}>{initials}</Text>
              ) : (
                <Ionicons name="person" size={22} color={avatarColors.fg} />
              )}
            </View>
          </View>

          <View style={styles.authorText}>
            <Text numberOfLines={1} style={[styles.authorName, { color: community.text, textAlign: align }]}>
              {author?.full_name ?? '…'}
            </Text>
            <View style={[styles.authorMetaRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}> 
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
          <Ionicons name="ellipsis-horizontal" size={24} color={community.isDark ? community.textSecondary : '#526B89'} />
        </Pressable>
      </View>

      {(showHiddenBadge || post.type) && (
        <View style={[styles.badgesRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}> 
          <View style={[styles.typeBadge, { backgroundColor: typeTone.background, flexDirection: isRTL ? 'row-reverse' : 'row' }]}> 
            <Ionicons name={communityTypeIcons[post.type]} size={14} color={typeTone.foreground} />
            <Text style={[styles.typeText, { color: typeTone.foreground }]}>{copy.types[post.type]}</Text>
          </View>
          {showHiddenBadge && (
            <View style={[styles.hiddenBadge, { backgroundColor: `${community.danger}12`, flexDirection: isRTL ? 'row-reverse' : 'row' }]}> 
              <Ionicons name="eye-off-outline" size={12} color={community.danger} />
              <Text style={[styles.hiddenBadgeText, { color: community.danger }]}>{copy.card.hiddenBadge}</Text>
            </View>
          )}
        </View>
      )}

      <Pressable onPress={onPress} style={({ pressed }) => [styles.contentArea, { opacity: pressed ? 0.84 : 1 }]}>
        {!!post.title && (
          <Text
            numberOfLines={3}
            style={[styles.title, { color: community.text, textAlign: align, writingDirection: isRTL ? 'rtl' : 'ltr' }]}
          >
            {post.title}
          </Text>
        )}
        {!!post.body && (
          <Text
            numberOfLines={5}
            style={[styles.body, { color: community.textSecondary, textAlign: align, writingDirection: isRTL ? 'rtl' : 'ltr' }]}
          >
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
        <Pressable
          onPress={onPress}
          style={[
            styles.pdfCard,
            {
              backgroundColor: community.surfaceRaised,
              borderColor: community.border,
              flexDirection: isRTL ? 'row-reverse' : 'row'
            }
          ]}
        >
          <View style={[styles.pdfIcon, { backgroundColor: community.isDark ? '#382B13' : '#FFF4D6' }]}> 
            <Ionicons name="document-text-outline" size={21} color={community.isDark ? '#FFD978' : '#986700'} />
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
        <View style={[styles.metaWrap, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}> 
          {meta.map((item) => (
            <View key={item} style={[styles.metaChip, { backgroundColor: community.surfaceRaised }]}> 
              <Text style={[styles.metaText, { color: community.textSecondary }]}>#{item.replace(/\s+/g, '')}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={[styles.footerDivider, { backgroundColor: community.isDark ? community.divider : '#E7EFF8' }]} />

      <View style={[styles.actionsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}> 
        <Pressable onPress={handleLike} disabled={!onToggleLike || likePending} hitSlop={10} style={styles.actionButton}>
          <Text style={[styles.actionCount, { color: community.textSecondary }]}>{post.likes_count}</Text>
          <Animated.View style={{ transform: [{ scale: likeScale }] }}>
            <Ionicons name={liked ? 'heart' : 'heart-outline'} size={27} color={liked ? '#F12648' : '#526B89'} />
          </Animated.View>
        </Pressable>

        <Pressable onPress={handleComment} hitSlop={10} style={styles.actionButton}>
          <Text style={[styles.actionCount, { color: community.textSecondary }]}>{post.comments_count}</Text>
          <Ionicons name="chatbubble-outline" size={24} color={community.isDark ? community.textSecondary : '#526B89'} />
        </Pressable>

        <Pressable onPress={handleShare} hitSlop={10} style={styles.iconOnlyButton}>
          <Ionicons name="paper-plane-outline" size={25} color={community.isDark ? community.textSecondary : '#173D69'} />
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
          <Ionicons
            name={saved ? 'bookmark' : 'bookmark-outline'}
            size={27}
            color={saved ? '#D6A525' : community.isDark ? community.textSecondary : '#526B89'}
          />
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
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 5,
    borderWidth: 1,
    borderRadius: 30,
    paddingTop: 16,
    paddingBottom: 12,
    overflow: 'hidden',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 7
  },
  decorations: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  waveA: {
    position: 'absolute',
    width: 340,
    height: 210,
    borderRadius: 170,
    backgroundColor: 'rgba(226,240,255,0.42)',
    right: -170,
    top: -100,
    transform: [{ rotate: '-12deg' }]
  },
  waveB: {
    position: 'absolute',
    width: 300,
    height: 180,
    borderRadius: 150,
    backgroundColor: 'rgba(190,222,250,0.20)',
    right: -120,
    bottom: -110,
    transform: [{ rotate: '12deg' }]
  },
  waveC: {
    position: 'absolute',
    width: 260,
    height: 155,
    borderRadius: 130,
    backgroundColor: 'rgba(234,244,255,0.28)',
    left: -170,
    bottom: -95
  },
  waveLineA: {
    position: 'absolute',
    width: 230,
    height: 86,
    borderRadius: 120,
    borderWidth: 1,
    borderColor: 'rgba(7,86,154,0.06)',
    right: -80,
    bottom: 8,
    transform: [{ rotate: '-9deg' }]
  },
  waveLineB: {
    position: 'absolute',
    width: 190,
    height: 68,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(7,86,154,0.045)',
    right: -52,
    bottom: 22,
    transform: [{ rotate: '-9deg' }]
  },
  cardAccent: {
    position: 'absolute',
    top: 0,
    left: 28,
    width: 42,
    height: 4,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8
  },
  authorRow: { minHeight: 58, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'space-between' },
  authorLockup: { flex: 1, minWidth: 0, alignItems: 'center', gap: 12 },
  avatarRing: { width: 58, height: 58, borderRadius: 29, borderWidth: 2, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FBFF' },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImg: { width: 48, height: 48, borderRadius: 24 },
  avatarInitials: { fontSize: 16, fontWeight: '900' },
  authorText: { flex: 1, minWidth: 0 },
  authorName: { fontWeight: '900', fontSize: 17.5 },
  authorMetaRow: { marginTop: 3, alignItems: 'center', gap: 4 },
  authorMeta: { fontSize: 12.2, fontWeight: '600', maxWidth: 168 },
  dot: { fontSize: 11 },
  time: { fontSize: 11.5, fontWeight: '700' },
  moreButton: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  badgesRow: { paddingHorizontal: 18, paddingTop: 10, gap: 8, flexWrap: 'wrap' },
  typeBadge: { alignItems: 'center', gap: 6, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  typeText: { fontWeight: '900', fontSize: 12 },
  hiddenBadge: { alignItems: 'center', gap: 4, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 },
  hiddenBadgeText: { fontWeight: '800', fontSize: 10.5 },
  contentArea: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 14, gap: 7 },
  title: { fontWeight: '900', fontSize: 19, lineHeight: 28 },
  body: { fontSize: 16, lineHeight: 26, fontWeight: '500' },
  imageShell: { marginHorizontal: 14, borderRadius: 21, overflow: 'hidden' },
  imagePreview: { width: '100%', aspectRatio: 1.18 },
  pdfCard: { marginHorizontal: 18, borderWidth: 1, borderRadius: 18, minHeight: 70, paddingHorizontal: 12, paddingVertical: 10, alignItems: 'center', gap: 10 },
  pdfIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  pdfTextWrap: { flex: 1, minWidth: 0 },
  pdfName: { fontWeight: '800', fontSize: 13.5 },
  pdfMeta: { marginTop: 2, fontSize: 10.5, fontWeight: '700' },
  metaWrap: { paddingHorizontal: 18, paddingTop: 10, gap: 6, flexWrap: 'wrap' },
  metaChip: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 },
  metaText: { fontSize: 11, fontWeight: '700' },
  footerDivider: { height: StyleSheet.hairlineWidth, marginTop: 12, marginHorizontal: 18 },
  actionsRow: { paddingHorizontal: 13, paddingTop: 8, alignItems: 'center', minHeight: 50 },
  actionButton: { minWidth: 62, height: 44, paddingHorizontal: 8, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center' },
  iconOnlyButton: { width: 46, height: 44, alignItems: 'center', justifyContent: 'center' },
  actionCount: { fontSize: 13, fontWeight: '800' },
  actionsSpacer: { flex: 1 },
  commentsLink: { paddingHorizontal: 18, paddingTop: 2, paddingBottom: 3 },
  commentsText: { fontSize: 11.8, fontWeight: '600' }
});