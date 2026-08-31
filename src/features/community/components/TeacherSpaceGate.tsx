import { Ionicons } from '@expo/vector-icons';
import { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../../components/Screen';
import { useAuth } from '../../../context/AuthProvider';
import { useLanguage } from '../../../context/LanguageProvider';
import { useTheme } from '../../../context/ThemeProvider';
import { getCommunityCopy } from '../../../i18n/communityCopy';

// Shared auth guard for every Teacher Space screen (feed, post detail,
// create post, teacher profile). `children` is only ever rendered once a
// signed-in session is CONFIRMED - not just "not yet known to be a guest".
// Because the data-fetching hooks (useCommunityFeed, useCommunityPostDetail,
// useTeacherPublicProfile(s), useCreateCommunityPost) all live inside the
// wrapped screen component, they are never even mounted - and so never
// issue a query - for a guest, or during the initial session bootstrap.
export function TeacherSpaceGate({ navigation, children }: { navigation: any; children: ReactNode }) {
  const { colors } = useTheme();
  const { isGuest, loading } = useAuth();
  const { language, isRTL } = useLanguage();
  const copy = getCommunityCopy(language);
  const row = isRTL ? ('row-reverse' as const) : ('row' as const);

  if (loading) {
    return (
      <Screen style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </Screen>
    );
  }

  if (isGuest) {
    return (
      <Screen style={styles.center}>
        <View style={[styles.guestIcon, { backgroundColor: `${colors.primary}18` }]}>
          <Ionicons name="people-outline" size={34} color={colors.primary} />
        </View>
        <Text style={[styles.guestTitle, { color: colors.text, textAlign: 'center' }]}>{copy.feed.guestTitle}</Text>
        <Text style={[styles.guestText, { color: colors.muted, textAlign: 'center', writingDirection: isRTL ? 'rtl' : 'ltr' }]}>
          {copy.feed.guestText}
        </Text>
        <Pressable
          onPress={() => navigation.navigate('Main', { screen: 'Profile', params: { screen: 'SignIn' } })}
          style={[styles.signInButton, { backgroundColor: colors.primary, flexDirection: row }]}
        >
          <Ionicons name="log-in-outline" size={19} color="#0B1833" />
          <Text style={styles.signInButtonText}>{copy.feed.signIn}</Text>
        </Pressable>
      </Screen>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 12 },
  guestIcon: { width: 62, height: 62, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  guestTitle: { fontWeight: '900', fontSize: 18 },
  guestText: { lineHeight: 21, fontSize: 13 },
  signInButton: { minHeight: 52, borderRadius: 16, paddingHorizontal: 22, alignItems: 'center', justifyContent: 'center', gap: 8 },
  signInButtonText: { color: '#0B1833', fontWeight: '900', fontSize: 15 }
});
