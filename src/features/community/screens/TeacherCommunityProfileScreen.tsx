import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../../components/Screen';
import { useLanguage } from '../../../context/LanguageProvider';
import { useTheme } from '../../../context/ThemeProvider';
import { useTeacherPosts, useTeacherPublicProfile } from '../../../hooks/useCommunity';
import { getCommunityCopy } from '../../../i18n/communityCopy';
import { CommunityPostCard } from '../components/CommunityPostCard';

// Displays ONLY the fields returned by public.get_public_teacher_profiles():
// full_name, avatar, subject, level, wilaya, bio, followers/following/posts
// counts. It never reads `profiles` directly, so phone/email/notif_prefs/
// role can never appear here even by accident.
export function TeacherCommunityProfileScreen({ route, navigation }: any) {
  const { colors } = useTheme();
  const { language, isRTL } = useLanguage();
  const copy = getCommunityCopy(language);
  const align = isRTL ? ('right' as const) : ('left' as const);
  const row = isRTL ? ('row-reverse' as const) : ('row' as const);
  const teacherId = String(route.params?.teacherId ?? '');

  const profile = useTeacherPublicProfile(teacherId);
  const posts = useTeacherPosts(teacherId);

  if (profile.isLoading) {
    return (
      <Screen style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={{ color: colors.muted }}>{copy.profile.loading}</Text>
      </Screen>
    );
  }

  if (profile.isError || !profile.data) {
    return (
      <Screen style={styles.center}>
        <Ionicons name="person-remove-outline" size={34} color={colors.primary} />
        <Text style={[styles.errorTitle, { color: colors.text }]}>{copy.profile.loadError}</Text>
        <Text style={[styles.errorBody, { color: colors.muted }]}>{copy.profile.loadErrorText}</Text>
      </Screen>
    );
  }

  const teacher = profile.data;
  const levels = (teacher.level ?? []).join('، ');

  return (
    <Screen scroll style={styles.page}>
      <View style={[styles.hero, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.avatar, { backgroundColor: `${colors.primary}18`, alignSelf: 'center' }]}>
          {teacher.avatar_url ? (
            <Image source={{ uri: teacher.avatar_url }} style={styles.avatarImg} />
          ) : (
            <Ionicons name="person" size={34} color={colors.primary} />
          )}
        </View>
        <Text style={[styles.name, { color: colors.text, textAlign: 'center' }]}>{teacher.full_name ?? ''}</Text>
        {(!!teacher.subject || !!levels) && (
          <Text style={[styles.subMeta, { color: colors.muted, textAlign: 'center' }]}>
            {[teacher.subject, levels].filter(Boolean).join('  •  ')}
          </Text>
        )}
        {!!teacher.wilaya && (
          <View style={[styles.wilayaRow, { flexDirection: row, alignSelf: 'center' }]}>
            <Ionicons name="location-outline" size={14} color={colors.muted} />
            <Text style={{ color: colors.muted, fontSize: 12.5 }}>{teacher.wilaya}</Text>
          </View>
        )}

        {!!teacher.bio && (
          <Text style={[styles.bio, { color: colors.text, textAlign: align, writingDirection: isRTL ? 'rtl' : 'ltr' }]}>{teacher.bio}</Text>
        )}

        <View style={[styles.statsRow, { flexDirection: row, borderColor: colors.border }]}>
          <Stat value={teacher.followers_count} label={copy.profile.followers} />
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <Stat value={teacher.following_count} label={copy.profile.following} />
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <Stat value={teacher.posts_count} label={copy.profile.posts} />
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text, textAlign: align }]}>{copy.profile.postsTitle}</Text>

      {posts.isLoading && <ActivityIndicator color={colors.primary} />}

      {!posts.isLoading && (posts.data ?? []).length === 0 && (
        <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={{ color: colors.muted, textAlign: 'center' }}>{copy.profile.noPosts}</Text>
        </View>
      )}

      <View style={styles.list}>
        {(posts.data ?? []).map((post) => (
          <CommunityPostCard
            key={post.id}
            post={post}
            author={teacher}
            onPress={() => navigation.navigate('CommunityPostDetail', { postId: post.id })}
          />
        ))}
      </View>
    </Screen>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.muted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { gap: 18 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  hero: { borderWidth: 1, borderRadius: 26, padding: 22, gap: 10, alignItems: 'center' },
  avatar: { width: 74, height: 74, borderRadius: 24, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImg: { width: 74, height: 74, borderRadius: 24 },
  name: { fontSize: 22, fontWeight: '900' },
  subMeta: { fontSize: 13 },
  wilayaRow: { alignItems: 'center', gap: 5 },
  bio: { fontSize: 14.5, lineHeight: 23, width: '100%', marginTop: 4 },
  statsRow: { width: '100%', borderTopWidth: StyleSheet.hairlineWidth, marginTop: 8, paddingTop: 14, justifyContent: 'space-around' },
  stat: { alignItems: 'center', gap: 3 },
  statValue: { fontWeight: '900', fontSize: 17 },
  statLabel: { fontSize: 11.5 },
  statDivider: { width: StyleSheet.hairlineWidth },
  sectionTitle: { fontSize: 18, fontWeight: '900' },
  emptyCard: { borderWidth: 1, borderRadius: 20, padding: 20 },
  list: { gap: 13 },
  errorTitle: { fontSize: 18, fontWeight: '900' },
  errorBody: { textAlign: 'center', lineHeight: 21 }
});
