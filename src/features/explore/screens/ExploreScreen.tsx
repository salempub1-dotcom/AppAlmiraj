import { Ionicons } from '@expo/vector-icons';
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
  icon: keyof typeof Ionicons.glyphMap;
};

const categories: Category[] = [
  { label: 'الكل', icon: 'apps-outline' },
  { label: 'فيديوهات', type: 'video', icon: 'play-circle-outline' },
  { label: 'فروض', type: 'test', icon: 'clipboard-outline' },
  { label: 'اختبارات', type: 'exam', icon: 'school-outline' },
  { label: 'مشاكل وحلول', type: 'problem', icon: 'help-buoy-outline' },
  { label: 'نصائح', type: 'teacher_tip', icon: 'bulb-outline' },
  { label: 'مقالات', type: 'article', icon: 'document-text-outline' },
  { label: 'مستجدات', type: 'announcement', icon: 'megaphone-outline' }
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
      <View style={styles.headerCopy}>
        <View style={[styles.headerIcon, { backgroundColor: `${colors.primary}18` }]}> 
          <Ionicons name="compass-outline" size={24} color={colors.primary} />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: colors.text }]}>استكشف</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>محتوى عملي للأستاذ، منظم حسب ما تحتاجه.</Text>
        </View>
      </View>

      <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}> 
        <Ionicons name="search-outline" size={20} color={colors.muted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="ابحث عن فيديو، فرض، نصيحة..."
          placeholderTextColor={colors.muted}
          style={[styles.searchInput, { color: colors.text }]}
          textAlign="right"
          selectionColor={colors.primary}
        />
      </View>

      <View style={styles.filterHeadingRow}>
        <Ionicons name="options-outline" size={18} color={colors.primary} />
        <Text style={[styles.filterTitle, { color: colors.text }]}>نوع المحتوى</Text>
      </View>
      <View style={styles.chips}>
        {categories.map((item) => {
          const active = item.label === category.label;
          return (
            <Pressable
              key={item.label}
              onPress={() => setCategory(item)}
              style={({ pressed }) => [
                styles.chip,
                {
                  backgroundColor: active ? colors.primary : colors.card,
                  borderColor: active ? colors.primary : colors.border,
                  opacity: pressed ? 0.85 : 1
                }
              ]}
            >
              <Ionicons name={item.icon} size={16} color={active ? '#17130C' : colors.muted} />
              <Text style={[styles.chipText, { color: active ? '#17130C' : colors.text }]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={[styles.filterTitleStandalone, { color: colors.text }]}>المستوى</Text>
      <View style={styles.chips}>
        {levels.map((item) => {
          const active = item === level;
          return (
            <Pressable
              key={item}
              onPress={() => setLevel(item)}
              style={({ pressed }) => [
                styles.levelChip,
                {
                  backgroundColor: active ? colors.primary : colors.card,
                  borderColor: active ? colors.primary : colors.border,
                  opacity: pressed ? 0.85 : 1
                }
              ]}
            >
              <Text style={[styles.levelText, { color: active ? '#17130C' : colors.text }]}>{item}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.resultsHeader}>
        <View style={[styles.countBadge, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <Text style={[styles.resultsCount, { color: colors.muted }]}>{content.data ? `${content.data.length} نتيجة` : '...'}</Text>
        </View>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>المحتوى</Text>
      </View>

      {content.isLoading && (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={colors.primary} size="small" />
          <Text style={{ color: colors.muted }}>جاري تحميل المحتوى...</Text>
        </View>
      )}

      {content.isError && (
        <View style={[styles.stateCard, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <Ionicons name="cloud-offline-outline" size={34} color={colors.primary} />
          <Text style={[styles.stateTitle, { color: colors.text }]}>تعذر تحميل المحتوى</Text>
          <Text style={[styles.stateBody, { color: colors.muted }]}>تحقق من الاتصال ثم حاول مرة أخرى.</Text>
          <Pressable onPress={() => content.refetch()} style={[styles.retry, { backgroundColor: colors.primary }]}> 
            <Ionicons name="refresh-outline" size={17} color="#17130C" />
            <Text style={styles.retryText}>إعادة المحاولة</Text>
          </Pressable>
        </View>
      )}

      {!content.isLoading && !content.isError && content.data?.length === 0 && (
        <View style={[styles.stateCard, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <Ionicons name="search-outline" size={34} color={colors.primary} />
          <Text style={[styles.stateTitle, { color: colors.text }]}>لا يوجد محتوى مطابق الآن</Text>
          <Text style={[styles.stateBody, { color: colors.muted }]}>جرّب تغيير الفئة أو المستوى أو كلمة البحث.</Text>
        </View>
      )}

      <View style={styles.list}>{content.data?.map((post) => <ContentCard key={post.id} post={post} />)}</View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { gap: 18 },
  headerCopy: { flexDirection: 'row-reverse', gap: 12, alignItems: 'center' },
  headerIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1, gap: 3 },
  title: { fontSize: 32, lineHeight: 40, fontWeight: '900', textAlign: 'right' },
  subtitle: { textAlign: 'right', writingDirection: 'rtl', lineHeight: 22 },
  searchBox: { borderWidth: 1, borderRadius: 18, minHeight: 56, paddingHorizontal: 15, flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  searchInput: { flex: 1, fontSize: 16, paddingVertical: 0, writingDirection: 'rtl' },
  filterHeadingRow: { flexDirection: 'row-reverse', gap: 7, alignItems: 'center', alignSelf: 'flex-end' },
  filterTitle: { textAlign: 'right', fontSize: 17, fontWeight: '900' },
  filterTitleStandalone: { textAlign: 'right', fontSize: 17, fontWeight: '900', marginTop: 2 },
  chips: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 13, paddingVertical: 10, flexDirection: 'row-reverse', alignItems: 'center', gap: 6 },
  chipText: { fontWeight: '800', fontSize: 13 },
  levelChip: { borderWidth: 1, borderRadius: 13, minWidth: 66, alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10 },
  levelText: { fontWeight: '900', fontSize: 14 },
  resultsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 5 },
  countBadge: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  resultsCount: { fontSize: 12, fontWeight: '700' },
  sectionTitle: { fontSize: 25, fontWeight: '900', textAlign: 'right' },
  list: { gap: 13 },
  loadingBox: { minHeight: 70, alignItems: 'center', justifyContent: 'center', gap: 9 },
  stateCard: { borderWidth: 1, borderRadius: 22, padding: 22, gap: 8, alignItems: 'flex-end' },
  stateTitle: { textAlign: 'right', fontSize: 18, fontWeight: '900' },
  stateBody: { textAlign: 'right', writingDirection: 'rtl', lineHeight: 22 },
  retry: { borderRadius: 13, paddingHorizontal: 16, paddingVertical: 10, marginTop: 4, flexDirection: 'row-reverse', gap: 7, alignItems: 'center' },
  retryText: { color: '#17130C', fontWeight: '900' }
});
