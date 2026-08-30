import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useLanguage } from '../context/LanguageProvider';
import { useTheme } from '../context/ThemeProvider';
import { CartScreen } from '../features/store/screens/CartScreen';
import { CheckoutScreen } from '../features/store/screens/CheckoutScreen';
import { MyOrdersScreen } from '../features/store/screens/MyOrdersScreen';
import { OrderDetailScreen } from '../features/store/screens/OrderDetailScreen';
import { ProductDetailScreen } from '../features/store/screens/ProductDetailScreen';
import { StoreScreen } from '../features/store/screens/StoreScreen';
import { getStoreCopy } from '../i18n/storeCopy';

const Stack = createNativeStackNavigator();

export function StoreStackNavigator() {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const nav = getStoreCopy(language).nav;

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.text,
        headerTitleAlign: 'center',
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background }
      }}
    >
      <Stack.Screen name="StoreHome" component={StoreScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ title: nav.productDetail }} />
      <Stack.Screen name="Cart" component={CartScreen} options={{ title: nav.cart }} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ title: nav.checkout }} />
      <Stack.Screen name="MyOrders" component={MyOrdersScreen} options={{ title: nav.orders }} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ title: nav.orderDetail }} />
    </Stack.Navigator>
  );
}
