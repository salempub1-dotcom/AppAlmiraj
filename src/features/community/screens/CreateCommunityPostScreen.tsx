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
  KeyboardAvoidingView,
  Platform,
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
    setAttachment({
      kind: 'image',
      file: { uri: asset.uri, name: asset.fileName ?? `image-${Date.now()}.jpg`, mimeType },
      previewUri: asset.uri
    });
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
        <View style={styles.heroBandDark} />
        <View style={styles.heroBandMid} />
        <View style={styles.heroBandSoft} />
        <View style={styles.heroCircleOne} />
        <View style={styles.heroCircleTwo} />
        <View style={styles.heroCircleThree} />
        <Ionicons name="book-outline" size={150} color="rgba(255,255,255,0.075)" style={styles.bgBook} />
        <View style={styles.contentBandOne} />
        <View style={styles.contentBandTwo} />
        <View style={styles.contentBandThree} />
        <View style={styles.contentCircleOne} />
        <View style={styles.contentCircleTwo} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.hero}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={ar ? 'رجوع' : 'Back'}
              onPress={() => navigation.goBack()}
              hitSlop={10}
              style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
            >
              <Ionicons name="arrow-back" size={27} color="#FFFFFF" />
            </Pressable>

            <View style={styles.heroTextWrap}>
              <Text style={styles.heroTitle}>{copy.feed.newPost}</Text>
              <View style={styles.heroLine} />
              <Text style={styles.heroSubtitle}>
                {ar ? 'شارك فكرة أو مورداً مع زملائك' : 'Share an idea or resource with colleagues'}
              </Text>
            </View>

            <View style={styles.heroRightNote}>
              <Ionicons name="school" size={48} color="#D4AF37" />
              <Text style={styles.heroNoteText}>{ar ? 'معاً\nنبني تعليماً أفضل' : 'Together\nwe build better learning'}</Text>
            </View>

            <View style={styles.heroLeftNote}>
              <Ionicons name="book-outline" size={58} color="rgba(255,255,255,0.13)" />
              <Text style={styles.heroNoteText}>{ar ? 'تبادل الخبرات\nيصنع الفرق' : 'Sharing experience\nmakes a difference'}</Text>
              <View style={styles.heroNoteLine} />
            </View>
          </View>

          <View style={styles.contentArea}>
            <View style={[styles.composerCard, { backgroundColor: community.surface }]}>
              <View style={styles.composerArea}>
                <View style={styles.avatarFloating}>
                  <View style={[styles.avatar, { backgroundColor: community.primarySoft }]}> 
                    {avatarUrl
                      ? <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
                      : <Text style={[styles.avatarInitial, { color: community.primaryStrong }]}>{initial}</Text>}
                  </View>
                  <View style={styles.onlineDot} />
                </View>

                <View style={styles.inputShell}>
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
                  <Text style={[styles.counter, isRTL ? styles.counterRTL : styles.counterLTR, { color: community.textMuted }]}>{body.length}/2000</Text>
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
                <View style={[styles.pdfRow, { flexDirection: row }]}> 
                  <View style={styles.pdfIcon}>
                    <Ionicons name="document-text-outline" size={21} color="#9A6A00" />
                  </View>
                  <Text numberOfLines={1} style={[styles.pdfName, { color: community.text, textAlign: align }]}>{attachment.file.name}</Text>
                  <Pressable accessibilityRole="button" accessibilityLabel={ar ? 'إزالة الملف' : 'Remove file'} onPress={() => setAttachment(null)} hitSlop={8}>
                    <Ionicons name="close-circle" size={20} color={community.textMuted} />
                  </Pressable>
                </View>
              )}

              <View style={styles.mediaBar}> 
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
                { flexDirection: row, backgroundColor: community.surface, opacity: pressed ? 0.78 : 1 }
              ]}
            >
              <Ionicons name={detailsOpen ? 'chevron-up' : 'chevron-back'} size={22} color={community.textMuted} />
              <View style={styles.detailsCopy}>
                <Text style={[styles.detailsTitle, { color: community.text, textAlign: align }]}>{ar ? 'تفاصيل المنشور' : 'Post details'}</Text>
                <Text style={[styles.detailsSubtitle, { color: community.textMuted, textAlign: align }]}>{ar ? 'النوع، العنوان، المادة والمستوى' : 'Type, title, subject and level'}</Text>
              </View>
              {detailsCount > 0 && (
                <View style={styles.detailsBadge}>
                  <Text style={styles.detailsBadgeText}>{detailsCount}</Text>
                </View>
              )}
              <View style={styles.detailsIcon}>
                <Ionicons name="options-outline" size={22} color="#173F78" />
              </View>
            </Pressable>

            {detailsOpen && (
              <View style={[styles.detailsCard, { backgroundColor: community.surface }]}> 
                <CompactSection title={copy.form.postType} community={community} align={align}>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => { Keyboard.dismiss(); setTypeOpen((open) => !open); }}
                    style={[styles.selector, { flexDirection: row }]}
                  >
                    <Ionicons name={communityTypeIcons[type]} size={19} color={community.primaryStrong} />
                    <Text style={[styles.selectorText, { color: community.text, textAlign: align }]}>{copy.types[type]}</Text>
                    <Ionicons name={typeOpen ? 'chevron-up' : 'chevron-down'} size={18} color={community.textMuted} />
                  </Pressable>
                  {typeOpen && (
                    <View style={styles.options}> 
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
          </View>
        </ScrollView>

        <View style={styles.publishFooter}> 
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={copy.form.publish}
            accessibilityState={{ disabled: !canPublish, busy }}
            onPress={handlePublish}
            disabled={!canPublish}
            style={({ pressed }) => [
              styles.publishButton,
              canPublish ? styles.publishButtonEnabled : styles.publishButtonDisabled,
              pressed && canPublish && styles.publishButtonPressed
            ]}
          >
            {busy
              ? <ActivityIndicator color="#FFFFFF" size="small" />
              : <>
                  <Text style={[styles.publishButtonText, { color: canPublish ? '#FFFFFF' : '#8A98AA' }]}>{copy.form.publish}</Text>
                  <Ionicons name="paper-plane" size={23} color={canPublish ? '#FFFFFF' : '#8A98AA'} />
                </>}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
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
      <Text style={[styles.attachmentActionText, { color }]}>{label}</Text>
      <Ionicons name={icon} size={24} color={color} />
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
      style={[styles.simpleInput, { color: community.text }]}
    />
  );
}

const styles = StyleSheet.create({
  page: { padding: 0, paddingHorizontal: 0, paddingVertical: 0, backgroundColor: '#EAF4FF' },
  keyboardView: { flex: 1 },
  background: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },

  heroBandDark: { position: 'absolute', top: 0, left: 0, right: 0, height: 185, backgroundColor: '#0B1833' },
  heroBandMid: { position: 'absolute', top: 185, left: 0, right: 0, height: 125, backgroundColor: '#102C57' },
  heroBandSoft: { position: 'absolute', top: 310, left: 0, right: 0, height: 105, backgroundColor: '#17477F' },
  heroCircleOne: { position: 'absolute', width: 330, height: 330, borderRadius: 165, backgroundColor: '#17477F', top: -155, left: -120, opacity: 0.82 },
  heroCircleTwo: { position: 'absolute', width: 285, height: 285, borderRadius: 143, backgroundColor: '#1F5C9D', top: 80, right: -145, opacity: 0.50 },
  heroCircleThree: { position: 'absolute', width: 190, height: 190, borderRadius: 95, backgroundColor: '#286DB4', top: -72, right: 95, opacity: 0.25 },
  bgBook: { position: 'absolute', top: 128, left: -28, transform: [{ rotate: '-7deg' }] },

  contentBandOne: { position: 'absolute', top: 415, left: 0, right: 0, height: 210, backgroundColor: '#D9ECFF' },
  contentBandTwo: { position: 'absolute', top: 625, left: 0, right: 0, height: 330, backgroundColor: '#E8F4FF' },
  contentBandThree: { position: 'absolute', top: 955, left: 0, right: 0, bottom: 0, backgroundColor: '#F3F8FE' },
  contentCircleOne: { position: 'absolute', width: 320, height: 320, borderRadius: 160, backgroundColor: '#BFDFFF', top: 560, left: -170, opacity: 0.62 },
  contentCircleTwo: { position: 'absolute', width: 260, height: 260, borderRadius: 130, backgroundColor: '#CBE5FF', top: 760, right: -140, opacity: 0.60 },

  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 28 },
  hero: { minHeight: 355, paddingHorizontal: 22, paddingTop: 42, paddingBottom: 66, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  backButton: { position: 'absolute', top: 26, left: 20, width: 58, height: 58, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.26)', backgroundColor: 'rgba(255,255,255,0.09)', alignItems: 'center', justifyContent: 'center' },
  backButtonPressed: { backgroundColor: 'rgba(255,255,255,0.16)' },
  heroTextWrap: { alignItems: 'center', paddingHorizontal: 80, marginTop: -4 },
  heroTitle: { color: '#FFFFFF', fontSize: 36, fontWeight: '900', textAlign: 'center' },
  heroLine: { width: 60, height: 5, borderRadius: 3, marginTop: 13, backgroundColor: '#D4AF37' },
  heroSubtitle: { color: 'rgba(255,255,255,0.94)', marginTop: 14, fontSize: 16, fontWeight: '700', textAlign: 'center' },
  heroRightNote: { position: 'absolute', top: 32, right: 18, width: 105, alignItems: 'center' },
  heroLeftNote: { position: 'absolute', left: 26, bottom: 35, width: 115, alignItems: 'center' },
  heroNoteText: { color: 'rgba(255,255,255,0.54)', fontSize: 11.5, lineHeight: 18, textAlign: 'center', fontWeight: '600' },
  heroNoteLine: { width: 28, height: 3, borderRadius: 2, backgroundColor: '#D4AF37', marginTop: 7 },

  contentArea: { paddingHorizontal: 16, marginTop: -50, gap: 14 },
  composerCard: { position: 'relative', overflow: 'visible', borderRadius: 31, padding: 16, shadowColor: '#123C72', shadowOpacity: 0.14, shadowRadius: 24, shadowOffset: { width: 0, height: 10 }, elevation: 6 },
  composerArea: { position: 'relative', width: '100%' },
  avatarFloating: { position: 'absolute', top: -18, left: -2, zIndex: 20, elevation: 8, width: 70, height: 70 },
  avatar: { width: 70, height: 70, borderRadius: 35, borderWidth: 3, borderColor: '#D4AF37', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%' },
  avatarInitial: { fontSize: 24, fontWeight: '900' },
  onlineDot: { position: 'absolute', width: 17, height: 17, borderRadius: 9, backgroundColor: '#75BF35', borderWidth: 3, borderColor: '#FFFFFF', left: -1, bottom: 1 },
  inputShell: { width: '100%', minHeight: 255, borderRadius: 25, borderWidth: 1, borderColor: '#D9E7F5', backgroundColor: '#F8FBFF', paddingHorizontal: 18, paddingTop: 22, paddingBottom: 38, position: 'relative' },
  bodyInput: { width: '100%', minHeight: 190, fontSize: 17.5, lineHeight: 29, padding: 0 },
  bodyInputRTL: { paddingLeft: 54, paddingRight: 0 },
  bodyInputLTR: { paddingLeft: 54, paddingRight: 0 },
  counter: { position: 'absolute', bottom: 12, fontSize: 12.5, fontWeight: '700' },
  counterRTL: { right: 16 },
  counterLTR: { left: 16 },
  imagePreviewShell: { width: '100%', marginTop: 13, borderRadius: 20, overflow: 'hidden', position: 'relative' },
  imagePreview: { width: '100%', aspectRatio: 1.25 },
  removeMedia: { position: 'absolute', top: 9, right: 9, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.66)', alignItems: 'center', justifyContent: 'center' },
  pdfRow: { marginTop: 12, borderWidth: 1, borderColor: '#E2ECF6', borderRadius: 16, minHeight: 62, paddingHorizontal: 10, alignItems: 'center', gap: 9, backgroundColor: '#F8FBFF' },
  pdfIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF5D8' },
  pdfName: { flex: 1, fontSize: 13, fontWeight: '700' },
  mediaBar: { marginTop: 14, flexDirection: 'row', gap: 11 },
  attachmentAction: { flex: 1, minHeight: 66, borderRadius: 21, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 10 },
  attachmentActionText: { fontSize: 14.5, fontWeight: '900' },

  detailsToggle: { minHeight: 88, borderRadius: 25, paddingHorizontal: 15, alignItems: 'center', gap: 11, shadowColor: '#123C72', shadowOpacity: 0.10, shadowRadius: 17, shadowOffset: { width: 0, height: 7 }, elevation: 4 },
  detailsIcon: { width: 50, height: 50, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EAF3FF' },
  detailsCopy: { flex: 1, minWidth: 0 },
  detailsTitle: { fontSize: 16, fontWeight: '900' },
  detailsSubtitle: { marginTop: 4, fontSize: 12.3, fontWeight: '600' },
  detailsBadge: { minWidth: 26, height: 26, borderRadius: 13, paddingHorizontal: 7, alignItems: 'center', justifyContent: 'center', backgroundColor: '#D4AF37' },
  detailsBadgeText: { color: '#0B1833', fontSize: 11.5, fontWeight: '900' },
  detailsCard: { borderRadius: 24, overflow: 'hidden', paddingHorizontal: 14, shadowColor: '#123C72', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 2 },

  section: { paddingVertical: 14, gap: 9, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E6EDF5' },
  sectionTitle: { fontSize: 12.5, fontWeight: '900' },
  selector: { minHeight: 50, borderRadius: 15, borderWidth: 1, borderColor: '#DEE8F3', backgroundColor: '#F8FBFF', paddingHorizontal: 12, alignItems: 'center', gap: 9 },
  selectorText: { flex: 1, fontSize: 14, fontWeight: '700' },
  options: { borderWidth: 1, borderColor: '#DEE8F3', borderRadius: 15, overflow: 'hidden' },
  option: { minHeight: 46, paddingHorizontal: 12, alignItems: 'center', gap: 9 },
  simpleInput: { minHeight: 50, borderWidth: 1, borderColor: '#DEE8F3', borderRadius: 15, paddingHorizontal: 12, fontSize: 14, backgroundColor: '#F8FBFF' },
  stageRow: { gap: 8 },
  stageChip: { flex: 1, minHeight: 42, borderRadius: 999, borderWidth: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  stageChipText: { fontSize: 13, fontWeight: '800' },
  levelWrap: { flexWrap: 'wrap', gap: 8 },
  levelChip: { minHeight: 38, borderRadius: 999, borderWidth: 1, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  levelChipText: { fontSize: 12.5, fontWeight: '800' },

  publishFooter: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10, backgroundColor: 'rgba(255,255,255,0.97)', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(23,63,120,0.08)' },
  publishButton: { minHeight: 66, borderRadius: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  publishButtonEnabled: { backgroundColor: '#123C72', shadowColor: '#123C72', shadowOpacity: 0.20, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 3 },
  publishButtonDisabled: { backgroundColor: '#DDE9F6' },
  publishButtonPressed: { opacity: 0.88 },
  publishButtonText: { fontSize: 17, fontWeight: '900' }
});
