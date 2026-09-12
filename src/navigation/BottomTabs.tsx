import { Ionicons } from '@expo/vector-icons';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../context/LanguageProvider';
import { useTheme } from '../context/ThemeProvider';
import { getCommunityCopy } from '../i18n/communityCopy';
import { ui } from '../theme/ui';
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
  const bottomInset = Math.max(insets.bottom, 6);

  return (
    <Tab.Navigator
      initialRouteName="Community"
      screenOptions={({ route }) => {
        const nestedRoute = getFocusedRouteNameFromRoute(route);
        const hideForAuth = route.name === 'Profile' && (nestedRoute === 'SignIn' || nestedRoute === 'SignUp');

        return {
          headerShown: false,
          tabBarActiveTintColor: colors.text,
          tabBarInactiveTintColor: colors.muted,
          tabBarHideOnKeyboard: true,
          tabBarLabelStyle: {
            fontSize: 10.5,
            fontWeight: '800',
            marginTop: 3,
            marginBottom: 1
          },
          tabBarIcon: ({ color, focused }) => {
            const icon = icons[route.name as keyof typeof icons];
            const isStore = route.name === 'Store';
            const accent = isStore ? colors.primary : colors.text;
            const iconColor = isStore && focused ? '#0B1833' : focused ? '#FFFFFF' : color;

            return (
              <View
                style={{
                  width: 50,
                  height: 31,
                  borderRadius: ui.radius.pill,
                  backgroundColor: focused ? accent : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Ionicons name={focused ? icon.active : icon.inactive} color={iconColor} size={21} />
              </View>
            );
          },
          tabBarStyle: hideForAuth
            ? { display: 'none' }
            : {
                backgroundColor: colors.card,
                borderTopColor: colors.border,
                borderTopWidth: 1,
                height: 62 + bottomInset,
                paddingTop: 7,
                paddingBottom: bottomInset,
                elevation: 5,
                shadowColor: '#000000',
                shadowOpacity: 0.05,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: -4 }
              },
          tabBarItemStyle: { paddingTop: 0 }
        };
      }}
    >
      <Tab.Screen name="Community" component={CommunityStackNavigator} options={{ tabBarLabel: getCommunityCopy(language).nav.feed }} />
      <Tab.Screen name="Store" component={StoreStackNavigator} options={{ tabBarLabel: t('nav.store') }} />
      <Tab.Screen name="Profile" component={ProfileStackNavigator} options={{ tabBarLabel: t('nav.profile') }} />
    </Tab.Navigator>
  );
}
