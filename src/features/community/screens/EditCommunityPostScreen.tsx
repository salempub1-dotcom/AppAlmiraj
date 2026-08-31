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
import { TeacherSpaceGate } from '../components/TeacherSpaceGate';
import { communityTypeIcons } from '../contentTypeIcons';
import { getCommunityTheme } from '../communityTheme';

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
  const community = getCommunityTheme(colors);
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
      <Screen style={{ ...styles.center, backgroundColor: community.background }}>
        <ActivityIndicator color={community.primary} size="large" />
        <Text style={{ color: community.textMuted }}>{copy.owner.loadError}</Text>
      </Screen>
    );
  }

  if (detail.isError || !detail.data) {
    return (
      <Screen style={{ ...styles.center, backgroundColor: community.background }}>
        <View style={[styles.stateIcon, { backgroundColor: community.primarySoft }]}>
          <Ionicons name="alert-circle-outline" size={30} color={community.primary} />
        </View>
        <Text style={[styles.errorTitle, { color: community.text }]}>{copy.owner.loadError}</Text>
        <Text style={[styles.errorBody, { color: community.textSecondary }]}>{copy.owner.loadErrorText}</Text>
        <Pressable onPress={() => detail.refetch()} style={[styles.retryButton, { backgroundColor: community.primary }]}>
          <Ionicons name="refresh-outline" size={18} color="#FFFFFF" />
          <Text style={styles.retryButtonText}>{copy.owner.retry}</Text>
        </Pressable>
      </Screen>
    );
  }

  if (!viewerId || detail.data.author_id !== viewerId) {
    return (
      <Screen style={{ ...styles.center, backgroundColor: community.background }}>
        <View style={[styles.stateIcon, { backgroundColor: community.primarySoft }]}>
          <Ionicons name="lock-closed-outline" size={28} color={community.primary} />
        </View>
        <Text style={[styles.errorTitle, { color: community.text }]}>{copy.owner.notAuthorized}</Text>
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
    <Screen scroll style={{ ...styles.page, backgroundColor: community.background }}>
      <View
        style={[
          styles.composerCard,
          {
            backgroundColor: community.surface,
            borderColor: community.border,
            shadowColor: community.shadow
          }
        ]}
      >
        <View style={[styles.composerHeader, { flexDirection: row }]}>
          <View style={[styles.avatar, { backgroundColor: community.primarySoft }]}>
            <Ionicons name="create-outline" size={21} color={community.primary} />
          </View>
          <View style={styles.composerHeaderText}>
            <Text style={[styles.composerTitle, { color: community.text, textAlign: align }]}>{copy.owner.edit}</Text>
            <Text style={[styles.composerSubtitle, { color: community.textMuted, textAlign: align }]}>{copy.form.bodyPlaceholder}</Text>
          </View>
        </View>

        <TextField
          value={body}
          onChangeText={setBody}
          placeholder={copy.form.bodyPlaceholder}
          align={align}
          multiline
          numberOfLines={7}
          large
        />
      </View>

      <Section title={copy.form.postType} align={align}>
        <View style={styles.chipsRow}>
          {COMMUNITY_POST_TYPES.map((item) => (
            <CommunityChip
              key={item}
              label={copy.types[item]}
              active={type === item}
              onPress={() => setType(item)}
              icon={communityTypeIcons[item]}
            />
          ))}
        </View>
      </Section>

      <Section title={copy.form.titleField} align={align}>
        <TextField value={title} onChangeText={setTitle} placeholder={copy.form.titleOptional} align={align} />
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
              <View style={[styles.imagePreviewShell, { backgroundColor: community.imageBackdrop }]}>
                <Image source={{ uri: newAttachment.previewUri }} style={styles.imagePreview} resizeMode="cover" />
              </View>
            ) : (
              <PdfPreview name={newAttachment.file.name} align={align} />
            )}

            <View style={[styles.attachmentButtonsRow, { flexDirection: row }]}>
              <MediaButton
                label={copy.form.changeAttachment}
                icon={newAttachment.kind === 'image' ? 'image-outline' : 'document-text-outline'}
                onPress={newAttachment.kind === 'image' ? pickImage : pickPdf}
              />
              <MediaButton label={copy.form.removeAttachment} icon="trash-outline" onPress={handleRemoveAttachment} danger />
            </View>
          </View>
        ) : hasExistingAttachment ? (
          <View style={styles.attachmentPreviewWrap}>
            {existingMedia.type === 'image' ? (
              <View style={[styles.imagePreviewShell, { backgroundColor: community.imageBackdrop }]}>
                <Image source={{ uri: existingMedia.url }} style={styles.imagePreview} resizeMode="cover" />
              </View>
            ) : (
              <PdfPreview name={existingMedia.name || copy.card.openPdf} align={align} />
            )}

            <View style={[styles.attachmentButtonsRow, { flexDirection: row }]}>
              <MediaButton
                label={copy.form.changeAttachment}
                icon={existingMedia.type === 'image' ? 'image-outline' : 'document-text-outline'}
                onPress={existingMedia.type === 'image' ? pickImage : pickPdf}
              />
              <MediaButton label={copy.form.removeAttachment} icon="trash-outline" onPress={handleRemoveAttachment} danger />
            </View>
          </View>
        ) : (
          <View style={[styles.attachmentButtonsRow, { flexDirection: row }]}>
            <MediaButton label={copy.form.addImage} icon="image-outline" onPress={pickImage} emphasized />
            <MediaButton label={copy.form.addPdf} icon="document-text-outline" onPress={pickPdf} emphasized />
          </View>
        )}
      </Section>

      <Pressable
        onPress={handleSave}
        disabled={busy}
        style={({ pressed }) => [
          styles.publishButton,
          {
            backgroundColor: community.primary,
            opacity: busy ? 0.55 : pressed ? 0.88 : 1,
            flexDirection: row
          }
        ]}
      >
        {busy ? <ActivityIndicator color="#FFFFFF" /> : <Ionicons name="checkmark-circle-outline" size={19} color="#FFFFFF" />}
        <Text style={styles.publishButtonText}>{busy ? copy.owner.saving : copy.owner.save}</Text>
      </Pressable>
    </Screen>
  );
}

function Section({ title, align, children }: { title: string; align: 'right' | 'left'; children: React.ReactNode }) {
  const { colors } = useTheme();
  const community = getCommunityTheme(colors);

  return (
    <View
      style={[
        styles.section,
        {
          backgroundColor: community.surface,
          borderColor: community.border,
          shadowColor: community.shadow
        }
      ]}
    >
      <Text style={[styles.sectionTitle, { color: community.text, textAlign: align }]}>{title}</Text>
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
  numberOfLines,
  large
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  align: 'right' | 'left';
  multiline?: boolean;
  numberOfLines?: number;
  large?: boolean;
}) {
  const { colors } = useTheme();
  const community = getCommunityTheme(colors);

  return (
    <View
      style={[
        styles.input,
        {
          borderColor: community.border,
          backgroundColor: community.isDark ? community.surfaceRaised : '#F8FAFC'
        },
        multiline ? styles.inputMultiline : null,
        large ? styles.inputLarge : null
      ]}
    >
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={community.textMuted}
        textAlign={align}
        multiline={multiline}
        numberOfLines={numberOfLines}
        style={[
          styles.textInputInner,
          { color: community.text },
          multiline ? styles.textInputMultiline : null,
          large ? styles.textInputLarge : null
        ]}
      />
    </View>
  );
}

function PdfPreview({ name, align }: { name: string; align: 'right' | 'left' }) {
  const { colors } = useTheme();
  const community = getCommunityTheme(colors);

  return (
    <View
      style={[
        styles.pdfRow,
        {
          backgroundColor: community.isDark ? community.surfaceRaised : '#F8FAFC',
          borderColor: community.border
        }
      ]}
    >
      <View style={[styles.pdfIcon, { backgroundColor: community.primarySoft }]}>
        <Ionicons name="document-text-outline" size={21} color={community.primary} />
      </View>
      <View style={styles.pdfCopy}>
        <Text numberOfLines={1} style={[styles.pdfName, { color: community.text, textAlign: align }]}>
          {name}
        </Text>
        <Text style={[styles.pdfMeta, { color: community.textMuted, textAlign: align }]}>PDF</Text>
      </View>
    </View>
  );
}

function MediaButton({
  label,
  icon,
  onPress,
  danger,
  emphasized
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  danger?: boolean;
  emphasized?: boolean;
}) {
  const { colors } = useTheme();
  const community = getCommunityTheme(colors);
  const color = danger ? community.danger : community.primary;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.mediaButton,
        {
          borderColor: danger ? `${community.danger}55` : community.border,
          backgroundColor: emphasized ? community.primarySoft : community.surface,
          opacity: pressed ? 0.72 : 1
        }
      ]}
    >
      <Ionicons name={icon} size={18} color={color} />
      <Text style={[styles.mediaButtonText, { color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: {
    gap: 14,
    paddingBottom: 30
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingHorizontal: 24
  },
  stateIcon: {
    width: 56,
    height: 56,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center'
  },
  composerCard: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 15,
    gap: 13,
    shadowOpacity: 0.05,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2
  },
  composerHeader: {
    alignItems: 'center',
    gap: 10
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center'
  },
  composerHeaderText: {
    flex: 1
  },
  composerTitle: {
    fontSize: 15,
    fontWeight: '900'
  },
  composerSubtitle: {
    marginTop: 2,
    fontSize: 11.5,
    fontWeight: '600'
  },
  section: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 15,
    gap: 11,
    shadowOpacity: 0.035,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '900'
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  input: {
    borderWidth: 1,
    borderRadius: 15,
    minHeight: 50,
    justifyContent: 'center',
    paddingHorizontal: 13
  },
  inputMultiline: {
    minHeight: 120,
    paddingVertical: 11
  },
  inputLarge: {
    minHeight: 150,
    borderWidth: 0,
    paddingHorizontal: 0,
    backgroundColor: 'transparent'
  },
  textInputInner: {
    fontSize: 14.5,
    paddingVertical: 4
  },
  textInputMultiline: {
    minHeight: 100,
    textAlignVertical: 'top'
  },
  textInputLarge: {
    minHeight: 135,
    fontSize: 16,
    lineHeight: 25
  },
  attachmentPreviewWrap: {
    gap: 10
  },
  imagePreviewShell: {
    borderRadius: 16,
    overflow: 'hidden'
  },
  imagePreview: {
    width: '100%',
    height: 210
  },
  pdfRow: {
    borderWidth: 1,
    borderRadius: 15,
    minHeight: 64,
    paddingHorizontal: 11,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  pdfIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center'
  },
  pdfCopy: {
    flex: 1,
    minWidth: 0
  },
  pdfName: {
    fontWeight: '800',
    fontSize: 13.5
  },
  pdfMeta: {
    marginTop: 2,
    fontSize: 10.5,
    fontWeight: '700'
  },
  attachmentButtonsRow: {
    gap: 8
  },
  mediaButton: {
    flex: 1,
    flexDirection: 'row',
    gap: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 14,
    minHeight: 50,
    paddingHorizontal: 10
  },
  mediaButtonText: {
    fontWeight: '800',
    fontSize: 12.5
  },
  publishButton: {
    minHeight: 56,
    borderRadius: 17,
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  publishButtonText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 15.5
  },
  errorTitle: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '900'
  },
  errorBody: {
    textAlign: 'center',
    lineHeight: 21
  },
  retryButton: {
    minHeight: 46,
    borderRadius: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 14
  }
});
