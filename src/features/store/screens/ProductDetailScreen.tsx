import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../../components/Screen';
import { useCart } from '../../../context/CartProvider';
import { useTheme } from '../../../context/ThemeProvider';
import { useProductDetail } from '../../../hooks/useProducts';

export function ProductDetailScreen({ route, navigation }: any) {
  const { colors } = useTheme();
  const cart = useCart();
  const productId = Number(route.params?.productId);
  const productQuery = useProductDetail(productId);

  if (productQuery.isLoading) return <Screen style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></Screen>;

  if (productQuery.isError || !productQuery.data) {
    return <Screen style={styles.center}><Ionicons name="alert-circle-outline" size={36} color={colors.primary} /><Text style={[styles.errorTitle, { color: colors.text }]}>تعذر فتح المنتج</Text></Screen>;
  }

  const product = productQuery.data;
  const images = product.images ?? [];

  return (
    <Screen scroll style={styles.page}>
      <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={styles.gallery} contentContainerStyle={styles.galleryContent}>
        {(images.length ? images : ['']).map((uri, index) => (
          <View key={`${uri}-${index}`} style={[styles.imageWrap, { backgroundColor: colors.surface }]}> 
            {uri ? <Image source={{ uri }} style={styles.image} resizeMode="cover" /> : <Ionicons name="image-outline" size={42} color={colors.muted} />}
          </View>
        ))}
      </ScrollView>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
        <View style={styles.badgeRow}>
          {!!product.badge && <Text style={[styles.badge, { backgroundColor: colors.primary, color: colors.onPrimary }]}>{product.badge.trim()}</Text>}
          {!!product.level && <Text style={[styles.level, { color: colors.primary, borderColor: colors.primary }]}>{product.level}</Text>}
        </View>
        <Text style={[styles.title, { color: colors.text }]}>{product.name.trim()}</Text>
        <Text style={[styles.price, { color: colors.text }]}>{product.price.toLocaleString('fr-DZ')} دج</Text>
        {!!product.description && <Text style={[styles.description, { color: colors.muted }]}>{product.description}</Text>}
      </View>

      {!!product.benefits?.length && (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <Text style={[styles.sectionTitle, { color: colors.text }]}>المميزات</Text>
          {product.benefits.map((item, index) => (
            <View key={`${item}-${index}`} style={styles.pointRow}><Ionicons name="checkmark-circle" size={19} color={colors.primary} /><Text style={[styles.point, { color: colors.text }]}>{item}</Text></View>
          ))}
        </View>
      )}

      <Pressable onPress={() => { cart.add(product); navigation.navigate('Cart'); }} style={[styles.cta, { backgroundColor: colors.primary }]}> 
        <Ionicons name="bag-add-outline" size={21} color={colors.onPrimary} />
        <Text style={[styles.ctaText, { color: colors.onPrimary }]}>أضف إلى السلة</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { gap: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  errorTitle: { fontSize: 20, fontWeight: '900' },
  gallery: { marginHorizontal: -20 },
  galleryContent: { gap: 10, paddingHorizontal: 20 },
  imageWrap: { width: 320, height: 320, borderRadius: 26, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  image: { width: '100%', height: '100%' },
  card: { borderWidth: 1, borderRadius: 24, padding: 18, gap: 12 },
  badgeRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, fontWeight: '900', fontSize: 11 },
  level: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, fontWeight: '900', fontSize: 11 },
  title: { textAlign: 'right', writingDirection: 'rtl', fontSize: 27, lineHeight: 38, fontWeight: '900' },
  price: { textAlign: 'right', fontSize: 23, fontWeight: '900' },
  description: { textAlign: 'right', writingDirection: 'rtl', lineHeight: 25, fontSize: 15 },
  sectionTitle: { textAlign: 'right', fontSize: 20, fontWeight: '900' },
  pointRow: { flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 8 },
  point: { flex: 1, textAlign: 'right', writingDirection: 'rtl', lineHeight: 22 },
  cta: { minHeight: 58, borderRadius: 18, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 9 },
  ctaText: { fontWeight: '900', fontSize: 16 }
});
