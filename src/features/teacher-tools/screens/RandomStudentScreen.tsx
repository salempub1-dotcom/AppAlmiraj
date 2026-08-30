import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen } from '../../../components/Screen';
import { useTheme } from '../../../context/ThemeProvider';

export function RandomStudentScreen() {
  const { colors } = useTheme();
  const [rawNames, setRawNames] = useState('');
  const [selected, setSelected] = useState('');

  const names = useMemo(
    () => rawNames.split(/\n|,/).map((name) => name.trim()).filter(Boolean),
    [rawNames]
  );

  const pick = () => {
    if (!names.length) return;
    setSelected(names[Math.floor(Math.random() * names.length)]);
  };

  return (
    <Screen scroll style={styles.page}>
      <View style={[styles.hero, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.icon, { backgroundColor: `${colors.primary}18` }]}>
          <Ionicons name="shuffle-outline" size={28} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>اختيار تلميذ عشوائي</Text>
        <Text style={[styles.caption, { color: colors.muted }]}>أدخل الأسماء كل اسم في سطر، ثم اضغط اختيار.</Text>
      </View>

      <TextInput
        value={rawNames}
        onChangeText={setRawNames}
        multiline
        placeholder={'مثال:\nأحمد\nسارة\nيوسف'}
        placeholderTextColor={colors.muted}
        textAlign="right"
        style={[styles.input, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border }]}
      />

      <Text style={[styles.count, { color: colors.muted }]}>عدد التلاميذ: {names.length}</Text>

      {selected ? (
        <View style={[styles.result, { backgroundColor: `${colors.primary}12`, borderColor: colors.primary }]}>
          <Text style={[styles.resultLabel, { color: colors.muted }]}>تم الاختيار</Text>
          <Text style={[styles.resultName, { color: colors.text }]}>{selected}</Text>
        </View>
      ) : null}

      <Pressable disabled={!names.length} onPress={pick} style={[styles.button, { backgroundColor: colors.primary, opacity: names.length ? 1 : 0.45 }]}>
        <Ionicons name="sparkles-outline" size={21} color="#0B1833" />
        <Text style={styles.buttonText}>اختيار الآن</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { gap: 18 },
  hero: { borderWidth: 1, borderRadius: 26, padding: 20, alignItems: 'flex-end', gap: 8 },
  icon: { width: 50, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 25, fontWeight: '900', textAlign: 'right' },
  caption: { lineHeight: 21, textAlign: 'right', writingDirection: 'rtl' },
  input: { minHeight: 210, borderWidth: 1, borderRadius: 22, padding: 18, fontSize: 17, lineHeight: 29, textAlignVertical: 'top' },
  count: { textAlign: 'right', fontWeight: '700' },
  result: { borderWidth: 1, borderRadius: 24, padding: 22, alignItems: 'center', gap: 8 },
  resultLabel: { fontSize: 13, fontWeight: '700' },
  resultName: { fontSize: 30, fontWeight: '900', textAlign: 'center' },
  button: { minHeight: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center', flexDirection: 'row-reverse', gap: 9 },
  buttonText: { color: '#0B1833', fontSize: 17, fontWeight: '900' }
});
