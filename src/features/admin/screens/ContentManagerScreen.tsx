import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen } from '../../../components/Screen';
import { useLanguage } from '../../../context/LanguageProvider';
import { useTheme } from '../../../context/ThemeProvider';
import { getAdminCopy } from '../../../i18n/adminCopy';
import {
  ADMIN_POST_TYPES,
  EDUCATIONAL_LEVELS,
  POST_STATUSES,
  type AdminContentFilters,
  type PostStatus
} from '../../../repositories/contentRepository';
import { useAdminContentCounts, useAdminContentList, useDeleteContent, useDuplicateContent, useSetContentStatus } from '../../../hooks/useAdminContent';
import { useIsAdmin } from '../../../hooks/useAdminAccess';
import { AdminChip } from '../components/AdminChip';
import { AdminContentRow } from '../components/AdminContentRow';
import { contentTypeIcons } from '../contentTypeIcons';

export function ContentManagerScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { language, isRTL } = useLanguage();
  const copy = getAdminCopy(language);
  const row = isRTL ? ('row-reverse' as const) : ('row' as const);
  const align = isRTL ? ('right' as const) : ('left' as const);
  const { isAdmin, isLoading: checkingAdmin } = useIsAdmin();

  const [status, setStatus] = useState<PostStatus | 'all'>('all');
  const [postType, setPostType] = useState<AdminContentFilters['postType'] | 'all'>('all');
  const [level, setLevel] = useState<string>('all');
  const [search, setSearch] = useState('');

  const filters = useMemo<AdminContentFilters>(
    () => ({
      status: status === 'all' ? undefined : status,
      postType: postType === 'all' ? undefined : postType,
      level: level === 'all' ? undefined : level,
      search: search.trim() || undefined
    }),
    [status, postType, level, search]
  );

  const counts = useAdminContentCounts();
  const list = useAdminContentList(filters);
  const setContentStatus = useSetContentStatus();
  const duplicate = useDuplicateContent();
  const remove = useDeleteContent();

  const hasFilters = status !== 'all' || postType !== 'all' || level !== 'all' || search.trim().length > 0;
  const resetFilters = () => {
    setStatus('all');
    setPostType('all');
    setLevel('all');
    setSearch('');
  };

  const handleTogglePublish = (id: string, current: PostStatus) => {
    setContentStatus.mutate(
      { id, status: current === 'published' ? 'hidden' : 'published' },
      {
        onSuccess: () => Alert.alert(current === 'published' ? copy.confirm.hidden : copy.confirm.published)
      }
    );
  };

  const handleDuplicate = (id: string) => {
    duplicate.mutate(id, { onSuccess: () => Alert.alert(copy.confirm.duplicated) });
  };

  const handleDelete = (id: string, title: string) => {
    Alert.alert(copy.confirm.deleteTitle, `${copy.confirm.deleteText}\n\n${title}`, [
      { text: copy.confirm.cancel, style: 'cancel' },
      {
        text: copy.confirm.confirmDelete,
        style: 'destructive',
        onPress: () => remove.mutate(id, { onSuccess: () => Alert.alert(copy.confirm.deleted) })
      }
    ]);
  };

  if (checkingAdmin) {
    return (
      <Screen style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </Screen>
    );
  }

  if (!isAdmin) {
    return (
      <Screen style={styles.center}>
        <Ionicons name="lock-closed-outline" size={40} color={colors.muted} />
        <Text style={{ color: colors.text, fontWeight: '900', fontSize: 18, textAlign: 'center' }}>
          {copy.dashboard.accessDeniedTitle}
        </Text>
        <Text style={{ color: colors.muted, textAlign: 'center', lineHeight: 20 }}>{copy.dashboard.accessDeniedText}</Text>
      </Screen>
    );
  }

  return (
    <Screen scroll style={styles.page}>
      <View style={styles.headerCard}>
        <View style={[styles.headerTopRow, { flexDirection: row }]}>
          <View style={styles.headerIcon}>
            <Ionicons name="library" size={22} color="#0B1833" />
          </View>
          <Pressable onPress={() => navigation.navigate('ContentForm', {})} style={[styles.addButton, { flexDirection: row }]}>
            <Ionicons name="add" size={18} color="#0B1833" />
            <Text style={styles.addButtonText}>{copy.dashboard.addNew}</Text>
          </Pressable>
        </View>
        <Text style={[styles.title, { textAlign: align }]}>{copy.dashboard.title}</Text>
        <Text style={[styles.subtitle, { textAlign: align, writingDirection: isRTL ? 'rtl' : 'ltr' }]}>{copy.dashboard.subtitle}</Text>
      </View>

      <View style={[styles.statsRow, { flexDirection: row }]}>
        <StatTile
          label={copy.dashboard.totalContent}
          value={counts.data?.total}
          active={status === 'all'}
          onPress={() => setStatus('all')}
          icon="albums-outline"
        />
        <StatTile
          label={copy.dashboard.published}
          value={counts.data?.published}
          active={status === 'published'}
          onPress={() => setStatus('published')}
          icon="checkmark-circle-outline"
        />
        <StatTile
          label={copy.dashboard.drafts}
          value={counts.data?.draft}
          active={status === 'draft'}
          onPress={() => setStatus('draft')}
          icon="create-outline"
        />
        <StatTile
          label={copy.dashboard.hidden}
          value={counts.data?.hidden}
          active={status === 'hidden'}
          onPress={() => setStatus('hidden')}
          icon="eye-off-outline"
        />
      </View>

      <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border, flexDirection: row }]}>
        <Ionicons name="search-outline" size={19} color={colors.muted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder={copy.dashboard.searchPlaceholder}
          placeholderTextColor={colors.muted}
          style={[styles.searchInput, { color: colors.text, textAlign: align }]}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch('')} hitSlop={8}>
            <Ionicons name="close-circle" size={19} color={colors.muted} />
          </Pressable>
        )}
      </View>

      <View style={[styles.filterHeader, { flexDirection: row }]}>
        {hasFilters ? (
          <Pressable onPress={resetFilters} style={[styles.resetRow, { flexDirection: row }]}>
            <Ionicons name="refresh-outline" size={14} color={colors.primary} />
            <Text style={[styles.resetText, { color: colors.primary }]}>{copy.dashboard.resetFilters}</Text>
          </Pressable>
        ) : (
          <View />
        )}
        <Text style={[styles.filterTitle, { color: colors.text }]}>{copy.dashboard.filters}</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} inverted={isRTL}>
        <View style={[styles.chipsInline, { flexDirection: row }]}>
          <AdminChip label={copy.dashboard.allTypes} active={postType === 'all'} onPress={() => setPostType('all')} icon="apps-outline" />
          {ADMIN_POST_TYPES.map((type) => (
            <AdminChip
              key={type}
              label={copy.types[type]}
              active={postType === type}
              onPress={() => setPostType(type)}
              icon={contentTypeIcons[type]}
            />
          ))}
        </View>
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} inverted={isRTL}>
        <View style={[styles.chipsInline, { flexDirection: row }]}>
          <AdminChip label={copy.dashboard.allLevels} active={level === 'all'} onPress={() => setLevel('all')} />
          {EDUCATIONAL_LEVELS.map((item) => (
            <AdminChip key={item} label={item} active={level === item} onPress={() => setLevel(item)} />
          ))}
        </View>
      </ScrollView>

      <View style={[styles.resultsHeader, { flexDirection: row }]}>
        <View style={[styles.countBadge, { backgroundColor: colors.card, borderColor: colors.border, flexDirection: row }]}>
          <Ionicons name="layers-outline" size={13} color={colors.muted} />
          <Text style={[styles.resultsCount, { color: colors.muted }]}>
            {list.data ? `${list.data.length} ${copy.dashboard.resultsCount}` : '...'}
          </Text>
        </View>
      </View>

      {list.isLoading && (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={colors.primary} />
          <Text style={{ color: colors.muted }}>{copy.dashboard.loading}</Text>
        </View>
      )}

      {list.isError && (
        <View style={[styles.stateCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="cloud-offline-outline" size={32} color={colors.primary} />
          <Text style={[styles.stateTitle, { color: colors.text }]}>{copy.dashboard.loadError}</Text>
          <Text style={[styles.stateBody, { color: colors.muted }]}>{copy.dashboard.loadErrorText}</Text>
          <Pressable onPress={() => list.refetch()} style={[styles.retry, { backgroundColor: colors.primary, flexDirection: row }]}>
            <Ionicons name="refresh-outline" size={16} color="#0B1833" />
            <Text style={styles.retryText}>{copy.dashboard.retry}</Text>
          </Pressable>
        </View>
      )}

      {!list.isLoading && !list.isError && list.data?.length === 0 && (
        <View style={[styles.stateCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="document-text-outline" size={32} color={colors.primary} />
          <Text style={[styles.stateTitle, { color: colors.text }]}>{copy.dashboard.emptyTitle}</Text>
          <Text style={[styles.stateBody, { color: colors.muted }]}>{copy.dashboard.emptyText}</Text>
        </View>
      )}

      <View style={styles.list}>
        {list.data?.map((post) => (
          <AdminContentRow
            key={post.id}
            post={post}
            busy={setContentStatus.isPending || duplicate.isPending || remove.isPending}
            onEdit={() => navigation.navigate('ContentForm', { id: post.id })}
            onPreview={() => navigation.navigate('ContentPreview', { id: post.id })}
            onTogglePublish={() => handleTogglePublish(post.id, post.status)}
            onDuplicate={() => handleDuplicate(post.id)}
            onDelete={() => handleDelete(post.id, post.title)}
          />
        ))}
      </View>
    </Screen>
  );
}

function StatTile({
  label,
  value,
  active,
  onPress,
  icon
}: {
  label: string;
  value?: number;
  active: boolean;
  onPress: () => void;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.statTile,
        { backgroundColor: active ? colors.primary : colors.card, borderColor: active ? colors.primary : colors.border }
      ]}
    >
      <Ionicons name={icon} size={16} color={active ? '#0B1833' : colors.primary} />
      <Text style={[styles.statValue, { color: active ? '#0B1833' : colors.text }]}>{value ?? '—'}</Text>
      <Text style={[styles.statLabel, { color: active ? '#0B1833' : colors.muted }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: { gap: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  headerCard: { backgroundColor: '#0B1833', borderRadius: 28, padding: 21, gap: 10 },
  headerTopRow: { alignItems: 'center', justifyContent: 'space-between' },
  headerIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: '#D4AF37', alignItems: 'center', justifyContent: 'center' },
  addButton: { alignItems: 'center', gap: 6, backgroundColor: '#D4AF37', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10 },
  addButtonText: { color: '#0B1833', fontWeight: '900', fontSize: 12.5 },
  title: { fontSize: 27, lineHeight: 36, fontWeight: '900', color: '#FFFFFF' },
  subtitle: { lineHeight: 21, color: '#C6D0DE', fontSize: 13 },
  statsRow: { gap: 8 },
  statTile: { flex: 1, borderWidth: 1, borderRadius: 18, paddingVertical: 12, paddingHorizontal: 6, alignItems: 'center', gap: 5, minHeight: 78, justifyContent: 'center' },
  statValue: { fontWeight: '900', fontSize: 19 },
  statLabel: { fontSize: 9.5, fontWeight: '700' },
  searchBox: { borderWidth: 1, borderRadius: 18, minHeight: 54, paddingHorizontal: 14, alignItems: 'center', gap: 9 },
  searchInput: { flex: 1, fontSize: 15 },
  filterHeader: { justifyContent: 'space-between', alignItems: 'center' },
  filterTitle: { fontSize: 15.5, fontWeight: '900' },
  resetRow: { gap: 4, alignItems: 'center' },
  resetText: { fontWeight: '800', fontSize: 11.5 },
  chipsInline: { gap: 8, paddingVertical: 2 },
  resultsHeader: { alignItems: 'center' },
  countBadge: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, alignItems: 'center', gap: 5 },
  resultsCount: { fontSize: 11.5, fontWeight: '700' },
  list: { gap: 11 },
  loadingBox: { minHeight: 70, alignItems: 'center', justifyContent: 'center', gap: 9 },
  stateCard: { borderWidth: 1, borderRadius: 22, padding: 22, gap: 8, alignItems: 'center' },
  stateTitle: { fontSize: 17, fontWeight: '900' },
  stateBody: { lineHeight: 21, textAlign: 'center' },
  retry: { borderRadius: 13, paddingHorizontal: 16, paddingVertical: 10, marginTop: 4, gap: 7, alignItems: 'center' },
  retryText: { color: '#0B1833', fontWeight: '900' }
});
