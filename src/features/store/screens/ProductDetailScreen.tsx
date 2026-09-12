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
  const addToCart = () => cart.add(product);
  const buyNow = () => { cart.add(product); navigation.navigate('Checkout'); };

  return (
    <Screen scroll style={styles.page}>
      <View style={styles.galleryShell}>
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={styles.gallery} contentContainerStyle={styles.galleryContent}>
          {(images.length ? images : ['']).map((uri, index) => (
            <View key={`${uri}-${index}`} style={[styles.imageWrap, { backgroundColor: colors.surface }]}>
              {uri ? <Image source={{ uri }} style={styles.image} resizeMode="cover" /> : <Ionicons name="image-outline" size={42} color={colors.muted} />}
            </View>
          ))}
        </ScrollView>
        <View style={styles.galleryBadge}><Ionicons name="sparkles-outline" size={14} color="#D4AF37" /><Text style={styles.galleryBadgeText}>AL MIRAJ</Text></View>
      </View>

      <View style={[styles.mainCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.badgeRow, { flexDirection: row }]}>
          {!!product.badge && <Text style={styles.badge}>{product.badge.trim()}</Text>}
          {!!product.level && <Text style={[styles.level, { color: colors.text, borderColor: colors.border }]}>{product.level}</Text>}
        </View>
        <Text style={[styles.title, { color: colors.text, textAlign: align, writingDirection: direction }]}>{product.name.trim()}</Text>
        <Text style={[styles.price, { color: '#0B1833', textAlign: align }]}>{product.price.toLocaleString('fr-DZ')} دج</Text>
        {!!product.description && <Text style={[styles.description, { color: colors.muted, textAlign: align, writingDirection: direction }]}>{product.description}</Text>}
      </View>

      {!!product.benefits?.length && (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.sectionHead, { flexDirection: row }]}>
            <View style={styles.sectionIcon}><Ionicons name="checkmark-done-outline" size={18} color="#D4AF37" /></View>
            <Text style={[styles.sectionTitle, { color: colors.text, textAlign: align }]}>{copy.benefits}</Text>
          </View>
          {product.benefits.map((item, index) => (
            <View key={`${item}-${index}`} style={[styles.pointRow, { flexDirection: row }]}>
              <View style={styles.checkDot}><Ionicons name="checkmark" size={13} color="#0B1833" /></View>
              <Text style={[styles.point, { color: colors.text, textAlign: align, writingDirection: direction }]}>{item}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={[styles.actions, { flexDirection: row }]}>
        <Pressable onPress={addToCart} style={({ pressed }) => [styles.addToCart, { backgroundColor: colors.card, borderColor: '#D4AF37', flexDirection: row, opacity: pressed ? 0.82 : 1 }]}>
          <Ionicons name="bag-add-outline" size={20} color="#B2871E" />
          <Text style={styles.addToCartText}>{copy.addToCart}</Text>
        </Pressable>
        <Pressable onPress={buyNow} style={({ pressed }) => [styles.buyNow, { flexDirection: row, opacity: pressed ? 0.85 : 1 }]}>
          <Ionicons name="flash-outline" size={20} color="#0B1833" />
          <Text style={styles.buyNowText}>{copy.buyNow}</Text>
        </Pressable>
      </View>

      <View style={styles.hintRow}>
        <Ionicons name="shield-checkmark-outline" size={15} color={colors.muted} />
        <Text style={[styles.actionHint, { color: colors.muted, writingDirection: direction }]}>{copy.actionHint}</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { gap: 14 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  errorTitle: { fontSize: 20, fontWeight: '900' },
  galleryShell: { position: 'relative' },
  gallery: { marginHorizontal: -20 },
  galleryContent: { gap: 10, paddingHorizontal: 20 },
  imageWrap: { width: 320, height: 320, borderRadius: 28, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  image: { width: '100%', height: '100%' },
  galleryBadge: { position: 'absolute', right: 12, bottom: 12, minHeight: 30, borderRadius: 999, paddingHorizontal: 10, backgroundColor: 'rgba(11,24,51,0.90)', flexDirection: 'row', alignItems: 'center', gap: 5 },
  galleryBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '900', letterSpacing: 0.8 },
  mainCard: { borderWidth: 1, borderRadius: 24, padding: 18, gap: 11 },
  card: { borderWidth: 1, borderRadius: 22, padding: 17, gap: 12 },
  badgeRow: { flexWrap: 'wrap', gap: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, fontWeight: '900', fontSize: 11, color: '#0B1833', backgroundColor: '#F3DE9B' },
  level: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, fontWeight: '800', fontSize: 11 },
  title: { fontSize: 25, lineHeight: 35, fontWeight: '900' },
  price: { fontSize: 24, fontWeight: '900' },
  description: { lineHeight: 24, fontSize: 14.5 },
  sectionHead: { alignItems: 'center', gap: 9 },
  sectionIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: '#0B1833', alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { flex: 1, fontSize: 18, fontWeight: '900' },
  pointRow: { alignItems: 'flex-start', gap: 9 },
  checkDot: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#D4AF37', alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  point: { flex: 1, lineHeight: 22, fontSize: 13.5 },
  actions: { gap: 10 },
  buyNow: { flex: 1, minHeight: 56, borderRadius: 17, backgroundColor: '#D4AF37', alignItems: 'center', justifyContent: 'center', gap: 8 },
  addToCart: { flex: 1, minHeight: 56, borderRadius: 17, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', gap: 8 },
  buyNowText: { color: '#0B1833', fontWeight: '900', fontSize: 14.5 },
  addToCartText: { color: '#8B6A17', fontWeight: '900', fontSize: 14.5 },
  hintRow: { alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6, paddingTop: 2 },
  actionHint: { textAlign: 'center', fontSize: 11.5, lineHeight: 18 }
});