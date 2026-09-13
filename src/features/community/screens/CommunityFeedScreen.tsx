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
  const align = isRTL ? ('right' as const) : ('left' as const);
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
        <Ionicons name="book-outline" size={108} color="rgba(255,255,255,0.045)" style={styles.heroBook} />

        <View style={styles.topBar}>
          <Pressable onPress={openComposer} style={styles.headerIcon}>
            <Ionicons name="add" size={27} color="#FFFFFF" />
          </Pressable>

          <View style={styles.brandLockup}>
            <View style={[styles.titleRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Ionicons name="school" size={29} color="#E8BE4C" />
              <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.88} style={styles.spaceTitle}>
                {copy.feed.title}
              </Text>
            </View>
            <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.9} style={styles.spaceSubtitle}>
              {copy.feed.subtitle}
            </Text>
          </View>

          <Pressable onPress={() => navigation.navigate('SavedCommunityPosts')} style={styles.headerIcon}>
            <Ionicons name="bookmark-outline" size={23} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>

      <Pressable
        onPress={openComposer}
        style={({ pressed }) => [
          styles.composerCard,
          {
            opacity: pressed ? 0.94 : 1,
            shadowColor: community.isDark ? '#000000' : '#799BC1'
          }
        ]}
      >
        <View style={styles.composerGlowTop} />
        <View style={styles.composerGoldShape} />

        <View style={[styles.composerTopRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}> 
          <View style={styles.composerAvatarOuter}>
            <View style={styles.composerAvatarInner}>
              <Ionicons name="person" size={25} color="#0E2B58" />
            </View>
            <View style={styles.onlineDot} />
          </View>

          <View style={styles.composerPromptBox}>
            <Text numberOfLines={2} style={[styles.composerPrompt, { textAlign: align }]}>
              {social.composerPrompt}
            </Text>
          </View>

          <View style={styles.publishButtonOuter}>
            <View style={styles.publishButton}>
              <Ionicons name="paper-plane" size={25} color="#FFFFFF" />
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

      <View style={styles.filtersWrap}>
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
                    borderColor: active ? '#17396A' : '#D4E0EF',
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
      <View style={styles.feedBackdropTop} />
    </View>
  );

  if (feed.isLoading) {
    return (
      <Screen style={{ ...styles.loadingPage, backgroundColor: '#EAF4FF' }}>
        <FeedSkeleton community={community} />
      </Screen>
    );
  }

  if (feed.isError) {
    return (
      <Screen style={{ ...styles.center, backgroundColor: community.background }}>
        <View style={[styles.stateIcon, { backgroundColor: community.primarySoft }]}><Ionicons name="cloud-offline-outline" size={30} color={community.primary} /></View>
        <Text style={[styles.stateTitle, { color: community.text }]}>{copy.feed.loadError}</Text>
        <Text style={[styles.stateText, { color: community.textSecondary }]}>{copy.feed.loadErrorText}</Text>
        <Pressable onPress={() => feed.refetch()} style={styles.retryButton}><Text style={styles.retryText}>{copy.feed.retry}</Text></Pressable>
      </Screen>
    );
  }

  return (
    <Screen style={{ ...styles.listPage, backgroundColor: community.isDark ? community.background : '#D7E9FC' }}>
      <FlatList
        data={visiblePosts}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={header}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={feed.isRefetching && !feed.isFetchingNextPage} onRefresh={() => feed.refetch()} tintColor={community.primary} />}
        onEndReachedThreshold={0.45}
        onEndReached={() => { if (feed.hasNextPage && !feed.isFetchingNextPage) feed.fetchNextPage(); }}
        ListEmptyComponent={
          <View style={[styles.emptyCard, { backgroundColor: community.surface, borderColor: '#D8E6F5' }]}> 
            <View style={[styles.stateIcon, { backgroundColor: community.primarySoft }]}><Ionicons name="chatbubbles-outline" size={28} color={community.primaryStrong} /></View>
            <Text style={[styles.stateTitle, { color: community.text, textAlign: 'center' }]}>{copy.feed.emptyTitle}</Text>
            <Text style={[styles.stateText, { color: community.textSecondary, textAlign: 'center' }]}>{copy.feed.emptyText}</Text>
            <Pressable onPress={openComposer} style={styles.emptyCta}><Ionicons name="add" size={18} color="#FFFFFF" /><Text style={styles.emptyCtaText}>{copy.feed.newPost}</Text></Pressable>
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
              <View style={styles.postGlowOne} />
              <View style={styles.postGlowTwo} />
              <View style={styles.postGlowThree} />
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
        ListFooterComponent={feed.isFetchingNextPage ? <View style={styles.footerLoading}><ActivityIndicator color={community.primary} /><Text style={{ color: community.textMuted, fontSize: 12 }}>{copy.feed.loadingMore}</Text></View> : <View style={{ height: 28 }} />}
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
          <View style={styles.skeletonAuthor}><View style={[styles.skeletonAvatar, { backgroundColor: community.surfaceRaised }]} /><View style={{ flex: 1, gap: 7 }}><View style={[styles.skeletonLineShort, { backgroundColor: community.surfaceRaised }]} /><View style={[styles.skeletonLineTiny, { backgroundColor: community.surfaceRaised }]} /></View></View>
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
  header: { width: '100%', paddingBottom: 0, backgroundColor: '#EAF4FF' },
  hero: { minHeight: 154, backgroundColor: '#0B1833', overflow: 'hidden', paddingTop: 10, paddingBottom: 22 },
  heroOrbA: { position: 'absolute', width: 210, height: 210, borderRadius: 105, backgroundColor: 'rgba(21,76,143,0.40)', top: -138, right: -58 },
  heroOrbB: { position: 'absolute', width: 230, height: 230, borderRadius: 115, backgroundColor: 'rgba(21,67,126,0.25)', left: -102, bottom: -178 },
  heroGlow: { position: 'absolute', width: 150, height: 170, borderRadius: 80, backgroundColor: 'rgba(46,106,188,0.10)', left: '38%', top: -36 },
  heroBook: { position: 'absolute', right: 86, bottom: -26, transform: [{ rotate: '-8deg' }] },
  topBar: { paddingHorizontal: 18, alignItems: 'flex-start', justifyContent: 'space-between', flexDirection: 'row', gap: 10 },
  brandLockup: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 1, minWidth: 0 },
  titleRow: { alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%' },
  spaceTitle: { color: '#FFFFFF', fontSize: 27, fontWeight: '900', letterSpacing: -0.35, maxWidth: '82%' },
  spaceSubtitle: { color: '#D6E0EC', fontSize: 12.2, fontWeight: '700', marginTop: 7, textAlign: 'center', width: '100%' },
  headerIcon: { width: 48, height: 48, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.09)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)' },
  composerCard: { marginHorizontal: 13, marginTop: -34, borderWidth: 1.25, borderColor: '#E3BC4D', borderRadius: 28, minHeight: 154, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#FFFDF9', overflow: 'hidden', shadowOpacity: 0.22, shadowRadius: 19, shadowOffset: { width: 0, height: 9 }, elevation: 8, gap: 10 },
  composerGlowTop: { position: 'absolute', top: -52, left: 64, right: 26, height: 96, borderRadius: 50, backgroundColor: 'rgba(232,244,255,0.68)' },
  composerGoldShape: { position: 'absolute', width: 160, height: 82, borderRadius: 82, left: -58, bottom: -45, backgroundColor: 'rgba(244,205,91,0.18)', transform: [{ rotate: '12deg' }] },
  composerTopRow: { alignItems: 'center', gap: 9 },
  composerAvatarOuter: { width: 52, height: 52, borderRadius: 27, borderWidth: 2, borderColor: '#D8E8FB', backgroundColor: '#F7FBFF', alignItems: 'center', justifyContent: 'center' },
  composerAvatarInner: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#E8F1FD', alignItems: 'center', justifyContent: 'center' },
  onlineDot: { position: 'absolute', width: 13, height: 13, borderRadius: 7, backgroundColor: '#7ABD3A', borderWidth: 2, borderColor: '#FFFFFF', right: -1, bottom: 1 },
  composerPromptBox: { flex: 1, minHeight: 66, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, justifyContent: 'center', backgroundColor: '#F3F7FC', borderWidth: 1, borderColor: '#DEE8F3', shadowColor: '#B4C8DD', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 1, transform: [{ translateY: -4 }] },
  composerPrompt: { color: '#294363', fontSize: 15.2, lineHeight: 21.5, fontWeight: '800' },
  publishButtonOuter: { width: 58, height: 58, borderRadius: 29, borderWidth: 2, borderColor: '#E7B837', padding: 4, backgroundColor: '#FFF7DE', alignItems: 'center', justifyContent: 'center', transform: [{ translateY: -3 }] },
  publishButton: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#17396A', alignItems: 'center', justifyContent: 'center', shadowColor: '#17396A', shadowOpacity: 0.23, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  quickKinds: { gap: 8, alignItems: 'center', justifyContent: 'center' },
  quickKind: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7, minHeight: 34, flex: 1 },
  quickKindImage: { backgroundColor: '#E8F2FF' },
  quickKindQuestion: { backgroundColor: '#F2ECFF' },
  quickKindFile: { backgroundColor: '#FFF4D9' },
  quickKindText: { fontSize: 11, fontWeight: '900' },
  filtersWrap: { paddingTop: 12, paddingBottom: 14, backgroundColor: '#EAF4FF' },
  filtersContent: { paddingHorizontal: 13, gap: 9 },
  filterChip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 13, paddingVertical: 8, minHeight: 39, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 6, shadowColor: '#7898BA', shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
  filterText: { fontSize: 11.2, fontWeight: '900' },
  feedBackdropTop: { height: 16, backgroundColor: '#DCEEFF' },
  postStage: { position: 'relative', paddingVertical: 8, overflow: 'hidden' },
  postStageA: { backgroundColor: '#DCEEFF' },
  postStageB: { backgroundColor: '#CFE4FA' },
  postGlowOne: { position: 'absolute', width: 280, height: 280, borderRadius: 140, right: -118, top: -82, backgroundColor: 'rgba(92,151,218,0.24)' },
  postGlowTwo: { position: 'absolute', width: 230, height: 230, borderRadius: 115, left: -128, bottom: -66, backgroundColor: 'rgba(185,218,250,0.58)' },
  postGlowThree: { position: 'absolute', width: 170, height: 170, borderRadius: 85, left: '31%', top: 24, backgroundColor: 'rgba(247,251,255,0.38)' },
  stateIcon: { width: 56, height: 56, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  stateTitle: { fontWeight: '900', fontSize: 18 },
  stateText: { lineHeight: 21, fontSize: 13 },
  retryButton: { minHeight: 46, borderRadius: 14, paddingHorizontal: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1E3A66' },
  retryText: { color: '#FFFFFF', fontWeight: '900', fontSize: 14 },
  emptyCard: { borderWidth: 1, borderRadius: 22, padding: 25, gap: 9, alignItems: 'center', margin: 16, shadowColor: '#7898BA', shadowOpacity: 0.18, shadowRadius: 13, shadowOffset: { width: 0, height: 6 }, elevation: 4 },
  emptyCta: { marginTop: 6, minHeight: 42, borderRadius: 13, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#1E3A66' },
  emptyCtaText: { color: '#FFFFFF', fontWeight: '900', fontSize: 12.5 },
  footerLoading: { paddingVertical: 22, alignItems: 'center', gap: 6 },
  skeletonHero: { height: 154, paddingHorizontal: 18, backgroundColor: '#0B1833', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  skeletonTitleDark: { width: 145, height: 24, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.12)' },
  skeletonIconDark: { width: 48, height: 48, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.10)' },
  skeletonPost: { marginHorizontal: 12, marginTop: 12, borderWidth: 1, borderRadius: 22, paddingTop: 13, paddingBottom: 15, gap: 11, overflow: 'hidden' },
  skeletonAuthor: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14 },
  skeletonAvatar: { width: 42, height: 42, borderRadius: 21 },
  skeletonLine: { height: 12, borderRadius: 6, marginHorizontal: 14 },
  skeletonLineMedium: { width: '66%', height: 12, borderRadius: 6, marginHorizontal: 14 },
  skeletonLineShort: { width: 118, height: 11, borderRadius: 6 },
  skeletonLineTiny: { width: 82, height: 8, borderRadius: 5 },
  skeletonMedia: { marginHorizontal: 10, borderRadius: 16, aspectRatio: 1.18, marginTop: 2 }
});