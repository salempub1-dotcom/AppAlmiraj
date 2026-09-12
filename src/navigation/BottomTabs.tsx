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
  Community: { active: 'people' as const, inactive: 'people-outline' as const },
  Store: { active: 'cart' as const, inactive: 'cart-outline' as const },
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
          tabBarActiveTintColor: '#C89522',
          tabBarInactiveTintColor: '#607086',
          tabBarHideOnKeyboard: true,
          tabBarLabelStyle: {
            fontSize: 10.5,
            fontWeight: '800',
            marginTop: 1,
            marginBottom: 1
          },
          tabBarIcon: ({ color, focused }) => {
            const icon = icons[route.name as keyof typeof icons];
            return <Ionicons name={focused ? icon.active : icon.inactive} color={color} size={22} />;
          },
          tabBarStyle: hideForAuth
            ? { display: 'none' }
            : {
                backgroundColor: colors.card,
                borderTopColor: colors.border,
                borderTopWidth: 1,
                height: 58 + bottomInset,
                paddingTop: 7,
                paddingBottom: bottomInset,
                elevation: 8,
                shadowColor: '#0B1833',
                shadowOpacity: 0.08,
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
