import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen } from '../../../components/Screen';
import { useAuth } from '../../../context/AuthProvider';
import { useLanguage } from '../../../context/LanguageProvider';
import { useTheme } from '../../../context/ThemeProvider';
import { useCommunityPostDetail } from '../../../hooks/useCommunity';
import { useUpdateCommunityPost, type CommunityPostAttachmentAction } from '../../../hooks/useCommunityPostOwner';
import { getCommunityCopy } from '../../../i18n/communityCopy';
import { EDUCATIONAL_LEVELS } from '../../../repositories/contentRepository';
import {
  ALLOWED_IMAGE_MIME_TYPES,
  ALLOWED_PDF_MIME_TYPES,
  CommunityMediaTooLargeError,
  MAX_PDF_BYTES,
  type PickedCommunityFile
} from '../../../repositories/communityMediaRepository';
import { COMMUNITY_POST_TYPES, type CommunityMedia, type CommunityPostType } from '../../../repositories/communityRepository';
import { CommunityChip } from '../components/CommunityChip';
import { communityTypeIcons } from '../contentTypeIcons';
import { TeacherSpaceGate } from '../components/TeacherSpaceGate';

// Owner-only post editing (Phase F). A separate screen from
// CreateCommunityPostScreen on purpose - that screen's exact
// publish/compression flow was already reviewed and approved (Phase C.1)
// and stays untouched here; this screen duplicates only the small
// presentational pieces it needs (Section/TextField/MediaButton below) and
// wires them to useUpdateCommunityPost instead of useCreateCommunityPost.
export function EditCommunityPostScreen({ route, navigation }: any) {
  return (
    <TeacherSpaceGate navigation={navigation}>
      <EditCommunityPostContent route={route} navigation={navigation} />
    </TeacherSpaceGate>
  );
}

type PendingAttachment = { kind: 'image' | 'pdf'; file: PickedCommunityFile; previewUri: string };

function EditCommunityPostContent({ route, navigation }: any) {
  const { colors } = useTheme();
  const { session } = useAuth();
  const viewerId = session?.user.id ?? null;
  const { language, isRTL } = useLanguage();
  const copy = getCommunityCopy(language);
  const align = isRTL ? ('right' as const) : ('left' as const);
  const row = isRTL ? ('row-reverse' as const) : ('row' as const);
  const postId = String(route.params?.postId ?? '');

  const detail = useCommunityPostDetail(postId);
  const updatePost = useUpdateCommunityPost(postId);

  const [type, setType] = useState<CommunityPostType>('text');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [subject, setSubject] = useState('');
  const [levels, setLevels] = useState<string[]>([]);
  const [existingMedia, setExistingMedia] = useState<CommunityMedia>({});
  const [removeExisting, setRemoveExisting] = useState(false);
  const [newAttachment, setNewAttachment] = useState<PendingAttachment | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Seed local form state from the loaded post exactly once (not on every
  // background refetch, which would otherwise stomp on in-progress edits).
  useEffect(() => {
    if (initialized || !detail.data) return;
    const post = detail.data;
    setType(post.type);
    setTitle(post.title ?? '');
    setBody(post.body ?? '');
    setSubject(post.subject ?? '');
    setLevels(post.level ?? []);
    setExistingMedia(post.media ?? {});
    setInitialized(true);
  }, [detail.data, initialized]);

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
    // Same as Create: no size gate here - the picked image is compressed
    // automatically before upload (communityMediaRepository.uploadImage),
    // which still enforces MAX_IMAGE_BYTES as a defense-in-depth check.
    setNewAttachment({
      kind: 'image',
      file: { uri: asset.uri, name: asset.fileName ?? `image-${Date.now()}.jpg`, mimeType },
      previewUri: asset.uri
    });
    setRemoveExisting(false);
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

    setNewAttachment({ kind: 'pdf', file: { uri: asset.uri, name: asset.name, mimeType }, previewUri: asset.uri });
    setRemoveExisting(false);
  };

  const handleRemoveAttachment = () => {
    setNewAttachment(null);
    setRemoveExisting(true);
  };

  if (detail.isLoading) {
    return (
      <Screen style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={{ color: colors.muted }}>{copy.owner.loadError}</Text>
      </Screen>
    );
  }

  if (detail.isError || !detail.data) {
    return (
      <Screen style={styles.center}>
        <Ionicons name="alert-circle-outline" size={34} color={colors.primary} />
        <Text style={[styles.errorTitle, { color: colors.text }]}>{copy.owner.loadError}</Text>
        <Text style={[styles.errorBody, { color: colors.muted }]}>{copy.owner.loadErrorText}</Text>
        <Pressable onPress={() => detail.refetch()} style={[styles.retryButton, { backgroundColor: colors.primary }]}>
          <Ionicons name="refresh-outline" size={18} color="#0B1833" />
          <Text style={styles.retryButtonText}>{copy.owner.retry}</Text>
        </Pressable>
      </Screen>
    );
  }

  // Defense in depth: RLS is the real boundary (community_posts_own_update
  // only ever lets author_id = auth.uid() succeed), but this screen should
  // never even render the form for anyone but the post's own author.
  if (!viewerId || detail.data.author_id !== viewerId) {
    return (
      <Screen style={styles.center}>
        <Ionicons name="lock-closed-outline" size={34} color={colors.primary} />
        <Text style={[styles.errorTitle, { color: colors.text }]}>{copy.owner.notAuthorized}</Text>
      </Screen>
    );
  }

  const hasExistingAttachment = !removeExisting && !!existingMedia?.type && !!existingMedia?.url;

  const handleSave = () => {
    if (updatePost.isPending) return;

    const trimmedBody = body.trim();
    const hasAttachmentAfterSave = !!newAttachment || hasExistingAttachment;
    if (!trimmedBody && !hasAttachmentAfterSave) {
      Alert.alert(copy.form.validationEmpty);
      return;
    }

    let attachmentAction: CommunityPostAttachmentAction;
    if (newAttachment) {
      attachmentAction = { kind: 'replace', attachment: { kind: newAttachment.kind, file: newAttachment.file } };
    } else if (removeExisting) {
      attachmentAction = { kind: 'remove' };
    } else {
      attachmentAction = { kind: 'keep' };
    }

    updatePost.mutate(
      {
        input: {
          type,
          title: title.trim() || null,
          body: trimmedBody || null,
          subject: subject.trim() || null,
          level: levels
        },
        attachmentAction,
        previousMedia: existingMedia
      },
      {
        onSuccess: () => {
          Alert.alert(copy.owner.editSuccess);
          navigation.goBack();
        },
        onError: (error: unknown) => {
          if (error instanceof CommunityMediaTooLargeError) {
            Alert.alert(error.kind === 'image' ? copy.form.validationSizeImage : copy.form.validationSizePdf);
            return;
          }
          Alert.alert(copy.owner.updateError);
        }
      }
    );
  };

  const busy = updatePost.isPending;

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
        {newAttachment ? (
          <View style={styles.attachmentPreviewWrap}>
            {newAttachment.kind === 'image' ? (
              <Image source={{ uri: newAttachment.previewUri }} style={styles.imagePreview} resizeMode="cover" />
            ) : (
              <View style={[styles.pdfRow, { backgroundColor: colors.card, borderColor: colors.border, flexDirection: row }]}>
                <Ionicons name="document-attach-outline" size={18} color={colors.primary} />
                <Text numberOfLines={1} style={[styles.pdfName, { color: colors.text, textAlign: align }]}>
                  {newAttachment.file.name}
                </Text>
              </View>
            )}
            <View style={[styles.attachmentButtonsRow, { flexDirection: row }]}>
              <MediaButton
                label={copy.form.changeAttachment}
                icon={newAttachment.kind === 'image' ? 'image-outline' : 'document-attach-outline'}
                onPress={newAttachment.kind === 'image' ? pickImage : pickPdf}
              />
              <MediaButton label={copy.form.removeAttachment} icon="trash-outline" onPress={handleRemoveAttachment} danger />
            </View>
          </View>
        ) : hasExistingAttachment ? (
          <View style={styles.attachmentPreviewWrap}>
            {existingMedia.type === 'image' ? (
              <Image source={{ uri: existingMedia.url }} style={styles.imagePreview} resizeMode="cover" />
            ) : (
              <View style={[styles.pdfRow, { backgroundColor: colors.card, borderColor: colors.border, flexDirection: row }]}>
                <Ionicons name="document-attach-outline" size={18} color={colors.primary} />
                <Text numberOfLines={1} style={[styles.pdfName, { color: colors.text, textAlign: align }]}>
                  {existingMedia.name || copy.card.openPdf}
                </Text>
              </View>
            )}
            <View style={[styles.attachmentButtonsRow, { flexDirection: row }]}>
              <MediaButton
                label={copy.form.changeAttachment}
                icon={existingMedia.type === 'image' ? 'image-outline' : 'document-attach-outline'}
                onPress={existingMedia.type === 'image' ? pickImage : pickPdf}
              />
              <MediaButton label={copy.form.removeAttachment} icon="trash-outline" onPress={handleRemoveAttachment} danger />
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
        onPress={handleSave}
        disabled={busy}
        style={[styles.publishButton, { backgroundColor: colors.primary, opacity: busy ? 0.6 : 1, flexDirection: row }]}
      >
        {busy ? <ActivityIndicator color="#0B1833" /> : <Ionicons name="checkmark-circle-outline" size={19} color="#0B1833" />}
        <Text style={styles.publishButtonText}>{busy ? copy.owner.saving : copy.owner.save}</Text>
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 12 },
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
  publishButtonText: { color: '#0B1833', fontWeight: '900', fontSize: 16 },
  errorTitle: { textAlign: 'center', fontSize: 18, fontWeight: '900' },
  errorBody: { textAlign: 'center', lineHeight: 21 },
  retryButton: { minHeight: 46, borderRadius: 14, paddingHorizontal: 20, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
  retryButtonText: { color: '#0B1833', fontWeight: '900', fontSize: 15 }
});
