import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { ProductCard } from '../../../components/ProductCard';
import { Screen } from '../../../components/Screen';
import { useCart } from '../../../context/CartProvider';
import { useTheme } from '../../../context/ThemeProvider';
import { useProducts } from '../../../hooks/useProducts';

export function StoreScreen({ navigation }: any) {
  const { colors } = useTheme();
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
        <View style={styles.topRow}>
          <Pressable onPress={() => navigation.navigate('Cart')} style={styles.cartButton}>
            <Ionicons name="bag-handle-outline" size={21} color="#0B1833" />
            {cart.count > 0 && <Text style={styles.cartCount}>{cart.count}</Text>}
          </Pressable>
          <View style={styles.heroCopy}>
            <Text style={styles.eyebrow}>AL MIRAJ STORE</Text>
            <Text style={styles.heroTitle}>متجر المعراج</Text>
          </View>
        </View>
        <Text style={styles.heroBody}>منتجات تعليمية مختارة للأستاذ، بنفس قاعدة بيانات متجر المعراج.</Text>
      </View>

      <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}> 
        <Ionicons name="search-outline" size={20} color={colors.muted} />
        <TextInput value={search} onChangeText={setSearch} placeholder="ابحث عن منتج أو مستوى..." placeholderTextColor={colors.muted} style={[styles.searchInput, { color: colors.text }]} textAlign="right" />
      </View>

      <View style={styles.sectionHeader}>
        <Text style={[styles.count, { color: colors.muted }]}>{filtered.length} منتج</Text>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>المنتجات</Text>
      </View>

      {products.isLoading && <ActivityIndicator color={colors.primary} />}
      {products.isError && (
        <View style={[styles.stateCard, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <Ionicons name="cloud-offline-outline" size={30} color={colors.primary} />
          <Text style={[styles.stateTitle, { color: colors.text }]}>تعذر تحميل المنتجات</Text>
          <Pressable onPress={() => products.refetch()} style={[styles.retry, { backgroundColor: colors.primary }]}> 
            <Text style={styles.retryText}>إعادة المحاولة</Text>
          </Pressable>
        </View>
      )}

      {!products.isLoading && !products.isError && filtered.length === 0 && (
        <View style={[styles.stateCard, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <Ionicons name="search-outline" size={30} color={colors.primary} />
          <Text style={[styles.stateTitle, { color: colors.text }]}>لا يوجد منتج مطابق</Text>
        </View>
      )}

      <View style={styles.grid}>
        {filtered.map((product) => <ProductCard key={product.id} product={product} onPress={() => navigation.navigate('ProductDetail', { productId: product.id })} />)}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { gap: 18 },
  hero: { backgroundColor: '#0B1833', borderRadius: 30, padding: 22, gap: 12 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroCopy: { alignItems: 'flex-end', gap: 3 },
  eyebrow: { color: '#D4AF37', fontSize: 11.5, fontWeight: '900', letterSpacing: 1 },
  heroTitle: { color: '#FFFFFF', fontSize: 31, fontWeight: '900', textAlign: 'right' },
  heroBody: { color: '#C6D0DE', textAlign: 'right', writingDirection: 'rtl', lineHeight: 23 },
  cartButton: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#D4AF37', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  cartCount: { position: 'absolute', top: -5, left: -5, minWidth: 21, height: 21, borderRadius: 99, backgroundColor: '#FFFFFF', color: '#0B1833', textAlign: 'center', fontWeight: '900', fontSize: 11, lineHeight: 21 },
  searchBox: { borderWidth: 1, borderRadius: 18, minHeight: 54, paddingHorizontal: 14, flexDirection: 'row-reverse', alignItems: 'center', gap: 9 },
  searchInput: { flex: 1, fontSize: 15.5, writingDirection: 'rtl' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 24, fontWeight: '900', textAlign: 'right' },
  count: { fontSize: 12, fontWeight: '700' },
  grid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 12 },
  stateCard: { borderWidth: 1, borderRadius: 22, padding: 22, gap: 10, alignItems: 'center' },
  stateTitle: { fontWeight: '900', fontSize: 17 },
  retry: { borderRadius: 13, paddingHorizontal: 16, paddingVertical: 10 },
  retryText: { color: '#0B1833', fontWeight: '900' }
});
