import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen } from '../../../components/Screen';
import { useLanguage } from '../../../context/LanguageProvider';
import { useTheme } from '../../../context/ThemeProvider';

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function GroupMakerScreen() {
  const { colors } = useTheme();
  const { t, isRTL } = useLanguage();
  const align = isRTL ? 'right' as const : 'left' as const;
  const row = isRTL ? 'row-reverse' as const : 'row' as const;
  const [rawNames, setRawNames] = useState('');
  const [groupCount, setGroupCount] = useState(2);
  const [groups, setGroups] = useState<string[][]>([]);

  const names = useMemo(() => rawNames.split(/\n|,/).map((name) => name.trim()).filter(Boolean), [rawNames]);
  const generate = () => {
    if (names.length < 2) return;
    const count = Math.min(groupCount, names.length);
    const next = Array.from({ length: count }, () => [] as string[]);
    shuffle(names).forEach((name, index) => next[index % count].push(name));
    setGroups(next);
  };

  return (
    <Screen scroll style={styles.page}>
      <View style={[styles.hero, { backgroundColor: colors.card, borderColor: colors.border, alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
        <View style={[styles.icon, { backgroundColor: `${colors.primary}18` }]}><Ionicons name="people-outline" size={28} color={colors.primary} /></View>
        <Text style={[styles.title, { color: colors.text, textAlign: align }]}>{t('tools.groupsTitle')}</Text>
        <Text style={[styles.caption, { color: colors.muted, textAlign: align, writingDirection: isRTL ? 'rtl' : 'ltr' }]}>{t('tools.groupsCaption')}</Text>
      </View>

      <TextInput value={rawNames} onChangeText={setRawNames} multiline placeholder={t('tools.groupsPlaceholder')} placeholderTextColor={colors.muted} textAlign={align} style={[styles.input, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border }]} />

      <View style={styles.controls}>
        <Pressable onPress={() => setGroupCount((value) => Math.max(2, value - 1))} style={[styles.stepButton, { backgroundColor: colors.card, borderColor: colors.border }]}><Ionicons name="remove" size={22} color={colors.text} /></Pressable>
        <View style={[styles.counter, { backgroundColor: colors.card, borderColor: colors.border }]}><Text style={[styles.counterLabel, { color: colors.muted }]}>{t('tools.groupCount')}</Text><Text style={[styles.counterValue, { color: colors.text }]}>{groupCount}</Text></View>
        <Pressable onPress={() => setGroupCount((value) => Math.min(10, value + 1))} style={[styles.stepButton, { backgroundColor: colors.card, borderColor: colors.border }]}><Ionicons name="add" size={22} color={colors.text} /></Pressable>
      </View>

      <Pressable disabled={names.length < 2} onPress={generate} style={[styles.button, { backgroundColor: colors.primary, opacity: names.length >= 2 ? 1 : 0.45, flexDirection: row }]}><Ionicons name="shuffle-outline" size={21} color="#0B1833" /><Text style={styles.buttonText}>{t('tools.splitNow')}</Text></Pressable>

      {groups.map((group, index) => (
        <View key={`${index}-${group.join('-')}`} style={[styles.groupCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.groupTitle, { color: colors.primary, textAlign: align }]}>{t('tools.group')} {index + 1}</Text>
          {group.map((name) => <Text key={name} style={[styles.name, { color: colors.text, textAlign: align }]}>• {name}</Text>)}
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { gap: 16 }, hero: { borderWidth: 1, borderRadius: 26, padding: 20, gap: 8 }, icon: { width: 50, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }, title: { fontSize: 25, fontWeight: '900' }, caption: { lineHeight: 21 }, input: { minHeight: 180, borderWidth: 1, borderRadius: 22, padding: 18, fontSize: 16, lineHeight: 27, textAlignVertical: 'top' }, controls: { flexDirection: 'row', gap: 10, alignItems: 'stretch' }, stepButton: { width: 58, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }, counter: { flex: 1, borderRadius: 16, borderWidth: 1, padding: 10, alignItems: 'center' }, counterLabel: { fontSize: 12, fontWeight: '700' }, counterValue: { fontSize: 24, fontWeight: '900' }, button: { minHeight: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center', gap: 9 }, buttonText: { color: '#0B1833', fontSize: 17, fontWeight: '900' }, groupCard: { borderWidth: 1, borderRadius: 20, padding: 17, gap: 7 }, groupTitle: { fontSize: 17, fontWeight: '900', marginBottom: 3 }, name: { fontSize: 16, lineHeight: 24 }
});
