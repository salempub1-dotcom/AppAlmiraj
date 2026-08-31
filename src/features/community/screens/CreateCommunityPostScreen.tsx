import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen } from '../../../components/Screen';
import { useLanguage } from '../../../context/LanguageProvider';
import { useTheme } from '../../../context/ThemeProvider';
import { useCreateCommunityPost, type CreateCommunityPostAttachment } from '../../../hooks/useCommunity';
import { getCommunityCopy } from '../../../i18n/communityCopy';
import { EDUCATIONAL_LEVELS } from '../../../repositories/contentRepository';
import {
  ALLOWED_IMAGE_MIME_TYPES,
  ALLOWED_PDF_MIME_TYPES,
  MAX_IMAGE_BYTES,
  MAX_PDF_BYTES,
  type PickedCommunityFile
} from '../../../repositories/communityMediaRepository';
import { COMMUNITY_POST_TYPES, type CommunityPostType } from '../../../repositories/communityRepository';
import { CommunityChip } from '../components/CommunityChip';
import { communityTypeIcons } from '../contentTypeIcons';
import { TeacherSpaceGate } from '../components/TeacherSpaceGate';

type PendingAttachment = { kind: 'image' | 'pdf'; file: PickedCommunityFile; previewUri: string };

// Gated the same way as the rest of Teacher Space - see TeacherSpaceGate. A
// guest cannot reach this screen today (it's only linked from the gated
// feed), but this keeps that guarantee explicit rather than implicit.
export function CreateCommunityPostScreen({ navigation }: any) {
  return (
    <TeacherSpaceGate navigation={navigation}>
      <CreateCommunityPostContent navigation={navigation} />
    </TeacherSpaceGate>
  );
}

function CreateCommunityPostContent({ navigation }: any) {
  const { colors } = useTheme();
  const { language, isRTL } = useLanguage();
  const copy = getCommunityCopy(language);
  const align = isRTL ? ('right' as const) : ('left' as const);
  const row = isRTL ? ('row-reverse' as const) : ('row' as const);

  const createPost = useCreateCommunityPost();

  const [type, setType] = useState<CommunityPostType>('text');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [subject, setSubject] = useState('');
  const [levels, setLevels] = useState<string[]>([]);
  const [attachment, setAttachment] = useState<PendingAttachment | null>(null);

  const toggleLevel = (item: string) => {
    setLevels((prev) => (prev.includes(item) ? prev.filter((l) => l !== item) : [...prev, item]));
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
    if (asset.fileSize && asset.fileSize > MAX_IMAGE_BYTES) {
      Alert.alert(copy.form.validationSizeImage);
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

    setAttachment({
      kind: 'pdf',
      file: { uri: asset.uri, name: asset.name, mimeType },
      previewUri: asset.uri
    });
  };

  const handlePublish = () => {
    // Belt-and-suspenders against double-submit: the Publish button is
    // already `disabled` while a mutation is in flight, but guard the
    // handler itself too in case of a double-tap racing ahead of the
    // re-render (e.g. two rapid taps registered before React re-renders
    // the disabled state).
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
        onError: () => Alert.alert(copy.form.publishError)
      }
    );
  };

  const busy = createPost.isPending;

  return (
    <Screen scroll style={styles.page}>
      <Section title={copy.form.postType} align={align}>
        <View style={styles.chipsRow}>
          {COMMUNITY_POST_TYPES.map((item) => (
            <CommunityChip key={item} label={copy.types[item]} active={type === item} onPress={() => setType(item)} icon={communityTypeIcons[item]} />
          ))}
        </View>
      </Section>

      <Section title={copy.form.titleField} align={align}>
        <TextField value={title} onChangeText={setTitle} placeholder={copy.form.titleOptional} align={align} />
      </Section>

      <Section title={copy.form.body} align={align}>
        <TextField value={body} onChangeText={setBody} placeholder={copy.form.bodyPlaceholder} align={align} multiline numberOfLines={6} />
      </Section>

      <Section title={copy.form.subject} align={align}>
        <TextField value={subject} onChangeText={setSubject} align={align} />
      </Section>

      <Section title={copy.form.level} align={align}>
        <View style={styles.chipsRow}>
          {EDUCATIONAL_LEVELS.map((item) => (
            <CommunityChip key={item} label={item} active={levels.includes(item)} onPress={() => toggleLevel(item)} />
          ))}
        </View>
      </Section>

      <Section title={copy.form.attachment} align={align}>
        {attachment ? (
          <View style={styles.attachmentPreviewWrap}>
            {attachment.kind === 'image' ? (
              <Image source={{ uri: attachment.previewUri }} style={styles.imagePreview} resizeMode="cover" />
            ) : (
              <View style={[styles.pdfRow, { backgroundColor: colors.card, borderColor: colors.border, flexDirection: row }]}>
                <Ionicons name="document-attach-outline" size={18} color={colors.primary} />
                <Text numberOfLines={1} style={[styles.pdfName, { color: colors.text, textAlign: align }]}>
                  {attachment.file.name}
                </Text>
              </View>
            )}
            <View style={[styles.attachmentButtonsRow, { flexDirection: row }]}>
              <MediaButton
                label={copy.form.changeAttachment}
                icon={attachment.kind === 'image' ? 'image-outline' : 'document-attach-outline'}
                onPress={attachment.kind === 'image' ? pickImage : pickPdf}
              />
              <MediaButton label={copy.form.removeAttachment} icon="trash-outline" onPress={() => setAttachment(null)} danger />
            </View>
          </View>
        ) : (
          <View style={[styles.attachmentButtonsRow, { flexDirection: row }]}>
            <MediaButton label={copy.form.addImage} icon="image-outline" onPress={pickImage} />
            <MediaButton label={copy.form.addPdf} icon="document-attach-outline" onPress={pickPdf} />
          </View>
        )}
      </Section>

      <Pressable
        onPress={handlePublish}
        disabled={busy}
        style={[styles.publishButton, { backgroundColor: colors.primary, opacity: busy ? 0.6 : 1, flexDirection: row }]}
      >
        {busy ? <ActivityIndicator color="#0B1833" /> : <Ionicons name="cloud-upload-outline" size={19} color="#0B1833" />}
        <Text style={styles.publishButtonText}>
          {busy ? (attachment ? copy.form.uploading : copy.form.publishing) : copy.form.publish}
        </Text>
      </Pressable>
    </Screen>
  );
}

function Section({ title, align, children }: { title: string; align: 'right' | 'left'; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.sectionTitle, { color: colors.text, textAlign: align }]}>{title}</Text>
      {children}
    </View>
  );
}

function TextField({
  value,
  onChangeText,
  placeholder,
  align,
  multiline,
  numberOfLines
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  align: 'right' | 'left';
  multiline?: boolean;
  numberOfLines?: number;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.input,
        { borderColor: colors.border, backgroundColor: colors.background },
        multiline ? styles.inputMultiline : null
      ]}
    >
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        textAlign={align}
        multiline={multiline}
        numberOfLines={numberOfLines}
        style={[styles.textInputInner, { color: colors.text }, multiline ? styles.textInputMultiline : null]}
      />
    </View>
  );
}

function MediaButton({
  label,
  icon,
  onPress,
  danger
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  danger?: boolean;
}) {
  const { colors } = useTheme();
  const color = danger ? colors.danger : colors.text;
  return (
    <Pressable onPress={onPress} style={[styles.mediaButton, { borderColor: colors.border }]}>
      <Ionicons name={icon} size={16} color={color} />
      <Text style={[styles.mediaButtonText, { color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: { gap: 16 },
  section: { borderWidth: 1, borderRadius: 22, padding: 17, gap: 12 },
  sectionTitle: { fontSize: 14.5, fontWeight: '900' },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  input: { borderWidth: 1, borderRadius: 14, minHeight: 52, justifyContent: 'center', paddingHorizontal: 14 },
  inputMultiline: { minHeight: 130, paddingVertical: 12 },
  textInputInner: { fontSize: 15, paddingVertical: 4 },
  textInputMultiline: { minHeight: 110, textAlignVertical: 'top' },
  attachmentPreviewWrap: { gap: 10 },
  imagePreview: { width: '100%', height: 160, borderRadius: 16 },
  pdfRow: { borderWidth: 1, borderRadius: 14, minHeight: 52, paddingHorizontal: 14, alignItems: 'center', gap: 9 },
  pdfName: { flex: 1, fontWeight: '700', fontSize: 13.5 },
  attachmentButtonsRow: { gap: 8 },
  mediaButton: { flex: 1, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderStyle: 'dashed', borderRadius: 14, minHeight: 52, paddingHorizontal: 12 },
  mediaButtonText: { fontWeight: '800', fontSize: 13 },
  publishButton: { minHeight: 56, borderRadius: 17, gap: 8, alignItems: 'center', justifyContent: 'center' },
  publishButtonText: { color: '#0B1833', fontWeight: '900', fontSize: 16 }
});
