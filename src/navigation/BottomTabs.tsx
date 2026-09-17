import { Ionicons } from '@expo/vector-icons';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View } from 'react-native';
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
          tabBarActiveTintColor: dark ? '#F1C95A' : '#D6A525',
          tabBarInactiveTintColor: dark ? '#8190A8' : '#173D69',
          tabBarHideOnKeyboard: true,
          tabBarLabel: ({ focused, color }) => {
            const label =
              route.name === 'Community'
                ? getCommunityCopy(language).nav.feed
                : route.name === 'Store'
                  ? t('nav.store')
                  : t('nav.profile');

            return (
              <View style={{ alignItems: 'center', justifyContent: 'center', gap: 5, minWidth: 74 }}>
                <Text style={{ color, fontSize: 11, fontWeight: '800' }}>{label}</Text>
                {focused && route.name === 'Community' ? (
                  <View
                    style={{
                      width: 46,
                      height: 4,
                      borderRadius: 999,
                      backgroundColor: dark ? '#F1C95A' : '#D6A525'
                    }}
                  />
                ) : (
                  <View style={{ width: 46, height: 4 }} />
                )}
              </View>
            );
          },
          tabBarIcon: ({ color, focused }) => {
            const icon = icons[route.name as keyof typeof icons];
            return (
              <Ionicons
                name={focused ? icon.active : icon.inactive}
                color={color}
                size={focused ? 25 : 23}
              />
            );
          },
          tabBarStyle: hideForAuth
            ? { display: 'none' }
            : {
                backgroundColor: dark ? 'rgba(14,26,45,0.98)' : 'rgba(255,255,255,0.98)',
                borderTopColor: dark ? '#213149' : 'rgba(6,45,91,0.08)',
                borderTopWidth: 1,
                borderTopLeftRadius: 28,
                borderTopRightRadius: 28,
                height: 70 + bottomInset,
                paddingTop: 9,
                paddingBottom: bottomInset,
                elevation: 20,
                shadowColor: '#062D5B',
                shadowOpacity: dark ? 0.24 : 0.13,
                shadowRadius: 22,
                shadowOffset: { width: 0, height: -7 },
                overflow: 'visible'
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
      <Tab.Screen name="Community" component={CommunityStackNavigator} />
      <Tab.Screen name="Store" component={StoreStackNavigator} />
      <Tab.Screen name="Profile" component={ProfileStackNavigator} />
    </Tab.Navigator>
  );
}