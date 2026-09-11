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

  const createPost = useCreateCommunityPost();

  const [type, setType] = useState<CommunityPostType>('text');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [subject, setSubject] = useState('');
  const [levels, setLevels] = useState<string[]>([]);
  const [typeOpen, setTypeOpen] = useState(false);
  const [stage, setStage] = useState<'PS' | 'MS' | null>(null);
  const ar = language === 'ar';
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
    <Screen scroll style={{ ...styles.page, backgroundColor: community.background }}>
      <View
        style={[
          styles.composerCard,
          {
            backgroundColor: community.surface,
            borderColor: community.border,
            borderTopColor: community.gold,
            shadowColor: community.shadow
          }
        ]}
      >
        <View style={[styles.composerHeader, { flexDirection: row }]}>
          <View style={[styles.avatar, { backgroundColor: '#D4AF37' }]}>
            <Ionicons name="create-outline" size={22} color="#0B1833" />
          </View>
          <View style={styles.composerHeaderText}>
            <Text style={[styles.composerTitle, { color: community.text, textAlign: align }]}>{copy.feed.newPost}</Text>
            <Text style={[styles.composerSubtitle, { color: community.isDark ? '#8CD9CF' : '#176C64', textAlign: align }]}>{ar ? 'فكرة منك قد تلهم أستاذًا آخر' : 'Your idea could inspire another teacher'}</Text>
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
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${copy.form.postType}: ${copy.types[type]}`}
          accessibilityState={{ expanded: typeOpen }}
          onPress={() => { Keyboard.dismiss(); setTypeOpen((open) => !open); }}
          style={({ pressed }) => [styles.selectButton, { flexDirection: row, backgroundColor: community.surfaceRaised, borderColor: typeOpen ? community.gold : community.border, opacity: pressed ? 0.8 : 1 }]}
        >
          <View style={[styles.selectIcon, { backgroundColor: community.isDark ? '#34301E' : '#FFF3CC' }]}>
            <Ionicons name={communityTypeIcons[type]} size={20} color={community.isDark ? '#E8C65C' : '#7A5B09'} />
          </View>
          <Text style={[styles.selectLabel, { color: community.text, textAlign: align }]}>{copy.types[type]}</Text>
          <Ionicons name={typeOpen ? 'chevron-up' : 'chevron-down'} size={18} color={community.textSecondary} />
        </Pressable>
        {typeOpen && (
          <View style={[styles.options, { borderColor: community.border }]}>
            {COMMUNITY_POST_TYPES.map((item) => (
              <Pressable
                key={item}
                accessibilityRole="radio"
                accessibilityState={{ checked: type === item }}
                accessibilityLabel={copy.types[item]}
                onPress={() => { setType(item); setTypeOpen(false); }}
                style={({ pressed }) => [styles.option, { flexDirection: row, backgroundColor: type === item ? community.primarySoft : community.surface, opacity: pressed ? 0.7 : 1 }]}
              >
                <Ionicons name={communityTypeIcons[item]} size={19} color={community.isDark ? '#E8C65C' : '#7A5B09'} />
                <Text style={[styles.selectLabel, { color: community.text, textAlign: align }]}>{copy.types[item]}</Text>
                {type === item && <Ionicons name="checkmark-circle" size={20} color={community.isDark ? '#8CD9CF' : '#176C64'} />}
              </Pressable>
            ))}
          </View>
        )}
      </Section>

      <Section title={copy.form.titleField} align={align}>
        <TextField value={title} onChangeText={setTitle} placeholder={copy.form.titleOptional} align={align} />
      </Section>

      <Section title={copy.form.subject} align={align}>
        <TextField value={subject} onChangeText={setSubject} align={align} />
      </Section>

      <Section title={copy.form.level} align={align}>
        <Text style={[styles.hint, { color: community.textMuted, textAlign: align }]}>
          {ar ? 'اختر الطور ثم سنة أو أكثر (اختياري)' : 'Choose a stage, then one or more years (optional)'}
        </Text>
        <View style={[styles.stageRow, { flexDirection: row }]}>
          {(['PS', 'MS'] as const).map((item) => (
            <Pressable key={item} accessibilityRole="button" accessibilityState={{ selected: stage === item, expanded: stage === item }}
              onPress={() => { Keyboard.dismiss(); setTypeOpen(false); setStage(stage === item ? null : item); }}
              style={({ pressed }) => [styles.stageButton, { borderColor: stage === item ? community.gold : community.border, backgroundColor: stage === item ? (community.isDark ? '#34301E' : '#FFF3CC') : community.surfaceRaised, opacity: pressed ? 0.8 : 1 }]}>
              <Ionicons name={item === 'PS' ? 'book-outline' : 'school-outline'} size={22} color={community.isDark ? '#E8C65C' : '#7A5B09'} />
              <Text style={[styles.stageLabel, { color: community.text }]}>{item === 'PS' ? (ar ? 'ابتدائي' : 'Primary') : (ar ? 'متوسط' : 'Middle school')}</Text>
              <Ionicons name={stage === item ? 'chevron-up' : 'chevron-down'} size={14} color={community.textMuted} />
            </Pressable>
          ))}
        </View>
        {stage && <View style={[styles.chipsRow, { flexDirection: row }]}>
          {EDUCATIONAL_LEVELS.filter((item) => item.endsWith(stage)).map((item) => (
            <Pressable key={item} accessibilityRole="checkbox" accessibilityState={{ checked: levels.includes(item) }}
              onPress={() => toggleLevel(item)}
              style={({ pressed }) => [styles.yearButton, { flexDirection: row, borderColor: levels.includes(item) ? '#479B90' : community.border, backgroundColor: levels.includes(item) ? (community.isDark ? '#163E3C' : '#E3F4EF') : community.surfaceRaised, opacity: pressed ? 0.8 : 1 }]}>
              <Ionicons name={levels.includes(item) ? 'checkbox' : 'square-outline'} size={19} color={community.isDark ? '#8CD9CF' : '#176C64'} />
              <Text style={[styles.stageLabel, { color: community.text }]}>{ar ? `السنة ${item[0]} ${stage === 'PS' ? 'ابتدائي' : 'متوسط'}` : `Year ${item[0]}`}</Text>
            </Pressable>
          ))}
        </View>}
        {levels.length > 0 && <View style={{ gap: 8 }}>
          <Text style={[styles.hint, { color: community.textSecondary, textAlign: align }]}>{ar ? 'السنوات المختارة — اضغط للإزالة' : 'Selected years — tap to remove'}</Text>
          <View style={[styles.chipsRow, { flexDirection: row }]}>
            {EDUCATIONAL_LEVELS.filter((item) => levels.includes(item)).map((item) => (
              <Pressable key={item} accessibilityRole="button" accessibilityLabel={`${ar ? 'إزالة' : 'Remove'} ${item}`}
                onPress={() => toggleLevel(item)} style={[styles.selectedYear, { flexDirection: row, backgroundColor: community.primarySoft }]}>
                <Text style={{ color: community.text, fontWeight: '700' }}>{item}</Text>
                <Ionicons name="close-circle" size={17} color={community.textSecondary} />
              </Pressable>
            ))}
          </View>
        </View>}
      </Section>

      <Section title={copy.form.attachment} align={align}>
        {attachment ? (
          <View style={styles.attachmentPreviewWrap}>
            {attachment.kind === 'image' ? (
              <View style={[styles.imagePreviewShell, { backgroundColor: community.imageBackdrop }]}>
                <Image source={{ uri: attachment.previewUri }} style={styles.imagePreview} resizeMode="cover" />
              </View>
            ) : (
              <View
                style={[
                  styles.pdfRow,
                  {
                    backgroundColor: community.isDark ? community.surfaceRaised : '#F8FAFC',
                    borderColor: community.border,
                    flexDirection: row
                  }
                ]}
              >
                <View style={[styles.pdfIcon, { backgroundColor: community.primarySoft }]}>
                  <Ionicons name="document-text-outline" size={21} color={community.primary} />
                </View>
                <View style={styles.pdfCopy}>
                  <Text numberOfLines={1} style={[styles.pdfName, { color: community.text, textAlign: align }]}>
                    {attachment.file.name}
                  </Text>
                  <Text style={[styles.pdfMeta, { color: community.textMuted, textAlign: align }]}>PDF</Text>
                </View>
              </View>
            )}

            <View style={[styles.attachmentButtonsRow, { flexDirection: row }]}>
              <MediaButton
                label={copy.form.changeAttachment}
                icon={attachment.kind === 'image' ? 'image-outline' : 'document-text-outline'}
                onPress={attachment.kind === 'image' ? pickImage : pickPdf}
              />
              <MediaButton label={copy.form.removeAttachment} icon="trash-outline" onPress={() => setAttachment(null)} danger />
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
        accessibilityRole="button"
        accessibilityState={{ disabled: busy, busy }}
        onPress={handlePublish}
        disabled={busy}
        style={({ pressed }) => [
          styles.publishButton,
          {
            backgroundColor: '#D4AF37',
            opacity: busy ? 0.55 : pressed ? 0.88 : 1,
            flexDirection: row
          }
        ]}
      >
        {busy ? <ActivityIndicator color="#0B1833" /> : <Ionicons name="send-outline" size={19} color="#0B1833" />}
        <Text style={styles.publishButtonText}>
          {busy ? (attachment ? copy.form.uploading : copy.form.publishing) : copy.form.publish}
        </Text>
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
        accessibilityLabel={placeholder}
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
  const { isRTL } = useLanguage();
  const community = getCommunityTheme(colors);
  const color = danger ? community.danger : community.isDark ? '#8CD9CF' : '#176C64';

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.mediaButton,
        {
          flexDirection: isRTL ? 'row-reverse' : 'row',
          borderColor: danger ? `${community.danger}55` : community.border,
          backgroundColor: emphasized ? (community.isDark ? '#163E3C' : '#E3F4EF') : community.surface,
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
    paddingTop: 16,
    paddingBottom: 30
  },
  composerCard: {
    borderWidth: 1,
    borderTopWidth: 3,
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
  selectButton: { minHeight: 56, borderWidth: 1, borderRadius: 15, padding: 10, alignItems: 'center', gap: 10 },
  selectIcon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  selectLabel: { flex: 1, fontSize: 14, fontWeight: '700' },
  options: { borderWidth: 1, borderRadius: 15, overflow: 'hidden' },
  option: { minHeight: 48, padding: 12, alignItems: 'center', gap: 10 },
  stageRow: { gap: 10 },
  stageButton: { flex: 1, borderWidth: 1, borderRadius: 15, padding: 12, alignItems: 'center', gap: 7 },
  stageLabel: { fontSize: 13, fontWeight: '700', textAlign: 'center', flexShrink: 1 },
  yearButton: { minHeight: 48, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderRadius: 12, alignItems: 'center', gap: 8 },
  selectedYear: { minHeight: 44, paddingHorizontal: 12, borderRadius: 22, alignItems: 'center', gap: 8 },
  hint: { fontSize: 12, lineHeight: 19 },
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
    flexShrink: 1,
    textAlign: 'center',
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
    color: '#0B1833',
    fontWeight: '900',
    fontSize: 15.5
  }
});
