import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../context/ThemeProvider';
import { ContentDetailScreen } from '../features/explore/screens/ContentDetailScreen';
import { ClassTimerScreen } from '../features/teacher-tools/screens/ClassTimerScreen';
import { GroupMakerScreen } from '../features/teacher-tools/screens/GroupMakerScreen';
import { RandomStudentScreen } from '../features/teacher-tools/screens/RandomStudentScreen';
import { BottomTabs } from './BottomTabs';
import { CommunityStackNavigator } from './CommunityStackNavigator';

const Stack = createNativeStackNavigator();

export function RootNavigator() {
  const { mode, colors } = useTheme();
  const base = mode === 'dark' ? DarkTheme : DefaultTheme;
  const theme = {
    ...base,
    colors: {
      ...base.colors,
      background: colors.background,
      card: colors.card,
      text: colors.text,
      border: colors.border,
      primary: colors.primary
    }
  };

  return (
    <NavigationContainer theme={theme}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
          headerTitleAlign: 'right'
        }}
      >
        <Stack.Screen name="Main" component={BottomTabs} options={{ headerShown: false }} />
        <Stack.Screen name="Community" component={CommunityStackNavigator} options={{ headerShown: false }} />
        <Stack.Screen name="ContentDetail" component={ContentDetailScreen} options={{ title: 'التفاصيل' }} />
        <Stack.Screen name="ClassTimer" component={ClassTimerScreen} options={{ title: 'مؤقت القسم' }} />
        <Stack.Screen name="RandomStudent" component={RandomStudentScreen} options={{ title: 'اختيار تلميذ' }} />
        <Stack.Screen name="GroupMaker" component={GroupMakerScreen} options={{ title: 'تقسيم المجموعات' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
