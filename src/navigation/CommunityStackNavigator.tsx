import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useLanguage } from '../context/LanguageProvider';
import { useTheme } from '../context/ThemeProvider';
import { CommunityFeedScreen } from '../features/community/screens/CommunityFeedScreen';
import { CommunityPostDetailScreen } from '../features/community/screens/CommunityPostDetailScreen';
import { CreateCommunityPostScreen } from '../features/community/screens/CreateCommunityPostScreen';
import { EditCommunityPostScreen } from '../features/community/screens/EditCommunityPostScreen';
import { SavedCommunityPostsScreen } from '../features/community/screens/SavedCommunityPostsScreen';
import { TeacherCommunityProfileScreen } from '../features/community/screens/TeacherCommunityProfileScreen';
import { getCommunityCopy } from '../i18n/communityCopy';
import { getCommunityTheme } from '../features/community/communityTheme';

const Stack = createNativeStackNavigator();

export function CommunityStackNavigator() {
  const { colors } = useTheme();
  const community = getCommunityTheme(colors);
  const { language } = useLanguage();
  const nav = getCommunityCopy(language).nav;

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: community.surface },
        headerTintColor: community.text,
        headerTitleAlign: 'center',
        headerShadowVisible: false,
        headerBackTitleVisible: false,
        headerTitleStyle: { fontSize: 16, fontWeight: '800' },
        contentStyle: { backgroundColor: community.background },
        animation: 'slide_from_right'
      }}
    >
      <Stack.Screen name="CommunityFeed" component={CommunityFeedScreen} options={{ title: nav.feed, headerShown: false }} />
      <Stack.Screen name="CommunityPostDetail" component={CommunityPostDetailScreen} options={{ title: nav.detail }} />
      <Stack.Screen name="CreateCommunityPost" component={CreateCommunityPostScreen} options={{ title: nav.create }} />
      <Stack.Screen name="EditCommunityPost" component={EditCommunityPostScreen} options={{ title: nav.editPost }} />
      <Stack.Screen name="TeacherCommunityProfile" component={TeacherCommunityProfileScreen} options={{ title: nav.profile }} />
      <Stack.Screen name="SavedCommunityPosts" component={SavedCommunityPostsScreen} options={{ title: nav.saved }} />
    </Stack.Navigator>
  );
}
