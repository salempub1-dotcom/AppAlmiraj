import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../../components/Screen';
import { useAuth } from '../../../context/AuthProvider';
import { AppLanguage, useLanguage } from '../../../context/LanguageProvider';
import { useTheme } from '../../../context/ThemeProvider';
import { useIsAdmin } from '../../../hooks/useAdminAccess';
import { getAdminCopy } from '../../../i18n/adminCopy';
import { getCommunityCopy } from '../../../i18n/communityCopy';

export function ProfileScreen({ navigation }: any) {
  const { session, isGuest, signOut } = useAuth();
  const { colors, preference, setPreference } = useTheme();
  const { language, setLanguage, t, isRTL } = useLanguage();
  const { isAdmin } = useIsAdmin();
  const adminCopy = getAdminCopy(language);
  const communityCopy = getCommunityCopy(language);
  const align = isRTL ? 'right' as const : 'left' as const;
  const row = isRTL ? 'row-reverse' as const : 'row' as const;

  const themes = [
    { key: 'system' as const, label: t('profile.system'), icon: 'phone-portrait-outline' as const },
    { key: 'dark' as const, label: t('profile.dark'), icon: 'moon-outline' as const },
    { key: 'light' as const, label: t('profile.light'), icon: 'sunny-outline' as const }
  ];
  const languages: { key: AppLanguage; label: string }[] = [
    { key: 'ar', label: t('common.arabic') },
    { key: 'en', label: t('common.english') }
  ];

  return (
    <Screen scroll style={styles.page}>
      <View style={[styles.headerRow, { flexDirection: row }]}>
        <View style={[styles.headerIcon, { backgroundColor: `${colors.primary}18` }]}>
          <Ionicons name="person-outline" size={22} color={colors.primary} />
        </View>
        <View style={styles.headerCopy}>
          <Text style={[styles.title, { color: colors.text, textAlign: align }]}>{t('profile.title')}</Text>
          <Text style={[styles.subtitle, { color: colors.muted, textAlign: align }]}>{t('profile.subtitle')}</Text>
        </View>
      </View>

      {isGuest ? (
        <View style={[styles.guestHero, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
          <View style={styles.guestAvatar}><Ionicons name="person" size={31} color="#0B1833" /></View>
          <Text style={[styles.guestTitle, { textAlign: align }]}>{t('profile.welcome')}</Text>
          <Text style={[styles.guestText, { textAlign: align, writingDirection: isRTL ? 'rtl' : 'ltr' }]}>{t('profile.guestText')}</Text>
          <Pressable onPress={() => navigation.navigate('SignIn')} style={[styles.primaryButton, { flexDirection: row }]}>
            <Ionicons name="log-in-outline" size={19} color="#0B1833" />
            <Text style={styles.primaryButtonText}>{t('profile.signIn')}</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate('SignUp')} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>{t('profile.signUp')}</Text></Pressable>
        </View>
      ) : (
        <View style={[styles.accountCard, { backgroundColor: colors.card, borderColor: colors.border, flexDirection: row }]}> 
          <View style={[styles.avatar, { backgroundColor: `${colors.primary}18` }]}><Ionicons name="person" size={28} color={colors.primary} /></View>
          <View style={styles.accountCopy}>
            <Text style={[styles.accountLabel, { color: colors.muted, textAlign: align }]}>{t('profile.teacherAccount')}</Text>
            <Text numberOfLines={1} style={[styles.email, { color: colors.text, textAlign: align }]}>{session?.user.email}</Text>
          </View>
          <View style={[styles.verified, { backgroundColor: `${colors.primary}18` }]}><Ionicons name="checkmark-circle" size={18} color={colors.primary} /></View>
        </View>
      )}

      {!isGuest && (
        <View style={styles.menuList}>
          <Pressable onPress={() => navigation.navigate('EditProfile')} style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.border, flexDirection: row }]}> 
            <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={18} color={colors.muted} />
            <View style={styles.menuCopy}>
              <Text style={[styles.menuTitle, { color: colors.text, textAlign: align }]}>{t('profile.editProfile')}</Text>
              <Text style={[styles.menuText, { color: colors.muted, textAlign: align }]}>{t('profile.editProfileText')}</Text>
            </View>
            <View style={[styles.menuIcon, { backgroundColor: `${colors.primary}16` }]}><Ionicons name="create-outline" size={20} color={colors.primary} /></View>
          </Pressable>

          <View style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.border, flexDirection: row }]}> 
            <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={18} color={colors.muted} />
            <View style={styles.menuCopy}>
              <Text style={[styles.menuTitle, { color: colors.text, textAlign: align }]}>{t('profile.orders')}</Text>
              <Text style={[styles.menuText, { color: colors.muted, textAlign: align }]}>{t('profile.ordersText')}</Text>
            </View>
            <View style={[styles.menuIcon, { backgroundColor: `${colors.primary}16` }]}><Ionicons name="cube-outline" size={20} color={colors.primary} /></View>
          </View>

          <Pressable onPress={() => navigation.navigate('Community')} style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.border, flexDirection: row }]}>
            <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={18} color={colors.muted} />
            <View style={styles.menuCopy}>
              <Text style={[styles.menuTitle, { color: colors.text, textAlign: align }]}>{communityCopy.entry.title}</Text>
              <Text style={[styles.menuText, { color: colors.muted, textAlign: align }]}>{communityCopy.entry.subtitle}</Text>
            </View>
            <View style={[styles.menuIcon, { backgroundColor: `${colors.primary}16` }]}><Ionicons name="people-outline" size={20} color={colors.primary} /></View>
          </Pressable>

          {isAdmin && (
            <Pressable onPress={() => navigation.navigate('ContentManager')} style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.border, flexDirection: row }]}>
              <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={18} color={colors.muted} />
              <View style={styles.menuCopy}>
                <Text style={[styles.menuTitle, { color: colors.text, textAlign: align }]}>{adminCopy.entry.title}</Text>
                <Text style={[styles.menuText, { color: colors.muted, textAlign: align }]}>{adminCopy.entry.subtitle}</Text>
              </View>
              <View style={[styles.menuIcon, { backgroundColor: `${colors.primary}16` }]}><Ionicons name="library-outline" size={20} color={colors.primary} /></View>
            </Pressable>
          )}

          {isAdmin && (
            <Pressable onPress={() => navigation.navigate('CommunityModeration')} style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.border, flexDirection: row }]}>
              <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={18} color={colors.muted} />
              <View style={styles.menuCopy}>
                <Text style={[styles.menuTitle, { color: colors.text, textAlign: align }]}>{adminCopy.communityModerationEntry.title}</Text>
                <Text style={[styles.menuText, { color: colors.muted, textAlign: align }]}>{adminCopy.communityModerationEntry.subtitle}</Text>
              </View>
              <View style={[styles.menuIcon, { backgroundColor: `${colors.primary}16` }]}><Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} /></View>
            </Pressable>
          )}
        </View>
      )}

      <View>
        <Text style={[styles.sectionTitle, { color: colors.text, textAlign: align }]}>{t('profile.language')}</Text>
        <Text style={[styles.sectionText, { color: colors.muted, textAlign: align }]}>{t('profile.languageText')}</Text>
      </View>
      <View style={[styles.themeSelector, { backgroundColor: colors.card, borderColor: colors.border, flexDirection: row }]}> 
        {languages.map((item) => {
          const active = language === item.key;
          return <Pressable key={item.key} onPress={() => setLanguage(item.key)} style={[styles.themeItem, { flexDirection: row }, active && { backgroundColor: colors.primary }]}>
            <Ionicons name={item.key === 'ar' ? 'language-outline' : 'globe-outline'} size={18} color={active ? '#0B1833' : colors.muted} />
            <Text style={[styles.themeText, { color: active ? '#0B1833' : colors.text }]}>{item.label}</Text>
          </Pressable>;
        })}
      </View>

      <View>
        <Text style={[styles.sectionTitle, { color: colors.text, textAlign: align }]}>{t('profile.appearance')}</Text>
        <Text style={[styles.sectionText, { color: colors.muted, textAlign: align }]}>{t('profile.appearanceText')}</Text>
      </View>
      <View style={[styles.themeSelector, { backgroundColor: colors.card, borderColor: colors.border, flexDirection: row }]}> 
        {themes.map((item) => {
          const active = preference === item.key;
          return <Pressable key={item.key} onPress={() => setPreference(item.key)} style={[styles.themeItem, { flexDirection: row }, active && { backgroundColor: colors.primary }]}>
            <Ionicons name={item.icon} size={18} color={active ? '#0B1833' : colors.muted} />
            <Text style={[styles.themeText, { color: active ? '#0B1833' : colors.text }]}>{item.label}</Text>
          </Pressable>;
        })}
      </View>

      {!isGuest && <Pressable onPress={() => signOut()} style={[styles.signOut, { borderColor: colors.border, flexDirection: row }]}><Ionicons name="log-out-outline" size={19} color={colors.danger} /><Text style={[styles.signOutText, { color: colors.danger }]}>{t('profile.signOut')}</Text></Pressable>}
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { gap: 22 }, headerRow: { alignItems: 'center', gap: 12 }, headerIcon: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center' }, headerCopy: { flex: 1 },
  title: { fontSize: 29, fontWeight: '900' }, subtitle: { marginTop: 3, fontSize: 12.5 },
  guestHero: { backgroundColor: '#0B1833', borderRadius: 30, padding: 22, gap: 12 }, guestAvatar: { width: 54, height: 54, borderRadius: 18, backgroundColor: '#D4AF37', alignItems: 'center', justifyContent: 'center' }, guestTitle: { color: '#FFFFFF', fontSize: 24, lineHeight: 34, fontWeight: '900' }, guestText: { color: '#C6D0DE', lineHeight: 23 },
  primaryButton: { width: '100%', minHeight: 52, borderRadius: 16, backgroundColor: '#D4AF37', gap: 8, alignItems: 'center', justifyContent: 'center', marginTop: 4 }, primaryButtonText: { color: '#0B1833', fontWeight: '900', fontSize: 15.5 }, secondaryButton: { width: '100%', minHeight: 50, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' }, secondaryButtonText: { color: '#FFFFFF', fontWeight: '800' },
  accountCard: { borderWidth: 1, borderRadius: 22, padding: 16, alignItems: 'center', gap: 12 }, avatar: { width: 50, height: 50, borderRadius: 17, alignItems: 'center', justifyContent: 'center' }, accountCopy: { flex: 1 }, accountLabel: { fontSize: 11.5, marginBottom: 3 }, email: { fontWeight: '800', fontSize: 14 }, verified: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  menuList: { gap: 10 }, menuItem: { borderWidth: 1, borderRadius: 20, padding: 14, alignItems: 'center', gap: 10 }, menuCopy: { flex: 1 }, menuTitle: { fontWeight: '900' }, menuText: { marginTop: 4, fontSize: 11.5 }, menuIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 20, fontWeight: '900' }, sectionText: { marginTop: 3, fontSize: 12 }, themeSelector: { borderWidth: 1, borderRadius: 20, padding: 6, gap: 5 }, themeItem: { flex: 1, minHeight: 48, borderRadius: 15, gap: 6, alignItems: 'center', justifyContent: 'center' }, themeText: { fontWeight: '800', fontSize: 12.5 }, signOut: { borderWidth: 1, borderRadius: 18, minHeight: 52, gap: 8, alignItems: 'center', justifyContent: 'center' }, signOutText: { fontWeight: '900' }
});
