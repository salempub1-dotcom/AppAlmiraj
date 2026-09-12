import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CommunityModerationScreen } from '../features/admin/screens/CommunityModerationScreen';
import { ContentFormScreen } from '../features/admin/screens/ContentFormScreen';
import { ContentManagerScreen } from '../features/admin/screens/ContentManagerScreen';
import { ContentPreviewScreen } from '../features/admin/screens/ContentPreviewScreen';
import { SignInScreen } from '../features/auth/screens/SignInScreen';
import { SignUpScreen } from '../features/auth/screens/SignUpScreen';
import { EditProfileScreen } from '../features/profile/screens/EditProfileScreen';
import { ProfileScreen } from '../features/profile/screens/ProfileScreen';
import { useAuth } from '../context/AuthProvider';
import { useLanguage } from '../context/LanguageProvider';
import { useTheme } from '../context/ThemeProvider';
import { getAdminCopy } from '../i18n/adminCopy';

const Stack = createNativeStackNavigator();

export function ProfileStackNavigator() {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const { session } = useAuth();
  const nav = getAdminCopy(language).nav;

  return (
    <Stack.Navigator
      key={session ? `authenticated-${session.user.id}` : 'guest'}
      initialRouteName="ProfileHome"
      screenOptions={{
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.text,
        headerTitleAlign: 'center',
        headerShadowVisible: false,
        headerBackTitleVisible: false,
        headerTitleStyle: { fontSize: 16, fontWeight: '800' },
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right'
      }}
    >
      <Stack.Screen name="ProfileHome" component={ProfileScreen} options={{ headerShown: false }} />
      <Stack.Screen name="SignIn" component={SignInScreen} options={{ title: 'تسجيل الدخول' }} />
      <Stack.Screen name="SignUp" component={SignUpScreen} options={{ title: 'إنشاء حساب' }} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'تعديل الحساب' }} />
      <Stack.Screen name="ContentManager" component={ContentManagerScreen} options={{ title: nav.contentManager }} />
      <Stack.Screen
        name="ContentForm"
        component={ContentFormScreen}
        options={({ route }: any) => ({ title: route.params?.id ? nav.editContent : nav.contentForm })}
      />
      <Stack.Screen name="ContentPreview" component={ContentPreviewScreen} options={{ title: nav.preview }} />
      <Stack.Screen name="CommunityModeration" component={CommunityModerationScreen} options={{ title: nav.communityModeration }} />
    </Stack.Navigator>
  );
}
