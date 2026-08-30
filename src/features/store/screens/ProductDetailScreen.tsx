import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../../components/Screen';
import { useCart } from '../../../context/CartProvider';
import { useLanguage } from '../../../context/LanguageProvider';
import { useTheme } from '../../../context/ThemeProvider';
import { useProductDetail } from '../../../hooks/useProducts';
import { getStoreCopy } from '../../../i18n/storeCopy';

export function ProductDetailScreen({ route, navigation }: any) {
  const { colors } = useTheme();
  const { language, isRTL } = useLanguage();
  const copy = getStoreCopy(language).product;
  const cart = useCart();
  const productId = Number(route.params?.productId);
  const productQuery = useProductDetail(productId);
  const align = isRTL ? 'right' as const : 'left' as const;
  const direction = isRTL ? 'rtl' as const : 'ltr' as const;
  const row = isRTL ? 'row-reverse' as const : 'row' as const;

  if (productQuery.isLoading) return <Screen style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></Screen>;

  if (productQuery.isError || !productQuery.data) {
    return <Screen style={styles.center}><Ionicons name="alert-circle-outline" size={36} color={colors.primary} /><Text style={[styles.errorTitle, { color: colors.text }]}>{copy.loadError}</Text></Screen>;
  }

  const product = productQuery.data;
  const images = product.images ?? [];

  const addToCart = () => {
    cart.add(product);
  };

  const buyNow = () => {
    cart.add(product);
    navigation.navigate('Checkout');
  };

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
        <View style={[styles.badgeRow, { flexDirection: row }]}>
          {!!product.badge && <Text style={[styles.badge, { backgroundColor: colors.primary, color: colors.onPrimary }]}>{product.badge.trim()}</Text>}
          {!!product.level && <Text style={[styles.level, { color: colors.primary, borderColor: colors.primary }]}>{product.level}</Text>}
        </View>
        <Text style={[styles.title, { color: colors.text, textAlign: align, writingDirection: direction }]}>{product.name.trim()}</Text>
        <Text style={[styles.price, { color: colors.text, textAlign: align }]}>{product.price.toLocaleString('fr-DZ')} دج</Text>
        {!!product.description && <Text style={[styles.description, { color: colors.muted, textAlign: align, writingDirection: direction }]}>{product.description}</Text>}
      </View>

      {!!product.benefits?.length && (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text, textAlign: align }]}>{copy.benefits}</Text>
          {product.benefits.map((item, index) => (
            <View key={`${item}-${index}`} style={[styles.pointRow, { flexDirection: row }]}><Ionicons name="checkmark-circle" size={19} color={colors.primary} /><Text style={[styles.point, { color: colors.text, textAlign: align, writingDirection: direction }]}>{item}</Text></View>
          ))}
        </View>
      )}

      <View style={[styles.actions, { flexDirection: row }]}>
        <Pressable onPress={buyNow} style={[styles.buyNow, { backgroundColor: colors.primary, flexDirection: row }]}>
          <Ionicons name="flash-outline" size={21} color={colors.onPrimary} />
          <Text style={[styles.actionText, { color: colors.onPrimary }]}>{copy.buyNow}</Text>
        </Pressable>

        <Pressable onPress={addToCart} style={[styles.addToCart, { backgroundColor: colors.card, borderColor: colors.primary, flexDirection: row }]}>
          <Ionicons name="bag-add-outline" size={21} color={colors.primary} />
          <Text style={[styles.actionText, { color: colors.primary }]}>{copy.addToCart}</Text>
        </Pressable>
      </View>

      <Text style={[styles.actionHint, { color: colors.muted, writingDirection: direction }]}>{copy.actionHint}</Text>
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
  badgeRow: { flexWrap: 'wrap', gap: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, fontWeight: '900', fontSize: 11 },
  level: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, fontWeight: '900', fontSize: 11 },
  title: { fontSize: 27, lineHeight: 38, fontWeight: '900' },
  price: { fontSize: 23, fontWeight: '900' },
  description: { lineHeight: 25, fontSize: 15 },
  sectionTitle: { fontSize: 20, fontWeight: '900' },
  pointRow: { alignItems: 'flex-start', gap: 8 },
  point: { flex: 1, lineHeight: 22 },
  actions: { gap: 10 },
  buyNow: { flex: 1.08, minHeight: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center', gap: 8 },
  addToCart: { flex: 1, minHeight: 58, borderRadius: 18, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', gap: 8 },
  actionText: { fontWeight: '900', fontSize: 15 },
  actionHint: { textAlign: 'center', fontSize: 12, lineHeight: 19, marginTop: -5 }
});
