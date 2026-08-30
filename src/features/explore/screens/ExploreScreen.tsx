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
  { label: 'مشاكل وحلول', type: 'problem', icon: 'sparkles-outline' },
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
  const hasFilters = category.label !== 'الكل' || level !== 'الكل' || search.trim().length > 0;

  const resetFilters = () => {
    setCategory(categories[0]);
    setLevel('الكل');
    setSearch('');
  };

  return (
    <Screen scroll style={styles.page}>
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          <View style={styles.headerIcon}>
            <Ionicons name="compass" size={22} color="#0B1833" />
          </View>
          <Text style={styles.headerEyebrow}>مكتبة المعراج</Text>
        </View>
        <Text style={styles.title}>استكشف المحتوى</Text>
        <Text style={styles.subtitle}>ابحث بسرعة عن فيديو، فرض، نصيحة أو مورد يناسب مستواك.</Text>
      </View>

      <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}> 
        <Ionicons name="search-outline" size={20} color={colors.muted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="ابحث داخل مكتبة المعراج..."
          placeholderTextColor={colors.muted}
          style={[styles.searchInput, { color: colors.text }]}
          textAlign="right"
          selectionColor={colors.primary}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch('')} hitSlop={8}>
            <Ionicons name="close-circle" size={20} color={colors.muted} />
          </Pressable>
        )}
      </View>

      <View style={styles.filterHeader}>
        {hasFilters ? (
          <Pressable onPress={resetFilters} style={styles.resetRow}>
            <Text style={[styles.resetText, { color: colors.primary }]}>مسح الفلاتر</Text>
            <Ionicons name="refresh-outline" size={15} color={colors.primary} />
          </Pressable>
        ) : (
          <View />
        )}
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
                  opacity: pressed ? 0.86 : 1
                }
              ]}
            >
              <Ionicons name={item.icon} size={15} color={active ? '#0B1833' : colors.muted} />
              <Text style={[styles.chipText, { color: active ? '#0B1833' : colors.text }]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={[styles.filterTitle, { color: colors.text }]}>المستوى الدراسي</Text>
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
                  opacity: pressed ? 0.86 : 1
                }
              ]}
            >
              <Text style={[styles.levelText, { color: active ? '#0B1833' : colors.text }]}>{item}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.resultsHeader}>
        <View style={[styles.countBadge, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <Ionicons name="layers-outline" size={13} color={colors.muted} />
          <Text style={[styles.resultsCount, { color: colors.muted }]}>{content.data ? `${content.data.length} نتيجة` : '...'}</Text>
        </View>
        <View>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>المحتوى</Text>
          <Text style={[styles.sectionCaption, { color: colors.muted }]}>مرتّب من الأحدث إلى الأقدم</Text>
        </View>
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
            <Ionicons name="refresh-outline" size={17} color="#0B1833" />
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
  page: { gap: 19 },
  headerCard: { backgroundColor: '#0B1833', borderRadius: 28, padding: 21, gap: 10 },
  headerTop: { flexDirection: 'row-reverse', alignItems: 'center', gap: 9 },
  headerIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: '#D4AF37', alignItems: 'center', justifyContent: 'center' },
  headerEyebrow: { color: '#D4AF37', fontWeight: '900', fontSize: 12, letterSpacing: 0.4 },
  title: { fontSize: 29, lineHeight: 39, fontWeight: '900', textAlign: 'right', color: '#FFFFFF' },
  subtitle: { textAlign: 'right', writingDirection: 'rtl', lineHeight: 23, color: '#C6D0DE', fontSize: 14 },
  searchBox: { borderWidth: 1, borderRadius: 18, minHeight: 56, paddingHorizontal: 15, flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  searchInput: { flex: 1, fontSize: 15.5, paddingVertical: 0, writingDirection: 'rtl' },
  filterHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  filterTitle: { textAlign: 'right', fontSize: 17, fontWeight: '900' },
  resetRow: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  resetText: { fontWeight: '800', fontSize: 12 },
  chips: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 9, flexDirection: 'row-reverse', alignItems: 'center', gap: 5 },
  chipText: { fontWeight: '800', fontSize: 12.5 },
  levelChip: { borderWidth: 1, borderRadius: 13, minWidth: 62, alignItems: 'center', paddingHorizontal: 11, paddingVertical: 10 },
  levelText: { fontWeight: '900', fontSize: 13.5 },
  resultsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 4 },
  countBadge: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 5 },
  resultsCount: { fontSize: 11.5, fontWeight: '700' },
  sectionTitle: { fontSize: 24, fontWeight: '900', textAlign: 'right' },
  sectionCaption: { fontSize: 11.5, textAlign: 'right', marginTop: 2 },
  list: { gap: 13 },
  loadingBox: { minHeight: 70, alignItems: 'center', justifyContent: 'center', gap: 9 },
  stateCard: { borderWidth: 1, borderRadius: 22, padding: 22, gap: 8, alignItems: 'flex-end' },
  stateTitle: { textAlign: 'right', fontSize: 18, fontWeight: '900' },
  stateBody: { textAlign: 'right', writingDirection: 'rtl', lineHeight: 22 },
  retry: { borderRadius: 13, paddingHorizontal: 16, paddingVertical: 10, marginTop: 4, flexDirection: 'row-reverse', gap: 7, alignItems: 'center' },
  retryText: { color: '#0B1833', fontWeight: '900' }
});
