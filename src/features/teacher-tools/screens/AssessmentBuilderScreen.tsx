import { useState } from 'react';
import { Alert, ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import { useLanguage } from '../../../context/LanguageProvider';
import { useTheme } from '../../../context/ThemeProvider';

type Question = { id: number; prompt: string; answer: string; points: string };
const escapeHtml = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const numberOf = (raw: string) => Number(raw.replace(',', '.'));
const isValidPoint = (raw: string) => raw.trim() !== '' && Number.isFinite(numberOf(raw)) && numberOf(raw) > 0 && numberOf(raw) <= 20;

function makeHtml(opts: { school: string; level: string; subject: string; heading: string; duration: string; questions: Question[]; correction: boolean }) {
  const { school, level, subject, heading, duration, questions, correction } = opts;
  const total = questions.reduce((n, q) => n + numberOf(q.points), 0);
  const items = questions.map((q, i) => `<section class="question"><div class="qhead"><b>${i + 1}. ${escapeHtml(q.prompt).replace(/\n/g, '<br>')}</b><span>${numberOf(q.points)} ن</span></div>${correction ? `<p class="answer">${escapeHtml(q.answer || 'لم تُحدد إجابة نموذجية').replace(/\n/g, '<br>')}</p>` : '<div class="writing"></div>'}</section>`).join('');
  return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><style>
  @page{size:A4;margin:15mm}html,body{font-family:Arial,sans-serif;color:#0B1833;direction:rtl}*{box-sizing:border-box}
  .head{border-bottom:3px solid #D4AF37;padding-bottom:12px;margin-bottom:16px}.brand{font-size:13px;color:#6F5A1C;font-weight:700}
  h1{text-align:center;font-size:22px;margin:18px 0}.meta{display:flex;justify-content:space-between;gap:12px;font-size:13px}
  .student{border:1px solid #9AA6B7;padding:10px;margin:18px 0;border-radius:7px;font-size:13px}
  .question{break-inside:avoid;border-bottom:1px solid #E6EAF0;padding:10px 0 14px;min-height:95px}
  .qhead{display:flex;justify-content:space-between;gap:12px;line-height:1.9;font-size:15px}.qhead span{white-space:nowrap;color:#7A611E}
  .writing{min-height:70px}.answer{white-space:normal;line-height:1.9;color:#21445C}
  footer{font-size:11px;text-align:center;margin-top:20px;color:#777}</style></head><body>
  <div class="head"><div class="brand">AL MIRAJ EDUCATION • المعراج للوسائل التعليمية</div><div class="meta"><span>${escapeHtml(school)}</span><span>${escapeHtml(level)} — ${escapeHtml(subject)}</span></div></div>
  <h1>${escapeHtml(heading)}${correction ? ' — التصحيح النموذجي' : ''}</h1>
  <div class="meta"><span>المدة: ${escapeHtml(duration)}</span><span>العلامة: ${total.toFixed(1).replace(/\.0$/, '')} / 20</span></div>
  ${correction ? '' : '<div class="student">الاسم واللقب: ............................................................................. القسم: .................</div>'}
  ${items}<footer>المعراج • وثيقة قابلة للتعديل أنشأها الأستاذ — يرجى مراجعة المحتوى قبل الطباعة</footer>
  </body></html>`;
}

export function AssessmentBuilderScreen() {
  const { colors } = useTheme();
  const { language, isRTL } = useLanguage();
  const ar = language === 'ar';
  const align = isRTL ? 'right' as const : 'left' as const;
  const copy = (a: string, en: string) => ar ? a : en;
  const [school, setSchool] = useState('');
  const [level, setLevel] = useState('');
  const [subject, setSubject] = useState('');
  const [heading, setHeading] = useState('فرض الفصل الأول');
  const [duration, setDuration] = useState('ساعة واحدة');
  const [questions, setQuestions] = useState<Question[]>([{ id: 1, prompt: '', answer: '', points: '10' }, { id: 2, prompt: '', answer: '', points: '10' }]);
  const [busy, setBusy] = useState(false);
  const [lastFiles, setLastFiles] = useState<{ exam: string; correction: string } | null>(null);
  const total = questions.reduce((n, q) => n + (isValidPoint(q.points) ? numberOf(q.points) : 0), 0);
  const valid = questions.length > 0 && questions.every(q => q.prompt.trim().length > 0 && isValidPoint(q.points)) && Math.abs(total - 20) < 0.001 && heading.trim().length > 0 && subject.trim().length > 0 && level.trim().length > 0;
  const change = (id: number, prop: 'prompt' | 'answer' | 'points', value: string) => { setQuestions(prev => prev.map(q => q.id === id ? { ...q, [prop]: value } : q)); setLastFiles(null); };
  const add = () => { setQuestions(prev => [...prev, { id: Math.max(0, ...prev.map(q => q.id)) + 1, prompt: '', answer: '', points: '1' }]); setLastFiles(null); };
  const remove = (id: number) => { setQuestions(prev => prev.filter(q => q.id !== id)); setLastFiles(null); };
  const exportPdfs = async () => {
    if (!valid || busy) return;
    setBusy(true);
    try {
      const opts = { school, level, subject, heading, duration, questions };
      const examTemp = await Print.printToFileAsync({ html: makeHtml({ ...opts, correction: false }) });
      const answerTemp = await Print.printToFileAsync({ html: makeHtml({ ...opts, correction: true }) });
      const stamp = Date.now();
      const exam = new File(Paths.document, `AlMiraj-Exam-${stamp}.pdf`);
      const correction = new File(Paths.document, `AlMiraj-Correction-${stamp}.pdf`);
      new File(examTemp.uri).copy(exam);
      new File(answerTemp.uri).copy(correction);
      setLastFiles({ exam: exam.uri, correction: correction.uri });
      Alert.alert(copy('نجح التصدير', 'Export complete'), copy('تم إنشاء ملف الفرض وملف التصحيح محليًا. اختر ملفًا لمشاركته.', 'Exam and answer key were saved in the app. Choose a file to share.'));
    } catch {
      Alert.alert(copy('تعذر إنشاء PDF', 'PDF failed'), copy('تحقق من مساحة الهاتف وحاول مجددًا.', 'Check your device storage and retry.'));
    } finally { setBusy(false); }
  };
  const share = async (uri: string) => { try { if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' }); else Alert.alert(copy('المشاركة غير متاحة', 'Sharing unavailable')); } catch { Alert.alert(copy('تعذرت المشاركة', 'Sharing failed')); } };
  const field = (label: string, value: string, changeText: (s: string) => void, multiline = false) => (
    <View style={styles.field}><Text style={[styles.label, { color: colors.text, textAlign: align }]}>{label}</Text>
      <TextInput value={value} onChangeText={changeText} multiline={multiline} textAlign={align} placeholderTextColor={colors.muted} style={[styles.input, multiline && { minHeight: 84, textAlignVertical: 'top' }, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]} /></View>
  );
  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
      <View style={styles.hero}><Text style={styles.heroTitle}>{copy('صانع الفروض والاختبارات', 'Test & Exam Builder')}</Text>
        <Text style={styles.heroText}>{copy('أنشئ أسئلتك بنفسك وراجعها، ثم صدّر موضوع الاختبار والتصحيح في ملفين منفصلين. يعمل محليًا دون اشتراك أو ذكاء اصطناعي في هذه النسخة التجريبية.', 'Write and review your questions, then export the exam and answer key separately. This preview works locally without subscriptions or AI.')}</Text></View>
      {field(copy('المؤسسة', 'School'), school, setSchool)}
      {field(copy('المستوى والقسم', 'Level & class'), level, setLevel)}
      {field(copy('المادة', 'Subject'), subject, setSubject)}
      {field(copy('عنوان الفرض أو الاختبار', 'Exam title'), heading, setHeading)}
      {field(copy('المدة', 'Duration'), duration, setDuration)}
      <Text style={[styles.section, { color: colors.text }]}>{copy('الأسئلة', 'Questions')}</Text>
      {questions.map((q, index) => (
        <View key={q.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeader}><Text style={[styles.cardTitle, { color: colors.text }]}>{copy('السؤال', 'Question')} {index + 1}</Text>
            <Pressable accessibilityRole="button" onPress={() => remove(q.id)}><Text style={styles.remove}>{copy('حذف', 'Remove')}</Text></Pressable></View>
          {field(copy('نص السؤال', 'Question text'), q.prompt, v => change(q.id, 'prompt', v), true)}
          {field(copy('التصحيح النموذجي (اختياري)', 'Answer key (optional)'), q.answer, v => change(q.id, 'answer', v), true)}
          {field(copy('النقاط', 'Points'), q.points, v => change(q.id, 'points', v))}
        </View>
      ))}
      <Pressable accessibilityRole="button" style={[styles.outline, { borderColor: colors.primary }]} onPress={add}><Text style={{ color: colors.primary, fontWeight: '800' }}>{copy('+ إضافة سؤال', '+ Add question')}</Text></Pressable>
      <Text style={[styles.total, { color: Math.abs(total - 20) < 0.001 ? colors.text : '#B45309' }]}>{copy('مجموع النقاط', 'Total points')}: {total} / 20</Text>
      <Text style={[styles.note, { color: colors.muted }]}>{copy('يجب أن يكون مجموع النقاط 20 وأن تكون الحقول الأساسية والأسئلة مكتملة. لا ترفع هذه الأداة بياناتك إلى Supabase.', 'The points must total 20 and required fields must be filled. Data is not uploaded to Supabase.')}</Text>
      <Pressable accessibilityRole="button" disabled={!valid || busy} onPress={exportPdfs} style={[styles.primary, { opacity: valid && !busy ? 1 : 0.45 }]}>{busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>{copy('إنشاء الموضوع والتصحيح PDF', 'Export exam + answer key PDF')}</Text>}</Pressable>
      {lastFiles && <View style={styles.shareRow}><Pressable accessibilityRole="button" style={styles.shareButton} onPress={() => share(lastFiles.exam)}><Text style={styles.shareText}>{copy('مشاركة الموضوع', 'Share exam')}</Text></Pressable><Pressable accessibilityRole="button" style={styles.shareButton} onPress={() => share(lastFiles.correction)}><Text style={styles.shareText}>{copy('مشاركة التصحيح', 'Share answers')}</Text></Pressable></View>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { padding: 18, paddingBottom: 60, gap: 14 }, hero: { backgroundColor: '#0B1833', padding: 22, borderRadius: 24, gap: 10 },
  heroTitle: { color: '#D4AF37', fontSize: 23, fontWeight: '900', textAlign: 'right' },
  heroText: { color: '#E0E7F1', fontSize: 13, lineHeight: 23, textAlign: 'right' },
  field: { gap: 6, flex: 1 }, label: { fontWeight: '700', fontSize: 13 },
  input: { borderWidth: 1, borderRadius: 12, minHeight: 43, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14 },
  section: { fontSize: 20, fontWeight: '900', marginTop: 9 },
  card: { padding: 14, borderRadius: 18, borderWidth: 1, gap: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontWeight: '800', fontSize: 16 }, remove: { color: '#B42318', fontWeight: '700' },
  outline: { alignItems: 'center', padding: 13, borderWidth: 1, borderRadius: 14 },
  total: { fontWeight: '900', fontSize: 17, textAlign: 'center' }, note: { fontSize: 12, lineHeight: 20, textAlign: 'center' },
  primary: { backgroundColor: '#0B1833', padding: 16, borderRadius: 15, alignItems: 'center' }, primaryText: { color: '#FFFFFF', fontWeight: '900' },
  shareRow: { flexDirection: 'row', gap: 10 }, shareButton: { flex: 1, backgroundColor: '#D4AF37', padding: 12, borderRadius: 12, alignItems: 'center' }, shareText: { color: '#0B1833', fontWeight: '800' }
});
