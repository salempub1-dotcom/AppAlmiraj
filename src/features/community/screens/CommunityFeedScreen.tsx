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

const FEED_FILTERS: FeedFilter[] = ['all', 'idea', 'question', 'test', 'exam', 'resource', 'classroom_experience', 'tip'];

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
        <Ionicons name="book-outline" size={84} color="rgba(255,255,255,0.045)" style={styles.heroBook} />
        <Ionicons name="school-outline" size={64} color="rgba(229,201,106,0.07)" style={styles.heroSchool} />

        <View style={styles.topBar}>
          <Pressable onPress={() => navigation.navigate('SavedCommunityPosts')} style={styles.headerIcon}>
            <Ionicons name="bookmark-outline" size={19} color="#FFFFFF" />
          </Pressable>

          <View style={styles.brandLockup}>
            <Text style={styles.spaceTitle}>{copy.feed.title}</Text>
            <View style={styles.titleAccent} />
          </View>

          <Pressable onPress={openComposer} style={styles.headerIcon}>
            <Ionicons name="add" size={22} color="#FFFFFF" />
          </Pressable>
        </View>

        <View style={styles.welcomeStrip}>
          <Text style={[styles.spaceSubtitle, { textAlign: align }]}>{copy.feed.subtitle}</Text>
        </View>
      </View>

      <Pressable
        onPress={openComposer}
        style={({ pressed }) => [
          styles.composerCard,
          {
            backgroundColor: community.surface,
            borderColor: community.border,
            shadowColor: community.shadow,
            opacity: pressed ? 0.9 : 1,
            flexDirection: isRTL ? 'row-reverse' : 'row'
          }
        ]}
      >
        <View style={[styles.composerAvatarRing, { borderColor: community.primary }]}> 
          <View style={[styles.composerAvatar, { backgroundColor: community.primarySoft }]}> 
            <Ionicons name="school" size={18} color={community.primaryStrong} />
          </View>
        </View>
        <View style={styles.composerTextWrap}>
          <Text numberOfLines={1} style={[styles.composerPrompt, { color: community.textSecondary, textAlign: align }]}>
            {social.composerPrompt}
          </Text>
          <View style={[styles.quickKinds, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}> 
            <View style={[styles.quickKind, { backgroundColor: community.isDark ? '#172A49' : '#EAF1FF' }]}><Ionicons name="image-outline" size={13} color={community.isDark ? '#9AC1FF' : '#245B9B'} /><Text style={[styles.quickKindText, { color: community.isDark ? '#B9D2FF' : '#365A87' }]}>صورة</Text></View>
            <View style={[styles.quickKind, { backgroundColor: community.isDark ? '#2A2040' : '#F2EEFF' }]}><Ionicons name="help-circle-outline" size={13} color={community.isDark ? '#D5C7FF' : '#7650C8'} /><Text style={[styles.quickKindText, { color: community.isDark ? '#D5C7FF' : '#7650C8' }]}>سؤال</Text></View>
            <View style={[styles.quickKind, { backgroundColor: community.isDark ? '#382B13' : '#FFF4D6' }]}><Ionicons name="document-text-outline" size={13} color={community.isDark ? '#FFD978' : '#986700'} /><Text style={[styles.quickKindText, { color: community.isDark ? '#FFD978' : '#986700' }]}>ملف</Text></View>
          </View>
        </View>
        <View style={[styles.composeArrow, { backgroundColor: community.isDark ? '#203B66' : '#1E3A66' }]}>
          <Ionicons name={isRTL ? 'arrow-back' : 'arrow-forward'} size={16} color="#FFFFFF" />
        </View>
      </Pressable>

      <View style={styles.filtersWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.filtersContent, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}> 
          {FEED_FILTERS.map((filter) => {
            const active = filter === activeFilter;
            return (
              <Pressable
                key={filter}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => setActiveFilter(filter)}
                style={({ pressed }) => [
                  styles.filterChip,
                  {
                    backgroundColor: active ? (community.isDark ? '#294979' : '#1E3A66') : community.surface,
                    borderColor: active ? 'transparent' : community.border,
                    opacity: pressed ? 0.78 : 1
                  }
                ]}
              >
                <Text style={[styles.filterText, { color: active ? '#FFFFFF' : community.textSecondary }]}>{social.filters[filter]}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );

  if (feed.isLoading) {
    return (
      <Screen style={{ ...styles.loadingPage, backgroundColor: community.background }}>
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
    <Screen style={{ ...styles.listPage, backgroundColor: community.background }}>
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
          <View style={[styles.emptyCard, { backgroundColor: community.surface, borderColor: community.border }]}> 
            <View style={[styles.stateIcon, { backgroundColor: community.primarySoft }]}><Ionicons name="chatbubbles-outline" size={28} color={community.primaryStrong} /></View>
            <Text style={[styles.stateTitle, { color: community.text, textAlign: 'center' }]}>{copy.feed.emptyTitle}</Text>
            <Text style={[styles.stateText, { color: community.textSecondary, textAlign: 'center' }]}>{copy.feed.emptyText}</Text>
            <Pressable onPress={openComposer} style={styles.emptyCta}><Ionicons name="add" size={18} color="#FFFFFF" /><Text style={styles.emptyCtaText}>{copy.feed.newPost}</Text></Pressable>
          </View>
        }
        renderItem={({ item }) => {
          const liked = likedIds.data?.has(item.id) ?? false;
          const saved = savedIds.data?.has(item.id) ?? false;
          const isOwner = Boolean(viewerId) && viewerId === item.author_id;
          const ownerBusy =
            (visibilityMutation.isPending && visibilityMutation.variables?.postId === item.id) ||
            (deleteMutation.isPending && deleteMutation.variables?.postId === item.id);

          return (
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
  header: { width: '100%', paddingBottom: 4 },
  hero: { minHeight: 126, backgroundColor: '#0B1833', overflow: 'hidden', paddingBottom: 10 },
  heroOrbA: { position: 'absolute', width: 170, height: 170, borderRadius: 85, backgroundColor: 'rgba(30,58,102,0.52)', top: -95, left: -45 },
  heroOrbB: { position: 'absolute', width: 190, height: 190, borderRadius: 95, backgroundColor: 'rgba(45,63,115,0.38)', right: -75, bottom: -115 },
  heroBook: { position: 'absolute', left: 20, bottom: -20, transform: [{ rotate: '-7deg' }] },
  heroSchool: { position: 'absolute', right: 28, bottom: -9 },
  topBar: { minHeight: 64, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'space-between', flexDirection: 'row' },
  brandLockup: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  spaceTitle: { color: '#FFFFFF', fontSize: 21, fontWeight: '900', letterSpacing: -0.35 },
  titleAccent: { width: 34, height: 3, borderRadius: 99, backgroundColor: '#D4B24C', marginTop: 6 },
  headerIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.10)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' },
  welcomeStrip: { paddingHorizontal: 18, paddingTop: 5, paddingBottom: 6 },
  spaceSubtitle: { color: '#C7D3E2', fontSize: 11.5, fontWeight: '600' },
  composerCard: { marginHorizontal: 12, marginTop: -15, borderWidth: 1, borderRadius: 21, minHeight: 84, paddingHorizontal: 12, paddingVertical: 11, alignItems: 'center', gap: 10, shadowOpacity: 0.07, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 2 },
  composerAvatarRing: { width: 46, height: 46, borderRadius: 23, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  composerAvatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  composerTextWrap: { flex: 1, minWidth: 0, gap: 8 },
  composerPrompt: { fontSize: 13, fontWeight: '700' },
  quickKinds: { gap: 6, flexWrap: 'wrap' },
  quickKind: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  quickKindText: { fontSize: 9.5, fontWeight: '800' },
  composeArrow: { width: 35, height: 35, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  filtersWrap: { paddingTop: 11, paddingBottom: 5 },
  filtersContent: { paddingHorizontal: 12, gap: 7 },
  filterChip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7, minHeight: 34, justifyContent: 'center' },
  filterText: { fontSize: 11, fontWeight: '800' },
  stateIcon: { width: 56, height: 56, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  stateTitle: { fontWeight: '900', fontSize: 18 },
  stateText: { lineHeight: 21, fontSize: 13 },
  retryButton: { minHeight: 46, borderRadius: 14, paddingHorizontal: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1E3A66' },
  retryText: { color: '#FFFFFF', fontWeight: '900', fontSize: 14 },
  emptyCard: { borderWidth: 1, borderRadius: 22, padding: 25, gap: 9, alignItems: 'center', margin: 16 },
  emptyCta: { marginTop: 6, minHeight: 42, borderRadius: 13, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#1E3A66' },
  emptyCtaText: { color: '#FFFFFF', fontWeight: '900', fontSize: 12.5 },
  footerLoading: { paddingVertical: 22, alignItems: 'center', gap: 6 },
  skeletonHero: { height: 126, paddingHorizontal: 14, backgroundColor: '#0B1833', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  skeletonTitleDark: { width: 120, height: 20, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.12)' },
  skeletonIconDark: { width: 38, height: 38, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.10)' },
  skeletonPost: { marginHorizontal: 12, marginTop: 12, borderWidth: 1, borderRadius: 22, paddingTop: 13, paddingBottom: 15, gap: 11, overflow: 'hidden' },
  skeletonAuthor: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14 },
  skeletonAvatar: { width: 42, height: 42, borderRadius: 21 },
  skeletonLine: { height: 12, borderRadius: 6, marginHorizontal: 14 },
  skeletonLineMedium: { width: '66%', height: 12, borderRadius: 6, marginHorizontal: 14 },
  skeletonLineShort: { width: 118, height: 11, borderRadius: 6 },
  skeletonLineTiny: { width: 82, height: 8, borderRadius: 5 },
  skeletonMedia: { marginHorizontal: 10, borderRadius: 16, aspectRatio: 1.18, marginTop: 2 }
});