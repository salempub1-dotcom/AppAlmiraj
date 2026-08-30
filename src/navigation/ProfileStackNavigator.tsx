import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SignInScreen } from '../features/auth/screens/SignInScreen';
import { SignUpScreen } from '../features/auth/screens/SignUpScreen';
import { EditProfileScreen } from '../features/profile/screens/EditProfileScreen';
import { ProfileScreen } from '../features/profile/screens/ProfileScreen';
import { useTheme } from '../context/ThemeProvider';

const Stack = createNativeStackNavigator();

export function ProfileStackNavigator() {
  const { colors } = useTheme();
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: colors.card }, headerTintColor: colors.text, headerTitleAlign: 'right' }}>
      <Stack.Screen name="ProfileHome" component={ProfileScreen} options={{ headerShown: false }} />
      <Stack.Screen name="SignIn" component={SignInScreen} options={{ title: 'تسجيل الدخول' }} />
      <Stack.Screen name="SignUp" component={SignUpScreen} options={{ title: 'إنشاء حساب' }} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'تعديل الحساب' }} />
    </Stack.Navigator>
  );
}
