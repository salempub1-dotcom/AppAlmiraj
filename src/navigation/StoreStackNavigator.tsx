import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CartScreen } from '../features/store/screens/CartScreen';
import { CheckoutScreen } from '../features/store/screens/CheckoutScreen';
import { MyOrdersScreen } from '../features/store/screens/MyOrdersScreen';
import { OrderDetailScreen } from '../features/store/screens/OrderDetailScreen';
import { ProductDetailScreen } from '../features/store/screens/ProductDetailScreen';
import { StoreScreen } from '../features/store/screens/StoreScreen';
import { useTheme } from '../context/ThemeProvider';

const Stack = createNativeStackNavigator();

export function StoreStackNavigator() {
  const { colors } = useTheme();

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
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ title: 'تفاصيل المنتج' }} />
      <Stack.Screen name="Cart" component={CartScreen} options={{ title: 'سلة الطلب' }} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ title: 'إتمام الطلب' }} />
      <Stack.Screen name="MyOrders" component={MyOrdersScreen} options={{ title: 'طلباتي' }} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ title: 'تفاصيل الطلب' }} />
    </Stack.Navigator>
  );
}
