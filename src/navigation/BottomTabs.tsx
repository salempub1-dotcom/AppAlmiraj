import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../context/LanguageProvider';
import { useTheme } from '../context/ThemeProvider';
import { getCommunityCopy } from '../i18n/communityCopy';
import { CommunityStackNavigator } from './CommunityStackNavigator';
import { ProfileStackNavigator } from './ProfileStackNavigator';
import { StoreStackNavigator } from './StoreStackNavigator';

const Tab = createBottomTabNavigator();

const icons = {
  Community: { active: 'people' as const, inactive: 'people-outline' as const },
  Store: { active: 'storefront' as const, inactive: 'storefront-outline' as const },
  Profile: { active: 'person' as const, inactive: 'person-outline' as const }
} as const;

export function BottomTabs() {
  const { colors } = useTheme();
  const { t, language } = useLanguage();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 8);

  return (
    <Tab.Navigator
      initialRouteName="Community"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: route.name === 'Store' ? colors.text : '#111827',
        tabBarInactiveTintColor: colors.muted,
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700', marginTop: 4, marginBottom: 2 },
        tabBarIcon: ({ color, focused }) => {
          const icon = icons[route.name as keyof typeof icons];
          const isStore = route.name === 'Store';
          const activeBackground = isStore ? colors.primary : '#111827';
          const activeIcon = isStore ? '#0B1833' : '#FFFFFF';

          return (
            <View
              style={{
                width: 56,
                height: 34,
                borderRadius: 17,
                backgroundColor: focused ? activeBackground : 'transparent',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Ionicons name={focused ? icon.active : icon.inactive} color={focused ? activeIcon : color} size={23} />
            </View>
          );
        },
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 72 + bottomInset,
          paddingTop: 10,
          paddingBottom: bottomInset,
          elevation: 3,
          shadowOpacity: 0.05,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: -5 }
        },
        tabBarItemStyle: { paddingTop: 1 }
      })}
    >
      <Tab.Screen name="Community" component={CommunityStackNavigator} options={{ tabBarLabel: getCommunityCopy(language).nav.feed }} />
      <Tab.Screen name="Store" component={StoreStackNavigator} options={{ tabBarLabel: t('nav.store') }} />
      <Tab.Screen name="Profile" component={ProfileStackNavigator} options={{ tabBarLabel: t('nav.profile') }} />
    </Tab.Navigator>
  );
}
