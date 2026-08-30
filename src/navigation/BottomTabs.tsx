import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ExploreScreen } from '../features/explore/screens/ExploreScreen';
import { HomeScreen } from '../features/home/screens/HomeScreen';
import { StoreScreen } from '../features/store/screens/StoreScreen';
import { ToolsScreen } from '../features/teacher-tools/screens/ToolsScreen';
import { useTheme } from '../context/ThemeProvider';
import { ProfileStackNavigator } from './ProfileStackNavigator';

const Tab = createBottomTabNavigator();

const icons: Record<string, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }> = {
  Home: { active: 'home', inactive: 'home-outline' },
  Explore: { active: 'compass', inactive: 'compass-outline' },
  Tools: { active: 'construct', inactive: 'construct-outline' },
  Store: { active: 'bag-handle', inactive: 'bag-handle-outline' },
  Profile: { active: 'person-circle', inactive: 'person-circle-outline' }
};

export function BottomTabs() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginTop: 2,
          marginBottom: 5
        },
        tabBarIcon: ({ color, size, focused }) => {
          const config = icons[route.name];
          return <Ionicons name={focused ? config.active : config.inactive} color={color} size={size + 2} />;
        },
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 68,
          paddingTop: 7,
          elevation: 10,
          shadowOpacity: 0.08,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: -4 }
        }
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'الرئيسية' }} />
      <Tab.Screen name="Explore" component={ExploreScreen} options={{ tabBarLabel: 'استكشف' }} />
      <Tab.Screen name="Tools" component={ToolsScreen} options={{ tabBarLabel: 'الأدوات' }} />
      <Tab.Screen name="Store" component={StoreScreen} options={{ tabBarLabel: 'المتجر' }} />
      <Tab.Screen name="Profile" component={ProfileStackNavigator} options={{ tabBarLabel: 'حسابي' }} />
    </Tab.Navigator>
  );
}
