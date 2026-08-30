import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { Screen } from '../../../components/Screen';
import { useLanguage } from '../../../context/LanguageProvider';
import { useTheme } from '../../../context/ThemeProvider';
import { getAdminCopy } from '../../../i18n/adminCopy';
import {
  ADMIN_POST_TYPES,
  EDUCATIONAL_LEVELS,
  POST_STATUSES,
  type ContentInput,
  type ContentMedia,
  type PostStatus,
  type PostType
} from '../../../repositories/contentRepository';
import {
  useAdminContentDetail,
  useCreateContent,
  useUpdateContent,
  useUploadCoverImage,
  useUploadResourceFile
} from '../../../hooks/useAdminContent';
import { AdminChip } from '../components/AdminChip';
import { AdminField } from '../components/AdminField';
import { contentTypeIcons } from '../contentTypeIcons';

const FILE_TYPES: PostType[] = ['resource', 'test', 'exam'];

export function ContentFormScreen({ route, navigation }: any) {
  const id: string | undefined = route.params?.id;
  const isEditing = Boolean(id);

  const { colors } = useTheme();
  const { language, isRTL } = useLanguage();
  const copy = getAdminCopy(language);
  const row = isRTL ? ('row-reverse' as const) : ('row' as const);
  const align = isRTL ? ('right' as const) : ('left' as const);

  const detail = useAdminContentDetail(id ?? '');
  const createContent = useCreateContent();
  const updateContent = useUpdateContent();
  const uploadCover = useUploadCoverImage();
  const uploadFile = useUploadResourceFile();

  const [postType, setPostType] = useState<PostType>('article');
  const [title, setTitle] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [body, setBody] = useState('');
  const [bodyEn, setBodyEn] = useState('');
  const [subject, setSubject] = useState('');
  const [level, setLevel] = useState('');
  const [term, setTerm] = useState('');
  const [sequence, setSequence] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [isOfficial, setIsOfficial] = useState(false);
  const [status, setStatus] = useState<PostStatus>('draft');
  const [publishDate, setPublishDate] = useState('');
  const [loaded, setLoaded] = useState(!isEditing);

  useEffect(() => {
    if (!isEditing || !detail.data || loaded) return;
    const post = detail.data;
    setPostType(post.post_type);
    setTitle(post.title);
    setTitleEn(post.title_en ?? '');
    setBody(post.body ?? '');
    setBodyEn(post.body_en ?? '');
    setSubject(post.subject ?? '');
    setLevel(post.level ?? '');
    setTerm(post.term ?? '');
    setSequence(post.sequence ?? '');
    setCoverUrl(post.media?.cover_url ?? '');
    setFileUrl(post.media?.file_url ?? '');
    setFileName(post.media?.file_name ?? '');
    setVideoUrl(post.media?.youtube_url ?? post.media?.video_url ?? '');
    setIsOfficial(post.is_official);
    setStatus(post.status);
    setPublishDate(post.published_at ? post.published_at.slice(0, 10) : '');
    setLoaded(true);
  }, [detail.data, isEditing, loaded]);

  const showVideoField = postType === 'video';
  const showFileField = FILE_TYPES.includes(postType);
  const saving = createContent.isPending || updateContent.isPending;
  const uploading = uploadCover.isPending || uploadFile.isPending;

  const buildMedia = (): ContentMedia => {
    const media: ContentMedia = {};
    if (coverUrl) media.cover_url = coverUrl;
    if (showVideoField && videoUrl) media.youtube_url = videoUrl.trim();
    if (showFileField && fileUrl) {
      media.file_url = fileUrl;
      media.file_name = fileName;
    }
    return media;
  };

  const buildPublishedAt = (nextStatus: PostStatus) => {
    if (publishDate.trim()) {
      const parsed = new Date(`${publishDate.trim()}T00:00:00`);
      if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
    }
    if (nextStatus === 'published') return new Date().toISOString();
    return null;
  };

  const pickCover = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(copy.form.permissionError);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    uploadCover.mutate(
      { uri: asset.uri, name: asset.fileName ?? `cover-${Date.now()}.jpg`, mimeType: asset.mimeType ?? 'image/jpeg' },
      {
        onSuccess: (uploaded) => setCoverUrl(uploaded.url),
        onError: () => Alert.alert(copy.form.uploadError)
      }
    );
  };

  const pickResourceFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', '*/*'], copyToCacheDirectory: true });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    uploadFile.mutate(
      { uri: asset.uri, name: asset.name, mimeType: asset.mimeType ?? 'application/octet-stream' },
      {
        onSuccess: (uploaded) => {
          setFileUrl(uploaded.url);
          setFileName(uploaded.name);
        },
        onError: () => Alert.alert(copy.form.uploadError)
      }
    );
  };

  const buildInput = (nextStatus: PostStatus): ContentInput => ({
    post_type: postType,
    title: title.trim(),
    title_en: titleEn.trim() || null,
    body: body.trim() || null,
    body_en: bodyEn.trim() || null,
    subject: subject.trim() || null,
    level: level || null,
    term: term.trim() || null,
    sequence: sequence.trim() || null,
    media: buildMedia(),
    is_official: isOfficial,
    status: nextStatus,
    published_at: buildPublishedAt(nextStatus)
  });

  const handleSave = (nextStatus: PostStatus) => {
    if (!title.trim()) {
      Alert.alert(copy.form.titleRequired);
      return;
    }
    setStatus(nextStatus);
    const input = buildInput(nextStatus);
    if (isEditing && id) {
      updateContent.mutate(
        { id, patch: input },
        { onSuccess: () => navigation.goBack(), onError: () => Alert.alert(copy.form.saveError) }
      );
    } else {
      createContent.mutate(input, { onSuccess: () => navigation.goBack(), onError: () => Alert.alert(copy.form.saveError) });
    }
  };

  const openPreview = () => {
    navigation.navigate('ContentPreview', {
      draft: {
        id: id ?? 'draft',
        post_type: postType,
        title: title.trim() || copy.form.titleAr,
        title_en: titleEn.trim() || null,
        body: body.trim() || null,
        body_en: bodyEn.trim() || null,
        subject: subject.trim() || null,
        level: level || null,
        term: term.trim() || null,
        sequence: sequence.trim() || null,
        media: buildMedia(),
        is_official: isOfficial,
        status,
        helpful_count: 0,
        published_at: buildPublishedAt(status),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    });
  };

  if (isEditing && !loaded) {
    return (
      <Screen style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </Screen>
    );
  }

  return (
    <Screen scroll style={styles.page}>
      <Section title={copy.form.section_general} align={align}>
        <Field label={copy.form.contentType} align={align}>
          <ChipsRow>
            {ADMIN_POST_TYPES.map((type) => (
              <AdminChip
                key={type}
                label={copy.types[type]}
                active={postType === type}
                onPress={() => setPostType(type)}
                icon={contentTypeIcons[type]}
              />
            ))}
          </ChipsRow>
        </Field>

        <AdminField label={copy.form.titleArRequired} value={title} onChangeText={setTitle} required />
        <AdminField label={copy.form.titleEn} value={titleEn} onChangeText={setTitleEn} />
        <AdminField
          label={copy.form.bodyAr}
          value={body}
          onChangeText={setBody}
          multiline
          numberOfLines={5}
        />
        <AdminField label={copy.form.bodyEn} value={bodyEn} onChangeText={setBodyEn} multiline numberOfLines={4} />

        <View style={[styles.row2, { flexDirection: row }]}>
          <View style={styles.flex1}>
            <AdminField label={copy.form.subject} value={subject} onChangeText={setSubject} />
          </View>
          <View style={styles.flex1}>
            <AdminField label={copy.form.term} value={term} onChangeText={setTerm} />
          </View>
        </View>
        <AdminField label={copy.form.sequence} value={sequence} onChangeText={setSequence} />

        <Field label={copy.form.level} align={align}>
          <ChipsRow>
            {EDUCATIONAL_LEVELS.map((item) => (
              <AdminChip key={item} label={item} active={level === item} onPress={() => setLevel(level === item ? '' : item)} />
            ))}
          </ChipsRow>
        </Field>
      </Section>

      <Section title={copy.form.section_media} align={align}>
        <Field label={copy.form.coverImage} align={align}>
          {coverUrl ? (
            <View style={styles.mediaPreviewWrap}>
              <Image source={{ uri: coverUrl }} style={styles.coverPreview} resizeMode="cover" />
              <View style={[styles.mediaButtonsRow, { flexDirection: row }]}>
                <MediaButton label={copy.form.changeCover} icon="image-outline" onPress={pickCover} />
                <MediaButton label={copy.form.removeCover} icon="trash-outline" onPress={() => setCoverUrl('')} danger />
              </View>
            </View>
          ) : (
            <MediaButton label={uploadCover.isPending ? copy.form.uploading : copy.form.chooseCover} icon="image-outline" onPress={pickCover} disabled={uploadCover.isPending} />
          )}
        </Field>

        {showFileField && (
          <Field label={copy.form.resourceFile} align={align}>
            {fileUrl ? (
              <View style={[styles.fileRow, { backgroundColor: colors.card, borderColor: colors.border, flexDirection: row }]}>
                <Ionicons name="document-attach-outline" size={18} color={colors.primary} />
                <Text numberOfLines={1} style={[styles.fileName, { color: colors.text, textAlign: align }]}>
                  {fileName || fileUrl}
                </Text>
                <Pressable onPress={() => { setFileUrl(''); setFileName(''); }} hitSlop={8}>
                  <Ionicons name="close-circle" size={18} color={colors.muted} />
                </Pressable>
              </View>
            ) : (
              <MediaButton label={uploadFile.isPending ? copy.form.uploading : copy.form.chooseFile} icon="document-attach-outline" onPress={pickResourceFile} disabled={uploadFile.isPending} />
            )}
          </Field>
        )}

        {showVideoField && (
          <AdminField
            label={copy.form.videoUrl}
            value={videoUrl}
            onChangeText={setVideoUrl}
            placeholder={copy.form.videoUrlPlaceholder}
            autoCapitalize="none"
            keyboardType="url"
          />
        )}
      </Section>

      <Section title={copy.form.section_publish} align={align}>
        <View style={[styles.toggleRow, { backgroundColor: colors.card, borderColor: colors.border, flexDirection: row }]}>
          <Switch value={isOfficial} onValueChange={setIsOfficial} trackColor={{ true: colors.primary }} />
          <View style={styles.toggleCopy}>
            <Text style={[styles.toggleTitle, { color: colors.text, textAlign: align }]}>{copy.form.officialToggle}</Text>
            <Text style={[styles.toggleText, { color: colors.muted, textAlign: align }]}>{copy.form.officialToggleText}</Text>
          </View>
        </View>

        <Field label={copy.form.status} align={align}>
          <ChipsRow>
            {POST_STATUSES.map((item) => (
              <AdminChip key={item} label={copy.statuses[item]} active={status === item} onPress={() => setStatus(item)} />
            ))}
          </ChipsRow>
        </Field>

        <AdminField
          label={copy.form.publishDate}
          value={publishDate}
          onChangeText={setPublishDate}
          placeholder="YYYY-MM-DD"
          hint={copy.form.publishDateHint}
          autoCapitalize="none"
        />
      </Section>

      <View style={[styles.actionsRow, { flexDirection: row }]}>
        <Pressable onPress={openPreview} style={[styles.previewButton, { borderColor: colors.border, flexDirection: row }]}>
          <Ionicons name="eye-outline" size={18} color={colors.text} />
          <Text style={[styles.previewButtonText, { color: colors.text }]}>{copy.form.preview}</Text>
        </Pressable>
      </View>

      <View style={[styles.saveRow, { flexDirection: row }]}>
        <Pressable
          onPress={() => handleSave('draft')}
          disabled={saving || uploading}
          style={[styles.secondarySave, { borderColor: colors.border, opacity: saving || uploading ? 0.6 : 1 }]}
        >
          <Text style={[styles.secondarySaveText, { color: colors.text }]}>{copy.form.saveDraft}</Text>
        </Pressable>
        <Pressable
          onPress={() => handleSave('published')}
          disabled={saving || uploading}
          style={[styles.primarySave, { backgroundColor: colors.primary, opacity: saving || uploading ? 0.6 : 1, flexDirection: row }]}
        >
          {saving ? <ActivityIndicator color="#0B1833" /> : <Ionicons name="cloud-upload-outline" size={18} color="#0B1833" />}
          <Text style={styles.primarySaveText}>{copy.form.publish}</Text>
        </Pressable>
      </View>
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

function Field({ label, align, children }: { label: string; align: 'right' | 'left'; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: colors.muted, textAlign: align }]}>{label}</Text>
      {children}
    </View>
  );
}

function ChipsRow({ children }: { children: React.ReactNode }) {
  return <View style={styles.chipsRow}>{children}</View>;
}

function MediaButton({
  label,
  icon,
  onPress,
  danger,
  disabled
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  const { colors } = useTheme();
  const color = danger ? colors.danger : colors.text;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.mediaButton, { borderColor: colors.border, opacity: disabled ? 0.6 : 1 }]}
    >
      <Ionicons name={icon} size={16} color={color} />
      <Text style={[styles.mediaButtonText, { color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: { gap: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  section: { borderWidth: 1, borderRadius: 22, padding: 17, gap: 14 },
  sectionTitle: { fontSize: 16.5, fontWeight: '900' },
  field: { gap: 8 },
  fieldLabel: { fontSize: 13.5, fontWeight: '800' },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  row2: { gap: 10 },
  flex1: { flex: 1 },
  mediaPreviewWrap: { gap: 10 },
  coverPreview: { width: '100%', height: 150, borderRadius: 16 },
  mediaButtonsRow: { gap: 8 },
  mediaButton: { flex: 1, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderStyle: 'dashed', borderRadius: 14, minHeight: 52, paddingHorizontal: 14 },
  mediaButtonText: { fontWeight: '800', fontSize: 13.5 },
  fileRow: { borderWidth: 1, borderRadius: 14, minHeight: 52, paddingHorizontal: 14, alignItems: 'center', gap: 9 },
  fileName: { flex: 1, fontWeight: '700', fontSize: 13.5 },
  toggleRow: { borderWidth: 1, borderRadius: 16, padding: 14, alignItems: 'center', gap: 12 },
  toggleCopy: { flex: 1, gap: 3 },
  toggleTitle: { fontWeight: '900', fontSize: 14.5 },
  toggleText: { fontSize: 11.5 },
  actionsRow: { justifyContent: 'flex-end' },
  previewButton: { borderWidth: 1, borderRadius: 14, minHeight: 46, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', gap: 7 },
  previewButtonText: { fontWeight: '800', fontSize: 13.5 },
  saveRow: { gap: 10 },
  secondarySave: { flex: 1, borderWidth: 1, borderRadius: 16, minHeight: 54, alignItems: 'center', justifyContent: 'center' },
  secondarySaveText: { fontWeight: '900', fontSize: 15 },
  primarySave: { flex: 1.4, borderRadius: 16, minHeight: 54, alignItems: 'center', justifyContent: 'center', gap: 8 },
  primarySaveText: { color: '#0B1833', fontWeight: '900', fontSize: 15.5 }
});
