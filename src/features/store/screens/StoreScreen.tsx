import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { ProductCard } from '../../../components/ProductCard';
import { Screen } from '../../../components/Screen';
import { useCart } from '../../../context/CartProvider';
import { useLanguage } from '../../../context/LanguageProvider';
import { useTheme } from '../../../context/ThemeProvider';
import { useProducts } from '../../../hooks/useProducts';
import { softShadow, ui } from '../../../theme/ui';

export function StoreScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { language, isRTL } = useLanguage();
  const align = isRTL ? 'right' : 'left';
  const text = language === 'ar'
    ? {
        eyebrow: 'متجر المعراج',
        title: 'أدوات تصنع الفرق',
        body: 'وسائل تعليمية مختارة بعناية لتجعل كل حصة أوضح وأسهل.',
        orders: 'طلباتي',
        cart: 'سلة الطلب',
        search: 'ابحث عن منتج أو مستوى...',
        products: 'اكتشف المجموعة',
        count: 'منتج',
        all: 'الكل',
        error: 'تعذر تحميل المنتجات',
        retry: 'إعادة المحاولة',
        empty: 'لا يوجد منتج مطابق'
      }
    : {
        eyebrow: 'AL MIRAJ STORE',
        title: 'Made for your classroom',
        body: 'Thoughtful teaching resources designed to make every lesson clearer and easier.',
        orders: 'My orders',
        cart: 'Cart',
        search: 'Search products or levels...',
        products: 'Explore the collection',
        count: 'products',
        all: 'All',
        error: 'Could not load products',
        retry: 'Try again',
        empty: 'No matching products'
      };

  const cart = useCart();
  const products = useProducts();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const categories = useMemo(() => {
    const values = (products.data ?? [])
      .map((product) => product.category?.trim())
      .filter((value): value is string => Boolean(value));
    return [...new Set(values)].slice(0, 8);
  }, [products.data]);

  const filtered = useMemo(() => {
    const value = search.trim().toLowerCase();
    return (products.data ?? []).filter((product) => {
      const matchesSearch = !value || [product.name, product.category, product.level]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(value);
      const matchesCategory = activeCategory === 'all' || product.category?.trim() === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products.data, search, activeCategory]);

  return (
    <Screen scroll style={styles.page}>
      <View style={styles.hero}>
        <View style={[styles.topRow, { flexDirection: 'row' }]}>
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={text.cart}
              onPress={() => navigation.navigate('Cart')}
              style={({ pressed }) => [styles.cartButton, pressed && styles.iconPressed]}
            >
              <Ionicons name="bag-handle-outline" size={20} color="#0B1833" />
              {cart.count > 0 && <Text style={styles.cartCount}>{cart.count}</Text>}
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={text.orders}
              onPress={() => navigation.navigate('MyOrders')}
              style={({ pressed }) => [styles.ordersButton, pressed && styles.iconPressed]}
            >
              <Ionicons name="cube-outline" size={19} color="#D4AF37" />
            </Pressable>
          </View>

          <View style={[styles.brandLockup, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
            <View style={styles.brandMark}>
              <Ionicons name="school-outline" size={17} color="#0B1833" />
            </View>
            <Text style={styles.eyebrow}>{text.eyebrow}</Text>
          </View>
        </View>

        <View style={styles.heroCopy}>
          <Text style={[styles.heroTitle, { textAlign: align }]}>{text.title}</Text>
          <View style={[styles.goldLine, { alignSelf: isRTL ? 'flex-end' : 'flex-start' }]} />
          <Text style={[styles.heroBody, { textAlign: align, writingDirection: isRTL ? 'rtl' : 'ltr' }]}>{text.body}</Text>
        </View>

        <Pressable
          onPress={() => navigation.navigate('MyOrders')}
          style={({ pressed }) => [
            styles.ordersLink,
            { alignSelf: isRTL ? 'flex-end' : 'flex-start', flexDirection: isRTL ? 'row-reverse' : 'row' },
            pressed && styles.linkPressed
          ]}
        >
          <Text style={styles.ordersLinkText}>{text.orders}</Text>
          <Ionicons name={isRTL ? 'arrow-back' : 'arrow-forward'} size={15} color="#D4AF37" />
        </Pressable>
      </View>

      <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <Ionicons name="search-outline" size={19} color={colors.muted} />
        <TextInput
          accessibilityLabel={text.search}
          value={search}
          onChangeText={setSearch}
          placeholder={text.search}
          placeholderTextColor={colors.muted}
          selectionColor={colors.primary}
          style={[styles.searchInput, { color: colors.text, writingDirection: isRTL ? 'rtl' : 'ltr' }]}
          textAlign={align}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch('')} hitSlop={8}>
            <Ionicons name="close-circle" size={19} color={colors.muted} />
          </Pressable>
        )}
      </View>

      {categories.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.categoryRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
        >
          {['all', ...categories].map((category) => {
            const active = activeCategory === category;
            return (
              <Pressable
                key={category}
                onPress={() => setActiveCategory(category)}
                style={({ pressed }) => [
                  styles.categoryChip,
                  {
                    backgroundColor: active ? '#0B1833' : colors.card,
                    borderColor: active ? '#0B1833' : colors.border,
                    opacity: pressed ? 0.78 : 1
                  }
                ]}
              >
                <Text style={[styles.categoryText, { color: active ? '#FFFFFF' : colors.text }]}>
                  {category === 'all' ? text.all : category}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      <View style={[styles.sectionHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <View>
          <Text style={[styles.sectionTitle, { color: colors.text, textAlign: align }]}>{text.products}</Text>
          <View style={[styles.sectionAccent, { alignSelf: isRTL ? 'flex-end' : 'flex-start' }]} />
        </View>
        <View style={[styles.countPill, { backgroundColor: colors.surface }]}>
          <Text style={[styles.count, { color: colors.muted }]}>{filtered.length} {text.count}</Text>
        </View>
      </View>

      {products.isLoading && <ActivityIndicator color={colors.primary} />}

      {products.isError && (
        <View style={[styles.stateCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.stateIcon, { backgroundColor: colors.surface }]}>
            <Ionicons name="cloud-offline-outline" size={27} color={colors.primary} />
          </View>
          <Text style={[styles.stateTitle, { color: colors.text }]}>{text.error}</Text>
          <Pressable
            onPress={() => products.refetch()}
            style={({ pressed }) => [styles.retry, pressed && styles.linkPressed]}
          >
            <Text style={styles.retryText}>{text.retry}</Text>
          </Pressable>
        </View>
      )}

      {!products.isLoading && !products.isError && filtered.length === 0 && (
        <View style={[styles.stateCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.stateIcon, { backgroundColor: colors.surface }]}>
            <Ionicons name="search-outline" size={27} color={colors.primary} />
          </View>
          <Text style={[styles.stateTitle, { color: colors.text }]}>{text.empty}</Text>
        </View>
      )}

      <View style={[styles.grid, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        {filtered.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onPress={() => navigation.navigate('ProductDetail', { productId: product.id })}
          />
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { gap: 16 },
  hero: { backgroundColor: '#132443', borderRadius: ui.radius.xl, padding: 20, gap: 15, ...softShadow },
  topRow: { justifyContent: 'space-between', alignItems: 'center' },
  brandLockup: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  brandMark: { width: 32, height: 32, borderRadius: 11, backgroundColor: '#D4AF37', alignItems: 'center', justifyContent: 'center' },
  heroCopy: { gap: 7 },
  eyebrow: { color: '#D4AF37', fontSize: 11, fontWeight: '900', letterSpacing: 0.8 },
  heroTitle: { color: '#FFFFFF', fontSize: 28, lineHeight: 37, fontWeight: '900' },
  goldLine: { width: 44, height: 3, borderRadius: 99, backgroundColor: '#D4AF37' },
  heroBody: { color: '#C7D0DD', lineHeight: 22, fontSize: 14 },
  actions: { flexDirection: 'row', gap: 8 },
  cartButton: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#D4AF37', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  ordersButton: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(212,175,55,0.28)', alignItems: 'center', justifyContent: 'center' },
  iconPressed: { transform: [{ scale: 0.96 }], opacity: 0.88 },
  cartCount: { position: 'absolute', top: -5, left: -5, minWidth: 20, height: 20, borderRadius: 99, backgroundColor: '#FFFFFF', color: '#0B1833', textAlign: 'center', fontWeight: '900', fontSize: 10.5, lineHeight: 20 },
  ordersLink: { gap: 7, alignItems: 'center', minHeight: 40, paddingHorizontal: 13, borderRadius: 12, backgroundColor: '#233756' },
  ordersLinkText: { color: '#D4AF37', fontWeight: '900', fontSize: 12 },
  linkPressed: { opacity: 0.82, transform: [{ scale: 0.985 }] },
  searchBox: { borderWidth: 1, borderRadius: ui.radius.md, minHeight: ui.controlHeight, paddingHorizontal: 14, alignItems: 'center', gap: 9 },
  searchInput: { flex: 1, fontSize: 15 },
  categoryRow: { gap: 8, paddingHorizontal: 1 },
  categoryChip: { minHeight: 38, borderRadius: 999, borderWidth: 1, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
  categoryText: { fontSize: 12, fontWeight: '800' },
  sectionHeader: { justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 2, marginTop: 2 },
  sectionTitle: { fontSize: 21, fontWeight: '900', flexShrink: 1 },
  sectionAccent: { width: 30, height: 3, borderRadius: 99, backgroundColor: '#D4AF37', marginTop: 5 },
  countPill: { minHeight: 32, borderRadius: 999, paddingHorizontal: 11, alignItems: 'center', justifyContent: 'center' },
  count: { fontSize: 11.5, fontWeight: '800' },
  grid: { flexWrap: 'wrap', rowGap: 14, justifyContent: 'space-between' },
  stateCard: { borderWidth: 1, borderRadius: ui.radius.lg, padding: 22, gap: 10, alignItems: 'center' },
  stateIcon: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  stateTitle: { fontWeight: '900', fontSize: 16, textAlign: 'center' },
  retry: { borderRadius: 12, paddingHorizontal: 18, paddingVertical: 11, backgroundColor: '#D4AF37' },
  retryText: { color: '#0B1833', fontWeight: '900' }
});
