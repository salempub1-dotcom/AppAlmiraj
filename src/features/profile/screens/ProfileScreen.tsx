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
  const align = isRTL ? ('right' as const) : ('left' as const);
  const row = isRTL ? ('row-reverse' as const) : ('row' as const);
  const fullName = session?.user.user_metadata?.full_name?.trim?.() || session?.user.email?.split('@')[0] || '';
  const initial = fullName ? fullName[0]?.toUpperCase() : 'أ';

  const languages: { key: AppLanguage; label: string }[] = [
    { key: 'ar', label: t('common.arabic') },
    { key: 'en', label: t('common.english') }
  ];
  const themes = [
    { key: 'system' as const, label: t('profile.system'), icon: 'phone-portrait-outline' as const },
    { key: 'light' as const, label: t('profile.light'), icon: 'sunny-outline' as const },
    { key: 'dark' as const, label: t('profile.dark'), icon: 'moon-outline' as const }
  ];

  if (isGuest) {
    return (
      <Screen scroll style={styles.page}>
        <View style={[styles.topTitle, { flexDirection: row }]}>
          <Text style={[styles.title, { color: colors.text }]}>حسابي</Text>
        </View>
        <View style={styles.guestCard}>
          <View style={styles.guestIcon}><Ionicons name="person-outline" size={30} color="#0B1833" /></View>
          <Text style={styles.guestTitle}>{t('profile.welcome')}</Text>
          <Text style={styles.guestText}>{t('profile.guestText')}</Text>
          <Pressable onPress={() => navigation.navigate('SignIn')} style={styles.primaryButton}><Text style={styles.primaryText}>{t('profile.signIn')}</Text></Pressable>
          <Pressable onPress={() => navigation.navigate('SignUp')} style={styles.outlineButton}><Text style={styles.outlineText}>{t('profile.signUp')}</Text></Pressable>
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll style={styles.page}>
      <View style={[styles.topTitle, { flexDirection: row }]}>
        <Text style={[styles.title, { color: colors.text }]}>حسابي</Text>
        <Pressable onPress={() => navigation.navigate('EditProfile')} style={[styles.settingsButton, { borderColor: colors.border, backgroundColor: colors.card }]}><Ionicons name="settings-outline" size={20} color={colors.text} /></Pressable>
      </View>

      <View style={styles.profileHeader}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{initial}</Text></View>
        <Text style={[styles.name, { color: colors.text }]}>{fullName}</Text>
        <Text style={[styles.email, { color: colors.muted }]}>{session?.user.email}</Text>
        <View style={styles.teacherBadge}><Ionicons name="school-outline" size={14} color="#0B1833" /><Text style={styles.teacherBadgeText}>{t('profile.teacherAccount')}</Text></View>
      </View>

      <View style={[styles.menuCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <MenuItem icon="person-outline" title={t('profile.editProfile')} onPress={() => navigation.navigate('EditProfile')} colors={colors} row={row} />
        <Divider color={colors.border} />
        <MenuItem icon="bag-handle-outline" title={t('profile.orders')} onPress={() => navigation.getParent?.()?.navigate?.('Store', { screen: 'MyOrders' })} colors={colors} row={row} />
        <Divider color={colors.border} />
        <MenuItem icon="people-outline" title={communityCopy.entry.title} onPress={() => navigation.getParent?.()?.navigate?.('Community')} colors={colors} row={row} />
        {isAdmin ? <><Divider color={colors.border} /><MenuItem icon="library-outline" title={adminCopy.entry.title} onPress={() => navigation.navigate('ContentManager')} colors={colors} row={row} /></> : null}
        {isAdmin ? <><Divider color={colors.border} /><MenuItem icon="shield-checkmark-outline" title={adminCopy.communityModerationEntry.title} onPress={() => navigation.navigate('CommunityModeration')} colors={colors} row={row} /></> : null}
      </View>

      <View style={styles.sectionBlock}>
        <Text style={[styles.sectionTitle, { color: colors.text, textAlign: align }]}>{t('profile.language')}</Text>
        <View style={[styles.segment, { backgroundColor: colors.card, borderColor: colors.border, flexDirection: row }]}>
          {languages.map((item) => {
            const active = language === item.key;
            return <Pressable key={item.key} onPress={() => setLanguage(item.key)} style={[styles.segmentItem, active && styles.segmentActive]}><Text style={[styles.segmentText, { color: active ? '#0B1833' : colors.text }]}>{item.label}</Text></Pressable>;
          })}
        </View>
      </View>

      <View style={styles.sectionBlock}>
        <Text style={[styles.sectionTitle, { color: colors.text, textAlign: align }]}>{t('profile.appearance')}</Text>
        <View style={[styles.segment, { backgroundColor: colors.card, borderColor: colors.border, flexDirection: row }]}>
          {themes.map((item) => {
            const active = preference === item.key;
            return <Pressable key={item.key} onPress={() => setPreference(item.key)} style={[styles.segmentItem, active && styles.segmentActive]}><Ionicons name={item.icon} size={16} color={active ? '#0B1833' : colors.muted} /><Text style={[styles.segmentText, { color: active ? '#0B1833' : colors.text }]}>{item.label}</Text></Pressable>;
          })}
        </View>
      </View>

      <Pressable onPress={() => signOut()} style={[styles.signOut, { borderColor: colors.border, backgroundColor: colors.card, flexDirection: row }]}>
        <Ionicons name="log-out-outline" size={18} color={colors.danger} />
        <Text style={[styles.signOutText, { color: colors.danger }]}>{t('profile.signOut')}</Text>
      </Pressable>
    </Screen>
  );
}

function MenuItem({ icon, title, onPress, colors, row }: any) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.menuItem, { flexDirection: row, opacity: pressed ? 0.6 : 1 }]}>
      <Ionicons name="chevron-back" size={18} color={colors.muted} />
      <Text style={[styles.menuTitle, { color: colors.text }]}>{title}</Text>
      <View style={[styles.menuIcon, { backgroundColor: colors.surface }]}><Ionicons name={icon} size={20} color={colors.text} /></View>
    </Pressable>
  );
}

function Divider({ color }: { color: string }) { return <View style={[styles.divider, { backgroundColor: color }]} />; }

const styles = StyleSheet.create({
  page: { gap: 18 },
  topTitle: { alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 27, fontWeight: '900' },
  settingsButton: { width: 40, height: 40, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  profileHeader: { alignItems: 'center', gap: 5, paddingVertical: 3 },
  avatar: { width: 82, height: 82, borderRadius: 41, backgroundColor: '#AFC4D7', alignItems: 'center', justifyContent: 'center', marginBottom: 5, borderWidth: 4, borderColor: '#FFFFFF' },
  avatarText: { color: '#FFFFFF', fontSize: 30, fontWeight: '900' },
  name: { fontSize: 20, fontWeight: '900' },
  email: { fontSize: 12.5 },
  teacherBadge: { flexDirection: 'row-reverse', alignItems: 'center', gap: 5, backgroundColor: '#F3E3A8', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, marginTop: 5 },
  teacherBadgeText: { color: '#0B1833', fontSize: 10.5, fontWeight: '900' },
  menuCard: { borderWidth: 1, borderRadius: 20, overflow: 'hidden' },
  menuItem: { minHeight: 58, paddingHorizontal: 14, alignItems: 'center', gap: 11 },
  menuTitle: { flex: 1, textAlign: 'right', fontSize: 14, fontWeight: '800' },
  menuIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: 14 },
  sectionBlock: { gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '900' },
  segment: { borderWidth: 1, borderRadius: 16, padding: 4, gap: 4 },
  segmentItem: { flex: 1, minHeight: 42, borderRadius: 12, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 5 },
  segmentActive: { backgroundColor: '#D4AF37' },
  segmentText: { fontSize: 12, fontWeight: '800' },
  signOut: { minHeight: 52, borderWidth: 1, borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 8 },
  signOutText: { fontWeight: '900' },
  guestCard: { backgroundColor: '#0B1833', borderRadius: 24, padding: 22, gap: 11, alignItems: 'center' },
  guestIcon: { width: 58, height: 58, borderRadius: 20, backgroundColor: '#D4AF37', alignItems: 'center', justifyContent: 'center' },
  guestTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '900' },
  guestText: { color: '#C7D0DE', textAlign: 'center', lineHeight: 21 },
  primaryButton: { width: '100%', minHeight: 50, borderRadius: 15, backgroundColor: '#D4AF37', alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  primaryText: { color: '#0B1833', fontWeight: '900' },
  outlineButton: { width: '100%', minHeight: 48, borderRadius: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' },
  outlineText: { color: '#FFFFFF', fontWeight: '800' }
});
