import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLanguage } from '../../../context/LanguageProvider';
import { useTheme } from '../../../context/ThemeProvider';
import { useReportCommunityContent } from '../../../hooks/useCommunityInteractions';
import { getCommunityCopy } from '../../../i18n/communityCopy';
import { COMMUNITY_REPORT_REASONS, type CommunityReportReason } from '../../../repositories/communityRepository';
import { getCommunityTheme } from '../communityTheme';
import { CommunityChip } from './CommunityChip';

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
  const community = getCommunityTheme(colors);
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
        <View style={[styles.sheet, { backgroundColor: community.surface, borderColor: community.border }]}>
          <View style={styles.handle} />

          <View style={[styles.headerRow, { flexDirection: row }]}>
            <View style={[styles.headerCopy, { flexDirection: row }]}>
              <View style={[styles.iconWrap, { backgroundColor: `${community.danger}14` }]}>
                <Ionicons name="flag-outline" size={19} color={community.danger} />
              </View>
              <Text style={[styles.title, { color: community.text, textAlign: align }]}>{copy.report.title}</Text>
            </View>

            <Pressable
              onPress={handleClose}
              hitSlop={10}
              style={({ pressed }) => [
                styles.closeButton,
                { backgroundColor: pressed ? community.primarySoft : 'transparent' }
              ]}
            >
              <Ionicons name="close" size={21} color={community.textSecondary} />
            </Pressable>
          </View>

          <Text style={[styles.label, { color: community.textSecondary, textAlign: align }]}>{copy.report.reasonLabel}</Text>

          <View style={styles.chipsRow}>
            {COMMUNITY_REPORT_REASONS.map((item) => (
              <CommunityChip
                key={item}
                label={copy.report.reasons[item]}
                active={reason === item}
                onPress={() => setReason(item)}
              />
            ))}
          </View>

          <Text style={[styles.label, { color: community.textSecondary, textAlign: align }]}>{copy.report.detailsLabel}</Text>

          <View
            style={[
              styles.input,
              {
                borderColor: community.border,
                backgroundColor: community.isDark ? community.surfaceRaised : '#F8FAFC'
              }
            ]}
          >
            <TextInput
              value={details}
              onChangeText={setDetails}
              placeholder={copy.report.detailsPlaceholder}
              placeholderTextColor={community.textMuted}
              textAlign={align}
              multiline
              numberOfLines={3}
              style={[styles.inputText, { color: community.text }]}
            />
          </View>

          <Pressable
            onPress={handleSubmit}
            disabled={report.isPending}
            style={({ pressed }) => [
              styles.submitButton,
              {
                backgroundColor: community.primary,
                opacity: report.isPending ? 0.55 : pressed ? 0.86 : 1,
                flexDirection: row
              }
            ]}
          >
            {report.isPending ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Ionicons name="flag-outline" size={18} color="#FFFFFF" />
            )}
            <Text style={styles.submitButtonText}>{report.isPending ? copy.report.submitting : copy.report.submit}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(7,17,31,0.56)', justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 24,
    gap: 12
  },
  handle: {
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(148,163,184,0.55)',
    alignSelf: 'center',
    marginBottom: 4
  },
  headerRow: { justifyContent: 'space-between', alignItems: 'center' },
  headerCopy: { alignItems: 'center', gap: 9, flex: 1 },
  iconWrap: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  closeButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '900', flex: 1 },
  label: { fontSize: 12.5, fontWeight: '800', marginTop: 3 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  input: { borderWidth: 1, borderRadius: 15, minHeight: 84, paddingHorizontal: 13, paddingVertical: 10 },
  inputText: { fontSize: 14, minHeight: 62, textAlignVertical: 'top' },
  submitButton: {
    minHeight: 52,
    borderRadius: 16,
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4
  },
  submitButtonText: { color: '#FFFFFF', fontWeight: '900', fontSize: 14.5 }
});
