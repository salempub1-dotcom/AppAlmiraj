import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../../components/Screen';
import { useAuth } from '../../../context/AuthProvider';
import { AppLanguage, useLanguage } from '../../../context/LanguageProvider';
import { useTheme } from '../../../context/ThemeProvider';
import { useIsAdmin } from '../../../hooks/useAdminAccess';
import { getAdminCopy } from '../../../i18n/adminCopy';
import { getCommunityCopy } from '../../../i18n/communityCopy';
import { ui } from '../../../theme/ui';

export function ProfileScreen({ navigation }: any) {
  const { session, isGuest, signOut } = useAuth();
  const { colors, preference, setPreference } = useTheme();
  const { language, setLanguage, t, isRTL } = useLanguage();
  const { isAdmin } = useIsAdmin();
  const adminCopy = getAdminCopy(language);
  const communityCopy = getCommunityCopy(language);
  const align = isRTL ? 'right' as const : 'left' as const;
  const row = isRTL ? 'row-reverse' as const : 'row' as const;
  const fullName = session?.user.user_metadata?.full_name?.trim?.() || session?.user.email?.split('@')[0] || '';
  const initial = fullName ? fullName[0]?.toUpperCase() : 'A';

  const themes = [
    { key: 'system' as const, label: t('profile.system'), icon: 'phone-portrait-outline' as const },
    { key: 'dark' as const, label: t('profile.dark'), icon: 'moon-outline' as const },
    { key: 'light' as const, label: t('profile.light'), icon: 'sunny-outline' as const }
  ];
  const languages: { key: AppLanguage; label: string }[] = [
    { key: 'ar', label: t('common.arabic') },
    { key: 'en', label: t('common.english') }
  ];

  const MenuItem = ({ icon, title, text, onPress, accent = false }: { icon: any; title: string; text: string; onPress?: () => void; accent?: boolean }) => (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.menuItem,
        { backgroundColor: colors.card, borderColor: colors.border, flexDirection: row },
        pressed && onPress ? styles.pressed : null
      ]}
    >
      <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={17} color={colors.muted} />
      <View style={styles.menuCopy}>
        <Text style={[styles.menuTitle, { color: colors.text, textAlign: align }]}>{title}</Text>
        <Text style={[styles.menuText, { color: colors.muted, textAlign: align }]}>{text}</Text>
      </View>
      <View style={[styles.menuIcon, { backgroundColor: accent ? `${colors.primary}18` : colors.surface }]}>
        <Ionicons name={icon} size={21} color={accent ? colors.primary : colors.text} />
      </View>
    </Pressable>
  );

  return (
    <Screen scroll style={styles.page}>
      <View style={[styles.headerRow, { flexDirection: row }]}>
        <View style={[styles.headerIcon, { backgroundColor: `${colors.primary}18` }]}>
          <Ionicons name="person-outline" size={21} color={colors.primary} />
        </View>
        <View style={styles.headerCopy}>
          <Text style={[styles.title, { color: colors.text, textAlign: align }]}>{t('profile.title')}</Text>
          <Text style={[styles.subtitle, { color: colors.muted, textAlign: align }]}>{t('profile.subtitle')}</Text>
        </View>
      </View>

      {isGuest ? (
        <View style={[styles.guestHero, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
          <View style={styles.guestAvatar}><Ionicons name="person" size={28} color="#0B1833" /></View>
          <Text style={[styles.guestTitle, { textAlign: align }]}>{t('profile.welcome')}</Text>
          <Text style={[styles.guestText, { textAlign: align, writingDirection: isRTL ? 'rtl' : 'ltr' }]}>{t('profile.guestText')}</Text>
          <Pressable onPress={() => navigation.navigate('SignIn')} style={({ pressed }) => [styles.primaryButton, { flexDirection: row }, pressed && styles.pressed]}>
            <Ionicons name="log-in-outline" size={18} color="#0B1833" />
            <Text style={styles.primaryButtonText}>{t('profile.signIn')}</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate('SignUp')} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
            <Text style={styles.secondaryButtonText}>{t('profile.signUp')}</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.accountCard}>
          <View style={[styles.accountTop, { flexDirection: row }]}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{initial}</Text></View>
            <View style={styles.accountCopy}>
              <View style={[styles.accountLabelRow, { flexDirection: row }]}>
                <Text style={[styles.accountLabel, { textAlign: align }]}>{t('profile.teacherAccount')}</Text>
                <View style={styles.teacherChip}><Ionicons name="school-outline" size={13} color="#D4AF37" /></View>
              </View>
              <Text numberOfLines={1} style={[styles.accountName, { textAlign: align }]}>{fullName}</Text>
              <Text numberOfLines={1} style={[styles.email, { textAlign: align }]}>{session?.user.email}</Text>
            </View>
          </View>
          <Pressable onPress={() => navigation.navigate('EditProfile')} style={({ pressed }) => [styles.editInline, { flexDirection: row }, pressed && styles.pressed]}>
            <Ionicons name="create-outline" size={16} color="#E8C568" />
            <Text style={styles.editInlineText}>{t('profile.editProfile')}</Text>
          </Pressable>
        </View>
      )}

      {!isGuest && (
        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionLabel, { color: colors.muted, textAlign: align }]}>{language === 'ar' ? 'حسابك' : 'Your account'}</Text>
          <View style={styles.menuList}>
            <MenuItem icon="create-outline" title={t('profile.editProfile')} text={t('profile.editProfileText')} onPress={() => navigation.navigate('EditProfile')} />
            <MenuItem icon="bag-handle-outline" title={t('profile.orders')} text={t('profile.ordersText')} />
            <MenuItem icon="people-outline" title={communityCopy.entry.title} text={communityCopy.entry.subtitle} onPress={() => navigation.navigate('Community')} />
            {isAdmin && <MenuItem accent icon="library-outline" title={adminCopy.entry.title} text={adminCopy.entry.subtitle} onPress={() => navigation.navigate('ContentManager')} />}
            {isAdmin && <MenuItem accent icon="shield-checkmark-outline" title={adminCopy.communityModerationEntry.title} text={adminCopy.communityModerationEntry.subtitle} onPress={() => navigation.navigate('CommunityModeration')} />}
          </View>
        </View>
      )}

      <View style={styles.sectionBlock}>
        <View>
          <Text style={[styles.sectionTitle, { color: colors.text, textAlign: align }]}>{t('profile.language')}</Text>
          <Text style={[styles.sectionText, { color: colors.muted, textAlign: align }]}>{t('profile.languageText')}</Text>
        </View>
        <View style={[styles.selector, { backgroundColor: colors.card, borderColor: colors.border, flexDirection: row }]}>
          {languages.map((item) => {
            const active = language === item.key;
            return (
              <Pressable key={item.key} onPress={() => setLanguage(item.key)} style={({ pressed }) => [styles.selectorItem, { flexDirection: row }, active && { backgroundColor: colors.primary }, pressed && styles.pressed]}>
                <Ionicons name={item.key === 'ar' ? 'language-outline' : 'globe-outline'} size={17} color={active ? '#0B1833' : colors.muted} />
                <Text style={[styles.selectorText, { color: active ? '#0B1833' : colors.text }]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.sectionBlock}>
        <View>
          <Text style={[styles.sectionTitle, { color: colors.text, textAlign: align }]}>{t('profile.appearance')}</Text>
          <Text style={[styles.sectionText, { color: colors.muted, textAlign: align }]}>{t('profile.appearanceText')}</Text>
        </View>
        <View style={[styles.selector, { backgroundColor: colors.card, borderColor: colors.border, flexDirection: row }]}>
          {themes.map((item) => {
            const active = preference === item.key;
            return (
              <Pressable key={item.key} onPress={() => setPreference(item.key)} style={({ pressed }) => [styles.selectorItem, { flexDirection: row }, active && { backgroundColor: colors.primary }, pressed && styles.pressed]}>
                <Ionicons name={item.icon} size={17} color={active ? '#0B1833' : colors.muted} />
                <Text style={[styles.selectorText, { color: active ? '#0B1833' : colors.text }]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {!isGuest && (
        <Pressable onPress={() => signOut()} style={({ pressed }) => [styles.signOut, { borderColor: colors.border, flexDirection: row }, pressed && styles.pressed]}>
          <Ionicons name="log-out-outline" size={18} color={colors.danger} />
          <Text style={[styles.signOutText, { color: colors.danger }]}>{t('profile.signOut')}</Text>
        </Pressable>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { gap: 18 },
  headerRow: { alignItems: 'center', gap: 11 },
  headerIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1 },
  title: { fontSize: 26, fontWeight: '900' },
  subtitle: { marginTop: 2, fontSize: 12.5 },
  guestHero: { backgroundColor: '#0B1833', borderRadius: ui.radius.xl, padding: 20, gap: 11 },
  guestAvatar: { width: 50, height: 50, borderRadius: 17, backgroundColor: '#D4AF37', alignItems: 'center', justifyContent: 'center' },
  guestTitle: { color: '#FFFFFF', fontSize: 22, lineHeight: 30, fontWeight: '900' },
  guestText: { color: '#C6D0DE', lineHeight: 22, fontSize: 14 },
  primaryButton: { width: '100%', minHeight: ui.controlHeight, borderRadius: ui.radius.md, backgroundColor: '#D4AF37', gap: 8, alignItems: 'center', justifyContent: 'center', marginTop: 3 },
  primaryButtonText: { color: '#0B1833', fontWeight: '900', fontSize: 15 },
  secondaryButton: { width: '100%', minHeight: ui.compactControlHeight, borderRadius: ui.radius.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  secondaryButtonText: { color: '#FFFFFF', fontWeight: '800' },
  accountCard: { backgroundColor: '#132443', borderWidth: 1, borderColor: '#243858', borderRadius: ui.radius.xl, padding: 18, gap: 14 },
  accountTop: { alignItems: 'center', gap: 13 },
  avatar: { width: 54, height: 54, borderRadius: 18, backgroundColor: '#E8C568', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#0B1833', fontSize: 22, fontWeight: '900' },
  accountCopy: { flex: 1, minWidth: 0 },
  accountLabelRow: { alignItems: 'center', gap: 7 },
  accountLabel: { color: '#E8C568', fontSize: 11.5, fontWeight: '800' },
  teacherChip: { width: 24, height: 24, borderRadius: 8, backgroundColor: '#233756', alignItems: 'center', justifyContent: 'center' },
  accountName: { color: '#FFFFFF', fontWeight: '900', fontSize: 17, marginTop: 4 },
  email: { color: '#C5CFDD', fontWeight: '600', fontSize: 12.5, marginTop: 2 },
  editInline: { alignSelf: 'flex-start', alignItems: 'center', gap: 7, backgroundColor: '#233756', minHeight: 38, paddingHorizontal: 12, borderRadius: 12 },
  editInlineText: { color: '#E8C568', fontWeight: '800', fontSize: 12.5 },
  sectionBlock: { gap: 10 },
  sectionLabel: { fontSize: 11.5, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  menuList: { gap: 8 },
  menuItem: { borderWidth: 1, borderRadius: ui.radius.lg, padding: 14, alignItems: 'center', gap: 11 },
  menuCopy: { flex: 1 },
  menuTitle: { fontWeight: '800', fontSize: 14.5 },
  menuText: { marginTop: 3, fontSize: 11.5, lineHeight: 17 },
  menuIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '900' },
  sectionText: { marginTop: 2, fontSize: 11.5 },
  selector: { borderWidth: 1, borderRadius: ui.radius.lg, padding: 5, gap: 4 },
  selectorItem: { flex: 1, minHeight: 44, borderRadius: 13, gap: 5, alignItems: 'center', justifyContent: 'center' },
  selectorText: { fontWeight: '800', fontSize: 12 },
  signOut: { borderWidth: 1, borderRadius: ui.radius.md, minHeight: ui.controlHeight, gap: 8, alignItems: 'center', justifyContent: 'center' },
  signOutText: { fontWeight: '900' },
  pressed: { opacity: 0.82, transform: [{ scale: 0.985 }] }
});
