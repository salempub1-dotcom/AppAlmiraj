import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import { Alert, ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLanguage } from '../../../context/LanguageProvider';
import { useTheme } from '../../../context/ThemeProvider';
import { exportImagesPdf, type PdfImage, type PdfPaper, type PdfOrientation } from '../utils/imagesToPdf';

const MAX_IMAGES = 30;
export function ImagesToPdfScreen() {
  const { colors } = useTheme();
  const { language, isRTL } = useLanguage();
  const ar = language === 'ar';
  const [images, setImages] = useState<PdfImage[]>([]);
  const [paper, setPaper] = useState<PdfPaper>('A4');
  const [orientation, setOrientation] = useState<PdfOrientation>('portrait');
  const [marginMm, setMarginMm] = useState(5);
  const [busy, setBusy] = useState(false);
  const [output, setOutput] = useState<string | null>(null);
  const row = isRTL ? 'row-reverse' as const : 'row' as const;
  const tr = (a: string, en: string) => ar ? a : en;

  async function pick(camera = false) {
    try {
      if (camera) {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) { Alert.alert(tr('الكاميرا غير مسموح بها', 'Camera access denied')); return; }
      }
      const result = camera
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.92 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, quality: 1 });
      if (result.canceled) return;
      const incoming = result.assets.filter(asset => !!asset.uri).map((asset, index) => ({ id: `${Date.now()}-${index}-${Math.random()}`, uri: asset.uri }));
      if (images.length + incoming.length > MAX_IMAGES) {
        Alert.alert(tr('الحد الأقصى 30 صورة', 'Maximum 30 images'));
        return;
      }
      setImages(prev => [...prev, ...incoming]);
      setOutput(null);
    } catch {
      Alert.alert(tr('تعذر فتح الصور', 'Unable to open images'));
    }
  }
  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= images.length) return;
    setImages(prev => {
      const next = [...prev]; const current = next[index]!; next[index] = next[target]!; next[target] = current;
      return next;
    });
    setOutput(null);
  }
  async function generate() {
    if (!images.length || busy) return;
    setBusy(true);
    try {
      const uri = await exportImagesPdf(images, paper, orientation, marginMm);
      setOutput(uri);
      Alert.alert(tr('تم إنشاء ملف PDF', 'PDF created'), tr('يمكنك مشاركته أو طباعته الآن.', 'You can now share or print it.'));
    } catch (error) {
      const code = error instanceof Error ? error.message : '';
      const message = code === 'IMAGES_TOO_LARGE' ? tr('الصور كبيرة جدًا. اختر عددًا أقل أو صورًا أصغر.', 'Images too large. Select fewer or smaller photos.')
        : code === 'IMAGE_UNAVAILABLE' ? tr('تعذر قراءة إحدى الصور.', 'One image is unavailable.')
        : tr('فشل إنشاء ملف PDF.', 'PDF generation failed.');
      Alert.alert(tr('خطأ', 'Error'), message);
    } finally { setBusy(false); }
  }
  async function share() {
    if (!output) return;
    try {
      if (!(await Sharing.isAvailableAsync())) throw new Error('Unavailable');
      await Sharing.shareAsync(output, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
    } catch { Alert.alert(tr('تعذرت المشاركة', 'Could not share PDF')); }
  }
  async function print() {
    if (!output) return;
    try { await Print.printAsync({ uri: output }); }
    catch { Alert.alert(tr('تعذرت الطباعة أو أُلغيت', 'Printing failed or was cancelled')); }
  }
  const action = (label: string, fn: () => void, disabled = false) =>
    <Pressable accessibilityRole="button" disabled={disabled} onPress={fn} style={[styles.button, { backgroundColor: colors.primary, opacity: disabled ? .5 : 1 }]}>
      <Text style={{ color: colors.onPrimary, fontWeight: '800' }}>{label}</Text>
    </Pressable>;
  return <ScrollView style={{ flex:1, backgroundColor:colors.background }} contentContainerStyle={styles.container}>
    <Text style={[styles.title, { color:colors.text, textAlign:isRTL?'right':'left' }]}>{tr('الصور إلى PDF', 'Images to PDF')}</Text>
    <Text style={{ color:colors.muted, textAlign:isRTL?'right':'left' }}>{tr('اختر الصور ورتبها ثم حدد إعدادات الورق. تتم المعالجة على هاتفك.', 'Select and arrange images, then configure paper settings. Processing stays on your device.')}</Text>
    <View style={[styles.actions, { flexDirection:row }]}>
      {action(tr('إضافة صور', 'Add images'), () => void pick())}
      {action(tr('التقاط صورة', 'Take photo'), () => void pick(true))}
    </View>
    <Text style={{ color:colors.text, fontWeight:'700' }}>{tr('الصور', 'Images')} ({images.length}/{MAX_IMAGES})</Text>
    {images.map((item,index) => <View key={item.id} style={[styles.imageRow, { flexDirection:row, borderColor:colors.border, backgroundColor:colors.card }]}>
      <Image source={{uri:item.uri}} style={styles.thumb} resizeMode="contain"/>
      <Text style={{color:colors.text, flex:1}}>{index+1}</Text>
      <Pressable accessibilityLabel={tr('تحريك للأعلى','Move up')} disabled={index===0} onPress={()=>move(index,-1)}><Ionicons name="arrow-up-circle-outline" size={28} color={colors.primary}/></Pressable>
      <Pressable accessibilityLabel={tr('تحريك للأسفل','Move down')} disabled={index===images.length-1} onPress={()=>move(index,1)}><Ionicons name="arrow-down-circle-outline" size={28} color={colors.primary}/></Pressable>
      <Pressable accessibilityLabel={tr('حذف','Remove')} onPress={()=>{setImages(prev=>prev.filter(x=>x.id!==item.id));setOutput(null);}}><Ionicons name="trash-outline" size={25} color={colors.danger}/></Pressable>
    </View>)}
    <Text style={{color:colors.text,fontWeight:'800'}}>{tr('حجم الورق', 'Paper')}</Text>
    <View style={[styles.actions,{flexDirection:row}]}>
      {(['A4','A3'] as const).map(value=><Pressable key={value} onPress={()=>{setPaper(value);setOutput(null);}} style={[styles.choice,{borderColor:paper===value?colors.primary:colors.border,backgroundColor:colors.card}]}><Text style={{color:colors.text}}>{value}</Text></Pressable>)}
    </View>
    <Text style={{color:colors.text,fontWeight:'800'}}>{tr('اتجاه الورقة', 'Orientation')}</Text>
    <View style={[styles.actions,{flexDirection:row}]}>
      {(['portrait','landscape'] as const).map(value=><Pressable key={value} onPress={()=>{setOrientation(value);setOutput(null);}} style={[styles.choice,{borderColor:orientation===value?colors.primary:colors.border,backgroundColor:colors.card}]}><Text style={{color:colors.text}}>{value==='portrait'?tr('عمودي','Portrait'):tr('أفقي','Landscape')}</Text></Pressable>)}
    </View>
    <Text style={{color:colors.text,fontWeight:'800'}}>{tr('الهوامش','Margins')}: {marginMm} mm</Text>
    <View style={[styles.actions,{flexDirection:row}]}>
      {[0,5,10,15,20].map(value=><Pressable key={value} onPress={()=>{setMarginMm(value);setOutput(null);}} style={[styles.choice,{borderColor:marginMm===value?colors.primary:colors.border,backgroundColor:colors.card}]}><Text style={{color:colors.text}}>{value}</Text></Pressable>)}
    </View>
    <Text style={{color:colors.muted}}>{tr('معاينة ترتيب الصفحات تظهر في الصور أعلاه. كل صورة في صفحة واحدة دون تشويه.', 'The image list previews page order. Each image is fitted to one page without distortion.')}</Text>
    {busy ? <ActivityIndicator color={colors.primary}/> : null}
    {action(tr('إنشاء PDF','Create PDF'),()=>void generate(),!images.length||busy)}
    {output ? <View style={[styles.actions,{flexDirection:row}]}>{action(tr('مشاركة / حفظ','Share / Save'),()=>void share())}{action(tr('طباعة','Print'),()=>void print())}</View> : null}
  </ScrollView>;
}
const styles=StyleSheet.create({
 container:{padding:20,paddingBottom:110,gap:14},title:{fontSize:26,fontWeight:'900'},actions:{gap:8,flexWrap:'wrap'},
 button:{minHeight:47,paddingHorizontal:16,paddingVertical:12,borderRadius:14,alignItems:'center',justifyContent:'center',flexGrow:1},
 choice:{borderWidth:2,borderRadius:12,paddingVertical:10,paddingHorizontal:16},
 imageRow:{borderWidth:1,borderRadius:12,padding:8,alignItems:'center',gap:12},
 thumb:{width:70,height:85}
});
