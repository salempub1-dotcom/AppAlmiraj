import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { Screen } from '../../../components/Screen';
import { useLanguage } from '../../../context/LanguageProvider';
import { useTheme } from '../../../context/ThemeProvider';
import { useCreateCommunityPost, type CreateCommunityPostAttachment } from '../../../hooks/useCommunity';
import { getCommunityCopy } from '../../../i18n/communityCopy';
import { EDUCATIONAL_LEVELS } from '../../../repositories/contentRepository';
import {
  ALLOWED_IMAGE_MIME_TYPES,
  ALLOWED_PDF_MIME_TYPES,
  CommunityMediaTooLargeError,
  MAX_PDF_BYTES,
  type PickedCommunityFile
} from '../../../repositories/communityMediaRepository';
import { COMMUNITY_POST_TYPES, type CommunityPostType } from '../../../repositories/communityRepository';
import { TeacherSpaceGate } from '../components/TeacherSpaceGate';
import { communityTypeIcons } from '../contentTypeIcons';
import { getCommunityTheme } from '../communityTheme';

type PendingAttachment = { kind: 'image' | 'pdf'; file: PickedCommunityFile; previewUri: string };

export function CreateCommunityPostScreen({ navigation }: any) {
  return (
    <TeacherSpaceGate navigation={navigation}>
      <CreateCommunityPostContent navigation={navigation} />
    </TeacherSpaceGate>
  );
}

function CreateCommunityPostContent({ navigation }: any) {
  const { colors } = useTheme();
  const community = getCommunityTheme(colors);
  const { language, isRTL } = useLanguage();
  const copy = getCommunityCopy(language);
  const align = isRTL ? ('right' as const) : ('left' as const);
  const row = isRTL ? ('row-reverse' as const) : ('row' as const);
  const ar = language === 'ar';
  const createPost = useCreateCommunityPost();

  const [type, setType] = useState<CommunityPostType>('text');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [subject, setSubject] = useState('');
  const [levels, setLevels] = useState<string[]>([]);
  const [typeOpen, setTypeOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [stage, setStage] = useState<'PS' | 'MS' | null>(null);
  const [attachment, setAttachment] = useState<PendingAttachment | null>(null);

  const toggleLevel = (item: string) => {
    setLevels((prev) => (prev.includes(item) ? prev.filter((level) => level !== item) : [...prev, item]));
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(copy.form.permissionError);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    const mimeType = asset.mimeType ?? 'image/jpeg';
    if (!ALLOWED_IMAGE_MIME_TYPES.includes(mimeType)) {
      Alert.alert(copy.form.validationMimeImage);
      return;
    }
    setAttachment({ kind: 'image', file: { uri: asset.uri, name: asset.fileName ?? `image-${Date.now()}.jpg`, mimeType }, previewUri: asset.uri });
  };

  const pickPdf = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    const mimeType = asset.mimeType ?? 'application/pdf';
    if (!ALLOWED_PDF_MIME_TYPES.includes(mimeType)) {
      Alert.alert(copy.form.validationMimePdf);
      return;
    }
    if (asset.size && asset.size > MAX_PDF_BYTES) {
      Alert.alert(copy.form.validationSizePdf);
      return;
    }
    setAttachment({ kind: 'pdf', file: { uri: asset.uri, name: asset.name, mimeType }, previewUri: asset.uri });
  };

  const handlePublish = () => {
    if (createPost.isPending) return;
    const trimmedBody = body.trim();
    if (!trimmedBody && !attachment) {
      Alert.alert(copy.form.validationEmpty);
      return;
    }
    const attachmentPayload: CreateCommunityPostAttachment | undefined = attachment ? { kind: attachment.kind, file: attachment.file } : undefined;
    createPost.mutate(
      {
        input: {
          type,
          title: title.trim() || null,
          body: trimmedBody || null,
          subject: subject.trim() || null,
          level: levels
        },
        attachment: attachmentPayload
      },
      {
        onSuccess: (post) => navigation.replace('CommunityPostDetail', { postId: post.id }),
        onError: (error) => {
          if (error instanceof CommunityMediaTooLargeError) {
            Alert.alert(error.kind === 'image' ? copy.form.validationSizeImage : copy.form.validationSizePdf);
            return;
          }
          Alert.alert(copy.form.publishError);
        }
      }
    );
  };

  const busy = createPost.isPending;
  const canPublish = Boolean(body.trim() || attachment) && !busy;
  const detailsCount = [type !== 'text', Boolean(title.trim()), Boolean(subject.trim()), levels.length > 0].filter(Boolean).length;

  return (
    <Screen style={{ ...styles.page, backgroundColor: community.background }}>
      <View style={[styles.topRow, { flexDirection: row, backgroundColor: community.surface, borderBottomColor: community.divider }]}> 
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={styles.topIcon}>
          <Ionicons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={25} color={community.text} />
        </Pressable>
        <View style={styles.titleWrap}>
          <Text style={[styles.screenTitle, { color: community.text }]}>{copy.feed.newPost}</Text>
          <Text style={[styles.screenSubtitle, { color: community.textMuted }]}>{ar ? 'شارك فكرة أو مورداً مع زملائك' : 'Share an idea or resource with colleagues'}</Text>
        </View>
        <View style={styles.topIcon} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={[styles.composerCard, { backgroundColor: community.surface, borderColor: community.border }]}>
          <View style={[styles.authorComposer, { flexDirection: row }]}> 
            <View style={[styles.avatar, { backgroundColor: community.primarySoft, borderColor: community.gold }]}> 
              <Ionicons name="person" size={20} color={community.primaryStrong} />
            </View>
            <View style={styles.composerBody}>
              <TextInput
                value={body}
                onChangeText={setBody}
                placeholder={copy.form.bodyPlaceholder}
                placeholderTextColor={community.textMuted}
                multiline
                textAlign={align}
                style={[styles.bodyInput, { color: community.text, writingDirection: isRTL ? 'rtl' : 'ltr' }]}
              />

              {attachment?.kind === 'image' && (
                <View style={styles.imagePreviewShell}>
                  <Image source={{ uri: attachment.previewUri }} style={styles.imagePreview} resizeMode="cover" />
                  <Pressable onPress={() => setAttachment(null)} style={styles.removeMedia}>
                    <Ionicons name="close" size={18} color="#FFFFFF" />
                  </Pressable>
                </View>
              )}

              {attachment?.kind === 'pdf' && (
                <View style={[styles.pdfRow, { backgroundColor: community.surfaceRaised, borderColor: community.border, flexDirection: row }]}> 
                  <View style={[styles.pdfIcon, { backgroundColor: community.primarySoft }]}><Ionicons name="document-text-outline" size={21} color={community.primaryStrong} /></View>
                  <Text numberOfLines={1} style={[styles.pdfName, { color: community.text, textAlign: align }]}>{attachment.file.name}</Text>
                  <Pressable onPress={() => setAttachment(null)} hitSlop={8}><Ionicons name="close-circle" size={20} color={community.textMuted} /></Pressable>
                </View>
              )}
            </View>
          </View>

          <View style={[styles.mediaBar, { flexDirection: row, borderTopColor: community.divider }]}> 
            <QuickAction icon="image-outline" label={copy.form.addImage} onPress={pickImage} color={community.primaryStrong} />
            <View style={[styles.mediaDivider, { backgroundColor: community.divider }]} />
            <QuickAction icon="document-text-outline" label={copy.form.addPdf} onPress={pickPdf} color={community.primaryStrong} />
          </View>
        </View>

        <Pressable
          onPress={() => { Keyboard.dismiss(); setTypeOpen(false); setDetailsOpen((open) => !open); }}
          style={({ pressed }) => [styles.detailsToggle, { flexDirection: row, backgroundColor: community.surface, borderColor: community.border, opacity: pressed ? 0.72 : 1 }]}
        >
          <View style={[styles.detailsIcon, { backgroundColor: community.primarySoft }]}><Ionicons name="options-outline" size={18} color={community.primaryStrong} /></View>
          <View style={styles.detailsCopy}>
            <Text style={[styles.detailsTitle, { color: community.text, textAlign: align }]}>{ar ? 'تفاصيل المنشور' : 'Post details'}</Text>
            <Text style={[styles.detailsSubtitle, { color: community.textMuted, textAlign: align }]}>{ar ? 'النوع، العنوان، المادة والمستوى' : 'Type, title, subject and level'}</Text>
          </View>
          {detailsCount > 0 && <View style={[styles.detailsBadge, { backgroundColor: community.gold }]}><Text style={styles.detailsBadgeText}>{detailsCount}</Text></View>}
          <Ionicons name={detailsOpen ? 'chevron-up' : 'chevron-down'} size={19} color={community.textMuted} />
        </Pressable>

        {detailsOpen && (
          <View style={[styles.detailsCard, { backgroundColor: community.surface, borderColor: community.border }]}>
            <CompactSection title={copy.form.postType} community={community} align={align}>
              <Pressable onPress={() => { Keyboard.dismiss(); setTypeOpen((open) => !open); }} style={[styles.selector, { backgroundColor: community.surfaceRaised, borderColor: community.border, flexDirection: row }]}>
                <Ionicons name={communityTypeIcons[type]} size={19} color={community.primaryStrong} />
                <Text style={[styles.selectorText, { color: community.text, textAlign: align }]}>{copy.types[type]}</Text>
                <Ionicons name={typeOpen ? 'chevron-up' : 'chevron-down'} size={18} color={community.textMuted} />
              </Pressable>
              {typeOpen && (
                <View style={[styles.options, { borderColor: community.border }]}> 
                  {COMMUNITY_POST_TYPES.map((item) => (
                    <Pressable key={item} onPress={() => { setType(item); setTypeOpen(false); }} style={[styles.option, { backgroundColor: type === item ? community.primarySoft : community.surface, flexDirection: row }]}>
                      <Ionicons name={communityTypeIcons[item]} size={18} color={community.primaryStrong} />
                      <Text style={[styles.selectorText, { color: community.text, textAlign: align }]}>{copy.types[item]}</Text>
                      {type === item && <Ionicons name="checkmark" size={18} color={community.primaryStrong} />}
                    </Pressable>
                  ))}
                </View>
              )}
            </CompactSection>

            <CompactSection title={copy.form.titleField} community={community} align={align}>
              <SimpleInput value={title} onChangeText={setTitle} placeholder={copy.form.titleOptional} align={align} community={community} />
            </CompactSection>
            <CompactSection title={copy.form.subject} community={community} align={align}>
              <SimpleInput value={subject} onChangeText={setSubject} align={align} community={community} />
            </CompactSection>
            <CompactSection title={copy.form.level} community={community} align={align}>
              <View style={[styles.stageRow, { flexDirection: row }]}> 
                {(['PS', 'MS'] as const).map((item) => {
                  const selected = stage === item;
                  return (
                    <Pressable key={item} onPress={() => setStage(selected ? null : item)} style={[styles.stageChip, { backgroundColor: selected ? community.text : community.surface, borderColor: selected ? community.text : community.border }]}>
                      <Text style={[styles.stageChipText, { color: selected ? community.surface : community.text }]}>{item === 'PS' ? (ar ? 'ابتدائي' : 'Primary') : (ar ? 'متوسط' : 'Middle')}</Text>
                    </Pressable>
                  );
                })}
              </View>
              {stage && (
                <View style={[styles.levelWrap, { flexDirection: row }]}> 
                  {EDUCATIONAL_LEVELS.filter((item) => item.endsWith(stage)).map((item) => {
                    const selected = levels.includes(item);
                    return (
                      <Pressable key={item} onPress={() => toggleLevel(item)} style={[styles.levelChip, { backgroundColor: selected ? community.primarySoft : community.surfaceRaised, borderColor: selected ? community.gold : community.border }]}>
                        <Text style={[styles.levelChipText, { color: selected ? community.text : community.textSecondary }]}>{ar ? `السنة ${item[0]}` : `Year ${item[0]}`}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </CompactSection>
          </View>
        )}
      </ScrollView>

      <View style={[styles.publishFooter, { backgroundColor: community.surface, borderTopColor: community.divider }]}> 
        <Pressable accessibilityRole="button" accessibilityState={{ disabled: !canPublish, busy }} onPress={handlePublish} disabled={!canPublish} style={({ pressed }) => [styles.publishButton, { backgroundColor: canPublish ? community.text : community.surfaceRaised, opacity: pressed && canPublish ? 0.82 : 1 }]}>
          {busy ? <ActivityIndicator color={community.surface} size="small" /> : <><Ionicons name="paper-plane" size={18} color={canPublish ? '#FFFFFF' : community.textMuted} /><Text style={[styles.publishButtonText, { color: canPublish ? '#FFFFFF' : community.textMuted }]}>{copy.form.publish}</Text></>}
        </Pressable>
      </View>
    </Screen>
  );
}

function QuickAction({ icon, label, onPress, color }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; color: string }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.quickAction, { opacity: pressed ? 0.55 : 1 }]}><Ionicons name={icon} size={21} color={color} /><Text style={[styles.quickActionText, { color }]}>{label}</Text></Pressable>;
}

function CompactSection({ title, community, align, children }: { title: string; community: ReturnType<typeof getCommunityTheme>; align: 'right' | 'left'; children: React.ReactNode }) {
  return <View style={styles.section}><Text style={[styles.sectionTitle, { color: community.text, textAlign: align }]}>{title}</Text>{children}</View>;
}

function SimpleInput({ value, onChangeText, placeholder, align, community }: { value: string; onChangeText: (value: string) => void; placeholder?: string; align: 'right' | 'left'; community: ReturnType<typeof getCommunityTheme> }) {
  return <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={community.textMuted} textAlign={align} style={[styles.simpleInput, { color: community.text, backgroundColor: community.surfaceRaised, borderColor: community.border }]} />;
}

const styles = StyleSheet.create({
  page: { padding: 0, paddingHorizontal: 0, paddingVertical: 0 },
  topRow: { minHeight: 72, paddingHorizontal: 12, borderBottomWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'space-between' },
  topIcon: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  titleWrap: { flex: 1, alignItems: 'center', gap: 2 },
  screenTitle: { fontSize: 19, fontWeight: '900' },
  screenSubtitle: { fontSize: 10.5, fontWeight: '500' },
  scroll: { flex: 1 },
  scrollContent: { padding: 14, gap: 12, paddingBottom: 24 },
  composerCard: { borderWidth: 1, borderRadius: 22, overflow: 'hidden' },
  authorComposer: { paddingHorizontal: 14, paddingTop: 16, paddingBottom: 14, alignItems: 'flex-start', gap: 11 },
  avatar: { width: 42, height: 42, borderRadius: 21, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  composerBody: { flex: 1, minWidth: 0, gap: 12 },
  bodyInput: { minHeight: 132, fontSize: 16.5, lineHeight: 25, textAlignVertical: 'top', paddingTop: 3 },
  imagePreviewShell: { width: '100%', borderRadius: 16, overflow: 'hidden', position: 'relative' },
  imagePreview: { width: '100%', aspectRatio: 1.1 },
  removeMedia: { position: 'absolute', top: 9, right: 9, width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(0,0,0,0.68)', alignItems: 'center', justifyContent: 'center' },
  pdfRow: { borderWidth: 1, borderRadius: 14, minHeight: 64, paddingHorizontal: 10, alignItems: 'center', gap: 9 },
  pdfIcon: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  pdfName: { flex: 1, fontSize: 13, fontWeight: '700' },
  mediaBar: { minHeight: 54, paddingHorizontal: 8, borderTopWidth: StyleSheet.hairlineWidth, alignItems: 'center' },
  mediaDivider: { width: StyleSheet.hairlineWidth, height: 28 },
  quickAction: { flex: 1, minHeight: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  quickActionText: { fontSize: 12.5, fontWeight: '800' },
  detailsToggle: { minHeight: 68, borderWidth: 1, borderRadius: 18, paddingHorizontal: 14, alignItems: 'center', gap: 10 },
  detailsIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  detailsCopy: { flex: 1, minWidth: 0 },
  detailsTitle: { fontSize: 14, fontWeight: '900' },
  detailsSubtitle: { marginTop: 2, fontSize: 11.5, fontWeight: '500' },
  detailsBadge: { minWidth: 24, height: 24, borderRadius: 12, paddingHorizontal: 7, alignItems: 'center', justifyContent: 'center' },
  detailsBadgeText: { color: '#0B1833', fontSize: 11.5, fontWeight: '900' },
  detailsCard: { borderWidth: 1, borderRadius: 20, overflow: 'hidden', paddingHorizontal: 14 },
  section: { paddingVertical: 14, gap: 9, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E9EDF1' },
  sectionTitle: { fontSize: 12.5, fontWeight: '900' },
  selector: { minHeight: 50, borderRadius: 13, borderWidth: 1, paddingHorizontal: 12, alignItems: 'center', gap: 9 },
  selectorText: { flex: 1, fontSize: 14, fontWeight: '700' },
  options: { borderWidth: 1, borderRadius: 13, overflow: 'hidden' },
  option: { minHeight: 46, paddingHorizontal: 12, alignItems: 'center', gap: 9 },
  simpleInput: { minHeight: 48, borderWidth: 1, borderRadius: 13, paddingHorizontal: 12, fontSize: 14 },
  stageRow: { gap: 8 },
  stageChip: { flex: 1, minHeight: 42, borderRadius: 999, borderWidth: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  stageChipText: { fontSize: 13, fontWeight: '800' },
  levelWrap: { flexWrap: 'wrap', gap: 8 },
  levelChip: { minHeight: 38, borderRadius: 999, borderWidth: 1, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  levelChipText: { fontSize: 12.5, fontWeight: '800' },
  publishFooter: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 10, borderTopWidth: StyleSheet.hairlineWidth },
  publishButton: { minHeight: 52, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  publishButtonText: { fontSize: 15, fontWeight: '900' }
});