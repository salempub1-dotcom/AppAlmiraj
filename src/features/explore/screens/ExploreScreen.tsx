import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { ContentCard } from '../../../components/ContentCard';
import { Screen } from '../../../components/Screen';
import { useTheme } from '../../../context/ThemeProvider';
import { useExploreContent } from '../../../hooks/useContent';
import type { PostType } from '../../../repositories/contentRepository';

type Category = {
  label: string;
  type?: PostType;
};

const categories: Category[] = [
  { label: 'الكل' },
  { label: 'فيديوهات', type: 'video' },
  { label: 'فروض', type: 'test' },
  { label: 'اختبارات', type: 'exam' },
  { label: 'مشاكل وحلول', type: 'problem' },
  { label: 'نصائح', type: 'teacher_tip' },
  { label: 'مقالات', type: 'article' },
  { label: 'مستجدات', type: 'announcement' }
];

const levels = ['الكل', '3PS', '4PS', '5PS', '1MS', '2MS', '3MS', '4MS'];

export function ExploreScreen() {
  const { colors } = useTheme();
  const [category, setCategory] = useState<Category>(categories[0]);
  const [level, setLevel] = useState('الكل');
  const [search, setSearch] = useState('');

  const filters = useMemo(
    () => ({
      postType: category.type,
      level: level === 'الكل' ? undefined : level,
      search
    }),
    [category.type, level, search]
  );

  const content = useExploreContent(filters);

  return (
    <Screen scroll style={styles.page}>
      <Text style={[styles.title, { color: colors.text }]}>استكشف</Text>
      <Text style={[styles.subtitle, { color: colors.muted }]}>محتوى عملي للأستاذ، منظم حسب ما تحتاجه.</Text>

      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="ابحث عن فيديو، فرض، نصيحة..."
        placeholderTextColor={colors.muted}
        style={[
          styles.search,
          {
            color: colors.text,
            backgroundColor: colors.card,
            borderColor: colors.border
          }
        ]}
        textAlign="right"
      />

      <Text style={[styles.filterTitle, { color: colors.text }]}>نوع المحتوى</Text>
      <View style={styles.chips}>
        {categories.map((item) => {
          const active = item.label === category.label;
          return (
            <Pressable
              key={item.label}
              onPress={() => setCategory(item)}
              style={[
                styles.chip,
                {
                  backgroundColor: active ? colors.primary : colors.card,
                  borderColor: active ? colors.primary : colors.border
                }
              ]}
            >
              <Text style={{ color: active ? '#17130C' : colors.text, fontWeight: '700' }}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={[styles.filterTitle, { color: colors.text }]}>المستوى</Text>
      <View style={styles.chips}>
        {levels.map((item) => {
          const active = item === level;
          return (
            <Pressable
              key={item}
              onPress={() => setLevel(item)}
              style={[
                styles.levelChip,
                {
                  backgroundColor: active ? colors.primary : colors.card,
                  borderColor: active ? colors.primary : colors.border
                }
              ]}
            >
              <Text style={{ color: active ? '#17130C' : colors.text, fontWeight: '700' }}>{item}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.resultsHeader}>
        <Text style={[styles.resultsCount, { color: colors.muted }]}>
          {content.data ? `${content.data.length} نتيجة` : ''}
        </Text>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>المحتوى</Text>
      </View>

      {content.isLoading && <ActivityIndicator color={colors.primary} />}

      {content.isError && (
        <View style={[styles.stateCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.stateTitle, { color: colors.text }]}>تعذر تحميل المحتوى</Text>
          <Text style={[styles.stateBody, { color: colors.muted }]}>تحقق من الاتصال ثم حاول مرة أخرى.</Text>
          <Pressable onPress={() => content.refetch()} style={[styles.retry, { backgroundColor: colors.primary }]}>
            <Text style={styles.retryText}>إعادة المحاولة</Text>
          </Pressable>
        </View>
      )}

      {!content.isLoading && !content.isError && content.data?.length === 0 && (
        <View style={[styles.stateCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.stateTitle, { color: colors.text }]}>لا يوجد محتوى مطابق الآن</Text>
          <Text style={[styles.stateBody, { color: colors.muted }]}>جرّب تغيير الفئة أو المستوى أو كلمة البحث.</Text>
        </View>
      )}

      <View style={styles.list}>
        {content.data?.map((post) => <ContentCard key={post.id} post={post} />)}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { gap: 14 },
  title: { fontSize: 32, fontWeight: '900', textAlign: 'right' },
  subtitle: { textAlign: 'right', lineHeight: 22 },
  search: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, minHeight: 52, fontSize: 16 },
  filterTitle: { textAlign: 'right', fontSize: 16, fontWeight: '800', marginTop: 4 },
  chips: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10 },
  levelChip: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9 },
  resultsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  resultsCount: { fontSize: 12 },
  sectionTitle: { fontSize: 22, fontWeight: '900', textAlign: 'right' },
  list: { gap: 12 },
  stateCard: { borderWidth: 1, borderRadius: 18, padding: 20, gap: 8 },
  stateTitle: { textAlign: 'right', fontSize: 18, fontWeight: '800' },
  stateBody: { textAlign: 'right', lineHeight: 22 },
  retry: { alignSelf: 'flex-end', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, marginTop: 4 },
  retryText: { color: '#17130C', fontWeight: '800' }
});
