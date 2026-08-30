import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../context/LanguageProvider';
import { useTheme } from '../context/ThemeProvider';
import { ExploreScreen } from '../features/explore/screens/ExploreScreen';
import { HomeScreen } from '../features/home/screens/HomeScreen';
import { ToolsScreen } from '../features/teacher-tools/screens/ToolsScreen';
import { ProfileStackNavigator } from './ProfileStackNavigator';
import { StoreStackNavigator } from './StoreStackNavigator';

const Tab = createBottomTabNavigator();

const icons: Record<string, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }> = {
  Home: { active: 'home', inactive: 'home-outline' },
  Explore: { active: 'compass', inactive: 'compass-outline' },
  Tools: { active: 'construct', inactive: 'construct-outline' },
  Store: { active: 'bag-handle', inactive: 'bag-handle-outline' },
  Profile: { active: 'person', inactive: 'person-outline' }
};

export function BottomTabs() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 8);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: { fontSize: 10.5, fontWeight: '800', marginTop: 2, marginBottom: 2 },
        tabBarIcon: ({ color, focused }) => {
          const config = icons[route.name];
          return (
            <Ionicons
              name={focused ? config.active : config.inactive}
              color={focused ? '#0B1833' : color}
              size={19}
              style={focused ? { backgroundColor: colors.primary, padding: 7, borderRadius: 12, overflow: 'hidden' } : undefined}
            />
          );
        },
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 64 + bottomInset,
          paddingTop: 7,
          paddingBottom: bottomInset,
          elevation: 14,
          shadowOpacity: 0.1,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: -5 }
        },
        tabBarItemStyle: { paddingTop: 1 }
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: t('nav.home') }} />
      <Tab.Screen name="Explore" component={ExploreScreen} options={{ tabBarLabel: t('nav.explore') }} />
      <Tab.Screen name="Tools" component={ToolsScreen} options={{ tabBarLabel: t('nav.tools') }} />
      <Tab.Screen name="Store" component={StoreStackNavigator} options={{ tabBarLabel: t('nav.store') }} />
      <Tab.Screen name="Profile" component={ProfileStackNavigator} options={{ tabBarLabel: t('nav.profile') }} />
    </Tab.Navigator>
  );
}
