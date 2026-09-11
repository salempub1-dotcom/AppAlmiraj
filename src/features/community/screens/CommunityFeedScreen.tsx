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

type FeedFilter =
  | 'all'
  | 'idea'
  | 'question'
  | 'test'
  | 'exam'
  | 'resource'
  | 'classroom_experience'
  | 'tip';

const FEED_FILTERS: FeedFilter[] = [
  'all',
  'idea',
  'question',
  'test',
  'exam',
  'resource',
  'classroom_experience',
  'tip'
];

// Stories stay disabled until their backend model is ready. The reserved slot
// lets us enable them later without rebuilding the feed structure.
const STORIES_ENABLED = false;

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
  const row = isRTL ? ('row-reverse' as const) : ('row' as const);
  const [activeFilter, setActiveFilter] = useState<FeedFilter>('all');

  const feed = useCommunityFeed();
  const posts = useMemo<CommunityPost[]>(() => feed.data?.pages.flat() ?? [], [feed.data]);
  const visiblePosts = useMemo(() => {
    if (activeFilter === 'all') return posts;
    if (activeFilter === 'resource') {
      return posts.filter((post) => post.type === 'resource' || post.type === 'pdf');
    }
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
      <View
        style={[
          styles.topBar,
          {
            backgroundColor: community.surface,
            borderBottomColor: community.divider,
            flexDirection: row
          }
        ]}
      >
        <View style={styles.brandLockup}>
          <Text style={[styles.spaceTitle, { color: community.text, textAlign: align }]}>{copy.feed.title}</Text>
          <Text numberOfLines={1} style={[styles.spaceSubtitle, { color: community.textMuted, textAlign: align }]}>
            {copy.feed.subtitle}
          </Text>
        </View>

        <View style={[styles.topActions, { flexDirection: row }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={copy.feed.newPost}
            onPress={openComposer}
            hitSlop={8}
            style={({ pressed }) => [styles.topAction, { opacity: pressed ? 0.5 : 1 }]}
          >
            <Ionicons name="add-circle-outline" size={28} color={community.text} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={copy.nav.saved}
            onPress={() => navigation.navigate('SavedCommunityPosts')}
            hitSlop={8}
            style={({ pressed }) => [styles.topAction, { opacity: pressed ? 0.5 : 1 }]}
          >
            <Ionicons name="bookmark-outline" size={25} color={community.text} />
          </Pressable>
        </View>
      </View>

      {STORIES_ENABLED ? <StoriesPlaceholder community={community} /> : null}

      <Pressable
        onPress={openComposer}
        style={({ pressed }) => [
          styles.composer,
          {
            backgroundColor: community.surface,
            borderBottomColor: community.divider,
            opacity: pressed ? 0.78 : 1,
            flexDirection: row
          }
        ]}
      >
        <View style={[styles.composerAvatar, { backgroundColor: community.primarySoft }]}>
          <Ionicons name="person" size={19} color={community.primaryStrong} />
        </View>
        <View style={styles.composerTextWrap}>
          <Text numberOfLines={1} style={[styles.composerPrompt, { color: community.textSecondary, textAlign: align }]}>
            {social.composerPrompt}
          </Text>
        </View>
        <View style={[styles.photoAction, { borderColor: community.border }]}>
          <Ionicons name="image-outline" size={20} color={community.textSecondary} />
        </View>
      </Pressable>

      <View style={[styles.filterSection, { backgroundColor: community.surface, borderBottomColor: community.divider }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.filtersContent, { flexDirection: row }]}
        >
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
                    backgroundColor: active ? community.text : community.surface,
                    borderColor: active ? community.text : community.border,
                    opacity: pressed ? 0.72 : 1
                  }
                ]}
              >
                <Text style={[styles.filterText, { color: active ? community.surface : community.textSecondary }]}>
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
      <Screen style={{ ...styles.loadingPage, backgroundColor: community.background }}>
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
        <Pressable onPress={() => feed.refetch()} style={[styles.retryButton, { backgroundColor: community.text }]}>
          <Text style={[styles.retryText, { color: community.surface }]}>{copy.feed.retry}</Text>
        </Pressable>
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
        refreshControl={
          <RefreshControl
            refreshing={feed.isRefetching && !feed.isFetchingNextPage}
            onRefresh={() => feed.refetch()}
            tintColor={community.text}
          />
        }
        onEndReachedThreshold={0.45}
        onEndReached={() => {
          if (feed.hasNextPage && !feed.isFetchingNextPage) feed.fetchNextPage();
        }}
        ListEmptyComponent={
          <View style={[styles.emptyCard, { backgroundColor: community.surface, borderColor: community.border }]}>
            <View style={[styles.stateIcon, { backgroundColor: community.primarySoft }]}>
              <Ionicons name="chatbubbles-outline" size={28} color={community.primary} />
            </View>
            <Text style={[styles.stateTitle, { color: community.text, textAlign: 'center' }]}>{copy.feed.emptyTitle}</Text>
            <Text style={[styles.stateText, { color: community.textSecondary, textAlign: 'center' }]}>{copy.feed.emptyText}</Text>
            <Pressable onPress={openComposer} style={[styles.emptyCta, { backgroundColor: community.text }]}> 
              <Ionicons name="add" size={18} color={community.surface} />
              <Text style={[styles.emptyCtaText, { color: community.surface }]}>{copy.feed.newPost}</Text>
            </Pressable>
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
        ListFooterComponent={
          feed.isFetchingNextPage ? (
            <View style={styles.footerLoading}>
              <ActivityIndicator color={community.text} />
              <Text style={{ color: community.textMuted, fontSize: 12 }}>{copy.feed.loadingMore}</Text>
            </View>
          ) : (
            <View style={{ height: 28 }} />
          )
        }
      />
    </Screen>
  );
}

function StoriesPlaceholder({ community }: { community: ReturnType<typeof getCommunityTheme> }) {
  return (
    <View style={[styles.storiesPlaceholder, { backgroundColor: community.surface, borderBottomColor: community.divider }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.storiesContent}>
        {Array.from({ length: 7 }).map((_, index) => (
          <View key={index} style={styles.storyItem}>
            <View style={[styles.storyRing, { borderColor: community.primary }]}> 
              <View style={[styles.storyAvatar, { backgroundColor: community.surfaceRaised }]} />
            </View>
            <View style={[styles.storyName, { backgroundColor: community.surfaceRaised }]} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function FeedSkeleton({ community }: { community: ReturnType<typeof getCommunityTheme> }) {
  return (
    <View style={{ flex: 1 }}>
      <View style={[styles.skeletonTop, { backgroundColor: community.surface, borderBottomColor: community.divider }]}>
        <View style={[styles.skeletonTitle, { backgroundColor: community.surfaceRaised }]} />
        <View style={[styles.skeletonIcon, { backgroundColor: community.surfaceRaised }]} />
      </View>
      {[0, 1].map((item) => (
        <View key={item} style={[styles.skeletonPost, { backgroundColor: community.surface, borderBottomColor: community.divider }]}>
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingHorizontal: 24
  },
  loadingPage: { flex: 1, padding: 0, paddingHorizontal: 0, paddingVertical: 0 },
  listPage: { padding: 0, paddingHorizontal: 0, paddingVertical: 0 },
  listContent: { paddingBottom: 0 },
  header: { width: '100%' },
  topBar: {
    minHeight: 72,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  brandLockup: { flex: 1, minWidth: 0, paddingEnd: 8 },
  spaceTitle: { fontSize: 22, lineHeight: 27, fontWeight: '900', letterSpacing: -0.5 },
  spaceSubtitle: { marginTop: 2, fontSize: 11.5, fontWeight: '500' },
  topActions: { alignItems: 'center', gap: 2 },
  topAction: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  composer: {
    minHeight: 68,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    gap: 10
  },
  composerAvatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  composerTextWrap: { flex: 1, minWidth: 0 },
  composerPrompt: { fontSize: 13, fontWeight: '500' },
  photoAction: { width: 39, height: 34, borderRadius: 11, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  filterSection: { borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 9 },
  filtersContent: { paddingHorizontal: 12, gap: 7 },
  filterChip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 13, paddingVertical: 8, minHeight: 36, justifyContent: 'center' },
  filterText: { fontSize: 11.5, fontWeight: '700' },
  storiesPlaceholder: { borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 10 },
  storiesContent: { paddingHorizontal: 12, gap: 12 },
  storyItem: { width: 62, alignItems: 'center', gap: 5 },
  storyRing: { width: 58, height: 58, borderRadius: 29, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  storyAvatar: { width: 50, height: 50, borderRadius: 25 },
  storyName: { width: 43, height: 7, borderRadius: 999 },
  stateIcon: { width: 56, height: 56, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  stateTitle: { fontWeight: '900', fontSize: 18 },
  stateText: { lineHeight: 21, fontSize: 13 },
  retryButton: { minHeight: 46, borderRadius: 14, paddingHorizontal: 22, alignItems: 'center', justifyContent: 'center' },
  retryText: { fontWeight: '900', fontSize: 14 },
  emptyCard: { borderWidth: 1, borderRadius: 20, padding: 25, gap: 9, alignItems: 'center', margin: 16 },
  emptyCta: { marginTop: 6, minHeight: 42, borderRadius: 13, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  emptyCtaText: { fontWeight: '900', fontSize: 12.5 },
  footerLoading: { paddingVertical: 22, alignItems: 'center', gap: 6 },
  skeletonTop: { height: 73, paddingHorizontal: 16, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  skeletonTitle: { width: 145, height: 21, borderRadius: 8 },
  skeletonIcon: { width: 38, height: 38, borderRadius: 19 },
  skeletonPost: { borderBottomWidth: StyleSheet.hairlineWidth, paddingTop: 13, paddingBottom: 15, gap: 11 },
  skeletonAuthor: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14 },
  skeletonAvatar: { width: 42, height: 42, borderRadius: 21 },
  skeletonLine: { height: 12, borderRadius: 6, marginHorizontal: 14 },
  skeletonLineMedium: { width: '66%', height: 12, borderRadius: 6, marginHorizontal: 14 },
  skeletonLineShort: { width: 118, height: 11, borderRadius: 6 },
  skeletonLineTiny: { width: 82, height: 8, borderRadius: 5 },
  skeletonMedia: { width: '100%', aspectRatio: 1, marginTop: 2 }
});
