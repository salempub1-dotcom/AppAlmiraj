import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
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
  const row = isRTL ? 'row' : 'row-reverse';
  const text = language === 'ar' ? {
    title: 'أدوات تصنع الفرق', body: 'وسائل تعليمية مختارة بعناية لتجعل كل حصة أوضح وأسهل.',
    orders: 'طلباتي', cart: 'سلة الطلب', search: 'ابحث عن منتج أو مستوى...',
    products: 'اكتشف المجموعة', count: 'منتج', error: 'تعذر تحميل المنتجات', retry: 'إعادة المحاولة', empty: 'لا يوجد منتج مطابق'
  } : {
    title: 'Made for your classroom', body: 'Thoughtful teaching resources designed to make every lesson clearer and easier.',
    orders: 'My orders', cart: 'Cart', search: 'Search products or levels...',
    products: 'Explore the collection', count: 'products', error: 'Could not load products', retry: 'Try again', empty: 'No matching products'
  };
  const cart = useCart();
  const products = useProducts();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const value = search.trim().toLowerCase();
    if (!value) return products.data ?? [];
    return (products.data ?? []).filter((product) => [product.name, product.category, product.level].filter(Boolean).join(' ').toLowerCase().includes(value));
  }, [products.data, search]);

  return (
    <Screen scroll style={styles.page}>
      <View style={styles.hero}>
        <View style={[styles.topRow, { flexDirection: row }]}>
          <View style={styles.actions}>
            <Pressable accessibilityRole="button" accessibilityLabel={text.cart} onPress={() => navigation.navigate('Cart')} style={({ pressed }) => [styles.cartButton, pressed && styles.iconPressed]}>
              <Ionicons name="bag-handle-outline" size={20} color="#0B1833" />
              {cart.count > 0 && <Text style={styles.cartCount}>{cart.count}</Text>}
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel={text.orders} onPress={() => navigation.navigate('MyOrders')} style={({ pressed }) => [styles.ordersButton, pressed && styles.iconPressed]}>
              <Ionicons name="cube-outline" size={19} color="#D4AF37" />
            </Pressable>
          </View>
          <Text style={styles.eyebrow}>AL MIRAJ STORE</Text>
        </View>

        <View style={styles.heroCopy}>
          <Text style={[styles.heroTitle, { textAlign: align }]}>{text.title}</Text>
          <Text style={[styles.heroBody, { textAlign: align, writingDirection: isRTL ? 'rtl' : 'ltr' }]}>{text.body}</Text>
        </View>

        <Pressable onPress={() => navigation.navigate('MyOrders')} style={({ pressed }) => [styles.ordersLink, { alignSelf: isRTL ? 'flex-end' : 'flex-start', flexDirection: row }, pressed && styles.linkPressed]}>
          <Ionicons name={isRTL ? 'arrow-back' : 'arrow-forward'} size={15} color="#D4AF37" />
          <Text style={styles.ordersLinkText}>{text.orders}</Text>
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
      </View>

      <View style={[styles.sectionHeader, { flexDirection: row }]}>
        <Text style={[styles.count, { color: colors.muted }]}>{filtered.length} {text.count}</Text>
        <Text style={[styles.sectionTitle, { color: colors.text, textAlign: align }]}>{text.products}</Text>
      </View>

      {products.isLoading && <ActivityIndicator color={colors.primary} />}
      {products.isError && (
        <View style={[styles.stateCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.stateIcon, { backgroundColor: colors.surface }]}><Ionicons name="cloud-offline-outline" size={27} color={colors.primary} /></View>
          <Text style={[styles.stateTitle, { color: colors.text }]}>{text.error}</Text>
          <Pressable onPress={() => products.refetch()} style={({ pressed }) => [styles.retry, { backgroundColor: colors.primary }, pressed && styles.linkPressed]}><Text style={styles.retryText}>{text.retry}</Text></Pressable>
        </View>
      )}

      {!products.isLoading && !products.isError && filtered.length === 0 && (
        <View style={[styles.stateCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.stateIcon, { backgroundColor: colors.surface }]}><Ionicons name="search-outline" size={27} color={colors.primary} /></View>
          <Text style={[styles.stateTitle, { color: colors.text }]}>{text.empty}</Text>
        </View>
      )}

      <View style={[styles.grid, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        {filtered.map((product) => <ProductCard key={product.id} product={product} onPress={() => navigation.navigate('ProductDetail', { productId: product.id })} />)}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { gap: 16 },
  hero: { backgroundColor: '#132443', borderRadius: ui.radius.xl, padding: 20, gap: 14, ...softShadow },
  topRow: { justifyContent: 'space-between', alignItems: 'center' },
  heroCopy: { gap: 6 },
  eyebrow: { color: '#D4AF37', fontSize: 11, fontWeight: '900', letterSpacing: 1.1 },
  heroTitle: { color: '#FFFFFF', fontSize: 27, lineHeight: 36, fontWeight: '900' },
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
  sectionHeader: { justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 2 },
  sectionTitle: { fontSize: 20, fontWeight: '900', flexShrink: 1 },
  count: { fontSize: 12, fontWeight: '700' },
  grid: { flexWrap: 'wrap', rowGap: 14, justifyContent: 'space-between' },
  stateCard: { borderWidth: 1, borderRadius: ui.radius.lg, padding: 22, gap: 10, alignItems: 'center' },
  stateIcon: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  stateTitle: { fontWeight: '900', fontSize: 16 },
  retry: { borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10 },
  retryText: { color: '#0B1833', fontWeight: '900' }
});
