import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { ActivityIndicator, Alert, Image, Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
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

  return (
    <Screen scroll style={{ ...styles.page, backgroundColor: community.surface }}>
      <View style={[styles.topRow, { flexDirection: row, borderBottomColor: community.divider }]}> 
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={styles.topIcon}>
          <Ionicons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={28} color={community.text} />
        </Pressable>
        <Text style={[styles.screenTitle, { color: community.text }]}>{copy.feed.newPost}</Text>
        <Pressable
          onPress={handlePublish}
          disabled={busy}
          style={({ pressed }) => [styles.publishTextButton, { opacity: busy ? 0.45 : pressed ? 0.55 : 1 }]}
        >
          {busy ? (
            <ActivityIndicator color={community.primary} size="small" />
          ) : (
            <Text style={[styles.publishText, { color: community.primaryStrong }]}>{copy.form.publish}</Text>
          )}
        </Pressable>
      </View>

      <View style={[styles.authorComposer, { flexDirection: row }]}> 
        <View style={[styles.avatar, { backgroundColor: community.primarySoft }]}> 
          <Ionicons name="person" size={22} color={community.primaryStrong} />
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
              <Ionicons name="document-text-outline" size={23} color={community.primaryStrong} />
              <Text numberOfLines={1} style={[styles.pdfName, { color: community.text, textAlign: align }]}>{attachment.file.name}</Text>
              <Pressable onPress={() => setAttachment(null)} hitSlop={8}>
                <Ionicons name="close-circle" size={20} color={community.textMuted} />
              </Pressable>
            </View>
          )}
        </View>
      </View>

      <View style={[styles.mediaBar, { flexDirection: row, borderTopColor: community.divider, borderBottomColor: community.divider }]}> 
        <QuickAction icon="image-outline" label={copy.form.addImage} onPress={pickImage} color={community.primaryStrong} />
        <QuickAction icon="document-text-outline" label={copy.form.addPdf} onPress={pickPdf} color={community.primaryStrong} />
      </View>

      <CompactSection title={copy.form.postType} community={community} align={align}>
        <Pressable
          onPress={() => { Keyboard.dismiss(); setTypeOpen((open) => !open); }}
          style={[styles.selector, { backgroundColor: community.surfaceRaised, borderColor: community.border, flexDirection: row }]}
        >
          <Ionicons name={communityTypeIcons[type]} size={20} color={community.primaryStrong} />
          <Text style={[styles.selectorText, { color: community.text, textAlign: align }]}>{copy.types[type]}</Text>
          <Ionicons name={typeOpen ? 'chevron-up' : 'chevron-down'} size={18} color={community.textMuted} />
        </Pressable>

        {typeOpen && (
          <View style={[styles.options, { borderColor: community.border }]}> 
            {COMMUNITY_POST_TYPES.map((item) => (
              <Pressable
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
          <View style={[styles.levelWrap, { flexDirection: row }]}> 
            {EDUCATIONAL_LEVELS.filter((item) => item.endsWith(stage)).map((item) => {
              const selected = levels.includes(item);
              return (
                <Pressable
                  key={item}
                  onPress={() => toggleLevel(item)}
                  style={[
                    styles.levelChip,
                    {
                      backgroundColor: selected ? community.primarySoft : community.surfaceRaised,
                      borderColor: selected ? community.primary : community.border
                    }
                  ]}
                >
                  <Text style={[styles.levelChipText, { color: selected ? community.primaryStrong : community.textSecondary }]}> 
                    {ar ? `السنة ${item[0]}` : `Year ${item[0]}`}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </CompactSection>

      <View style={{ height: 24 }} />
    </Screen>
  );
}

function QuickAction({ icon, label, onPress, color }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; color: string }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.quickAction, { opacity: pressed ? 0.55 : 1 }]}> 
      <Ionicons name={icon} size={22} color={color} />
      <Text style={[styles.quickActionText, { color }]}>{label}</Text>
    </Pressable>
  );
}

function CompactSection({ title, community, align, children }: { title: string; community: ReturnType<typeof getCommunityTheme>; align: 'right' | 'left'; children: React.ReactNode }) {
  return (
    <View style={[styles.section, { borderBottomColor: community.divider }]}> 
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
      style={[styles.simpleInput, { color: community.text, backgroundColor: community.surfaceRaised, borderColor: community.border }]}
    />
  );
}

const styles = StyleSheet.create({
  page: { padding: 0, paddingHorizontal: 0, paddingVertical: 0 },
  topRow: { minHeight: 62, paddingHorizontal: 12, borderBottomWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'space-between' },
  topIcon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  screenTitle: { fontSize: 20, fontWeight: '800' },
  publishTextButton: { minWidth: 68, height: 44, alignItems: 'center', justifyContent: 'center' },
  publishText: { fontSize: 15, fontWeight: '800' },
  authorComposer: { paddingHorizontal: 14, paddingTop: 16, paddingBottom: 14, alignItems: 'flex-start', gap: 11 },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  composerBody: { flex: 1, minWidth: 0, gap: 12 },
  bodyInput: { minHeight: 150, fontSize: 17, lineHeight: 25, textAlignVertical: 'top', paddingTop: 6 },
  imagePreviewShell: { width: '100%', borderRadius: 14, overflow: 'hidden', position: 'relative' },
  imagePreview: { width: '100%', aspectRatio: 1 },
  removeMedia: { position: 'absolute', top: 9, right: 9, width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(0,0,0,0.68)', alignItems: 'center', justifyContent: 'center' },
  pdfRow: { borderWidth: 1, borderRadius: 13, minHeight: 58, paddingHorizontal: 11, alignItems: 'center', gap: 9 },
  pdfName: { flex: 1, fontSize: 13, fontWeight: '700' },
  mediaBar: { minHeight: 58, paddingHorizontal: 8, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, alignItems: 'center' },
  quickAction: { flex: 1, minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  quickActionText: { fontSize: 12.5, fontWeight: '700' },
  section: { paddingHorizontal: 15, paddingVertical: 16, gap: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  sectionTitle: { fontSize: 13, fontWeight: '800' },
  selector: { minHeight: 50, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, alignItems: 'center', gap: 9 },
  selectorText: { flex: 1, fontSize: 14, fontWeight: '600' },
  options: { borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
  option: { minHeight: 46, paddingHorizontal: 12, alignItems: 'center', gap: 9 },
  simpleInput: { minHeight: 48, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, fontSize: 14 },
  stageRow: { gap: 8 },
  stageChip: { flex: 1, minHeight: 42, borderRadius: 999, borderWidth: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  stageChipText: { fontSize: 13, fontWeight: '700' },
  levelWrap: { flexWrap: 'wrap', gap: 8 },
  levelChip: { minHeight: 38, borderRadius: 999, borderWidth: 1, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  levelChipText: { fontSize: 12.5, fontWeight: '700' }
});
