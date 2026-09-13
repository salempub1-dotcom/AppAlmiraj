import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
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
  const appearance = preference === 'dark' ? t('profile.dark') : preference === 'light' ? t('profile.light') : t('profile.system');

  const chooseLanguage = () => Alert.alert(t('profile.language'), t('profile.languageText'), [
    { text: t('common.arabic'), onPress: () => void setLanguage('ar') },
    { text: t('common.english'), onPress: () => void setLanguage('en') },
    { text: language === 'ar' ? 'إلغاء' : 'Cancel', style: 'cancel' }
  ]);

  const chooseAppearance = () => Alert.alert(t('profile.appearance'), t('profile.appearanceText'), [
    { text: t('profile.system'), onPress: () => void setPreference('system') },
    { text: t('profile.light'), onPress: () => void setPreference('light') },
    { text: t('profile.dark'), onPress: () => void setPreference('dark') },
    { text: language === 'ar' ? 'إلغاء' : 'Cancel', style: 'cancel' }
  ]);

  if (isGuest) {
    return (
      <Screen scroll style={styles.page}>
        <View style={[styles.guestCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.guestIcon}><Ionicons name="school" size={34} color={palette.navy} /></View>
          <Text style={[styles.guestTitle, { color: colors.text }]}>{t('profile.welcome')}</Text>
          <Text style={[styles.guestText, { color: colors.muted }]}>{t('profile.guestText')}</Text>
          <Pressable onPress={() => navigation.navigate('SignIn')} style={styles.primaryButton}><Text style={styles.primaryText}>{t('profile.signIn')}</Text></Pressable>
          <Pressable onPress={() => navigation.navigate('SignUp')} style={[styles.secondaryButton, { borderColor: colors.border }]}><Text style={[styles.secondaryText, { color: colors.text }]}>{t('profile.signUp')}</Text></Pressable>
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll style={styles.page}>
      <View style={styles.header}>
        <View style={styles.glowA} /><View style={styles.glowB} />
        <View style={[styles.headerTop, { flexDirection: row }]}>
          <Text style={styles.headerTitle}>{t('profile.title')}</Text>
          <View style={styles.headerIcon}><Ionicons name="school-outline" size={20} color="#E1BD4F" /></View>
        </View>

        <View style={styles.identity}>
          <Pressable onPress={() => navigation.navigate('EditProfile')} style={styles.avatarWrap}>
            {avatarUrl ? <Image source={{ uri: avatarUrl }} style={styles.avatar} /> : <View style={[styles.avatar, styles.avatarFallback]}><Text style={styles.avatarText}>{initial}</Text></View>}
            <View style={styles.camera}><Ionicons name="camera" size={14} color={palette.navy} /></View>
          </Pressable>
          <Text style={styles.name}>{fullName}</Text>
          <Text style={styles.subject}>{subject}</Text>
          <Pressable onPress={() => navigation.navigate('EditProfile')} style={styles.editButton}>
            <Ionicons name="create-outline" size={15} color="#FFF" />
            <Text style={styles.editText}>{t('profile.editProfile')}</Text>
          </Pressable>
        </View>
      </View>

      <View style={[styles.menu, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <MenuItem icon="bag-handle-outline" iconBg="#FFF3DC" iconColor="#9A661E" title={t('profile.orders')} onPress={() => navigation.getParent?.()?.navigate?.('Store', { screen: 'MyOrders' })} colors={colors} row={row} />
        <Divider color={colors.divider} />
        <MenuItem icon="school-outline" iconBg="#EEF0FF" iconColor="#3E4BB0" title={communityCopy.entry.title} onPress={() => navigation.getParent?.()?.navigate?.('Community')} colors={colors} row={row} />
        <Divider color={colors.divider} />
        <SettingItem icon="language-outline" iconBg="#E5F5F4" iconColor="#19706B" title={t('profile.language')} value={language === 'ar' ? t('common.arabic') : t('common.english')} onPress={chooseLanguage} colors={colors} row={row} />
        <Divider color={colors.divider} />
        <SettingItem icon="moon-outline" iconBg="#EEEAFE" iconColor="#5B50B5" title={t('profile.appearance')} value={appearance} onPress={chooseAppearance} colors={colors} row={row} />
        {isAdmin ? <><Divider color={colors.divider} /><MenuItem icon="library-outline" iconBg="#EAF1F8" iconColor={colors.secondary} title={adminCopy.entry.title} onPress={() => navigation.navigate('ContentManager')} colors={colors} row={row} /></> : null}
        {isAdmin ? <><Divider color={colors.divider} /><MenuItem icon="shield-checkmark-outline" iconBg="#E8F5EE" iconColor={colors.success} title={adminCopy.communityModerationEntry.title} onPress={() => navigation.navigate('CommunityModeration')} colors={colors} row={row} /></> : null}
      </View>

      <Pressable onPress={() => signOut()} style={({ pressed }) => [styles.logout, { opacity: pressed ? 0.7 : 1 }]}>
        <Ionicons name="log-out-outline" size={21} color="#C94A4A" />
        <Text style={styles.logoutText}>{t('profile.signOut')}</Text>
      </Pressable>
    </Screen>
  );
}

function MenuItem({ icon, iconBg, iconColor, title, onPress, colors, row }: any) {
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.item, { flexDirection: row, opacity: pressed ? 0.65 : 1 }]}>
    <Ionicons name="chevron-back" size={18} color={colors.muted} />
    <Text style={[styles.itemTitle, { color: colors.text }]}>{title}</Text>
    <View style={[styles.itemIcon, { backgroundColor: iconBg }]}><Ionicons name={icon} size={21} color={iconColor} /></View>
  </Pressable>;
}

function SettingItem({ icon, iconBg, iconColor, title, value, onPress, colors, row }: any) {
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.item, { flexDirection: row, opacity: pressed ? 0.65 : 1 }]}>
    <View style={styles.valueWrap}><Text style={[styles.value, { color: colors.muted }]}>{value}</Text><Ionicons name="chevron-back" size={16} color={colors.muted} /></View>
    <Text style={[styles.itemTitle, { color: colors.text }]}>{title}</Text>
    <View style={[styles.itemIcon, { backgroundColor: iconBg }]}><Ionicons name={icon} size={21} color={iconColor} /></View>
  </Pressable>;
}

function Divider({ color }: { color: string }) { return <View style={[styles.divider, { backgroundColor: color }]} />; }

const styles = StyleSheet.create({
  page: { gap: 16, paddingTop: 10, paddingBottom: 28 },
  header: { minHeight: 276, borderRadius: 28, overflow: 'hidden', backgroundColor: palette.navy, padding: 18, borderWidth: 1, borderColor: '#1F3A62' },
  glowA: { position: 'absolute', width: 240, height: 240, borderRadius: 120, backgroundColor: '#17345D', right: -80, top: -105 },
  glowB: { position: 'absolute', width: 190, height: 190, borderRadius: 95, backgroundColor: '#223D6B', left: -100, bottom: -110, opacity: 0.55 },
  headerTop: { alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { color: '#FFF', fontSize: 22, fontWeight: '900' },
  headerIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  identity: { alignItems: 'center' },
  avatarWrap: { width: 92, height: 92, marginBottom: 9, position: 'relative' },
  avatar: { width: 92, height: 92, borderRadius: 46, borderWidth: 3, borderColor: '#E9CF78' },
  avatarFallback: { backgroundColor: '#B6C8DD', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFF', fontSize: 31, fontWeight: '900' },
  camera: { position: 'absolute', right: -1, bottom: 1, width: 30, height: 30, borderRadius: 15, backgroundColor: '#E1BD4F', borderWidth: 3, borderColor: palette.navy, alignItems: 'center', justifyContent: 'center' },
  name: { color: '#FFF', fontSize: 22, fontWeight: '900' },
  subject: { color: '#C7D2E3', fontSize: 13, marginTop: 3, fontWeight: '700' },
  editButton: { marginTop: 12, minHeight: 36, borderRadius: 18, paddingHorizontal: 15, flexDirection: 'row', gap: 7, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.10)' },
  editText: { color: '#FFF', fontSize: 12.5, fontWeight: '800' },
  menu: { borderWidth: 1, borderRadius: 24, overflow: 'hidden' },
  item: { minHeight: 66, paddingHorizontal: 14, alignItems: 'center', gap: 11 },
  itemTitle: { flex: 1, textAlign: 'right', fontSize: 15, fontWeight: '800' },
  itemIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  valueWrap: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  value: { fontSize: 12.5, fontWeight: '700' },
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: 14 },
  logout: { minHeight: 56, borderRadius: 18, borderWidth: 1, borderColor: '#F1D3D3', backgroundColor: '#FFF8F8', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  logoutText: { color: '#C94A4A', fontSize: 15, fontWeight: '900' },
  guestCard: { borderWidth: 1, borderRadius: 28, padding: 24, alignItems: 'center', gap: 13, minHeight: 370, justifyContent: 'center' },
  guestIcon: { width: 72, height: 72, borderRadius: 24, backgroundColor: '#FFF3CF', alignItems: 'center', justifyContent: 'center' },
  guestTitle: { fontSize: 24, fontWeight: '900' },
  guestText: { fontSize: 13.5, lineHeight: 22, textAlign: 'center' },
  primaryButton: { width: '100%', minHeight: 52, borderRadius: 17, backgroundColor: '#D9B73E', alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: palette.navy, fontSize: 15, fontWeight: '900' },
  secondaryButton: { width: '100%', minHeight: 52, borderRadius: 17, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { fontSize: 15, fontWeight: '800' }
});
