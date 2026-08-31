import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLanguage } from '../../../context/LanguageProvider';
import { useTheme } from '../../../context/ThemeProvider';
import { useReportCommunityContent } from '../../../hooks/useCommunityInteractions';
import { getCommunityCopy } from '../../../i18n/communityCopy';
import { COMMUNITY_REPORT_REASONS, type CommunityReportReason } from '../../../repositories/communityRepository';
import { CommunityChip } from './CommunityChip';

// Shared user-side reporting UI for both a post and a comment (Phase D).
// No admin moderation screen yet - this only writes a row to
// community_reports via communityRepository.report(), which RLS restricts
// to `reporter_id = auth.uid()` inserts (a teacher can never read anyone
// else's reports, only submit their own).
export function ReportModal({
  visible,
  onClose,
  targetType,
  targetId
}: {
  visible: boolean;
  onClose: () => void;
  targetType: 'post' | 'comment';
  targetId: string;
}) {
  const { colors } = useTheme();
  const { language, isRTL } = useLanguage();
  const copy = getCommunityCopy(language);
  const align = isRTL ? ('right' as const) : ('left' as const);
  const row = isRTL ? ('row-reverse' as const) : ('row' as const);

  const [reason, setReason] = useState<CommunityReportReason | null>(null);
  const [details, setDetails] = useState('');
  const report = useReportCommunityContent();

  const reset = () => {
    setReason(null);
    setDetails('');
  };

  const handleClose = () => {
    if (report.isPending) return;
    reset();
    onClose();
  };

  const handleSubmit = () => {
    if (!reason) {
      Alert.alert(copy.report.reasonRequired);
      return;
    }
    report.mutate(
      { targetType, targetId, reason, details: details.trim() || undefined },
      {
        onSuccess: () => {
          Alert.alert(copy.report.success);
          reset();
          onClose();
        },
        onError: () => Alert.alert(copy.report.error)
      }
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        <View style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.headerRow, { flexDirection: row }]}>
            <Text style={[styles.title, { color: colors.text, textAlign: align }]}>{copy.report.title}</Text>
            <Pressable onPress={handleClose} hitSlop={10}>
              <Ionicons name="close" size={22} color={colors.muted} />
            </Pressable>
          </View>

          <Text style={[styles.label, { color: colors.muted, textAlign: align }]}>{copy.report.reasonLabel}</Text>
          <View style={styles.chipsRow}>
            {COMMUNITY_REPORT_REASONS.map((item) => (
              <CommunityChip key={item} label={copy.report.reasons[item]} active={reason === item} onPress={() => setReason(item)} />
            ))}
          </View>

          <Text style={[styles.label, { color: colors.muted, textAlign: align }]}>{copy.report.detailsLabel}</Text>
          <View style={[styles.input, { borderColor: colors.border, backgroundColor: colors.background }]}>
            <TextInput
              value={details}
              onChangeText={setDetails}
              placeholder={copy.report.detailsPlaceholder}
              placeholderTextColor={colors.muted}
              textAlign={align}
              multiline
              numberOfLines={3}
              style={[styles.inputText, { color: colors.text }]}
            />
          </View>

          <Pressable
            onPress={handleSubmit}
            disabled={report.isPending}
            style={[styles.submitButton, { backgroundColor: colors.primary, opacity: report.isPending ? 0.6 : 1, flexDirection: row }]}
          >
            {report.isPending ? <ActivityIndicator color="#0B1833" /> : <Ionicons name="flag-outline" size={18} color="#0B1833" />}
            <Text style={styles.submitButtonText}>{report.isPending ? copy.report.submitting : copy.report.submit}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(7,17,31,0.5)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 26, borderTopRightRadius: 26, borderWidth: 1, borderBottomWidth: 0, padding: 20, gap: 12 },
  headerRow: { justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '900' },
  label: { fontSize: 12.5, fontWeight: '800', marginTop: 4 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  input: { borderWidth: 1, borderRadius: 14, minHeight: 80, paddingHorizontal: 14, paddingVertical: 10 },
  inputText: { fontSize: 14, minHeight: 60, textAlignVertical: 'top' },
  submitButton: { minHeight: 54, borderRadius: 16, gap: 8, alignItems: 'center', justifyContent: 'center', marginTop: 6, marginBottom: 8 },
  submitButtonText: { color: '#0B1833', fontWeight: '900', fontSize: 15 }
});
