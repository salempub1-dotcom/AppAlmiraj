import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { AL_MIRAJ_LOGO_DATA_URI } from '../../../assets/alMirajLogo';
import { Screen } from '../../../components/Screen';
import { useAuth } from '../../../context/AuthProvider';
import { useLanguage } from '../../../context/LanguageProvider';
import { useTheme } from '../../../context/ThemeProvider';
import { useIsAdmin } from '../../../hooks/useAdminAccess';
import { getAdminCopy } from '../../../i18n/adminCopy';
import { getCommunityCopy } from '../../../i18n/communityCopy';
import { profileRepository } from '../../../repositories/profileRepository';
import { palette } from '../../../theme/tokens';

export function ProfileScreen({ navigation }: any) {
  const { session, isGuest, signOut } = useAuth();
  const { colors, preference, setPreference } = useTheme();
  const { language, setLanguage, t, isRTL } = useLanguage();
  const { isAdmin } = useIsAdmin();
  const adminCopy = getAdminCopy(language);
  const communityCopy = getCommunityCopy(language);
  const row = isRTL ? ('row-reverse' as const) : ('row' as const);

  const { data: profileResult } = useQuery({
    queryKey: ['profile', 'me', session?.user.id],
    queryFn: () => profileRepository.getMyProfile(),
    enabled: !!session
  });

  const profile = profileResult?.data;
  const fullName = profile?.full_name?.trim?.() || session?.user.user_metadata?.full_name?.trim?.() || session?.user.email?.split('@')[0] || '';
  const avatarUrl = profile?.avatar_url || session?.user.user_metadata?.avatar_url || null;
  const subject = profile?.subject?.trim?.() || t('profile.teacherAccount');
  const initial = fullName ? fullName[0]?.toUpperCase() : 'أ';

  const appearanceLabel = preference === 'dark' ? 'داكن' : preference === 'light' ? 'فاتح' : 'النظام';
  const cycleAppearance = () => {
    if (preference === 'system') setPreference('light');
    else if (preference === 'light') setPreference('dark');
    else setPreference('system');
  };

  if (isGuest) {
    return (
      <Screen scroll style={styles.page}>
        <View style={styles.heroGuest}>
          <EducationalBackdrop />
          <Image source={{ uri: AL_MIRAJ_LOGO_DATA_URI }} style={styles.guestLogo} resizeMode="contain" />
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
      <View style={styles.heroCard}>
        <EducationalBackdrop />

        <View style={[styles.heroTopRow, { flexDirection: row }]}>
          <Text style={styles.heroTitle}>حسابي</Text>
          <View style={styles.brandMini}>
            <Image source={{ uri: AL_MIRAJ_LOGO_DATA_URI }} style={styles.brandLogo} resizeMode="contain" />
          </View>
        </View>

        <View style={styles.profileHero}>
          <Pressable onPress={() => navigation.navigate('EditProfile')} style={styles.avatarWrap}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatar}><Text style={styles.avatarText}>{initial}</Text></View>
            )}
            <View style={styles.editAvatarBadge}><Ionicons name="camera" size={15} color={palette.navy} /></View>
          </Pressable>
          <Text style={styles.heroName}>{fullName}</Text>
          <Text style={styles.heroSubject}>{subject}</Text>
        </View>

        <View style={styles.quoteCard}>
          <View style={styles.quoteSide}>
            <Ionicons name="book-outline" size={24} color={palette.amberSoft} />
            <Text style={styles.quoteSmall}>مستمرون معًا{`\n`}في رحلة التعليم</Text>
          </View>
          <View style={styles.quoteDivider} />
          <View style={styles.quoteMain}>
            <Text style={styles.quoteText}>بالعلم نصنع{`\n`}مستقبلًا أفضل</Text>
            <View style={styles.quoteLine} />
          </View>
        </View>
      </View>

      <View style={[styles.menuCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <MenuItem icon="person-outline" iconBg="#E5F0FF" iconColor="#2458A6" title={t('profile.editProfile')} onPress={() => navigation.navigate('EditProfile')} colors={colors} row={row} />
        <Divider color={colors.divider} />
        <MenuItem icon="bag-handle-outline" iconBg="#FFF3DC" iconColor="#9A661E" title={t('profile.orders')} onPress={() => navigation.getParent?.()?.navigate?.('Store', { screen: 'MyOrders' })} colors={colors} row={row} />
        <Divider color={colors.divider} />
        <MenuItem icon="school-outline" iconBg="#EEF0FF" iconColor="#3E4BB0" title={communityCopy.entry.title} onPress={() => navigation.getParent?.()?.navigate?.('Community')} colors={colors} row={row} />
        <Divider color={colors.divider} />
        <SettingMenuItem icon="language-outline" iconBg="#E5F5F4" iconColor="#19706B" title="اللغة" value={language === 'ar' ? 'العربية' : 'English'} onPress={() => setLanguage(language === 'ar' ? 'en' : 'ar')} colors={colors} row={row} />
        <Divider color={colors.divider} />
        <SettingMenuItem icon="moon-outline" iconBg="#EEEAFE" iconColor="#5B50B5" title="المظهر" value={appearanceLabel} onPress={cycleAppearance} colors={colors} row={row} />
        {isAdmin ? <><Divider color={colors.divider} /><MenuItem icon="library-outline" iconBg="#EAF1F8" iconColor={colors.secondary} title={adminCopy.entry.title} onPress={() => navigation.navigate('ContentManager')} colors={colors} row={row} /></> : null}
        {isAdmin ? <><Divider color={colors.divider} /><MenuItem icon="shield-checkmark-outline" iconBg="#E8F5EE" iconColor={colors.success} title={adminCopy.communityModerationEntry.title} onPress={() => navigation.navigate('CommunityModeration')} colors={colors} row={row} /></> : null}
        <Divider color={colors.divider} />
        <Pressable onPress={() => signOut()} style={({ pressed }) => [styles.logoutRow, { opacity: pressed ? 0.7 : 1 }]}>
          <Ionicons name="chevron-back" size={18} color="#C76B6B" />
          <Text style={styles.logoutTitle}>{t('profile.signOut')}</Text>
          <View style={styles.logoutIcon}><Ionicons name="log-out-outline" size={20} color="#C94A4A" /></View>
        </Pressable>
      </View>
    </Screen>
  );
}

function EducationalBackdrop() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
      <View style={styles.heroLayerOne} />
      <View style={styles.heroLayerTwo} />
      <View style={styles.bookshelf}>
        <View style={styles.bookTall} /><View style={styles.bookShort} /><View style={styles.bookMid} />
      </View>
      <View style={styles.boardHint} />
      <View style={styles.deskHint} />
      <View style={styles.warmGlow} />
    </View>
  );
}

function MenuItem({ icon, iconBg, iconColor, title, onPress, colors, row }: any) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.menuItem, { flexDirection: row, opacity: pressed ? 0.65 : 1 }]}>
      <Ionicons name="chevron-back" size={18} color={colors.muted} />
      <Text style={[styles.menuTitle, { color: colors.text }]}>{title}</Text>
      <View style={[styles.menuIcon, { backgroundColor: iconBg }]}><Ionicons name={icon} size={21} color={iconColor} /></View>
    </Pressable>
  );
}

function SettingMenuItem({ icon, iconBg, iconColor, title, value, onPress, colors, row }: any) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.menuItem, { flexDirection: row, opacity: pressed ? 0.65 : 1 }]}>
      <View style={styles.settingValueWrap}>
        <Text style={[styles.settingValue, { color: colors.muted }]}>{value}</Text>
        <Ionicons name="chevron-back" size={16} color={colors.muted} />
      </View>
      <Text style={[styles.menuTitle, { color: colors.text }]}>{title}</Text>
      <View style={[styles.menuIcon, { backgroundColor: iconBg }]}><Ionicons name={icon} size={21} color={iconColor} /></View>
    </Pressable>
  );
}

function Divider({ color }: { color: string }) {
  return <View style={[styles.divider, { backgroundColor: color }]} />;
}

const styles = StyleSheet.create({
  page: { gap: 14, paddingTop: 10, paddingBottom: 24 },
  heroCard: { minHeight: 410, borderRadius: 30, overflow: 'hidden', backgroundColor: palette.navy, paddingHorizontal: 18, paddingTop: 17, paddingBottom: 18, borderWidth: 1, borderColor: '#1F3A62' },
  heroLayerOne: { position: 'absolute', width: 360, height: 360, borderRadius: 180, backgroundColor: '#17345D', right: -125, top: -145, opacity: 0.92 },
  heroLayerTwo: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: palette.indigo, left: -155, bottom: -145, opacity: 0.35 },
  bookshelf: { position: 'absolute', left: 18, top: 82, width: 70, height: 104, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: 10, flexDirection: 'row', alignItems: 'flex-end', gap: 5, opacity: 0.28 },
  bookTall: { width: 10, height: 63, borderRadius: 3, backgroundColor: '#DCE8F5' },
  bookMid: { width: 10, height: 49, borderRadius: 3, backgroundColor: '#8EA8CC' },
  bookShort: { width: 10, height: 38, borderRadius: 3, backgroundColor: '#E5C96A' },
  boardHint: { position: 'absolute', right: 20, top: 70, width: 112, height: 72, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)', backgroundColor: 'rgba(255,255,255,0.018)', opacity: 0.7 },
  deskHint: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 92, backgroundColor: 'rgba(8,17,31,0.34)' },
  warmGlow: { position: 'absolute', right: -30, bottom: 22, width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(229,201,106,0.13)' },
  heroTopRow: { alignItems: 'center', justifyContent: 'space-between' },
  heroTitle: { color: '#FFFFFF', fontSize: 27, fontWeight: '900' },
  brandMini: { width: 72, height: 58, alignItems: 'center', justifyContent: 'center' },
  brandLogo: { width: 70, height: 58 },
  profileHero: { alignItems: 'center', marginTop: 4 },
  avatarWrap: { width: 116, height: 116, position: 'relative', marginBottom: 11 },
  avatar: { width: 116, height: 116, borderRadius: 58, backgroundColor: '#B6C8DD', alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: '#F5E7B3' },
  avatarImage: { width: 116, height: 116, borderRadius: 58, borderWidth: 4, borderColor: '#F5E7B3' },
  avatarText: { color: '#FFFFFF', fontSize: 38, fontWeight: '900' },
  editAvatarBadge: { position: 'absolute', right: 2, bottom: 2, width: 36, height: 36, borderRadius: 18, backgroundColor: palette.amberSoft, borderWidth: 3, borderColor: palette.navy, alignItems: 'center', justifyContent: 'center' },
  heroName: { color: '#FFFFFF', fontSize: 23, fontWeight: '900', textAlign: 'center' },
  heroSubject: { color: '#BFCBE0', fontSize: 13, marginTop: 4, fontWeight: '700' },
  quoteCard: { marginTop: 16, minHeight: 92, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(190,210,235,0.18)', backgroundColor: 'rgba(17,38,67,0.74)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
  quoteSide: { flex: 1, alignItems: 'center', gap: 5 },
  quoteSmall: { color: '#D3DDEC', fontSize: 11.5, lineHeight: 17, textAlign: 'center', fontWeight: '700' },
  quoteDivider: { width: 1, height: 52, backgroundColor: 'rgba(255,255,255,0.16)', marginHorizontal: 14 },
  quoteMain: { flex: 1.15, alignItems: 'center' },
  quoteText: { color: '#FFFFFF', fontSize: 18, lineHeight: 26, textAlign: 'center', fontWeight: '800' },
  quoteLine: { marginTop: 8, width: 52, height: 2, borderRadius: 2, backgroundColor: palette.amberSoft },
  menuCard: { borderWidth: 1, borderRadius: 24, overflow: 'hidden' },
  menuItem: { minHeight: 61, paddingHorizontal: 14, alignItems: 'center', gap: 11 },
  menuTitle: { flex: 1, textAlign: 'right', fontSize: 14.5, fontWeight: '800' },
  menuIcon: { width: 39, height: 39, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  settingValueWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  settingValue: { fontSize: 12.5, fontWeight: '700' },
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: 14 },
  logoutRow: { minHeight: 61, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: 'rgba(201,74,74,0.06)' },
  logoutTitle: { flex: 1, textAlign: 'right', fontSize: 14.5, fontWeight: '900', color: '#C94A4A' },
  logoutIcon: { width: 39, height: 39, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FDECEC' },
  heroGuest: { borderRadius: 28, overflow: 'hidden', backgroundColor: palette.navy, padding: 24, alignItems: 'center', gap: 12, minHeight: 390, justifyContent: 'center' },
  guestLogo: { width: 125, height: 120, marginBottom: 4 },
  guestTitle: { color: '#FFFFFF', fontSize: 23, fontWeight: '900' },
  guestText: { color: '#C7D0DE', textAlign: 'center', lineHeight: 21 },
  primaryButton: { width: '100%', minHeight: 50, borderRadius: 16, backgroundColor: palette.amberSoft, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  primaryText: { color: palette.navy, fontWeight: '900' },
  outlineButton: { width: '100%', minHeight: 48, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.20)', alignItems: 'center', justifyContent: 'center' },
  outlineText: { color: '#FFFFFF', fontWeight: '800' }
});
