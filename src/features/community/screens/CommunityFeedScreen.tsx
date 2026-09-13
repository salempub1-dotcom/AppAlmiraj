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

  const openComposer = () => navigation.navigate('CreateCommunityPost');

  const header = (
    <View style={styles.header}>
      <View style={styles.hero}>
        <View style={styles.heroOrbA} />
        <View style={styles.heroOrbB} />
        <View style={styles.heroGlow} />
        <Ionicons name="book-outline" size={112} color="rgba(255,255,255,0.055)" style={styles.heroBook} />

        <View style={styles.topBar}>
          <Pressable onPress={openComposer} style={styles.headerIcon}>
            <Ionicons name="add" size={28} color="#FFFFFF" />
          </Pressable>

          <View style={styles.brandLockup}>
            <View style={[styles.titleRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Ionicons name="school" size={30} color="#F0C343" />
              <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.9} style={styles.spaceTitle}>
                {copy.feed.title}
              </Text>
            </View>
            <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.9} style={styles.spaceSubtitle}>
              {copy.feed.subtitle}
            </Text>
          </View>

          <Pressable onPress={() => navigation.navigate('SavedCommunityPosts')} style={styles.headerIcon}>
            <Ionicons name="bookmark-outline" size={24} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>

      <View style={styles.composerShell}>
        <View pointerEvents="none" style={styles.composerHaloOuter} />
        <View pointerEvents="none" style={styles.composerHaloInner} />
        <Pressable
          onPress={openComposer}
          style={({ pressed }) => [styles.composerCard, { opacity: pressed ? 0.95 : 1 }]}
        >
          <View style={styles.composerSoftBlue} />
          <View style={styles.composerGoldShape} />

          <View style={[styles.composerTopRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}> 
            <View style={styles.composerAvatarOuter}>
              <View style={styles.composerAvatarInner}>
                <Ionicons name="person" size={23} color="#0E2B58" />
              </View>
              <View style={styles.onlineDot} />
            </View>

            <View style={styles.composerPromptBox}>
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.84}
                style={styles.composerPrompt}
              >
                {language === 'ar' ? 'ماذا ستشارك مع زملائك اليوم' : social.composerPrompt}
              </Text>
            </View>

            <View style={styles.publishButtonOuter}>
              <View style={styles.publishButton}>
                <Ionicons name="paper-plane" size={24} color="#FFFFFF" />
              </View>
            </View>
          </View>

          <View style={[styles.quickKinds, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={[styles.quickKind, styles.quickKindImage]}>
              <Ionicons name="image-outline" size={18} color="#2564C8" />
              <Text style={[styles.quickKindText, { color: '#2564C8' }]}>{language === 'ar' ? 'صورة' : 'Photo'}</Text>
            </View>
            <View style={[styles.quickKind, styles.quickKindQuestion]}>
              <Ionicons name="help-circle-outline" size={18} color="#7447D4" />
              <Text style={[styles.quickKindText, { color: '#7447D4' }]}>{language === 'ar' ? 'سؤال' : 'Question'}</Text>
            </View>
            <View style={[styles.quickKind, styles.quickKindFile]}>
              <Ionicons name="document-text-outline" size={18} color="#966400" />
              <Text style={[styles.quickKindText, { color: '#966400' }]}>{language === 'ar' ? 'ملف' : 'File'}</Text>
            </View>
          </View>
        </Pressable>
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
                    backgroundColor: active ? '#17396A' : '#FFFFFF',
                    borderColor: active ? '#17396A' : 'rgba(255,255,255,0.92)',
                    opacity: pressed ? 0.82 : 1
                  }
                ]}
              >
                <Ionicons name={FILTER_ICONS[filter]} size={17} color={active ? '#FFFFFF' : '#17396A'} />
                <Text style={[styles.filterText, { color: active ? '#FFFFFF' : '#17396A' }]}>{social.filters[filter]}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );

  if (feed.isLoading) {
    return (
      <Screen style={{ ...styles.loadingPage, backgroundColor: '#2F96E5' }}>
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
    <Screen style={{ ...styles.listPage, backgroundColor: community.isDark ? community.background : '#258EDC' }}>
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
            <Pressable onPress={openComposer} style={styles.emptyCta}>
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
              <Text style={{ color: '#E9F5FF', fontSize: 12 }}>{copy.feed.loadingMore}</Text>
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
  listContent: { paddingBottom: 0 },

  header: { width: '100%', paddingBottom: 0, backgroundColor: '#56ACED' },
  hero: {
    minHeight: 154,
    backgroundColor: '#0B1833',
    overflow: 'hidden',
    paddingTop: 10,
    paddingBottom: 22
  },
  heroOrbA: {
    position: 'absolute',
    width: 228,
    height: 228,
    borderRadius: 114,
    backgroundColor: 'rgba(26,104,212,0.58)',
    top: -138,
    right: -68
  },
  heroOrbB: {
    position: 'absolute',
    width: 244,
    height: 244,
    borderRadius: 122,
    backgroundColor: 'rgba(37,128,223,0.34)',
    left: -106,
    bottom: -184
  },
  heroGlow: {
    position: 'absolute',
    width: 220,
    height: 180,
    borderRadius: 100,
    backgroundColor: 'rgba(48,136,235,0.14)',
    left: '29%',
    top: -26
  },
  heroBook: { position: 'absolute', right: 78, bottom: -28, transform: [{ rotate: '-8deg' }] },
  topBar: {
    paddingHorizontal: 18,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    flexDirection: 'row',
    gap: 10
  },
  brandLockup: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 1, minWidth: 0 },
  titleRow: { alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%' },
  spaceTitle: { color: '#FFFFFF', fontSize: 28, fontWeight: '900', letterSpacing: -0.45, maxWidth: '83%' },
  spaceSubtitle: { color: '#E4EDF7', fontSize: 12.2, fontWeight: '700', marginTop: 7, textAlign: 'center', width: '100%' },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.09)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)'
  },

  composerShell: {
    position: 'relative',
    marginHorizontal: 24,
    marginTop: -34,
    zIndex: 3
  },
  composerHaloOuter: {
    position: 'absolute',
    top: -8,
    bottom: -8,
    left: -8,
    right: -8,
    borderRadius: 34,
    backgroundColor: 'rgba(255,197,42,0.22)'
  },
  composerHaloInner: {
    position: 'absolute',
    top: -4,
    bottom: -4,
    left: -4,
    right: -4,
    borderRadius: 32,
    backgroundColor: 'rgba(255,220,83,0.28)'
  },
  composerCard: {
    borderWidth: 1.5,
    borderColor: '#E8BE4C',
    borderRadius: 28,
    minHeight: 138,
    paddingHorizontal: 12,
    paddingVertical: 11,
    backgroundColor: '#FFFDF9',
    overflow: 'hidden',
    gap: 9,
    shadowColor: '#B68400',
    shadowOpacity: 0.2,
    shadowRadius: 11,
    shadowOffset: { width: 0, height: 5 },
    elevation: 7
  },
  composerSoftBlue: {
    position: 'absolute',
    top: -52,
    left: 42,
    right: 22,
    height: 92,
    borderRadius: 52,
    backgroundColor: 'rgba(224,240,255,0.72)'
  },
  composerGoldShape: {
    position: 'absolute',
    width: 146,
    height: 72,
    borderRadius: 74,
    left: -48,
    bottom: -40,
    backgroundColor: 'rgba(244,205,91,0.16)',
    transform: [{ rotate: '12deg' }]
  },
  composerTopRow: { alignItems: 'center', gap: 6 },
  composerAvatarOuter: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    borderColor: '#D8E8FB',
    backgroundColor: '#F7FBFF',
    alignItems: 'center',
    justifyContent: 'center'
  },
  composerAvatarInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F1FD',
    alignItems: 'center',
    justifyContent: 'center'
  },
  onlineDot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#7ABD3A',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    right: -1,
    bottom: 1
  },
  composerPromptBox: {
    flex: 1,
    minHeight: 54,
    borderRadius: 19,
    paddingHorizontal: 8,
    paddingVertical: 7,
    justifyContent: 'center',
    backgroundColor: '#F3F7FC',
    borderWidth: 1,
    borderColor: '#DEE8F3'
  },
  composerPrompt: {
    color: '#17396A',
    fontSize: 14.4,
    lineHeight: 19,
    fontWeight: '900',
    width: '100%',
    textAlign: 'center'
  },
  publishButtonOuter: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: '#E7B837',
    padding: 4,
    backgroundColor: '#FFF7DE',
    alignItems: 'center',
    justifyContent: 'center'
  },
  publishButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#17396A',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#17396A',
    shadowOpacity: 0.23,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4
  },
  quickKinds: { gap: 8, alignItems: 'center', justifyContent: 'center' },
  quickKind: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    minHeight: 34,
    flex: 1
  },
  quickKindImage: { backgroundColor: '#E8F2FF' },
  quickKindQuestion: { backgroundColor: '#F2ECFF' },
  quickKindFile: { backgroundColor: '#FFF4D9' },
  quickKindText: { fontSize: 11, fontWeight: '900' },

  filtersWrap: {
    position: 'relative',
    overflow: 'hidden',
    paddingTop: 18,
    paddingBottom: 14,
    backgroundColor: '#55ACEF'
  },
  filtersGlowA: {
    position: 'absolute',
    width: 250,
    height: 145,
    borderRadius: 120,
    backgroundColor: 'rgba(207,235,255,0.48)',
    left: -92,
    top: -46
  },
  filtersGlowB: {
    position: 'absolute',
    width: 230,
    height: 150,
    borderRadius: 110,
    backgroundColor: 'rgba(28,128,223,0.30)',
    right: -78,
    bottom: -70
  },
  filtersContent: { paddingHorizontal: 13, gap: 9 },
  filterChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 8,
    minHeight: 39,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    shadowColor: '#1B5D96',
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4
  },
  filterText: { fontSize: 11.2, fontWeight: '900' },

  postStage: {
    position: 'relative',
    paddingVertical: 8,
    overflow: 'hidden'
  },
  postStageA: { backgroundColor: '#3F9EE8' },
  postStageB: { backgroundColor: '#2F91DF' },
  postGlowOne: {
    position: 'absolute',
    width: 360,
    height: 360,
    borderRadius: 180,
    right: -170,
    top: -136,
    backgroundColor: 'rgba(11,94,185,0.30)'
  },
  postGlowTwo: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    left: -160,
    bottom: -96,
    backgroundColor: 'rgba(198,230,255,0.52)'
  },
  postGlowThree: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    left: '24%',
    top: 18,
    backgroundColor: 'rgba(112,189,245,0.27)'
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
    backgroundColor: '#1E3A66'
  },
  retryText: { color: '#FFFFFF', fontWeight: '900', fontSize: 14 },
  emptyCard: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 25,
    gap: 9,
    alignItems: 'center',
    margin: 16,
    shadowColor: '#114F88',
    shadowOpacity: 0.2,
    shadowRadius: 13,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4
  },
  emptyCta: {
    marginTop: 6,
    minHeight: 42,
    borderRadius: 13,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#1E3A66'
  },
  emptyCtaText: { color: '#FFFFFF', fontWeight: '900', fontSize: 12.5 },
  footerLoading: { paddingVertical: 22, alignItems: 'center', gap: 6 },

  skeletonHero: {
    height: 154,
    paddingHorizontal: 18,
    backgroundColor: '#0B1833',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  skeletonTitleDark: { width: 145, height: 24, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.12)' },
  skeletonIconDark: { width: 48, height: 48, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.10)' },
  skeletonPost: {
    marginHorizontal: 12,
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 22,
    paddingTop: 13,
    paddingBottom: 15,
    gap: 11,
    overflow: 'hidden'
  },
  skeletonAuthor: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14 },
  skeletonAvatar: { width: 42, height: 42, borderRadius: 21 },
  skeletonLine: { height: 12, borderRadius: 6, marginHorizontal: 14 },
  skeletonLineMedium: { width: '66%', height: 12, borderRadius: 6, marginHorizontal: 14 },
  skeletonLineShort: { width: 118, height: 11, borderRadius: 6 },
  skeletonLineTiny: { width: 82, height: 8, borderRadius: 5 },
  skeletonMedia: { marginHorizontal: 10, borderRadius: 16, aspectRatio: 1.18, marginTop: 2 }
});