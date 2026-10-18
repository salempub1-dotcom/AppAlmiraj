import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../context/ThemeProvider';
import { ContentDetailScreen } from '../features/explore/screens/ContentDetailScreen';
import { ClassTimerScreen } from '../features/teacher-tools/screens/ClassTimerScreen';
import { GroupMakerScreen } from '../features/teacher-tools/screens/GroupMakerScreen';
import { RandomStudentScreen } from '../features/teacher-tools/screens/RandomStudentScreen';
import { useLanguage } from '../context/LanguageProvider';
import { toolkitCopy } from '../features/teacher-tools/toolkitCopy';
import { BottomTabs } from './BottomTabs';

const Stack = createNativeStackNavigator();

export function RootNavigator() {
  const { language, t } = useLanguage();
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
          headerTitleAlign: 'center',
          headerShadowVisible: false,
          headerBackButtonDisplayMode: 'minimal',
          headerTitleStyle: { fontSize: 16, fontWeight: '800' },
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right'
        }}
      >
        <Stack.Screen name="Main" component={BottomTabs} options={{ headerShown: false }} />
        <Stack.Screen name="ContentDetail" component={ContentDetailScreen} options={{ title: 'التفاصيل' }} />
        <Stack.Screen name="ImagesToPdf" getComponent={() => require('../features/teacher-tools/screens/ImagesToPdfScreen').ImagesToPdfScreen} options={{ title: toolkitCopy(language).pdf }} />
        <Stack.Screen name="ClassTimer" component={ClassTimerScreen} options={{ title: t('tools.timerTitle') }} />
        <Stack.Screen name="RandomStudent" component={RandomStudentScreen} options={{ title: t('tools.randomTitle') }} />
        <Stack.Screen name="GroupMaker" component={GroupMakerScreen} options={{ title: t('tools.groupsTitle') }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
