import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ExploreScreen } from '../features/explore/screens/ExploreScreen';
import { HomeScreen } from '../features/home/screens/HomeScreen';
import { ProfileStackNavigator } from './ProfileStackNavigator';
import { StoreScreen } from '../features/store/screens/StoreScreen';
import { ToolsScreen } from '../features/teacher-tools/screens/ToolsScreen';
import { useTheme } from '../context/ThemeProvider';

const Tab = createBottomTabNavigator();

export function BottomTabs() {
  const { colors } = useTheme();
  return (
    <Tab.Navigator screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.primary, tabBarInactiveTintColor: colors.muted, tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border } }}>
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'الرئيسية' }} />
      <Tab.Screen name="Explore" component={ExploreScreen} options={{ tabBarLabel: 'استكشف' }} />
      <Tab.Screen name="Tools" component={ToolsScreen} options={{ tabBarLabel: 'الأدوات' }} />
      <Tab.Screen name="Store" component={StoreScreen} options={{ tabBarLabel: 'المتجر' }} />
      <Tab.Screen name="Profile" component={ProfileStackNavigator} options={{ tabBarLabel: 'حسابي' }} />
    </Tab.Navigator>
  );
}
