import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../context/LanguageProvider';
import { useTheme } from '../context/ThemeProvider';
import { CommunityStackNavigator } from './CommunityStackNavigator';
import { ProfileStackNavigator } from './ProfileStackNavigator';
import { StoreStackNavigator } from './StoreStackNavigator';

const Tab = createBottomTabNavigator();

const icons = {
  Community: { active: 'people' as const, inactive: 'people-outline' as const },
  Store: { active: 'storefront' as const, inactive: 'storefront-outline' as const },
  Profile: { active: 'person-circle' as const, inactive: 'person-circle-outline' as const }
} as const;

export function BottomTabs() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 8);

  return (
    <Tab.Navigator
      initialRouteName="Community"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: { fontSize: 10.5, fontWeight: '800', marginTop: 2, marginBottom: 2 },
        tabBarIcon: ({ color, focused }) => {
          const icon = icons[route.name as keyof typeof icons];
          return (
            <Ionicons
              name={focused ? icon.active : icon.inactive}
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
      <Tab.Screen name="Community" component={CommunityStackNavigator} options={{ tabBarLabel: 'فضاء الأستاذ' }} />
      <Tab.Screen name="Store" component={StoreStackNavigator} options={{ tabBarLabel: t('nav.store') }} />
      <Tab.Screen name="Profile" component={ProfileStackNavigator} options={{ tabBarLabel: t('nav.profile') }} />
    </Tab.Navigator>
  );
}
