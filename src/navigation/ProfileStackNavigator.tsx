import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SignInScreen } from '../features/auth/screens/SignInScreen';
import { SignUpScreen } from '../features/auth/screens/SignUpScreen';
import { EditProfileScreen } from '../features/profile/screens/EditProfileScreen';
import { ProfileScreen } from '../features/profile/screens/ProfileScreen';
import { ContentFormScreen } from '../features/admin/screens/ContentFormScreen';
import { ContentManagerScreen } from '../features/admin/screens/ContentManagerScreen';
import { ContentPreviewScreen } from '../features/admin/screens/ContentPreviewScreen';
import { useTheme } from '../context/ThemeProvider';
import { useLanguage } from '../context/LanguageProvider';
import { getAdminCopy } from '../i18n/adminCopy';

const Stack = createNativeStackNavigator();

export function ProfileStackNavigator() {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const nav = getAdminCopy(language).nav;

  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: colors.card }, headerTintColor: colors.text, headerTitleAlign: 'right' }}>
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
    </Stack.Navigator>
  );
}
