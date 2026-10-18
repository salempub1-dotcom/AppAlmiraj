import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Linking, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Directory, File } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import Pdf from 'react-native-pdf';
import { useLanguage } from '../../../context/LanguageProvider';
import { useTheme } from '../../../context/ThemeProvider';
import { toolkitCopy } from '../toolkitCopy';
import { cleanStaleScratch, createImagesPdf, makeJobId, PdfImage, savedPdfs, SavedPdf, thumbnailFor, removeThumbnail } from '../pdf/files';
import { fitImage, MAX_IMAGES, MAX_SOURCE_BYTES, MAX_SOURCE_PIXELS, PdfSettings } from '../pdf/layout';

export function ImagesToPdfScreen({ navigation }: any) {
  const { language, isRTL } = useLanguage();
  const { colors } = useTheme();
  const copy = toolkitCopy(language);
  const [images, setImages] = useState<PdfImage[]>([]);
  const [settings, setSettings] = useState<PdfSettings>({ paper: 'A4', landscape: false, marginMm: 10 });
  const [saved, setSaved] = useState<SavedPdf[]>([]);
  const [selected, setSelected] = useState<SavedPdf | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState(false);
  const thumbnails = useRef<string[]>([]);
  const lock = useRef(false);
  const mounted = useRef(true);
  const abort = useRef<AbortController | null>(null);
  const row = { flexDirection: isRTL ? 'row-reverse' as const : 'row' as const };
  const text = { color: colors.text, textAlign: isRTL ? 'right' as const : 'left' as const };

  const report = (error: unknown) => {
    const message = error instanceof Error ? error.message : '';
    if (message === 'CANCELLED') return;
    Alert.alert(copy.error, message === 'TOO_LARGE' ? copy.tooLarge : message === 'NO_SHARING' ? copy.unsupported : copy.failed);
  };
  const refresh = () => { if (mounted.current) setSaved(savedPdfs()); };
  useEffect(() => {
    mounted.current = true;
    try { cleanStaleScratch(); refresh(); } catch (error) { report(error); }
    return () => { mounted.current = false; abort.current?.abort(); thumbnails.current.forEach(removeThumbnail); };
  }, []);
  useEffect(() => navigation.addListener('beforeRemove', (event: any) => {
    if (lock.current) { event.preventDefault(); Alert.alert(copy.working, copy.wait); }
  }), [navigation, copy]);

  async function run(action: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true; setBusy(true);
    try { await action(); } catch (error) { if (mounted.current) report(error); }
    finally {
      lock.current = false;
      if (mounted.current) { setBusy(false); setProgress(null); }
    }
  }
  function open(file: SavedPdf) { setPreviewError(false); setSelected(file); }
  async function pick(camera: boolean) {
    if (images.length >= MAX_IMAGES) { Alert.alert(copy.photos, copy.limit); return; }
    await run(async () => {
      if (camera) {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert(copy.camera, copy.cameraDenied, [
            { text: copy.cancel, style: 'cancel' },
            { text: copy.settings, onPress: () => { void Linking.openSettings().catch(report); } },
          ]);
          return;
        }
      }
      const result = camera
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 1, allowsEditing: false })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1, allowsMultipleSelection: true,
          selectionLimit: MAX_IMAGES - images.length, orderedSelection: true, allowsEditing: false });
      if (result.canceled || !mounted.current) return;
      const picked: PdfImage[] = [];
      let skipped = result.assets.length > MAX_IMAGES - images.length;
      for (const asset of result.assets.slice(0, MAX_IMAGES - images.length)) {
        const bytes = asset.fileSize ?? new File(asset.uri).size;
        if (!asset.width || !asset.height || bytes > MAX_SOURCE_BYTES || asset.width * asset.height > MAX_SOURCE_PIXELS) {
          skipped = true; continue;
        }
        const thumbnailUri = await thumbnailFor(asset.uri);
        if (!mounted.current) { removeThumbnail(thumbnailUri); return; }
        thumbnails.current.push(thumbnailUri);
        picked.push({ thumbnailUri, id: makeJobId(), uri: asset.uri, name: asset.fileName || copy.photos, width: asset.width, height: asset.height });
      }
      setImages(previous => [...previous, ...picked]);
      if (skipped) Alert.alert(copy.photos, copy.limit);
    });
  }
  function move(index: number, delta: number) {
    setImages(previous => {
      const next = [...previous];
      if (index + delta < 0 || index + delta >= next.length) return previous;
      [next[index], next[index + delta]] = [next[index + delta]!, next[index]!];
      return next;
    });
  }
  async function generate() {
    await run(async () => {
      const controller = new AbortController(); abort.current = controller;
      setProgress(`0 / ${images.length}`);
      try {
        const file = await createImagesPdf(images, settings, controller.signal, (done, total) => {
          if (mounted.current) setProgress(`${done} / ${total}`);
        });
        if (mounted.current) { refresh(); open(file); }
      } finally { abort.current = null; }
    });
  }
  async function share(file: SavedPdf) {
    if (!await Sharing.isAvailableAsync()) throw new Error('NO_SHARING');
    await Sharing.shareAsync(file.uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: copy.pdf });
  }
  async function exportFile(file: SavedPdf) {
    if (Platform.OS === 'ios') { await share(file); return; }
    let directory: Directory;
    try { directory = await Directory.pickDirectoryAsync(); }
    catch (error) {
      if (/cancel|dismiss/i.test(String(error))) return;
      throw error;
    }
    const destination = directory.createFile(`AlMiraj-${makeJobId()}.pdf`, 'application/pdf');
    try { await new File(file.uri).copy(destination, { overwrite: true }); }
    catch (error) { try { destination.delete(); } catch {} throw error; }
    Alert.alert(copy.done, copy.exported);
  }
  const action = (label: string, icon: keyof typeof Ionicons.glyphMap, onPress: () => void, disabled = false) => (
    <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled || busy} onPress={onPress}
      style={[styles.action, row, { borderColor: colors.border, backgroundColor: colors.card, opacity: disabled || busy ? 0.45 : 1 }]}>
      <Ionicons name={icon} size={20} color={colors.primary} /><Text style={[text, styles.actionText]}>{label}</Text>
    </Pressable>
  );
  function choices<T extends string | number | boolean>(label: string, values: [T, string][], value: T, choose: (v: T) => void) {
    return <View style={styles.section}><Text style={[text, styles.label]}>{label}</Text><View style={[styles.actions, row]}>
      {values.map(([v, title]) => <Pressable key={String(v)} accessibilityRole="button" accessibilityState={{ selected: value === v }}
        disabled={busy} onPress={() => choose(v)} style={[styles.choice, { backgroundColor: value === v ? colors.primary : colors.card, borderColor: colors.border }]}>
        <Text style={{ color: value === v ? colors.onPrimary : colors.text, fontWeight: '700' }}>{title}</Text>
      </Pressable>)}
    </View></View>;
  }
  const lowResolution = images.some(image => {
    const fit = fitImage(image.width, image.height, settings);
    return image.width / (fit.width / 72) < 150;
  });
  return <SafeAreaView edges={['bottom', 'left', 'right']} style={[styles.page, { backgroundColor: colors.background }]}>
    <FlatList data={images} keyExtractor={item => item.id} contentContainerStyle={styles.content}
      ListHeaderComponent={<View style={styles.section}>
        <Text style={[text, styles.heading]}>{copy.pdf}</Text>
        <Text style={[text, styles.body]}>{copy.description}</Text>
        <Text style={[text, { color: colors.muted }]}>{copy.local}</Text>
        <View style={[styles.actions, row]}>{action(copy.gallery, 'images-outline', () => void pick(false))}{action(copy.camera, 'camera-outline', () => void pick(true))}</View>
        <Text style={[text, { color: colors.muted }]}>{copy.limit}</Text>
        <Text style={[text, styles.label]}>{copy.photos} · {images.length} / {MAX_IMAGES}</Text>
      </View>}
      ListEmptyComponent={<Text style={[text, styles.empty]}>{copy.empty}</Text>}
      renderItem={({ item, index }) => <View style={[styles.imageRow, row, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Image source={{ uri: item.thumbnailUri || item.uri }} resizeMode="contain" style={styles.thumbnail} accessibilityLabel={`${copy.photos} ${index + 1}`} />
        <View style={styles.imageDetails}><Text style={[text, styles.label]}>{index + 1}</Text><Text numberOfLines={1} style={text}>{item.name}</Text>
          <View style={[styles.actions, row]}>
            {action(copy.up, 'arrow-up', () => move(index, -1), index === 0)}
            {action(copy.down, 'arrow-down', () => move(index, 1), index === images.length - 1)}
            {action(copy.delete, 'trash-outline', () => { removeThumbnail(item.thumbnailUri); setImages(list => list.filter(image => image.id !== item.id)); })}
          </View></View>
      </View>}
      ListFooterComponent={<View style={styles.section}>
        {choices('A4 / A3 · ' + copy.paper, [['A4', 'A4'], ['A3', 'A3']], settings.paper, paper => setSettings(s => ({ ...s, paper })))}
        {choices(copy.orientation, [[false, copy.portrait], [true, copy.landscape]], settings.landscape, landscape => setSettings(s => ({ ...s, landscape })))}
        {choices(copy.margins, [0, 5, 10, 15, 20].map(n => [n, String(n)]), settings.marginMm, marginMm => setSettings(s => ({ ...s, marginMm })))}
        <Text style={[text, { color: colors.muted }]}>{copy.quality}</Text>
        {lowResolution && <Text style={[text, { color: colors.danger }]}>{copy.lowResolution}</Text>}
        <Pressable accessibilityRole="button" disabled={busy || !images.length} onPress={() => void generate()}
          style={[styles.primary, { backgroundColor: colors.primary, opacity: busy || !images.length ? 0.45 : 1 }]}>
          <Text style={{ color: colors.onPrimary, fontWeight: '800', fontSize: 16 }}>{copy.create}</Text>
        </Pressable>
        {busy && <View style={styles.section}><ActivityIndicator color={colors.primary} /><Text style={[text, { textAlign: 'center' }]}>{copy.working} {progress}</Text>
          {progress !== null && <Pressable accessibilityRole="button" onPress={() => abort.current?.abort()} style={styles.choice}><Text style={text}>{copy.cancel}</Text></Pressable>}
        </View>}
        <Text style={[text, styles.heading]}>{copy.saved}</Text><Text style={[text, styles.body]}>{copy.savedHint}</Text>
        {saved.map(file => <View key={file.uri} style={[styles.savedRow, { borderColor: colors.border }]}>
          <Pressable disabled={busy} accessibilityRole="button" onPress={() => open(file)} style={styles.savedName}>
            <Text style={text} numberOfLines={1}>{file.name}</Text><Text style={[text, { color: colors.muted }]}>{(file.size / 1024 / 1024).toFixed(1)} MB · {copy.preview}</Text>
          </Pressable>
          {action(copy.delete, 'trash-outline', () => Alert.alert(copy.delete, copy.deleteQuestion, [
            { text: copy.cancel, style: 'cancel' }, { text: copy.delete, style: 'destructive', onPress: () => { void run(async () => { new File(file.uri).delete(); refresh(); }); } },
          ]))}
        </View>)}
      </View>} />
    <Modal visible={!!selected} animationType="slide" onRequestClose={() => { if (!busy) setSelected(null); }}>
      <SafeAreaView style={[styles.page, { backgroundColor: colors.background }]}>
        <View style={styles.content}><Text style={[text, styles.heading]}>{copy.preview}</Text>
          <View style={[styles.actions, row]}>
            {action(copy.close, 'close', () => setSelected(null))}
            {selected && action(copy.share, 'share-outline', () => void run(() => share(selected)))}
            {selected && action(copy.export, 'download-outline', () => void run(() => exportFile(selected)))}
            {selected && action(copy.print, 'print-outline', () => void run(() => Print.printAsync({ uri: selected.uri })))}
          </View>{busy && <ActivityIndicator color={colors.primary} />}
        </View>
        {previewError ? <Text style={[text, styles.content]}>{copy.previewFailed}</Text> : selected && <Pdf key={selected.uri}
          source={{ uri: selected.uri }} style={styles.pdf} onError={() => setPreviewError(true)}
          trustAllCerts={false} enablePaging fitPolicy={2} />}
      </SafeAreaView>
    </Modal>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  page: { flex: 1 }, content: { padding: 18, paddingBottom: 28, gap: 14 }, heading: { fontSize: 22, fontWeight: '800' },
  section: { gap: 12, marginBottom: 16 }, body: { lineHeight: 23 }, actions: { flexWrap: 'wrap', gap: 8 },
  action: { minHeight: 44, padding: 10, borderWidth: 1, borderRadius: 12, alignItems: 'center', gap: 6 },
  actionText: { fontSize: 12, fontWeight: '700' }, choice: { minHeight: 44, padding: 12, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  label: { fontSize: 15, fontWeight: '700' }, empty: { paddingVertical: 24 }, thumbnail: { width: 72, height: 96, backgroundColor: '#FFFFFF', borderRadius: 8 },
  imageRow: { borderWidth: 1, borderRadius: 18, padding: 12, gap: 12, alignItems: 'center', marginBottom: 12 }, imageDetails: { flex: 1, gap: 8 },
  primary: { minHeight: 56, padding: 14, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  savedRow: { borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 10, gap: 8 }, savedName: { minHeight: 48, justifyContent: 'center' }, pdf: { flex: 1, width: '100%' },
});
