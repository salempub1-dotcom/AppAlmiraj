import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
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
import { useAuth } from '../../../context/AuthProvider';
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
import { profileRepository } from '../../../repositories/profileRepository';
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
  const { session } = useAuth();
  const { language, isRTL } = useLanguage();
  const copy = getCommunityCopy(language);
  const align = isRTL ? ('right' as const) : ('left' as const);
  const row = isRTL ? ('row-reverse' as const) : ('row' as const);
  const ar = language === 'ar';
  const createPost = useCreateCommunityPost();

  const { data: profileResult } = useQuery({
    queryKey: ['profile', 'me', session?.user.id],
    queryFn: () => profileRepository.getMyProfile(),
    enabled: !!session
  });

  const profile = profileResult?.data;
  const fullName = profile?.full_name?.trim?.()
    || session?.user.user_metadata?.full_name?.trim?.()
    || session?.user.email?.split('@')[0]
    || '';
  const avatarUrl = profile?.avatar_url || session?.user.user_metadata?.avatar_url || null;
  const initial = fullName ? fullName[0]?.toUpperCase() : ar ? 'أ' : 'T';

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
    const attachmentPayload: CreateCommunityPostAttachment | undefined = attachment
      ? { kind: attachment.kind, file: attachment.file }
      : undefined;
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
    <Screen style={styles.page}>
      <View style={styles.background} pointerEvents="none">
        <View style={styles.bgCircleOne} />
        <View style={styles.bgCircleTwo} />
        <Ionicons name="book-outline" size={122} color="rgba(35,92,164,0.075)" style={styles.bgBook} />
        <Ionicons name="paper-plane-outline" size={72} color="rgba(35,92,164,0.075)" style={styles.bgPlane} />
      </View>

      <View style={[styles.topRow, { flexDirection: row, borderBottomColor: 'rgba(23,63,120,0.08)' }]}> 
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={ar ? 'رجوع' : 'Back'}
          onPress={() => navigation.goBack()}
          hitSlop={10}
          style={({ pressed }) => [styles.topIcon, pressed && styles.topIconPressed]}
        >
          <Ionicons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={25} color={community.text} />
        </Pressable>
        <Text style={[styles.screenTitle, { color: community.text }]}>{copy.feed.newPost}</Text>
        <View style={styles.topIcon} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.hero}>
          <Text style={[styles.heroTitle, { color: community.text }]}>{copy.feed.newPost}</Text>
          <View style={[styles.heroLine, { backgroundColor: community.gold }]} />
          <Text style={[styles.heroSubtitle, { color: community.textSecondary }]}>
            {ar ? 'شارك فكرة أو مورداً مع زملائك' : 'Share an idea or resource with colleagues'}
          </Text>
        </View>

        <View style={[styles.composerCard, { backgroundColor: community.surface, borderColor: 'rgba(23,63,120,0.10)' }]}>
          <View style={styles.composerArea}>
            <View
              style={[
                styles.avatarFloating,
                isRTL ? styles.avatarFloatingRTL : styles.avatarFloatingLTR
              ]}
            >
              <View style={[styles.avatar, { backgroundColor: community.primarySoft, borderColor: community.gold }]}> 
                {avatarUrl
                  ? <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
                  : <Text style={[styles.avatarInitial, { color: community.primaryStrong }]}>{initial}</Text>}
              </View>
              <View style={styles.onlineDot} />
            </View>

            <View style={[styles.inputShell, { backgroundColor: '#F7FAFF', borderColor: 'rgba(23,63,120,0.08)' }]}>
              <TextInput
                value={body}
                onChangeText={setBody}
                placeholder={ar ? 'اكتب فكرتك، سؤالك أو تجربتك مع بقية الأساتذة...' : copy.form.bodyPlaceholder}
                placeholderTextColor={community.textMuted}
                multiline
                maxLength={2000}
                textAlign={align}
                textAlignVertical="top"
                style={[
                  styles.bodyInput,
                  isRTL ? styles.bodyInputRTL : styles.bodyInputLTR,
                  { color: community.text, writingDirection: isRTL ? 'rtl' : 'ltr' }
                ]}
              />
              <Text style={[styles.counter, { color: community.textMuted }]}>{body.length}/2000</Text>
            </View>
          </View>

          {attachment?.kind === 'image' && (
            <View style={styles.imagePreviewShell}>
              <Image source={{ uri: attachment.previewUri }} style={styles.imagePreview} resizeMode="cover" />
              <Pressable accessibilityRole="button" accessibilityLabel={ar ? 'إزالة الصورة' : 'Remove image'} onPress={() => setAttachment(null)} style={styles.removeMedia}>
                <Ionicons name="close" size={18} color="#FFFFFF" />
              </Pressable>
            </View>
          )}

          {attachment?.kind === 'pdf' && (
            <View style={[styles.pdfRow, { backgroundColor: '#F7FAFF', borderColor: 'rgba(23,63,120,0.10)', flexDirection: row }]}> 
              <View style={[styles.pdfIcon, { backgroundColor: '#FFF5D8' }]}>
                <Ionicons name="document-text-outline" size={21} color="#9A6A00" />
              </View>
              <Text numberOfLines={1} style={[styles.pdfName, { color: community.text, textAlign: align }]}>{attachment.file.name}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel={ar ? 'إزالة الملف' : 'Remove file'} onPress={() => setAttachment(null)} hitSlop={8}>
                <Ionicons name="close-circle" size={20} color={community.textMuted} />
              </Pressable>
            </View>
          )}

          <View style={[styles.mediaBar, { flexDirection: row }]}> 
            <AttachmentAction
              icon="image-outline"
              label={copy.form.addImage}
              onPress={pickImage}
              background="#EAF3FF"
              color="#1D5FA7"
            />
            <AttachmentAction
              icon="document-text-outline"
              label={copy.form.addPdf}
              onPress={pickPdf}
              background="#FFF5D8"
              color="#9A6A00"
            />
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={ar ? 'تفاصيل المنشور' : 'Post details'}
          onPress={() => { Keyboard.dismiss(); setTypeOpen(false); setDetailsOpen((open) => !open); }}
          style={({ pressed }) => [
            styles.detailsToggle,
            { flexDirection: row, backgroundColor: community.surface, borderColor: 'rgba(23,63,120,0.10)', opacity: pressed ? 0.76 : 1 }
          ]}
        >
          <View style={[styles.detailsIcon, { backgroundColor: '#EAF3FF' }]}>
            <Ionicons name="options-outline" size={20} color="#173F78" />
          </View>
          <View style={styles.detailsCopy}>
            <Text style={[styles.detailsTitle, { color: community.text, textAlign: align }]}>{ar ? 'تفاصيل المنشور' : 'Post details'}</Text>
            <Text style={[styles.detailsSubtitle, { color: community.textMuted, textAlign: align }]}>{ar ? 'النوع، العنوان، المادة والمستوى' : 'Type, title, subject and level'}</Text>
          </View>
          {detailsCount > 0 && (
            <View style={[styles.detailsBadge, { backgroundColor: community.gold }]}>
              <Text style={styles.detailsBadgeText}>{detailsCount}</Text>
            </View>
          )}
          <Ionicons name={detailsOpen ? 'chevron-up' : 'chevron-down'} size={20} color={community.textMuted} />
        </Pressable>

        {detailsOpen && (
          <View style={[styles.detailsCard, { backgroundColor: community.surface, borderColor: 'rgba(23,63,120,0.10)' }]}>
            <CompactSection title={copy.form.postType} community={community} align={align}>
              <Pressable
                accessibilityRole="button"
                onPress={() => { Keyboard.dismiss(); setTypeOpen((open) => !open); }}
                style={[styles.selector, { backgroundColor: '#F7FAFF', borderColor: 'rgba(23,63,120,0.10)', flexDirection: row }]}
              >
                <Ionicons name={communityTypeIcons[type]} size={19} color={community.primaryStrong} />
                <Text style={[styles.selectorText, { color: community.text, textAlign: align }]}>{copy.types[type]}</Text>
                <Ionicons name={typeOpen ? 'chevron-up' : 'chevron-down'} size={18} color={community.textMuted} />
              </Pressable>
              {typeOpen && (
                <View style={[styles.options, { borderColor: 'rgba(23,63,120,0.10)' }]}> 
                  {COMMUNITY_POST_TYPES.map((item) => (
                    <Pressable
                      accessibilityRole="button"
                      key={item}
                      onPress={() => { setType(item); setTypeOpen(false); }}
                      style={[styles.option, { backgroundColor: type === item ? community.primarySoft : community.surface, flexDirection: row }]}
                    >
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
                    <Pressable
                      accessibilityRole="button"
                      key={item}
                      onPress={() => setStage(selected ? null : item)}
                      style={[styles.stageChip, { backgroundColor: selected ? community.text : community.surface, borderColor: selected ? community.text : community.border }]}
                    >
                      <Text style={[styles.stageChipText, { color: selected ? community.surface : community.text }]}>
                        {item === 'PS' ? (ar ? 'ابتدائي' : 'Primary') : (ar ? 'متوسط' : 'Middle')}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              {stage && (
                <View style={[styles.levelWrap, { flexDirection: row }]}> 
                  {EDUCATIONAL_LEVELS.filter((item) => item.endsWith(stage)).map((item) => {
                    const selected = levels.includes(item);
                    return (
                      <Pressable
                        accessibilityRole="button"
                        key={item}
                        onPress={() => toggleLevel(item)}
                        style={[styles.levelChip, { backgroundColor: selected ? community.primarySoft : '#F7FAFF', borderColor: selected ? community.gold : community.border }]}
                      >
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

      <View style={[styles.publishFooter, { backgroundColor: community.surface, borderTopColor: 'rgba(23,63,120,0.08)' }]}> 
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copy.form.publish}
          accessibilityState={{ disabled: !canPublish, busy }}
          onPress={handlePublish}
          disabled={!canPublish}
          style={({ pressed }) => [
            styles.publishButton,
            { backgroundColor: canPublish ? '#123C72' : '#E5EDF7', opacity: pressed && canPublish ? 0.86 : 1 }
          ]}
        >
          {busy
            ? <ActivityIndicator color="#FFFFFF" size="small" />
            : <>
                <Ionicons name="paper-plane" size={21} color={canPublish ? '#FFFFFF' : '#8A98AA'} />
                <Text style={[styles.publishButtonText, { color: canPublish ? '#FFFFFF' : '#8A98AA' }]}>{copy.form.publish}</Text>
              </>}
        </Pressable>
      </View>
    </Screen>
  );
}

function AttachmentAction({
  icon,
  label,
  onPress,
  background,
  color
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  background: string;
  color: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.attachmentAction, { backgroundColor: background, opacity: pressed ? 0.72 : 1 }]}
    >
      <Ionicons name={icon} size={22} color={color} />
      <Text style={[styles.attachmentActionText, { color }]}>{label}</Text>
    </Pressable>
  );
}

function CompactSection({ title, community, align, children }: { title: string; community: ReturnType<typeof getCommunityTheme>; align: 'right' | 'left'; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: community.text, textAlign: align }]}>{title}</Text>
      {children}
    </View>
  );
}

function SimpleInput({ value, onChangeText, placeholder, align, community }: { value: string; onChangeText: (value: string) => void; placeholder?: string; align: 'right' | 'left'; community: ReturnType<typeof getCommunityTheme> }) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={community.textMuted}
      textAlign={align}
      style={[styles.simpleInput, { color: community.text, backgroundColor: '#F7FAFF', borderColor: 'rgba(23,63,120,0.10)' }]}
    />
  );
}

const styles = StyleSheet.create({
  page: { padding: 0, paddingHorizontal: 0, paddingVertical: 0, backgroundColor: '#F2F7FD' },
  background: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  bgCircleOne: { position: 'absolute', width: 260, height: 260, borderRadius: 130, backgroundColor: '#E4F1FF', top: 40, left: -110, opacity: 0.9 },
  bgCircleTwo: { position: 'absolute', width: 190, height: 190, borderRadius: 95, backgroundColor: '#EAF3FF', top: 250, right: -95, opacity: 0.75 },
  bgBook: { position: 'absolute', top: 178, left: -14, transform: [{ rotate: '-5deg' }] },
  bgPlane: { position: 'absolute', top: 160, right: 22, transform: [{ rotate: '-8deg' }] },
  topRow: { minHeight: 64, paddingHorizontal: 14, borderBottomWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.90)' },
  topIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  topIconPressed: { backgroundColor: 'rgba(23,63,120,0.06)' },
  screenTitle: { flex: 1, textAlign: 'center', fontSize: 19, fontWeight: '900' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 24, gap: 12 },
  hero: { minHeight: 116, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 14 },
  heroTitle: { fontSize: 28, fontWeight: '900' },
  heroLine: { width: 52, height: 4, borderRadius: 2, marginTop: 10 },
  heroSubtitle: { marginTop: 10, fontSize: 14.5, fontWeight: '600', textAlign: 'center' },
  composerCard: { position: 'relative', overflow: 'visible', borderWidth: 1, borderRadius: 28, padding: 14, shadowColor: '#163D6C', shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 7 }, elevation: 3 },
  composerArea: { position: 'relative', width: '100%' },
  avatarFloating: { position: 'absolute', top: -18, zIndex: 20, elevation: 8, width: 62, height: 62 },
  avatarFloatingRTL: { right: -4 },
  avatarFloatingLTR: { left: -4 },
  avatar: { width: 62, height: 62, borderRadius: 31, borderWidth: 2.5, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%' },
  avatarInitial: { fontSize: 22, fontWeight: '900' },
  onlineDot: { position: 'absolute', width: 15, height: 15, borderRadius: 8, backgroundColor: '#75BF35', borderWidth: 3, borderColor: '#FFFFFF', right: -1, bottom: 1 },
  inputShell: { width: '100%', minHeight: 215, borderRadius: 22, borderWidth: 1, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 30, position: 'relative' },
  bodyInput: { width: '100%', minHeight: 160, fontSize: 16.5, lineHeight: 27, padding: 0 },
  bodyInputRTL: { paddingRight: 48, paddingLeft: 0 },
  bodyInputLTR: { paddingLeft: 48, paddingRight: 0 },
  counter: { position: 'absolute', bottom: 10, left: 14, fontSize: 11.5, fontWeight: '600' },
  imagePreviewShell: { width: '100%', marginTop: 12, borderRadius: 18, overflow: 'hidden', position: 'relative' },
  imagePreview: { width: '100%', aspectRatio: 1.25 },
  removeMedia: { position: 'absolute', top: 9, right: 9, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.66)', alignItems: 'center', justifyContent: 'center' },
  pdfRow: { marginTop: 12, borderWidth: 1, borderRadius: 15, minHeight: 62, paddingHorizontal: 10, alignItems: 'center', gap: 9 },
  pdfIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  pdfName: { flex: 1, fontSize: 13, fontWeight: '700' },
  mediaBar: { marginTop: 14, gap: 10 },
  attachmentAction: { flex: 1, minHeight: 56, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 10 },
  attachmentActionText: { fontSize: 13.5, fontWeight: '900' },
  detailsToggle: { minHeight: 76, borderWidth: 1, borderRadius: 22, paddingHorizontal: 14, alignItems: 'center', gap: 10, shadowColor: '#163D6C', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  detailsIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  detailsCopy: { flex: 1, minWidth: 0 },
  detailsTitle: { fontSize: 15, fontWeight: '900' },
  detailsSubtitle: { marginTop: 3, fontSize: 11.8, fontWeight: '500' },
  detailsBadge: { minWidth: 24, height: 24, borderRadius: 12, paddingHorizontal: 7, alignItems: 'center', justifyContent: 'center' },
  detailsBadgeText: { color: '#0B1833', fontSize: 11.5, fontWeight: '900' },
  detailsCard: { borderWidth: 1, borderRadius: 22, overflow: 'hidden', paddingHorizontal: 14, shadowColor: '#163D6C', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 1 },
  section: { paddingVertical: 14, gap: 9, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E9EDF1' },
  sectionTitle: { fontSize: 12.5, fontWeight: '900' },
  selector: { minHeight: 50, borderRadius: 14, borderWidth: 1, paddingHorizontal: 12, alignItems: 'center', gap: 9 },
  selectorText: { flex: 1, fontSize: 14, fontWeight: '700' },
  options: { borderWidth: 1, borderRadius: 14, overflow: 'hidden' },
  option: { minHeight: 46, paddingHorizontal: 12, alignItems: 'center', gap: 9 },
  simpleInput: { minHeight: 50, borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, fontSize: 14 },
  stageRow: { gap: 8 },
  stageChip: { flex: 1, minHeight: 42, borderRadius: 999, borderWidth: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  stageChipText: { fontSize: 13, fontWeight: '800' },
  levelWrap: { flexWrap: 'wrap', gap: 8 },
  levelChip: { minHeight: 38, borderRadius: 999, borderWidth: 1, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  levelChipText: { fontSize: 12.5, fontWeight: '800' },
  publishFooter: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 10, borderTopWidth: StyleSheet.hairlineWidth },
  publishButton: { minHeight: 60, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  publishButtonText: { fontSize: 16, fontWeight: '900' }
});