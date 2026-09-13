import { Ionicons } from '@expo/vector-icons';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
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
  Community: { active: 'school' as const, inactive: 'school-outline' as const },
  Store: { active: 'bag-handle' as const, inactive: 'bag-handle-outline' as const },
  Profile: { active: 'person' as const, inactive: 'person-outline' as const }
} as const;

export function BottomTabs() {
  const { colors, mode } = useTheme();
  const { t, language } = useLanguage();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 7);
  const dark = mode === 'dark';

  return (
    <Tab.Navigator
      initialRouteName="Community"
      screenOptions={({ route }) => {
        const nestedRoute = getFocusedRouteNameFromRoute(route);
        const hideForAuth = route.name === 'Profile' && (nestedRoute === 'SignIn' || nestedRoute === 'SignUp');

        return {
          headerShown: false,
          tabBarActiveTintColor: dark ? '#E5C96A' : '#D4B24C',
          tabBarInactiveTintColor: dark ? '#8190A8' : '#7A879A',
          tabBarHideOnKeyboard: true,
          tabBarLabelStyle: {
            fontSize: 10.5,
            fontWeight: '800',
            marginTop: 2,
            marginBottom: 1
          },
          tabBarIcon: ({ color, focused }) => {
            const icon = icons[route.name as keyof typeof icons];
            return (
              <Ionicons
                name={focused ? icon.active : icon.inactive}
                color={color}
                size={focused ? 23 : 22}
              />
            );
          },
          tabBarStyle: hideForAuth
            ? { display: 'none' }
            : {
                backgroundColor: dark ? '#0E1A2D' : '#FFFFFF',
                borderTopColor: dark ? '#213149' : '#E7ECF2',
                borderTopWidth: 1,
                height: 61 + bottomInset,
                paddingTop: 8,
                paddingBottom: bottomInset,
                elevation: 14,
                shadowColor: '#0B1833',
                shadowOpacity: dark ? 0.24 : 0.1,
                shadowRadius: 18,
                shadowOffset: { width: 0, height: -5 }
              },
          tabBarItemStyle: {
            paddingTop: 0,
            borderRadius: 18,
            marginHorizontal: 5
          },
          sceneStyle: { backgroundColor: colors.background }
        };
      }}
    >
      <Tab.Screen
        name="Community"
        component={CommunityStackNavigator}
        options={{ tabBarLabel: getCommunityCopy(language).nav.feed }}
      />
      <Tab.Screen
        name="Store"
        component={StoreStackNavigator}
        options={{ tabBarLabel: t('nav.store') }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStackNavigator}
        options={{ tabBarLabel: t('nav.profile') }}
      />
    </Tab.Navigator>
  );
}
