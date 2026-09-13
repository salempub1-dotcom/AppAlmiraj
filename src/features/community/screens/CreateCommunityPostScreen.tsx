import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { PropsWithChildren, useState } from 'react';
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
    <View style={styles.page}>
      <View style={styles.background} pointerEvents="none">
        <View style={styles.heroBase} />
        <View style={styles.heroOrbA} />
        <View style={styles.heroOrbB} />
        <View style={styles.heroGlow} />
        <Ionicons name="book-outline" size={132} color="rgba(255,255,255,0.055)" style={styles.heroBook} />

        <View style={styles.stageBase} />
        <View style={styles.stageGlowA} />
        <View style={styles.stageGlowB} />
        <View style={styles.stageGlowC} />
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
            <View style={styles.heroTitleRow}>
              <Ionicons name="school" size={31} color="#F0C343" />
              <Text style={styles.heroTitle}>{copy.feed.newPost}</Text>
            </View>
            <View style={styles.heroLine} />
            <Text style={styles.heroSubtitle}>
              {ar ? 'شارك فكرة أو مورداً مع زملائك' : 'Share an idea or resource with colleagues'}
            </Text>
          </View>

          <View style={styles.contentArea}>
            <View style={styles.composerHalo} pointerEvents="none" />
            <View style={[styles.composerCard, { backgroundColor: community.surface }]}>
              <View style={styles.composerArea}>
                <View style={[styles.avatarFloating, isRTL ? styles.avatarFloatingRTL : styles.avatarFloatingLTR]}>
                  <View style={[styles.avatar, { backgroundColor: community.primarySoft }]}> 
                    {avatarUrl
                      ? <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
                      : <Text style={[styles.avatarInitial, { color: community.primaryStrong }]}>{initial}</Text>}
                  </View>
                  <View style={[styles.onlineDot, isRTL ? styles.onlineDotRTL : styles.onlineDotLTR]} />
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
                  <Text
                    style={[
                      styles.counter,
                      isRTL ? styles.counterRTL : styles.counterLTR,
                      { color: community.textMuted }
                    ]}
                  >
                    {body.length}/2000
                  </Text>
                </View>
              </View>

              {attachment?.kind === 'image' && (
                <View style={styles.imagePreviewShell}>
                  <Image source={{ uri: attachment.previewUri }} style={styles.imagePreview} resizeMode="cover" />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={ar ? 'إزالة الصورة' : 'Remove image'}
                    onPress={() => setAttachment(null)}
                    style={styles.removeMedia}
                  >
                    <Ionicons name="close" size={18} color="#FFFFFF" />
                  </Pressable>
                </View>
              )}

              {attachment?.kind === 'pdf' && (
                <View style={[styles.pdfRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}> 
                  <View style={styles.pdfIcon}>
                    <Ionicons name="document-text-outline" size={21} color="#9A6A00" />
                  </View>
                  <Text numberOfLines={1} style={[styles.pdfName, { color: community.text, textAlign: align }]}>{attachment.file.name}</Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={ar ? 'إزالة الملف' : 'Remove file'}
                    onPress={() => setAttachment(null)}
                    hitSlop={8}
                  >
                    <Ionicons name="close-circle" size={20} color={community.textMuted} />
                  </Pressable>
                </View>
              )}

              <View style={[styles.mediaBar, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}> 
                <AttachmentAction
                  icon="image-outline"
                  label={copy.form.addImage}
                  onPress={pickImage}
                  background="#E8F2FF"
                  color="#2564C8"
                  reverse={isRTL}
                />
                <AttachmentAction
                  icon="document-text-outline"
                  label={copy.form.addPdf}
                  onPress={pickPdf}
                  background="#FFF4D9"
                  color="#966400"
                  reverse={isRTL}
                />
              </View>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={ar ? 'تفاصيل المنشور' : 'Post details'}
              onPress={() => {
                Keyboard.dismiss();
                setTypeOpen(false);
                setDetailsOpen((open) => !open);
              }}
              style={({ pressed }) => [
                styles.detailsToggle,
                {
                  flexDirection: isRTL ? 'row-reverse' : 'row',
                  backgroundColor: community.surface,
                  opacity: pressed ? 0.82 : 1
                }
              ]}
            >
              <View style={styles.detailsIcon}>
                <Ionicons name="options-outline" size={22} color="#17396A" />
              </View>
              <View style={styles.detailsCopy}>
                <Text style={[styles.detailsTitle, { color: community.text, textAlign: align }]}>
                  {ar ? 'تفاصيل المنشور' : 'Post details'}
                </Text>
                <Text style={[styles.detailsSubtitle, { color: community.textMuted, textAlign: align }]}>
                  {ar ? 'النوع، العنوان، المادة والمستوى' : 'Type, title, subject and level'}
                </Text>
              </View>
              {detailsCount > 0 && (
                <View style={styles.detailsBadge}>
                  <Text style={styles.detailsBadgeText}>{detailsCount}</Text>
                </View>
              )}
              <Ionicons
                name={detailsOpen ? 'chevron-up' : isRTL ? 'chevron-back' : 'chevron-forward'}
                size={21}
                color={community.textMuted}
              />
            </Pressable>

            {detailsOpen && (
              <View style={[styles.detailsCard, { backgroundColor: community.surface }]}> 
                <CompactSection title={copy.form.postType} community={community} align={align}>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => {
                      Keyboard.dismiss();
                      setTypeOpen((open) => !open);
                    }}
                    style={[styles.selector, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
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
                          onPress={() => {
                            setType(item);
                            setTypeOpen(false);
                          }}
                          style={[
                            styles.option,
                            {
                              backgroundColor: type === item ? community.primarySoft : community.surface,
                              flexDirection: isRTL ? 'row-reverse' : 'row'
                            }
                          ]}
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
                  <SimpleInput
                    value={title}
                    onChangeText={setTitle}
                    placeholder={copy.form.titleOptional}
                    align={align}
                    community={community}
                  />
                </CompactSection>

                <CompactSection title={copy.form.subject} community={community} align={align}>
                  <SimpleInput value={subject} onChangeText={setSubject} align={align} community={community} />
                </CompactSection>

                <CompactSection title={copy.form.level} community={community} align={align}>
                  <View style={[styles.stageRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}> 
                    {(['PS', 'MS'] as const).map((item) => {
                      const selected = stage === item;
                      return (
                        <Pressable
                          accessibilityRole="button"
                          key={item}
                          onPress={() => setStage(selected ? null : item)}
                          style={[
                            styles.stageChip,
                            {
                              backgroundColor: selected ? community.text : community.surface,
                              borderColor: selected ? community.text : community.border
                            }
                          ]}
                        >
                          <Text style={[styles.stageChipText, { color: selected ? community.surface : community.text }]}> 
                            {item === 'PS' ? (ar ? 'ابتدائي' : 'Primary') : (ar ? 'متوسط' : 'Middle')}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  {stage && (
                    <View style={[styles.levelWrap, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}> 
                      {EDUCATIONAL_LEVELS.filter((item) => item.endsWith(stage)).map((item) => {
                        const selected = levels.includes(item);
                        return (
                          <Pressable
                            accessibilityRole="button"
                            key={item}
                            onPress={() => toggleLevel(item)}
                            style={[
                              styles.levelChip,
                              {
                                backgroundColor: selected ? community.primarySoft : '#F7FAFF',
                                borderColor: selected ? community.gold : community.border
                              }
                            ]}
                          >
                            <Text style={[styles.levelChipText, { color: selected ? community.text : community.textSecondary }]}>
                              {ar ? `السنة ${item[0]}` : `Year ${item[0]}`}
                            </Text>
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
                  <Text style={[styles.publishButtonText, { color: canPublish ? '#FFFFFF' : '#8697AA' }]}>{copy.form.publish}</Text>
                  <Ionicons name="paper-plane" size={23} color={canPublish ? '#FFFFFF' : '#8697AA'} />
                </>}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function AttachmentAction({
  icon,
  label,
  onPress,
  background,
  color,
  reverse
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  background: string;
  color: string;
  reverse: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.attachmentAction,
        { backgroundColor: background, opacity: pressed ? 0.72 : 1, flexDirection: reverse ? 'row-reverse' : 'row' }
      ]}
    >
      <Ionicons name={icon} size={23} color={color} />
      <Text style={[styles.attachmentActionText, { color }]}>{label}</Text>
    </Pressable>
  );
}

function CompactSection({
  title,
  community,
  align,
  children
}: PropsWithChildren<{
  title: string;
  community: ReturnType<typeof getCommunityTheme>;
  align: 'right' | 'left';
}>) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: community.text, textAlign: align }]}>{title}</Text>
      {children}
    </View>
  );
}

function SimpleInput({
  value,
  onChangeText,
  placeholder,
  align,
  community
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  align: 'right' | 'left';
  community: ReturnType<typeof getCommunityTheme>;
}) {
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
  page: { flex: 1, backgroundColor: '#2F96E5' },
  keyboardView: { flex: 1 },
  background: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },

  heroBase: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 236,
    backgroundColor: '#0B1833'
  },
  heroOrbA: {
    position: 'absolute',
    width: 238,
    height: 238,
    borderRadius: 119,
    backgroundColor: 'rgba(26,104,212,0.58)',
    top: -142,
    right: -72
  },
  heroOrbB: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(37,128,223,0.34)',
    left: -110,
    top: 92
  },
  heroGlow: {
    position: 'absolute',
    width: 220,
    height: 180,
    borderRadius: 100,
    backgroundColor: 'rgba(48,136,235,0.14)',
    left: '29%',
    top: -26
  },
  heroBook: {
    position: 'absolute',
    right: 54,
    top: 106,
    transform: [{ rotate: '-8deg' }]
  },

  stageBase: {
    position: 'absolute',
    top: 236,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#3F9EE8'
  },
  stageGlowA: {
    position: 'absolute',
    width: 390,
    height: 390,
    borderRadius: 195,
    right: -190,
    top: 230,
    backgroundColor: 'rgba(11,94,185,0.30)'
  },
  stageGlowB: {
    position: 'absolute',
    width: 330,
    height: 330,
    borderRadius: 165,
    left: -185,
    top: 540,
    backgroundColor: 'rgba(198,230,255,0.48)'
  },
  stageGlowC: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    left: '22%',
    top: 790,
    backgroundColor: 'rgba(112,189,245,0.24)'
  },

  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 30 },
  hero: {
    minHeight: 236,
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 54,
    alignItems: 'center',
    justifyContent: 'center'
  },
  heroTitleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.35
  },
  heroLine: {
    width: 54,
    height: 4,
    borderRadius: 3,
    marginTop: 11,
    backgroundColor: '#F0C343'
  },
  heroSubtitle: {
    color: '#E4EDF7',
    marginTop: 11,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '700',
    textAlign: 'center'
  },

  contentArea: {
    position: 'relative',
    paddingHorizontal: 18,
    marginTop: -36,
    gap: 14
  },
  composerHalo: {
    position: 'absolute',
    top: -7,
    left: 12,
    right: 12,
    height: 420,
    borderRadius: 34,
    backgroundColor: 'rgba(255,197,42,0.16)'
  },
  composerCard: {
    position: 'relative',
    overflow: 'visible',
    borderWidth: 1.5,
    borderColor: '#E8BE4C',
    borderRadius: 28,
    padding: 14,
    shadowColor: '#114F88',
    shadowOpacity: 0.23,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 7 },
    elevation: 8
  },
  composerArea: { position: 'relative', width: '100%' },
  avatarFloating: {
    position: 'absolute',
    top: -18,
    zIndex: 20,
    elevation: 8,
    width: 68,
    height: 68
  },
  avatarFloatingRTL: { right: -1 },
  avatarFloatingLTR: { left: -1 },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 3,
    borderColor: '#D4AF37',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarInitial: { fontSize: 23, fontWeight: '900' },
  onlineDot: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#75BF35',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    bottom: 1
  },
  onlineDotRTL: { right: -1 },
  onlineDotLTR: { left: -1 },
  inputShell: {
    width: '100%',
    minHeight: 260,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#D7E5F3',
    backgroundColor: '#F8FBFF',
    paddingHorizontal: 17,
    paddingTop: 22,
    paddingBottom: 38,
    position: 'relative'
  },
  bodyInput: {
    width: '100%',
    minHeight: 192,
    fontSize: 16.5,
    lineHeight: 27,
    padding: 0
  },
  bodyInputRTL: { paddingRight: 52, paddingLeft: 0 },
  bodyInputLTR: { paddingLeft: 52, paddingRight: 0 },
  counter: { position: 'absolute', bottom: 12, fontSize: 12.5, fontWeight: '700' },
  counterRTL: { left: 16 },
  counterLTR: { right: 16 },

  imagePreviewShell: {
    width: '100%',
    marginTop: 13,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative'
  },
  imagePreview: { width: '100%', aspectRatio: 1.25 },
  removeMedia: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.66)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  pdfRow: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E2ECF6',
    borderRadius: 16,
    minHeight: 62,
    paddingHorizontal: 10,
    alignItems: 'center',
    gap: 9,
    backgroundColor: '#F8FBFF'
  },
  pdfIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF5D8'
  },
  pdfName: { flex: 1, fontSize: 13, fontWeight: '700' },
  mediaBar: { marginTop: 14, gap: 11 },
  attachmentAction: {
    flex: 1,
    minHeight: 64,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    paddingHorizontal: 10
  },
  attachmentActionText: { fontSize: 14, fontWeight: '900' },

  detailsToggle: {
    minHeight: 88,
    borderRadius: 24,
    paddingHorizontal: 14,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(216,230,245,0.92)',
    shadowColor: '#114F88',
    shadowOpacity: 0.2,
    shadowRadius: 13,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5
  },
  detailsIcon: {
    width: 50,
    height: 50,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F2FF'
  },
  detailsCopy: { flex: 1, minWidth: 0 },
  detailsTitle: { fontSize: 16, fontWeight: '900' },
  detailsSubtitle: { marginTop: 4, fontSize: 12.3, fontWeight: '600' },
  detailsBadge: {
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    paddingHorizontal: 7,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D4AF37'
  },
  detailsBadgeText: { color: '#0B1833', fontSize: 11.5, fontWeight: '900' },
  detailsCard: {
    borderRadius: 24,
    overflow: 'hidden',
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(216,230,245,0.92)',
    shadowColor: '#114F88',
    shadowOpacity: 0.18,
    shadowRadius: 13,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4
  },

  section: {
    paddingVertical: 14,
    gap: 9,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E6EDF5'
  },
  sectionTitle: { fontSize: 12.5, fontWeight: '900' },
  selector: {
    minHeight: 50,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#DEE8F3',
    backgroundColor: '#F8FBFF',
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 9
  },
  selectorText: { flex: 1, fontSize: 14, fontWeight: '700' },
  options: { borderWidth: 1, borderColor: '#DEE8F3', borderRadius: 15, overflow: 'hidden' },
  option: { minHeight: 46, paddingHorizontal: 12, alignItems: 'center', gap: 9 },
  simpleInput: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: '#DEE8F3',
    borderRadius: 15,
    paddingHorizontal: 12,
    fontSize: 14,
    backgroundColor: '#F8FBFF'
  },
  stageRow: { gap: 8 },
  stageChip: {
    flex: 1,
    minHeight: 42,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12
  },
  stageChipText: { fontSize: 13, fontWeight: '800' },
  levelWrap: { flexWrap: 'wrap', gap: 8 },
  levelChip: {
    minHeight: 38,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  levelChipText: { fontSize: 12.5, fontWeight: '800' },

  publishFooter: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(23,63,120,0.08)'
  },
  publishButton: {
    minHeight: 66,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10
  },
  publishButtonEnabled: {
    backgroundColor: '#17396A',
    shadowColor: '#17396A',
    shadowOpacity: 0.23,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4
  },
  publishButtonDisabled: { backgroundColor: '#DDE9F6' },
  publishButtonPressed: { opacity: 0.88 },
  publishButtonText: { fontSize: 17, fontWeight: '900' }
});