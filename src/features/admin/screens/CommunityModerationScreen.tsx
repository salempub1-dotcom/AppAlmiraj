import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../../components/Screen';
import { useLanguage } from '../../../context/LanguageProvider';
import { useTheme } from '../../../context/ThemeProvider';
import { useIsAdmin } from '../../../hooks/useAdminAccess';
import {
  useCommunityReports,
  useDismissReport,
  useHideReportedContent,
  useModerationTargets,
  useRemoveReportedContent,
  useResolveReport
} from '../../../hooks/useCommunityModeration';
import { getAdminCopy } from '../../../i18n/adminCopy';
import type { CommunityReport, CommunityReportTargetType } from '../../../repositories/communityRepository';
import { AdminChip } from '../components/AdminChip';
import { ModerationReportRow } from '../components/ModerationReportRow';

// Phase E: admin-only Community Moderation - deliberately its own screen,
// separate from the official Content Manager (which never reads/writes
// community_* tables). Reuses the same is_admin()-backed admin gate
// (useIsAdmin) rather than any new role system.
export function CommunityModerationScreen() {
  const { colors } = useTheme();
  const { language, isRTL } = useLanguage();
  const copy = getAdminCopy(language);
  const row = isRTL ? ('row-reverse' as const) : ('row' as const);
  const align = isRTL ? ('right' as const) : ('left' as const);
  const { isAdmin, isLoading: checkingAdmin } = useIsAdmin();

  const [statusTab, setStatusTab] = useState<'open' | 'resolved'>('open');
  const [targetFilter, setTargetFilter] = useState<CommunityReportTargetType | 'all'>('all');

  const reports = useCommunityReports({
    status: statusTab,
    targetType: targetFilter === 'all' ? undefined : targetFilter
  });
  const rows = reports.data ?? [];
  const targets = useModerationTargets(rows);

  const hideMutation = useHideReportedContent();
  const removeMutation = useRemoveReportedContent();
  const dismissMutation = useDismissReport();
  const resolveMutation = useResolveReport();

  const busyActionFor = (report: CommunityReport) => {
    if (hideMutation.isPending && hideMutation.variables?.id === report.id) return 'hide' as const;
    if (removeMutation.isPending && removeMutation.variables?.id === report.id) return 'remove' as const;
    if (dismissMutation.isPending && dismissMutation.variables === report.id) return 'dismiss' as const;
    if (resolveMutation.isPending && resolveMutation.variables === report.id) return 'resolve' as const;
    return null;
  };

  const handleHide = (report: CommunityReport) => {
    Alert.alert(copy.moderation.hideConfirmTitle, copy.moderation.hideConfirmText, [
      { text: copy.moderation.cancel, style: 'cancel' },
      {
        text: copy.moderation.confirm,
        onPress: () =>
          hideMutation.mutate(report, {
            onSuccess: () => Alert.alert(copy.moderation.hidden),
            onError: () => Alert.alert(copy.moderation.actionError)
          })
      }
    ]);
  };

  const handleRemove = (report: CommunityReport) => {
    Alert.alert(copy.moderation.removeConfirmTitle, copy.moderation.removeConfirmText, [
      { text: copy.moderation.cancel, style: 'cancel' },
      {
        text: copy.moderation.confirm,
        style: 'destructive',
        onPress: () =>
          removeMutation.mutate(report, {
            onSuccess: () => Alert.alert(copy.moderation.removed),
            onError: () => Alert.alert(copy.moderation.actionError)
          })
      }
    ]);
  };

  const handleDismiss = (report: CommunityReport) => {
    dismissMutation.mutate(report.id, {
      onSuccess: () => Alert.alert(copy.moderation.dismissed),
      onError: () => Alert.alert(copy.moderation.actionError)
    });
  };

  const handleResolve = (report: CommunityReport) => {
    resolveMutation.mutate(report.id, {
      onSuccess: () => Alert.alert(copy.moderation.resolved),
      onError: () => Alert.alert(copy.moderation.actionError)
    });
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
          {copy.moderation.accessDeniedTitle}
        </Text>
        <Text style={{ color: colors.muted, textAlign: 'center', lineHeight: 20 }}>{copy.moderation.accessDeniedText}</Text>
      </Screen>
    );
  }

  return (
    <Screen scroll style={styles.page}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text, textAlign: align }]}>{copy.moderation.title}</Text>
        <Text style={[styles.subtitle, { color: colors.muted, textAlign: align, writingDirection: isRTL ? 'rtl' : 'ltr' }]}>
          {copy.moderation.subtitle}
        </Text>
      </View>

      <View style={[styles.tabsRow, { backgroundColor: colors.card, borderColor: colors.border, flexDirection: row }]}>
        <Pressable
          onPress={() => setStatusTab('open')}
          style={[styles.tab, statusTab === 'open' && { backgroundColor: colors.primary }]}
        >
          <Text style={[styles.tabText, { color: statusTab === 'open' ? '#0B1833' : colors.text }]}>{copy.moderation.tabOpen}</Text>
        </Pressable>
        <Pressable
          onPress={() => setStatusTab('resolved')}
          style={[styles.tab, statusTab === 'resolved' && { backgroundColor: colors.primary }]}
        >
          <Text style={[styles.tabText, { color: statusTab === 'resolved' ? '#0B1833' : colors.text }]}>
            {copy.moderation.tabResolved}
          </Text>
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={[styles.chipsInline, { flexDirection: row }]}>
          <AdminChip label={copy.moderation.filterAll} active={targetFilter === 'all'} onPress={() => setTargetFilter('all')} icon="apps-outline" />
          <AdminChip
            label={copy.moderation.filterPosts}
            active={targetFilter === 'post'}
            onPress={() => setTargetFilter('post')}
            icon="document-text-outline"
          />
          <AdminChip
            label={copy.moderation.filterComments}
            active={targetFilter === 'comment'}
            onPress={() => setTargetFilter('comment')}
            icon="chatbubble-outline"
          />
        </View>
      </ScrollView>

      {reports.isLoading && (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={colors.primary} />
          <Text style={{ color: colors.muted }}>{copy.moderation.loading}</Text>
        </View>
      )}

      {reports.isError && (
        <View style={[styles.stateCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="cloud-offline-outline" size={32} color={colors.primary} />
          <Text style={[styles.stateTitle, { color: colors.text }]}>{copy.moderation.loadError}</Text>
          <Text style={[styles.stateBody, { color: colors.muted }]}>{copy.moderation.loadErrorText}</Text>
          <Pressable onPress={() => reports.refetch()} style={[styles.retry, { backgroundColor: colors.primary, flexDirection: row }]}>
            <Ionicons name="refresh-outline" size={16} color="#0B1833" />
            <Text style={styles.retryText}>{copy.moderation.retry}</Text>
          </Pressable>
        </View>
      )}

      {!reports.isLoading && !reports.isError && rows.length === 0 && (
        <View style={[styles.stateCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="shield-checkmark-outline" size={32} color={colors.primary} />
          <Text style={[styles.stateTitle, { color: colors.text }]}>
            {statusTab === 'open' ? copy.moderation.emptyOpenTitle : copy.moderation.emptyResolvedTitle}
          </Text>
          <Text style={[styles.stateBody, { color: colors.muted }]}>
            {statusTab === 'open' ? copy.moderation.emptyOpenText : copy.moderation.emptyResolvedText}
          </Text>
        </View>
      )}

      <View style={styles.list}>
        {rows.map((report) => {
          const target =
            report.target_type === 'post'
              ? targets.postById.get(report.target_id)
              : report.target_type === 'comment'
                ? targets.commentById.get(report.target_id)
                : undefined;
          const targetText = target ? ('title' in target ? target.title || target.body || '' : target.body) : '';
          return (
            <ModerationReportRow
              key={report.id}
              report={report}
              targetText={targetText}
              targetMissing={!target}
              reporter={targets.reporterById.get(report.reporter_id)}
              onHide={() => handleHide(report)}
              onRemove={() => handleRemove(report)}
              onDismiss={() => handleDismiss(report)}
              onResolve={() => handleResolve(report)}
              busyAction={busyActionFor(report)}
            />
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { gap: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  header: { gap: 6 },
  title: { fontSize: 24, fontWeight: '900' },
  subtitle: { fontSize: 12.5, lineHeight: 19 },
  tabsRow: { borderWidth: 1, borderRadius: 16, padding: 5, gap: 5 },
  tab: { flex: 1, minHeight: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  tabText: { fontWeight: '900', fontSize: 13 },
  chipsInline: { gap: 8, paddingVertical: 2 },
  loadingBox: { minHeight: 70, alignItems: 'center', justifyContent: 'center', gap: 9 },
  stateCard: { borderWidth: 1, borderRadius: 22, padding: 22, gap: 8, alignItems: 'center' },
  stateTitle: { fontSize: 17, fontWeight: '900' },
  stateBody: { lineHeight: 21, textAlign: 'center' },
  retry: { borderRadius: 13, paddingHorizontal: 16, paddingVertical: 10, marginTop: 4, gap: 7, alignItems: 'center' },
  retryText: { color: '#0B1833', fontWeight: '900' },
  list: { gap: 11 }
});
