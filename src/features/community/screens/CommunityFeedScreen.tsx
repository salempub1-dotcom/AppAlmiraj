import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View
} from 'react-native';
import { Screen } from '../../../components/Screen';
import { useAuth } from '../../../context/AuthProvider';
import { useLanguage } from '../../../context/LanguageProvider';
import { useTheme } from '../../../context/ThemeProvider';
import { useCommunityFeed, useTeacherPublicProfiles } from '../../../hooks/useCommunity';
import {
  useCommunityLike,
  useCommunityLikedIds,
  useCommunitySave,
  useCommunitySavedIds
} from '../../../hooks/useCommunityInteractions';
import { useDeleteCommunityPost, useSetOwnCommunityPostVisibility } from '../../../hooks/useCommunityPostOwner';
import { getCommunityCopy } from '../../../i18n/communityCopy';
import type { CommunityPost, PublicTeacherProfile } from '../../../repositories/communityRepository';
import { CommunityPostCard } from '../components/CommunityPostCard';
import { TeacherSpaceGate } from '../components/TeacherSpaceGate';
import { getCommunityTheme } from '../communityTheme';
import { getCommunitySocialCopy } from '../communitySocialCopy';

type FeedFilter = 'all' | 'idea' | 'question' | 'test' | 'exam' | 'resource' | 'classroom_experience' | 'tip';

const DISPLAY_FILTERS: FeedFilter[] = ['tip', 'classroom_experience', 'resource', 'test', 'exam'];
const FILTER_ICONS: Record<FeedFilter, keyof typeof Ionicons.glyphMap> = {
  all: 'apps-outline',
  idea: 'bulb-outline',
  question: 'help-circle-outline',
  test: 'document-text-outline',
  exam: 'school-outline',
  resource: 'folder-outline',
  classroom_experience: 'people-outline',
  tip: 'bulb-outline'
};

export function CommunityFeedScreen({ navigation }: any) {
  return (
    <TeacherSpaceGate navigation={navigation}>
      <CommunityFeedList navigation={navigation} />
    </TeacherSpaceGate>
  );
}

function CommunityFeedList({ navigation }: any) {
  const { colors } = useTheme();
  const community = getCommunityTheme(colors);
  const { session } = useAuth();
  const viewerId = session?.user.id ?? null;
  const { language, isRTL } = useLanguage();
  const copy = getCommunityCopy(language);
  const social = getCommunitySocialCopy(language);
  const { width } = useWindowDimensions();
  const compact = width < 370;
  const [activeFilter, setActiveFilter] = useState<FeedFilter>('all');

  const feed = useCommunityFeed();
  const posts = useMemo<CommunityPost[]>(() => feed.data?.pages.flat() ?? [], [feed.data]);
  const visiblePosts = useMemo(() => {
    if (activeFilter === 'all') return posts;
    if (activeFilter === 'resource') return posts.filter((post) => post.type === 'resource' || post.type === 'pdf');
    return posts.filter((post) => post.type === activeFilter);
  }, [activeFilter, posts]);

  const authorIds = useMemo(() => [...new Set(posts.map((post) => post.author_id))], [posts]);
  const authors = useTeacherPublicProfiles(authorIds);
  const authorById = useMemo(() => {
    const map = new Map<string, PublicTeacherProfile>();
    (authors.data ?? []).forEach((profile: PublicTeacherProfile) => map.set(profile.id, profile));
    return map;
  }, [authors.data]);

  const postIds = useMemo(() => posts.map((post) => post.id), [posts]);
  const likedIds = useCommunityLikedIds(postIds);
  const savedIds = useCommunitySavedIds(postIds);
  const likeMutation = useCommunityLike();
  const saveMutation = useCommunitySave();
  const visibilityMutation = useSetOwnCommunityPostVisibility();
  const deleteMutation = useDeleteCommunityPost();

  const handleToggleVisibility = (post: CommunityPost) => {
    const nextStatus = post.status === 'hidden' ? 'visible' : 'hidden';
    visibilityMutation.mutate(
      { postId: post.id, status: nextStatus },
      {
        onSuccess: () => Alert.alert(nextStatus === 'hidden' ? copy.owner.hideSuccess : copy.owner.showSuccess),
        onError: () => Alert.alert(copy.owner.statusError)
      }
    );
  };

  const handleDeletePost = (post: CommunityPost) => {
    Alert.alert(copy.owner.deleteConfirmTitle, copy.owner.deleteConfirmText, [
      { text: copy.owner.cancel, style: 'cancel' },
      {
        text: copy.owner.confirmDelete,
        style: 'destructive',
        onPress: () =>
          deleteMutation.mutate(
            { postId: post.id, media: post.media },
            {
              onSuccess: () => Alert.alert(copy.owner.deleteSuccess),
              onError: () => Alert.alert(copy.owner.deleteError)
            }
          )
      }
    ]);
  };

  const openComposer = (initialType?: CommunityPost['type']) =>
    navigation.navigate('CreateCommunityPost', initialType ? { initialType } : undefined);

  const header = (
    <View style={styles.header}>
      <View style={[styles.hero, compact && styles.heroCompact]}>
        <View style={styles.heroDeepLayer} />
        <View style={styles.heroRoyalLayer} />
        <View style={styles.heroOrbA} />
        <View style={styles.heroOrbB} />
        <View style={styles.heroOrbC} />
        <View style={styles.heroGlow} />
        <View style={styles.goldCurveA} />
        <View style={styles.goldCurveB} />
        <Ionicons name="book-outline" size={compact ? 118 : 142} color="rgba(255,255,255,0.075)" style={styles.heroBook} />

        <View style={styles.topBar}>
          <View style={styles.sideHeroAction}>
            <Pressable
              onPress={() => openComposer()}
              style={({ pressed }) => [styles.headerIcon, pressed && styles.pressedScale]}
            >
              <Ionicons name="add" size={compact ? 28 : 32} color="#FFFFFF" />
            </Pressable>
            <Text style={styles.sideHeroText}>{language === 'ar' ? 'مشاركة خبرة ..\nتصنع فرقًا' : 'Share experience\nmake a difference'}</Text>
            <View style={styles.sideGoldLine} />
          </View>

          <View style={styles.brandLockup}>
            <View style={[styles.titleRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Ionicons name="school" size={compact ? 30 : 36} color="#F1C95A" />
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.86}
                style={[styles.spaceTitle, compact && styles.spaceTitleCompact]}
              >
                {copy.feed.title}
              </Text>
            </View>
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.84}
              style={[styles.spaceSubtitle, compact && styles.spaceSubtitleCompact]}
            >
              {copy.feed.subtitle}
            </Text>
          </View>

          <View style={styles.sideHeroAction}>
            <Pressable
              onPress={() => navigation.navigate('SavedCommunityPosts')}
              style={({ pressed }) => [styles.headerIcon, pressed && styles.pressedScale]}
            >
              <Ionicons name="bookmark-outline" size={compact ? 25 : 28} color="#FFFFFF" />
            </Pressable>
            <Text style={styles.sideHeroText}>{language === 'ar' ? 'معًا\nنصنع تعليمًا أفضل' : 'Together\nbetter education'}</Text>
            <View style={styles.sideGoldLine} />
          </View>
        </View>
      </View>

      <View style={[styles.composerShell, compact && styles.composerShellCompact]}>
        <View pointerEvents="none" style={styles.composerHaloOuter} />
        <View pointerEvents="none" style={styles.composerHaloInner} />
        <View style={styles.composerCard}>
          <View pointerEvents="none" style={styles.composerSoftBlue} />
          <View pointerEvents="none" style={styles.composerGoldShape} />
          <View pointerEvents="none" style={styles.composerGoldShapeTwo} />
          <View pointerEvents="none" style={styles.sparkleOne} />

          <View style={[styles.composerTopRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={[styles.composerAvatarOuter, compact && styles.composerAvatarOuterCompact]}>
              <View style={[styles.composerAvatarInner, compact && styles.composerAvatarInnerCompact]}>
                <Ionicons name="person" size={compact ? 25 : 30} color="#062D5B" />
              </View>
              <View style={styles.statusDot} />
            </View>

            <Pressable
              onPress={() => openComposer()}
              style={({ pressed }) => [styles.composerPromptBox, pressed && styles.composerPressed]}
            >
              <Text
                numberOfLines={2}
                adjustsFontSizeToFit
                minimumFontScale={0.82}
                style={[styles.composerPrompt, compact && styles.composerPromptCompact]}
              >
                {language === 'ar' ? 'ماذا تريد أن تشارك مع زملائك اليوم؟' : social.composerPrompt}
              </Text>
            </Pressable>

            <View style={[styles.publishButtonOuter, compact && styles.publishButtonOuterCompact]}>
              <Pressable
                onPress={() => openComposer()}
                style={({ pressed }) => [styles.publishButton, compact && styles.publishButtonCompact, pressed && styles.pressedScale]}
              >
                <View style={styles.publishHighlight} />
                <Ionicons name="paper-plane" size={compact ? 28 : 34} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>

          <View style={[styles.quickKinds, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Pressable onPress={() => openComposer()} style={({ pressed }) => [styles.quickKind, styles.quickKindImage, pressed && styles.quickPressed]}>
              <Ionicons name="image-outline" size={compact ? 18 : 20} color="#176CDD" />
              <Text style={[styles.quickKindText, { color: '#176CDD' }]}>{language === 'ar' ? 'صورة' : 'Photo'}</Text>
            </Pressable>
            <Pressable onPress={() => openComposer('question')} style={({ pressed }) => [styles.quickKind, styles.quickKindQuestion, pressed && styles.quickPressed]}>
              <Ionicons name="help-circle-outline" size={compact ? 18 : 20} color="#7437E8" />
              <Text style={[styles.quickKindText, { color: '#7437E8' }]}>{language === 'ar' ? 'سؤال' : 'Question'}</Text>
            </Pressable>
            <Pressable onPress={() => openComposer('resource')} style={({ pressed }) => [styles.quickKind, styles.quickKindFile, pressed && styles.quickPressed]}>
              <Ionicons name="document-text-outline" size={compact ? 18 : 20} color="#9A6A00" />
              <Text style={[styles.quickKindText, { color: '#9A6A00' }]}>{language === 'ar' ? 'ملف' : 'File'}</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <View style={styles.filtersWrap}>
        <View pointerEvents="none" style={styles.filtersGlowA} />
        <View pointerEvents="none" style={styles.filtersGlowB} />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.filtersContent, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
        >
          {DISPLAY_FILTERS.map((filter) => {
            const active = filter === activeFilter;
            return (
              <Pressable
                key={filter}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => setActiveFilter(active ? 'all' : filter)}
                style={({ pressed }) => [
                  styles.filterChip,
                  {
                    backgroundColor: active ? '#062D5B' : 'rgba(255,255,255,0.96)',
                    borderColor: active ? '#062D5B' : '#E5EDF7',
                    transform: [{ scale: pressed ? 0.96 : 1 }]
                  }
                ]}
              >
                <Ionicons name={FILTER_ICONS[filter]} size={compact ? 17 : 19} color={active ? '#FFFFFF' : '#173D69'} />
                <Text style={[styles.filterText, compact && styles.filterTextCompact, { color: active ? '#FFFFFF' : '#173D69' }]}>
                  {social.filters[filter]}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );

  if (feed.isLoading) {
    return (
      <Screen style={{ ...styles.loadingPage, backgroundColor: '#F2F8FF' }}>
        <FeedSkeleton community={community} />
      </Screen>
    );
  }

  if (feed.isError) {
    return (
      <Screen style={{ ...styles.center, backgroundColor: community.background }}>
        <View style={[styles.stateIcon, { backgroundColor: community.primarySoft }]}>
          <Ionicons name="cloud-offline-outline" size={30} color={community.primary} />
        </View>
        <Text style={[styles.stateTitle, { color: community.text }]}>{copy.feed.loadError}</Text>
        <Text style={[styles.stateText, { color: community.textSecondary }]}>{copy.feed.loadErrorText}</Text>
        <Pressable onPress={() => feed.refetch()} style={styles.retryButton}>
          <Text style={styles.retryText}>{copy.feed.retry}</Text>
        </Pressable>
      </Screen>
    );
  }

  return (
    <Screen style={{ ...styles.listPage, backgroundColor: community.isDark ? community.background : '#F2F8FF' }}>
      <FlatList
        data={visiblePosts}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={header}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={feed.isRefetching && !feed.isFetchingNextPage}
            onRefresh={() => feed.refetch()}
            tintColor={community.primary}
          />
        }
        onEndReachedThreshold={0.45}
        onEndReached={() => {
          if (feed.hasNextPage && !feed.isFetchingNextPage) feed.fetchNextPage();
        }}
        ListEmptyComponent={
          <View style={[styles.emptyCard, { backgroundColor: community.surface, borderColor: '#D8E6F5' }]}> 
            <View style={[styles.stateIcon, { backgroundColor: community.primarySoft }]}>
              <Ionicons name="chatbubbles-outline" size={28} color={community.primaryStrong} />
            </View>
            <Text style={[styles.stateTitle, { color: community.text, textAlign: 'center' }]}>{copy.feed.emptyTitle}</Text>
            <Text style={[styles.stateText, { color: community.textSecondary, textAlign: 'center' }]}>{copy.feed.emptyText}</Text>
            <Pressable onPress={() => openComposer()} style={styles.emptyCta}>
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text style={styles.emptyCtaText}>{copy.feed.newPost}</Text>
            </Pressable>
          </View>
        }
        renderItem={({ item, index }) => {
          const liked = likedIds.data?.has(item.id) ?? false;
          const saved = savedIds.data?.has(item.id) ?? false;
          const isOwner = Boolean(viewerId) && viewerId === item.author_id;
          const ownerBusy =
            (visibilityMutation.isPending && visibilityMutation.variables?.postId === item.id) ||
            (deleteMutation.isPending && deleteMutation.variables?.postId === item.id);

          return (
            <View style={[styles.postStage, index % 2 === 0 ? styles.postStageA : styles.postStageB]}>
              <View pointerEvents="none" style={styles.postGlowOne} />
              <View pointerEvents="none" style={styles.postGlowTwo} />
              <View pointerEvents="none" style={styles.postGlowThree} />
              <CommunityPostCard
                post={item}
                author={authorById.get(item.author_id)}
                onPress={() => navigation.navigate('CommunityPostDetail', { postId: item.id })}
                onPressAuthor={() => navigation.navigate('TeacherCommunityProfile', { teacherId: item.author_id })}
                liked={liked}
                saved={saved}
                onToggleLike={() => likeMutation.mutate({ postId: item.id, liked })}
                onToggleSave={() => saveMutation.mutate({ postId: item.id, saved })}
                likePending={likeMutation.isPending && likeMutation.variables?.postId === item.id}
                savePending={saveMutation.isPending && saveMutation.variables?.postId === item.id}
                isOwner={isOwner}
                onEdit={() => navigation.navigate('EditCommunityPost', { postId: item.id })}
                onDeletePost={() => handleDeletePost(item)}
                onToggleVisibility={() => handleToggleVisibility(item)}
                ownerBusy={ownerBusy}
                showHiddenBadge={isOwner && item.status === 'hidden'}
              />
            </View>
          );
        }}
        ListFooterComponent={
          feed.isFetchingNextPage ? (
            <View style={styles.footerLoading}>
              <ActivityIndicator color={community.primary} />
              <Text style={{ color: '#526B89', fontSize: 12 }}>{copy.feed.loadingMore}</Text>
            </View>
          ) : (
            <View style={{ height: 28 }} />
          )
        }
      />
    </Screen>
  );
}

function FeedSkeleton({ community }: { community: ReturnType<typeof getCommunityTheme> }) {
  return (
    <View style={{ flex: 1 }}>
      <View style={styles.skeletonHero}>
        <View style={styles.skeletonIconDark} />
        <View style={styles.skeletonTitleDark} />
        <View style={styles.skeletonIconDark} />
      </View>
      {[0, 1].map((item) => (
        <View key={item} style={[styles.skeletonPost, { backgroundColor: community.surface, borderColor: community.border }]}> 
          <View style={styles.skeletonAuthor}>
            <View style={[styles.skeletonAvatar, { backgroundColor: community.surfaceRaised }]} />
            <View style={{ flex: 1, gap: 7 }}>
              <View style={[styles.skeletonLineShort, { backgroundColor: community.surfaceRaised }]} />
              <View style={[styles.skeletonLineTiny, { backgroundColor: community.surfaceRaised }]} />
            </View>
          </View>
          <View style={[styles.skeletonLine, { backgroundColor: community.surfaceRaised }]} />
          <View style={[styles.skeletonLineMedium, { backgroundColor: community.surfaceRaised }]} />
          <View style={[styles.skeletonMedia, { backgroundColor: community.surfaceRaised }]} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 24 },
  loadingPage: { flex: 1, padding: 0, paddingHorizontal: 0, paddingVertical: 0 },
  listPage: { padding: 0, paddingHorizontal: 0, paddingVertical: 0 },
  listContent: { paddingBottom: 0, backgroundColor: '#F2F8FF' },
  pressedScale: { transform: [{ scale: 0.96 }], opacity: 0.9 },

  header: { width: '100%', paddingBottom: 0, backgroundColor: '#F2F8FF' },
  hero: {
    minHeight: 178,
    backgroundColor: '#031E42',
    overflow: 'hidden',
    paddingTop: 8,
    paddingBottom: 48
  },
  heroCompact: { minHeight: 166, paddingBottom: 44 },
  heroDeepLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#031E42'
  },
  heroRoyalLayer: {
    position: 'absolute',
    left: '34%',
    right: -80,
    top: -10,
    bottom: -20,
    backgroundColor: '#07569A',
    opacity: 0.44,
    borderTopLeftRadius: 180,
    borderBottomLeftRadius: 180
  },
  heroOrbA: {
    position: 'absolute',
    width: 255,
    height: 255,
    borderRadius: 128,
    backgroundColor: 'rgba(14,92,167,0.55)',
    top: -160,
    right: -70
  },
  heroOrbB: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(10,81,153,0.42)',
    left: -142,
    bottom: -210
  },
  heroOrbC: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(52,132,211,0.16)',
    left: '35%',
    top: -72
  },
  heroGlow: {
    position: 'absolute',
    width: 270,
    height: 160,
    borderRadius: 135,
    backgroundColor: 'rgba(70,157,238,0.10)',
    left: '22%',
    bottom: -34
  },
  heroBook: { position: 'absolute', right: '22%', bottom: -34, transform: [{ rotate: '-8deg' }] },
  goldCurveA: {
    position: 'absolute',
    width: 122,
    height: 122,
    borderRadius: 61,
    borderWidth: 1.5,
    borderColor: 'rgba(241,201,90,0.55)',
    left: -72,
    top: 4
  },
  goldCurveB: {
    position: 'absolute',
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 1,
    borderColor: 'rgba(214,165,37,0.48)',
    right: -54,
    bottom: 4
  },
  topBar: {
    paddingHorizontal: 16,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    flexDirection: 'row',
    gap: 8
  },
  sideHeroAction: { width: 66, alignItems: 'center' },
  brandLockup: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 3, minWidth: 0 },
  titleRow: { alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%' },
  spaceTitle: { color: '#FFFFFF', fontSize: 29, fontWeight: '900', letterSpacing: -0.45, maxWidth: '82%' },
  spaceTitleCompact: { fontSize: 25 },
  spaceSubtitle: { color: 'rgba(255,255,255,0.80)', fontSize: 13.2, fontWeight: '700', marginTop: 9, textAlign: 'center', width: '100%' },
  spaceSubtitleCompact: { fontSize: 11.8, marginTop: 7 },
  headerIcon: {
    width: 58,
    height: 58,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.11)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.19)',
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3
  },
  sideHeroText: {
    color: '#F1C95A',
    fontSize: 9.6,
    lineHeight: 14,
    textAlign: 'center',
    fontWeight: '700',
    marginTop: 6
  },
  sideGoldLine: { width: 28, height: 2.5, borderRadius: 2, backgroundColor: '#F1C95A', marginTop: 4 },

  composerShell: {
    position: 'relative',
    marginHorizontal: 16,
    marginTop: -39,
    zIndex: 3
  },
  composerShellCompact: { marginHorizontal: 12, marginTop: -36 },
  composerHaloOuter: {
    position: 'absolute',
    top: -8,
    bottom: -8,
    left: -8,
    right: -8,
    borderRadius: 40,
    backgroundColor: 'rgba(241,201,90,0.13)'
  },
  composerHaloInner: {
    position: 'absolute',
    top: -3,
    bottom: -3,
    left: -3,
    right: -3,
    borderRadius: 37,
    backgroundColor: 'rgba(255,255,255,0.52)'
  },
  composerCard: {
    borderWidth: 1.5,
    borderColor: '#DDB33C',
    borderRadius: 36,
    minHeight: 178,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    gap: 12,
    shadowColor: '#3576BA',
    shadowOpacity: 0.17,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8
  },
  composerSoftBlue: {
    position: 'absolute',
    top: -66,
    left: 78,
    right: 34,
    height: 128,
    borderRadius: 70,
    backgroundColor: 'rgba(226,240,255,0.62)'
  },
  composerGoldShape: {
    position: 'absolute',
    width: 195,
    height: 96,
    borderRadius: 90,
    left: -74,
    bottom: -54,
    backgroundColor: 'rgba(255,243,211,0.92)',
    transform: [{ rotate: '10deg' }]
  },
  composerGoldShapeTwo: {
    position: 'absolute',
    width: 115,
    height: 65,
    borderRadius: 55,
    right: -34,
    bottom: -30,
    backgroundColor: 'rgba(241,201,90,0.12)',
    transform: [{ rotate: '-12deg' }]
  },
  sparkleOne: {
    position: 'absolute',
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#F1C95A',
    right: 15,
    top: 13,
    opacity: 0.9,
    transform: [{ rotate: '45deg' }]
  },
  composerTopRow: { alignItems: 'center', gap: 8 },
  composerAvatarOuter: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2.5,
    borderColor: '#D8E8FB',
    backgroundColor: '#F8FBFF',
    alignItems: 'center',
    justifyContent: 'center'
  },
  composerAvatarOuterCompact: { width: 58, height: 58, borderRadius: 29 },
  composerAvatarInner: {
    width: 55,
    height: 55,
    borderRadius: 28,
    backgroundColor: '#EAF4FF',
    alignItems: 'center',
    justifyContent: 'center'
  },
  composerAvatarInnerCompact: { width: 47, height: 47, borderRadius: 24 },
  statusDot: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#D6A525',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    right: -2,
    bottom: 3
  },
  composerPromptBox: {
    flex: 1,
    minHeight: 82,
    borderRadius: 28,
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: 'center',
    backgroundColor: '#F8FBFF',
    borderWidth: 1,
    borderColor: '#E4EBF4'
  },
  composerPressed: { backgroundColor: '#F0F7FF' },
  composerPrompt: {
    color: '#365779',
    fontSize: 18.2,
    lineHeight: 28,
    fontWeight: '800',
    width: '100%',
    textAlign: 'center'
  },
  composerPromptCompact: { fontSize: 15.2, lineHeight: 23 },
  publishButtonOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: '#F1C95A',
    padding: 4,
    backgroundColor: '#FFF8DE',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#062D5B',
    shadowOpacity: 0.22,
    shadowRadius: 13,
    shadowOffset: { width: 0, height: 7 },
    elevation: 6
  },
  publishButtonOuterCompact: { width: 62, height: 62, borderRadius: 31 },
  publishButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#07569A',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  publishButtonCompact: { width: 50, height: 50, borderRadius: 25 },
  publishHighlight: {
    position: 'absolute',
    width: 64,
    height: 30,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.12)',
    top: -8,
    right: -16,
    transform: [{ rotate: '-18deg' }]
  },
  quickKinds: { gap: 9, alignItems: 'center', justifyContent: 'center' },
  quickKind: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    minHeight: 45,
    flex: 1
  },
  quickKindImage: { backgroundColor: '#E2F0FF' },
  quickKindQuestion: { backgroundColor: '#EFE6FF' },
  quickKindFile: { backgroundColor: '#FFF3D3' },
  quickKindText: { fontSize: 12.5, fontWeight: '900' },
  quickPressed: { transform: [{ scale: 0.97 }], opacity: 0.84 },

  filtersWrap: {
    position: 'relative',
    overflow: 'hidden',
    paddingTop: 17,
    paddingBottom: 15,
    backgroundColor: '#F2F8FF'
  },
  filtersGlowA: {
    position: 'absolute',
    width: 250,
    height: 145,
    borderRadius: 120,
    backgroundColor: 'rgba(226,240,255,0.78)',
    left: -92,
    top: -46
  },
  filtersGlowB: {
    position: 'absolute',
    width: 230,
    height: 150,
    borderRadius: 110,
    backgroundColor: 'rgba(190,222,250,0.45)',
    right: -78,
    bottom: -70
  },
  filtersContent: { paddingHorizontal: 14, gap: 10 },
  filterChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 16,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 7,
    shadowColor: '#3576BA',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3
  },
  filterText: { fontSize: 12.4, fontWeight: '900' },
  filterTextCompact: { fontSize: 11.2 },

  postStage: {
    position: 'relative',
    paddingVertical: 7,
    overflow: 'hidden',
    backgroundColor: '#F2F8FF'
  },
  postStageA: { backgroundColor: '#F2F8FF' },
  postStageB: { backgroundColor: '#EEF7FF' },
  postGlowOne: {
    position: 'absolute',
    width: 360,
    height: 360,
    borderRadius: 180,
    right: -210,
    top: -166,
    backgroundColor: 'rgba(7,86,154,0.055)'
  },
  postGlowTwo: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    left: -180,
    bottom: -116,
    backgroundColor: 'rgba(126,190,245,0.10)'
  },
  postGlowThree: {
    position: 'absolute',
    width: 210,
    height: 210,
    borderRadius: 105,
    left: '26%',
    top: 22,
    backgroundColor: 'rgba(234,244,255,0.48)'
  },

  stateIcon: { width: 56, height: 56, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  stateTitle: { fontWeight: '900', fontSize: 18 },
  stateText: { lineHeight: 21, fontSize: 13 },
  retryButton: {
    minHeight: 46,
    borderRadius: 14,
    paddingHorizontal: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#062D5B'
  },
  retryText: { color: '#FFFFFF', fontWeight: '900', fontSize: 14 },
  emptyCard: {
    borderWidth: 1,
    borderRadius: 28,
    padding: 25,
    gap: 9,
    alignItems: 'center',
    margin: 18,
    shadowColor: '#3576BA',
    shadowOpacity: 0.13,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 7 },
    elevation: 4
  },
  emptyCta: {
    marginTop: 6,
    minHeight: 44,
    borderRadius: 15,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#062D5B'
  },
  emptyCtaText: { color: '#FFFFFF', fontWeight: '900', fontSize: 12.5 },
  footerLoading: { paddingVertical: 22, alignItems: 'center', gap: 6 },

  skeletonHero: {
    height: 176,
    paddingHorizontal: 18,
    backgroundColor: '#031E42',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  skeletonTitleDark: { width: 145, height: 24, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.12)' },
  skeletonIconDark: { width: 58, height: 58, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.10)' },
  skeletonPost: {
    marginHorizontal: 16,
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 28,
    paddingTop: 14,
    paddingBottom: 16,
    gap: 11,
    overflow: 'hidden'
  },
  skeletonAuthor: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16 },
  skeletonAvatar: { width: 50, height: 50, borderRadius: 25 },
  skeletonLine: { height: 12, borderRadius: 6, marginHorizontal: 16 },
  skeletonLineMedium: { width: '66%', height: 12, borderRadius: 6, marginHorizontal: 16 },
  skeletonLineShort: { width: 132, height: 11, borderRadius: 6 },
  skeletonLineTiny: { width: 88, height: 8, borderRadius: 5 },
  skeletonMedia: { marginHorizontal: 12, borderRadius: 20, aspectRatio: 1.18, marginTop: 2 }
});