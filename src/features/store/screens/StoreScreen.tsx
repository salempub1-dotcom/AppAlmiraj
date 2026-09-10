import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { ProductCard } from '../../../components/ProductCard';
import { Screen } from '../../../components/Screen';
import { useCart } from '../../../context/CartProvider';
import { useTheme } from '../../../context/ThemeProvider';
import { useLanguage } from '../../../context/LanguageProvider';
import { useProducts } from '../../../hooks/useProducts';

export function StoreScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { language, isRTL } = useLanguage();
  const align = isRTL ? 'right' : 'left';
  const row = isRTL ? 'row' : 'row-reverse';
  const text = language === 'ar' ? {
    title: 'أدوات تصنع الفرق', body: 'وسائل تعليمية تلهمك وتُثري كل حصة.',
    orders: 'طلباتي', cart: 'سلة الطلب', search: 'ابحث عن منتج أو مستوى...',
    products: 'اكتشف المجموعة', count: 'منتج', error: 'تعذر تحميل المنتجات', retry: 'إعادة المحاولة', empty: 'لا يوجد منتج مطابق'
  } : {
    title: 'Made for your classroom', body: 'Thoughtful teaching resources for inspiring lessons.',
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
            <Pressable accessibilityRole="button" accessibilityLabel={text.cart} onPress={() => navigation.navigate('Cart')} style={styles.cartButton}>
              <Ionicons name="bag-handle-outline" size={21} color="#0B1833" />
              {cart.count > 0 && <Text style={styles.cartCount}>{cart.count}</Text>}
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel={text.orders} onPress={() => navigation.navigate('MyOrders')} style={styles.ordersButton}>
              <Ionicons name="cube-outline" size={20} color="#D4AF37" />
            </Pressable>
          </View>
          <View style={[styles.heroCopy, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
            <Text style={styles.eyebrow}>AL MIRAJ STORE</Text>
          </View>
        </View>
        <Text style={[styles.heroTitle, { textAlign: align }]}>{text.title}</Text>
        <Text style={[styles.heroBody, { textAlign: align, writingDirection: isRTL ? 'rtl' : 'ltr' }]}>{text.body}</Text>
        <Pressable onPress={() => navigation.navigate('MyOrders')} style={[styles.ordersLink, { alignSelf: isRTL ? 'flex-end' : 'flex-start', flexDirection: row }]}>
          <Ionicons name={isRTL ? 'arrow-back' : 'arrow-forward'} size={16} color="#D4AF37" />
          <Text style={styles.ordersLinkText}>{text.orders}</Text>
        </Pressable>
      </View>

      <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <Ionicons name="search-outline" size={20} color={colors.muted} />
        <TextInput accessibilityLabel={text.search} value={search} onChangeText={setSearch} placeholder={text.search} placeholderTextColor={colors.muted} style={[styles.searchInput, { color: colors.text, writingDirection: isRTL ? 'rtl' : 'ltr' }]} textAlign={align} />
      </View>

      <View style={[styles.sectionHeader, { flexDirection: row }]}>
        <Text style={[styles.count, { color: colors.muted }]}>{filtered.length} {text.count}</Text>
        <Text style={[styles.sectionTitle, { color: colors.text, textAlign: align }]}>{text.products}</Text>
      </View>

      {products.isLoading && <ActivityIndicator color={colors.primary} />}
      {products.isError && (
        <View style={[styles.stateCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="cloud-offline-outline" size={30} color={colors.primary} />
          <Text style={[styles.stateTitle, { color: colors.text }]}>{text.error}</Text>
          <Pressable onPress={() => products.refetch()} style={[styles.retry, { backgroundColor: colors.primary }]}><Text style={styles.retryText}>{text.retry}</Text></Pressable>
        </View>
      )}

      {!products.isLoading && !products.isError && filtered.length === 0 && (
        <View style={[styles.stateCard, { backgroundColor: colors.card, borderColor: colors.border }]}><Ionicons name="search-outline" size={30} color={colors.primary} /><Text style={[styles.stateTitle, { color: colors.text }]}>{text.empty}</Text></View>
      )}

      <View style={[styles.grid, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>{filtered.map((product) => <ProductCard key={product.id} product={product} onPress={() => navigation.navigate('ProductDetail', { productId: product.id })} />)}</View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { gap: 18 },
  hero: { backgroundColor: '#132443', borderRadius: 28, padding: 22, gap: 12 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroCopy: { alignItems: 'flex-end', gap: 3 },
  eyebrow: { color: '#D4AF37', fontSize: 11.5, fontWeight: '900', letterSpacing: 1 },
  heroTitle: { color: '#FFFFFF', fontSize: 28, lineHeight: 38, fontWeight: '800', textAlign: 'right' },
  heroBody: { color: '#C6D0DE', textAlign: 'right', writingDirection: 'rtl', lineHeight: 23 },
  actions: { flexDirection: 'row', gap: 8 },
  cartButton: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#D4AF37', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  ordersButton: { width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(212,175,55,0.35)', alignItems: 'center', justifyContent: 'center' },
  cartCount: { position: 'absolute', top: -5, left: -5, minWidth: 21, height: 21, borderRadius: 99, backgroundColor: '#FFFFFF', color: '#0B1833', textAlign: 'center', fontWeight: '900', fontSize: 11, lineHeight: 21 },
  ordersLink: { alignSelf: 'flex-end', flexDirection: 'row', gap: 8, alignItems: 'center', minHeight: 44, paddingHorizontal: 14, borderRadius: 14, backgroundColor: '#233756' },
  ordersLinkText: { color: '#D4AF37', fontWeight: '900', fontSize: 12 },
  searchBox: { borderWidth: 1, borderRadius: 18, minHeight: 54, paddingHorizontal: 14, flexDirection: 'row-reverse', alignItems: 'center', gap: 9 },
  searchInput: { flex: 1, fontSize: 15.5, writingDirection: 'rtl' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 21, fontWeight: '800', textAlign: 'right', flexShrink: 1 },
  count: { fontSize: 12, fontWeight: '700' },
  grid: { flexDirection: 'row-reverse', flexWrap: 'wrap', rowGap: 14, justifyContent: 'space-between' },
  stateCard: { borderWidth: 1, borderRadius: 22, padding: 22, gap: 10, alignItems: 'center' },
  stateTitle: { fontWeight: '900', fontSize: 17 },
  retry: { borderRadius: 13, paddingHorizontal: 16, paddingVertical: 10 },
  retryText: { color: '#0B1833', fontWeight: '900' }
});
