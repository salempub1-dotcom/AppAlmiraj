import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLanguage } from '../../../context/LanguageProvider';
import { useTheme } from '../../../context/ThemeProvider';
import { getAdminCopy } from '../../../i18n/adminCopy';
import { getCommunityCopy } from '../../../i18n/communityCopy';
import type { CommunityReport, CommunityReportReason, PublicTeacherProfile } from '../../../repositories/communityRepository';
import { formatRelativeTime } from '../../../utils/formatRelativeTime';

type ModerationAction = 'hide' | 'remove' | 'dismiss' | 'resolve';

export function ModerationReportRow({
  report,
  targetText,
  targetMissing,
  reporter,
  onHide,
  onRemove,
  onDismiss,
  onResolve,
  busyAction
}: {
  report: CommunityReport;
  targetText: string;
  targetMissing: boolean;
  reporter?: PublicTeacherProfile | null;
  onHide: () => void;
  onRemove: () => void;
  onDismiss: () => void;
  onResolve: () => void;
  busyAction: ModerationAction | null;
}) {
  const { colors } = useTheme();
  const { language, isRTL } = useLanguage();
  const copy = getAdminCopy(language);
  const communityCopy = getCommunityCopy(language);
  const row = isRTL ? ('row-reverse' as const) : ('row' as const);
  const align = isRTL ? ('right' as const) : ('left' as const);

  const isOpen = report.status === 'open';
  const statusLabel =
    report.status === 'open'
      ? copy.moderation.statusOpen
      : report.status === 'reviewed'
        ? copy.moderation.statusReviewed
        : report.status === 'dismissed'
          ? copy.moderation.statusDismissed
          : copy.moderation.statusActioned;
  const statusColor = report.status === 'open' ? colors.primary : report.status === 'dismissed' ? colors.muted : colors.danger;
  const reasonLabel = communityCopy.report.reasons[report.reason as CommunityReportReason] ?? report.reason;
  const targetLabel = report.target_type === 'comment' ? copy.moderation.targetComment : copy.moderation.targetPost;
  const busy = busyAction !== null;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.topRow, { flexDirection: row }]}>
        <View style={[styles.targetBadge, { backgroundColor: `${colors.primary}18`, flexDirection: row }]}>
          <Ionicons name={report.target_type === 'comment' ? 'chatbubble-outline' : 'document-text-outline'} size={13} color={colors.primary} />
          <Text style={[styles.targetBadgeText, { color: colors.primary }]}>{targetLabel}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: `${statusColor}18`, flexDirection: row }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
        <Text style={[styles.time, { color: colors.muted }]}>{formatRelativeTime(report.created_at, language)}</Text>
      </View>

      <View style={[styles.field, { flexDirection: row }]}>
        <Text style={[styles.fieldLabel, { color: colors.muted }]}>{copy.moderation.reasonLabel}:</Text>
        <Text numberOfLines={1} style={[styles.fieldValue, { color: colors.text, textAlign: align, flex: 1 }]}>
          {reasonLabel}
        </Text>
      </View>

      {!!report.details && (
        <Text numberOfLines={3} style={[styles.details, { color: colors.text, textAlign: align, writingDirection: isRTL ? 'rtl' : 'ltr' }]}>
          {report.details}
        </Text>
      )}

      <View style={[styles.previewCard, { backgroundColor: `${colors.muted}10`, borderColor: colors.border }]}>
        {targetMissing ? (
          <Text style={[styles.previewMissing, { color: colors.muted, textAlign: align }]}>{copy.moderation.targetMissing}</Text>
        ) : (
          <Text numberOfLines={2} style={[styles.previewText, { color: colors.text, textAlign: align, writingDirection: isRTL ? 'rtl' : 'ltr' }]}>
            {targetText}
          </Text>
        )}
      </View>

      <View style={[styles.reporterRow, { flexDirection: row }]}>
        <View style={[styles.reporterAvatar, { backgroundColor: `${colors.primary}18` }]}>
          {reporter?.avatar_url ? (
            <Image source={{ uri: reporter.avatar_url }} style={styles.reporterAvatarImg} />
          ) : (
            <Ionicons name="person" size={13} color={colors.primary} />
          )}
        </View>
        <Text style={[styles.reporterText, { color: colors.muted }]}>
          {copy.moderation.reporterLabel}: {reporter?.full_name ?? copy.moderation.reporterUnknown}
        </Text>
      </View>

      {isOpen && (
        <View style={[styles.actions, { flexDirection: row }]}>
          <ActionButton label={copy.moderation.hide} icon="eye-off-outline" onPress={onHide} busy={busyAction === 'hide'} disabled={busy} />
          <ActionButton label={copy.moderation.remove} icon="trash-outline" onPress={onRemove} busy={busyAction === 'remove'} disabled={busy} danger />
          <ActionButton label={copy.moderation.dismiss} icon="close-circle-outline" onPress={onDismiss} busy={busyAction === 'dismiss'} disabled={busy} />
          <ActionButton label={copy.moderation.resolve} icon="checkmark-circle-outline" onPress={onResolve} busy={busyAction === 'resolve'} disabled={busy} highlight />
        </View>
      )}
    </View>
  );
}

function ActionButton({
  label,
  icon,
  onPress,
  busy,
  disabled,
  danger,
  highlight
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  busy?: boolean;
  disabled?: boolean;
  danger?: boolean;
  highlight?: boolean;
}) {
  const { colors } = useTheme();
  const color = danger ? colors.danger : highlight ? colors.primary : colors.muted;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.actionButton,
        { backgroundColor: `${color}14`, opacity: disabled && !busy ? 0.4 : pressed ? 0.75 : 1 }
      ]}
    >
      {busy ? <ActivityIndicator size="small" color={color} /> : <Ionicons name={icon} size={14} color={color} />}
      <Text numberOfLines={1} style={[styles.actionButtonText, { color }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 20, padding: 14, gap: 9 },
  topRow: { alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  targetBadge: { alignItems: 'center', gap: 5, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 },
  targetBadgeText: { fontWeight: '900', fontSize: 11 },
  statusBadge: { alignItems: 'center', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 },
  statusText: { fontWeight: '800', fontSize: 10.5 },
  time: { marginStart: 'auto', fontSize: 10.5, fontWeight: '700' },
  field: { alignItems: 'center', gap: 6 },
  fieldLabel: { fontSize: 11.5, fontWeight: '800' },
  fieldValue: { fontSize: 12.5, fontWeight: '700' },
  details: { fontSize: 12.5, lineHeight: 19 },
  previewCard: { borderWidth: 1, borderRadius: 14, padding: 10 },
  previewText: { fontSize: 12.5, lineHeight: 19 },
  previewMissing: { fontSize: 12, fontStyle: 'italic' },
  reporterRow: { alignItems: 'center', gap: 7 },
  reporterAvatar: { width: 22, height: 22, borderRadius: 8, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  reporterAvatarImg: { width: 22, height: 22, borderRadius: 8 },
  reporterText: { fontSize: 11, fontWeight: '700' },
  actions: { flexWrap: 'wrap', gap: 8, marginTop: 2 },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8 },
  actionButtonText: { fontWeight: '800', fontSize: 11 }
});
