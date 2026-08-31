import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../../components/Screen';
import { useAuth } from '../../../context/AuthProvider';
import { useLanguage } from '../../../context/LanguageProvider';
import { useTheme } from '../../../context/ThemeProvider';
import { useCommunityFeed, useTeacherPublicProfiles } from '../../../hooks/useCommunity';
import { useCommunityLike, useCommunityLikedIds, useCommunitySave, useCommunitySavedIds } from '../../../hooks/useCommunityInteractions';
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

// TeacherSpaceGate renders CommunityFeedList only once a session is confirmed,
// so no community query mounts for a guest or during auth bootstrap.
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

  // Interaction state remains batched for the currently loaded post set.
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

  const quickActions = [
    { key: 'idea', label: social.quickIdea, icon: 'bulb-outline' as const },
    { key: 'question', label: social.quickQuestion, icon: 'help-circle-outline' as const },
    { key: 'image', label: social.quickImage, icon: 'image-outline' as const },
    { key: 'pdf', label: social.quickPdf, icon: 'document-text-outline' as const }
  ];

  const header = (
    <View style={styles.header}>
      <View style={[styles.heroCard, { backgroundColor: community.primary }]}>
        <View style={[styles.heroTopRow, { flexDirection: row }]}>
          <View style={styles.heroIcon}>
            <Ionicons name="people" size={23} color="#FFFFFF" />
          </View>

          <Pressable
            onPress={() => navigation.navigate('SavedCommunityPosts')}
            style={({ pressed }) => [styles.savedButton, { opacity: pressed ? 0.7 : 1 }]}
          >
            <Ionicons name="bookmark-outline" size={20} color="#FFFFFF" />
          </Pressable>
        </View>

        <Text style={[styles.heroEyebrow, { textAlign: align }]}>{social.communityLabel}</Text>
        <Text style={[styles.title, { textAlign: align }]}>{copy.feed.title}</Text>
        <Text style={[styles.subtitle, { textAlign: align }]}>{copy.feed.subtitle}</Text>
      </View>

      <View
        style={[
          styles.composer,
          {
            backgroundColor: community.surface,
            borderColor: community.border,
            shadowColor: community.shadow
          }
        ]}
      >
        <Pressable onPress={openComposer} style={[styles.composerMain, { flexDirection: row }]}>
          <View style={[styles.composerAvatar, { backgroundColor: community.primarySoft }]}>
            <Ionicons name="person" size={20} color={community.primary} />
          </View>
          <View style={[styles.composerPrompt, { backgroundColor: community.isDark ? community.surfaceRaised : '#F8FAFC' }]}>
            <Text numberOfLines={2} style={[styles.composerPromptText, { color: community.textSecondary, textAlign: align }]}>
              {social.composerPrompt}
            </Text>
          </View>
        </Pressable>

        <View style={[styles.composerDivider, { backgroundColor: community.divider }]} />

        <View style={[styles.quickActions, { flexDirection: row }]}>
          {quickActions.map((action) => (
            <Pressable
              key={action.key}
              onPress={openComposer}
              style={({ pressed }) => [styles.quickAction, { opacity: pressed ? 0.65 : 1 }]}
            >
              <Ionicons name={action.icon} size={18} color={community.primary} />
              <Text style={[styles.quickActionText, { color: community.textSecondary }]}>{action.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.filterSection}>
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
                onPress={() => setActiveFilter(filter)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: active ? community.primary : community.surface,
                    borderColor: active ? community.primary : community.border
                  }
                ]}
              >
                <Text style={[styles.filterText, { color: active ? '#FFFFFF' : community.textSecondary }]}>
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
      <Screen style={{ ...styles.center, backgroundColor: community.background }}>
        <ActivityIndicator color={community.primary} size="large" />
        <Text style={{ color: community.textMuted }}>{copy.feed.loading}</Text>
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
        <Pressable onPress={() => feed.refetch()} style={[styles.retryButton, { backgroundColor: community.primary }]}>
          <Text style={styles.retryText}>{copy.feed.retry}</Text>
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
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (feed.hasNextPage && !feed.isFetchingNextPage) feed.fetchNextPage();
        }}
        ListEmptyComponent={
          <View
            style={[
              styles.emptyCard,
              {
                backgroundColor: community.surface,
                borderColor: community.border,
                shadowColor: community.shadow
              }
            ]}
          >
            <View style={[styles.stateIcon, { backgroundColor: community.primarySoft }]}>
              <Ionicons name="chatbubbles-outline" size={28} color={community.primary} />
            </View>
            <Text style={[styles.stateTitle, { color: community.text, textAlign: 'center' }]}>{copy.feed.emptyTitle}</Text>
            <Text style={[styles.stateText, { color: community.textSecondary, textAlign: 'center' }]}>{copy.feed.emptyText}</Text>
            <Pressable onPress={openComposer} style={[styles.emptyCta, { backgroundColor: community.primary }]}>
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text style={styles.emptyCtaText}>{copy.feed.newPost}</Text>
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
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListFooterComponent={
          feed.isFetchingNextPage ? (
            <View style={styles.footerLoading}>
              <ActivityIndicator color={community.primary} />
              <Text style={{ color: community.textMuted, fontSize: 12 }}>{copy.feed.loadingMore}</Text>
            </View>
          ) : null
        }
      />
    </Screen>
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
  listPage: {
    padding: 0,
    paddingHorizontal: 0,
    paddingVertical: 0
  },
  listContent: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 40
  },
  header: {
    gap: 12,
    marginBottom: 14
  },
  heroCard: {
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 15,
    paddingBottom: 19,
    overflow: 'hidden'
  },
  heroTopRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  heroIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  savedButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  heroEyebrow: {
    color: 'rgba(255,255,255,0.76)',
    fontSize: 11.5,
    fontWeight: '800',
    marginBottom: 4
  },
  title: {
    color: '#FFFFFF',
    fontSize: 27,
    fontWeight: '900'
  },
  subtitle: {
    color: 'rgba(255,255,255,0.84)',
    fontSize: 12.5,
    lineHeight: 19,
    marginTop: 4
  },
  composer: {
    borderWidth: 1,
    borderRadius: 19,
    padding: 12,
    gap: 11,
    shadowOpacity: 0.05,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2
  },
  composerMain: {
    gap: 10,
    alignItems: 'center'
  },
  composerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center'
  },
  composerPrompt: {
    flex: 1,
    minHeight: 42,
    borderRadius: 21,
    paddingHorizontal: 14,
    justifyContent: 'center'
  },
  composerPromptText: {
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: '600'
  },
  composerDivider: {
    height: StyleSheet.hairlineWidth
  },
  quickActions: {
    justifyContent: 'space-around',
    alignItems: 'center'
  },
  quickAction: {
    minWidth: 62,
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3
  },
  quickActionText: {
    fontSize: 10.5,
    fontWeight: '700'
  },
  filterSection: {
    marginHorizontal: -14
  },
  filtersContent: {
    paddingHorizontal: 14,
    gap: 8
  },
  filterChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8
  },
  filterText: {
    fontSize: 12,
    fontWeight: '800'
  },
  stateIcon: {
    width: 56,
    height: 56,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center'
  },
  stateTitle: {
    fontWeight: '900',
    fontSize: 18
  },
  stateText: {
    lineHeight: 21,
    fontSize: 13
  },
  retryButton: {
    minHeight: 46,
    borderRadius: 14,
    paddingHorizontal: 22,
    alignItems: 'center',
    justifyContent: 'center'
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 14
  },
  emptyCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 25,
    gap: 9,
    alignItems: 'center',
    marginTop: 6,
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1
  },
  emptyCta: {
    marginTop: 6,
    minHeight: 42,
    borderRadius: 13,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6
  },
  emptyCtaText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 12.5
  },
  footerLoading: {
    paddingVertical: 18,
    alignItems: 'center',
    gap: 6
  }
});
