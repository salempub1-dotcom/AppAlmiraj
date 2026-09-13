import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';
import { Screen } from '../../../components/Screen';
import { useAuth } from '../../../context/AuthProvider';
import { useLanguage } from '../../../context/LanguageProvider';
import { useTheme } from '../../../context/ThemeProvider';
import { useIsAdmin } from '../../../hooks/useAdminAccess';
import { getAdminCopy } from '../../../i18n/adminCopy';
import { getCommunityCopy } from '../../../i18n/communityCopy';
import { profileRepository } from '../../../repositories/profileRepository';
import { palette } from '../../../theme/tokens';

type PickerKind = 'language' | 'appearance' | null;

export function ProfileScreen({ navigation }: any) {
  const { session, isGuest, signOut } = useAuth();
  const { colors, preference, setPreference } = useTheme();
  const { language, setLanguage, t, isRTL } = useLanguage();
  const { isAdmin } = useIsAdmin();
  const [picker, setPicker] = useState<PickerKind>(null);

  const adminCopy = getAdminCopy(language);
  const communityCopy = getCommunityCopy(language);
  const row = isRTL ? ('row-reverse' as const) : ('row' as const);
  const copy = language === 'ar'
    ? {
        intro: 'إدارة حسابك وتخصيص تجربتك',
        settings: 'الإعدادات',
        settingsHint: 'خصص تجربتك كما تحب',
        role: 'أستاذ',
        roleText: 'دورك في المنصة',
        active: 'عضو نشط',
        activeText: 'مجتمع المعراج',
        together: 'نسعى معًا',
        togetherText: 'لأثر أكبر في التعليم',
        teacherSpaceText: 'مساحتك التعليمية',
        languageText: 'اختر لغة التطبيق',
        appearanceText: 'اختر مظهر التطبيق',
        signOutText: 'الخروج من حسابك الحالي',
        cancel: 'إلغاء'
      }
    : {
        intro: 'Manage your account and personalize your experience',
        settings: 'Settings',
        settingsHint: 'Make the experience yours',
        role: 'Teacher',
        roleText: 'Your role on the platform',
        active: 'Active member',
        activeText: 'Al Miraj community',
        together: 'Growing together',
        togetherText: 'For greater impact in education',
        teacherSpaceText: 'Your teaching community',
        languageText: 'Choose app language',
        appearanceText: 'Choose app appearance',
        signOutText: 'Sign out of your current account',
        cancel: 'Cancel'
      };

  const { data: profileResult } = useQuery({
    queryKey: ['profile', 'me', session?.user.id],
    queryFn: () => profileRepository.getMyProfile(),
    enabled: !!session
  });

  const profile = profileResult?.data;
  const fullName = profile?.full_name?.trim?.()
    || session?.user.user_metadata?.full_name?.trim?.()
    || session?.user.email?.split('@')[0]
    || '';
  const avatarUrl = profile?.avatar_url
    || session?.user.user_metadata?.avatar_url
    || null;
  const initial = fullName ? fullName[0]?.toUpperCase() : 'أ';
  const appearance = preference === 'dark'
    ? t('profile.dark')
    : preference === 'light'
      ? t('profile.light')
      : t('profile.system');

  const openTeacherSpace = () => navigation.getParent?.()?.navigate?.('Community');
  const openOrders = () => navigation.getParent?.()?.navigate?.('Store', { screen: 'MyOrders' });

  if (isGuest) {
    return (
      <Screen scroll style={styles.page}>
        <View style={[styles.guestCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.guestIcon}><Ionicons name="school" size={34} color={palette.navy} /></View>
          <Text style={[styles.guestTitle, { color: colors.text }]}>{t('profile.welcome')}</Text>
          <Text style={[styles.guestText, { color: colors.muted }]}>{t('profile.guestText')}</Text>
          <Pressable onPress={() => navigation.navigate('SignIn')} style={styles.primaryButton}>
            <Text style={styles.primaryText}>{t('profile.signIn')}</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate('SignUp')} style={[styles.secondaryButton, { borderColor: colors.border }]}>
            <Text style={[styles.secondaryText, { color: colors.text }]}>{t('profile.signUp')}</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll style={styles.page}>
      <View style={styles.hero}>
        <View style={styles.heroOrbTop} />
        <View style={styles.heroOrbLeft} />
        <View style={styles.heroOrbBottom} />
        <Ionicons name="book-outline" size={142} color="rgba(132,175,224,0.10)" style={styles.heroBook} />
        <Ionicons name="school-outline" size={104} color="rgba(132,175,224,0.09)" style={styles.heroSchool} />

        <View style={[styles.heroTop, { flexDirection: row }]}>
          <View style={styles.heroHeading}>
            <Text style={styles.heroTitle}>{t('profile.title')}</Text>
            <View style={styles.goldDash} />
            <Text style={styles.heroIntro}>{copy.intro}</Text>
          </View>
          <View style={styles.brandIcon}>
            <Ionicons name="school-outline" size={24} color={GOLD} />
          </View>
        </View>

        <View style={styles.identity}>
          <Pressable onPress={() => navigation.navigate('EditProfile')} style={({ pressed }) => [styles.avatarWrap, pressed && styles.pressed]}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarText}>{initial}</Text>
              </View>
            )}
            <View style={styles.cameraBadge}>
              <Ionicons name="camera" size={16} color={NAVY} />
            </View>
          </Pressable>
          <Text numberOfLines={1} style={styles.name}>{fullName}</Text>
          <View style={styles.accountType}>
            <Ionicons name="school" size={14} color={GOLD} />
            <Text style={styles.accountTypeText}>{t('profile.teacherAccount')}</Text>
          </View>
        </View>

        <View style={[styles.quickInfo, { flexDirection: row }]}>
          <QuickChip icon="school" title={copy.role} subtitle={copy.roleText} />
          <QuickChip icon="star" title={copy.active} subtitle={copy.activeText} />
          <QuickChip icon="stats-chart" title={copy.together} subtitle={copy.togetherText} />
        </View>

        <Pressable onPress={() => navigation.navigate('EditProfile')} style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}>
          <Ionicons name="create-outline" size={20} color={NAVY} />
          <Text style={styles.editText}>{t('profile.editProfile')}</Text>
        </Pressable>
      </View>

      <View style={styles.settingsSection}>
        <View style={[styles.settingsHeader, { flexDirection: row }]}>
          <Text style={[styles.settingsTitle, { color: colors.text }]}>{copy.settings}</Text>
          <View style={styles.settingsHintWrap}>
            <Ionicons name="settings-outline" size={17} color="#A77A19" />
            <Text style={[styles.settingsHint, { color: colors.muted }]}>{copy.settingsHint}</Text>
          </View>
        </View>

        <View style={[styles.menu, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <MenuItem
            icon="bag-handle-outline"
            iconBg="#FFF3DC"
            iconColor="#9A661E"
            title={t('profile.orders')}
            subtitle={t('profile.ordersText')}
            onPress={openOrders}
            colors={colors}
            row={row}
          />
          <Divider color={colors.divider} />
          <MenuItem
            icon="school-outline"
            iconBg="#EEF0FF"
            iconColor="#3E4BB0"
            title={communityCopy.entry.title}
            subtitle={copy.teacherSpaceText}
            onPress={openTeacherSpace}
            colors={colors}
            row={row}
          />
          <Divider color={colors.divider} />
          <SettingItem
            icon="language-outline"
            iconBg="#E5F5F4"
            iconColor="#19706B"
            title={t('profile.language')}
            subtitle={copy.languageText}
            value={language === 'ar' ? t('common.arabic') : t('common.english')}
            onPress={() => setPicker('language')}
            colors={colors}
            row={row}
          />
          <Divider color={colors.divider} />
          <SettingItem
            icon="moon-outline"
            iconBg="#EEEAFE"
            iconColor="#5B50B5"
            title={t('profile.appearance')}
            subtitle={copy.appearanceText}
            value={appearance}
            onPress={() => setPicker('appearance')}
            colors={colors}
            row={row}
          />
          {isAdmin ? (
            <>
              <Divider color={colors.divider} />
              <MenuItem
                icon="library-outline"
                iconBg="#EAF1F8"
                iconColor={colors.secondary}
                title={adminCopy.entry.title}
                subtitle={language === 'ar' ? 'إدارة محتوى المنصة' : 'Manage platform content'}
                onPress={() => navigation.navigate('ContentManager')}
                colors={colors}
                row={row}
              />
              <Divider color={colors.divider} />
              <MenuItem
                icon="shield-checkmark-outline"
                iconBg="#E8F5EE"
                iconColor={colors.success}
                title={adminCopy.communityModerationEntry.title}
                subtitle={language === 'ar' ? 'الإشراف على مجتمع الأساتذة' : 'Moderate the teacher community'}
                onPress={() => navigation.navigate('CommunityModeration')}
                colors={colors}
                row={row}
              />
            </>
          ) : null}
        </View>
      </View>

      <Pressable onPress={() => signOut()} style={({ pressed }) => [styles.logout, pressed && styles.pressed]}>
        <Ionicons name="log-out-outline" size={24} color="#C94A4A" />
        <View style={styles.logoutCopy}>
          <Text style={styles.logoutText}>{t('profile.signOut')}</Text>
          <Text style={styles.logoutSub}>{copy.signOutText}</Text>
        </View>
      </Pressable>

      <ChoiceSheet
        visible={picker === 'language'}
        title={t('profile.language')}
        onClose={() => setPicker(null)}
        colors={colors}
        options={[
          { label: t('common.arabic'), selected: language === 'ar', onPress: () => void setLanguage('ar') },
          { label: t('common.english'), selected: language === 'en', onPress: () => void setLanguage('en') }
        ]}
        cancelText={copy.cancel}
      />

      <ChoiceSheet
        visible={picker === 'appearance'}
        title={t('profile.appearance')}
        onClose={() => setPicker(null)}
        colors={colors}
        options={[
          { label: t('profile.system'), selected: preference === 'system', onPress: () => void setPreference('system') },
          { label: t('profile.light'), selected: preference === 'light', onPress: () => void setPreference('light') },
          { label: t('profile.dark'), selected: preference === 'dark', onPress: () => void setPreference('dark') }
        ]}
        cancelText={copy.cancel}
      />
    </Screen>
  );
}

function QuickChip({ icon, title, subtitle }: { icon: any; title: string; subtitle: string }) {
  return (
    <View style={styles.quickChip}>
      <Ionicons name={icon} size={20} color={GOLD} />
      <View style={styles.quickChipText}>
        <Text numberOfLines={1} style={styles.quickChipTitle}>{title}</Text>
        <Text numberOfLines={2} style={styles.quickChipSubtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

function MenuItem({ icon, iconBg, iconColor, title, subtitle, onPress, colors, row }: any) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.item, { flexDirection: row, opacity: pressed ? 0.62 : 1 }]}>
      <Ionicons name="chevron-back" size={19} color={colors.muted} />
      <View style={styles.itemCopy}>
        <Text style={[styles.itemTitle, { color: colors.text }]}>{title}</Text>
        <Text numberOfLines={1} style={[styles.itemSubtitle, { color: colors.muted }]}>{subtitle}</Text>
      </View>
      <View style={[styles.itemIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={23} color={iconColor} />
      </View>
    </Pressable>
  );
}

function SettingItem({ icon, iconBg, iconColor, title, subtitle, value, onPress, colors, row }: any) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.item, { flexDirection: row, opacity: pressed ? 0.62 : 1 }]}>
      <View style={styles.settingLeading}>
        <Ionicons name="chevron-back" size={18} color={colors.muted} />
        <View style={[styles.valuePill, { backgroundColor: colors.background }]}>
          <Text numberOfLines={1} style={[styles.value, { color: colors.muted }]}>{value}</Text>
        </View>
      </View>
      <View style={styles.itemCopy}>
        <Text style={[styles.itemTitle, { color: colors.text }]}>{title}</Text>
        <Text numberOfLines={1} style={[styles.itemSubtitle, { color: colors.muted }]}>{subtitle}</Text>
      </View>
      <View style={[styles.itemIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={23} color={iconColor} />
      </View>
    </Pressable>
  );
}

function ChoiceSheet({ visible, title, onClose, options, cancelText, colors }: any) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => undefined}>
          <View style={styles.sheetHandle} />
          <Text style={[styles.sheetTitle, { color: colors.text }]}>{title}</Text>
          <View style={styles.sheetOptions}>
            {options.map((option: any) => (
              <Pressable
                key={option.label}
                onPress={() => {
                  option.onPress();
                  onClose();
                }}
                style={({ pressed }) => [
                  styles.sheetOption,
                  { borderColor: option.selected ? GOLD : colors.border, backgroundColor: option.selected ? '#FFF9E7' : colors.background },
                  pressed && styles.pressed
                ]}
              >
                <Text style={[styles.sheetOptionText, { color: option.selected ? NAVY : colors.text }]}>{option.label}</Text>
                <Ionicons name={option.selected ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={option.selected ? GOLD : colors.muted} />
              </Pressable>
            ))}
          </View>
          <Pressable onPress={onClose} style={styles.cancelButton}>
            <Text style={[styles.cancelText, { color: colors.muted }]}>{cancelText}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Divider({ color }: { color: string }) {
  return <View style={[styles.divider, { backgroundColor: color }]} />;
}

const NAVY = '#0B1833';
const GOLD = '#D4AF37';

const styles = StyleSheet.create({
  page: { gap: 16, paddingTop: 10, paddingBottom: 28 },
  hero: {
    minHeight: 410,
    borderRadius: 30,
    overflow: 'hidden',
    backgroundColor: NAVY,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 20,
    borderWidth: 1,
    borderColor: '#24446F',
    shadowColor: '#071426',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5
  },
  heroOrbTop: { position: 'absolute', width: 260, height: 260, borderRadius: 130, backgroundColor: '#173F72', right: -74, top: -132, opacity: 0.78 },
  heroOrbLeft: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: '#1E4E86', left: -92, top: 86, opacity: 0.35 },
  heroOrbBottom: { position: 'absolute', width: 250, height: 250, borderRadius: 125, backgroundColor: '#123663', right: -105, bottom: -150, opacity: 0.8 },
  heroBook: { position: 'absolute', right: -24, bottom: 96, transform: [{ rotate: '-8deg' }] },
  heroSchool: { position: 'absolute', left: -12, bottom: 122, transform: [{ rotate: '8deg' }] },
  heroTop: { justifyContent: 'space-between', alignItems: 'flex-start' },
  heroHeading: { flex: 1 },
  heroTitle: { color: '#FFF', fontSize: 28, fontWeight: '900', textAlign: 'left' },
  goldDash: { width: 38, height: 4, borderRadius: 3, backgroundColor: GOLD, marginTop: 7, marginBottom: 8 },
  heroIntro: { color: '#BFCDE1', fontSize: 12.5, fontWeight: '600', maxWidth: 230, lineHeight: 19, textAlign: 'left' },
  brandIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' },
  identity: { alignItems: 'center', marginTop: -4 },
  avatarWrap: { width: 102, height: 102, marginBottom: 10, position: 'relative' },
  avatar: { width: 102, height: 102, borderRadius: 51, borderWidth: 4, borderColor: '#E4C75C' },
  avatarFallback: { backgroundColor: '#AFC3DB', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFF', fontSize: 36, fontWeight: '900' },
  cameraBadge: { position: 'absolute', left: -2, bottom: 3, width: 35, height: 35, borderRadius: 18, backgroundColor: '#E4C75C', borderWidth: 3, borderColor: NAVY, alignItems: 'center', justifyContent: 'center' },
  name: { maxWidth: '88%', color: '#FFF', fontSize: 24, fontWeight: '900', textAlign: 'center' },
  accountType: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  accountTypeText: { color: '#C5D2E2', fontSize: 13, fontWeight: '700' },
  quickInfo: { gap: 7, marginTop: 14 },
  quickChip: { flex: 1, minHeight: 60, borderRadius: 17, borderWidth: 1, borderColor: 'rgba(255,255,255,0.13)', backgroundColor: 'rgba(255,255,255,0.055)', paddingHorizontal: 7, paddingVertical: 8, alignItems: 'center', justifyContent: 'center', gap: 4 },
  quickChipText: { alignItems: 'center' },
  quickChipTitle: { color: '#FFF', fontSize: 11, fontWeight: '900', textAlign: 'center' },
  quickChipSubtitle: { color: '#AFC0D7', fontSize: 8.8, lineHeight: 12, fontWeight: '600', textAlign: 'center', marginTop: 1 },
  editButton: { alignSelf: 'center', marginTop: 14, minHeight: 46, minWidth: '72%', borderRadius: 24, paddingHorizontal: 24, flexDirection: 'row', gap: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E0BF50', borderWidth: 1, borderColor: '#F0D878', shadowColor: '#000', shadowOpacity: 0.14, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  editText: { color: NAVY, fontSize: 14.5, fontWeight: '900' },
  settingsSection: { gap: 10 },
  settingsHeader: { paddingHorizontal: 4, alignItems: 'center', justifyContent: 'space-between' },
  settingsTitle: { fontSize: 19, fontWeight: '900' },
  settingsHintWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  settingsHint: { fontSize: 11.5, fontWeight: '600' },
  menu: { borderWidth: 1, borderRadius: 26, overflow: 'hidden', shadowColor: '#12213B', shadowOpacity: 0.08, shadowRadius: 15, shadowOffset: { width: 0, height: 7 }, elevation: 2 },
  item: { minHeight: 78, paddingHorizontal: 13, alignItems: 'center', gap: 11 },
  itemCopy: { flex: 1, minWidth: 0 },
  itemTitle: { textAlign: 'right', fontSize: 15, fontWeight: '900' },
  itemSubtitle: { textAlign: 'right', fontSize: 10.8, fontWeight: '600', marginTop: 3 },
  itemIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  settingLeading: { flexDirection: 'row', alignItems: 'center', gap: 6, maxWidth: 96 },
  valuePill: { minHeight: 29, maxWidth: 74, borderRadius: 15, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center' },
  value: { fontSize: 10.5, fontWeight: '800' },
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: 14 },
  logout: { minHeight: 70, borderRadius: 22, borderWidth: 1, borderColor: '#F0C4C4', backgroundColor: '#FFF5F5', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 12, paddingHorizontal: 18 },
  logoutCopy: { alignItems: 'flex-start' },
  logoutText: { color: '#C94A4A', fontSize: 16, fontWeight: '900' },
  logoutSub: { color: '#D07B7B', fontSize: 10.5, fontWeight: '600', marginTop: 2 },
  pressed: { opacity: 0.7, transform: [{ scale: 0.992 }] },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(5,14,30,0.52)', justifyContent: 'flex-end', paddingHorizontal: 14, paddingBottom: 16 },
  sheet: { borderWidth: 1, borderRadius: 28, padding: 18, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 18, shadowOffset: { width: 0, height: -5 }, elevation: 8 },
  sheetHandle: { alignSelf: 'center', width: 42, height: 5, borderRadius: 3, backgroundColor: '#CAD1DC', marginBottom: 14 },
  sheetTitle: { fontSize: 20, fontWeight: '900', textAlign: 'center', marginBottom: 14 },
  sheetOptions: { gap: 9 },
  sheetOption: { minHeight: 54, borderRadius: 17, borderWidth: 1, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sheetOptionText: { fontSize: 14.5, fontWeight: '800' },
  cancelButton: { alignSelf: 'center', paddingHorizontal: 20, paddingVertical: 12, marginTop: 6 },
  cancelText: { fontSize: 13, fontWeight: '700' },
  guestCard: { borderWidth: 1, borderRadius: 28, padding: 24, alignItems: 'center', gap: 13, minHeight: 370, justifyContent: 'center' },
  guestIcon: { width: 72, height: 72, borderRadius: 24, backgroundColor: '#FFF3CF', alignItems: 'center', justifyContent: 'center' },
  guestTitle: { fontSize: 24, fontWeight: '900' },
  guestText: { fontSize: 13.5, lineHeight: 22, textAlign: 'center' },
  primaryButton: { width: '100%', minHeight: 52, borderRadius: 17, backgroundColor: '#D9B73E', alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: NAVY, fontSize: 15, fontWeight: '900' },
  secondaryButton: { width: '100%', minHeight: 52, borderRadius: 17, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { fontSize: 15, fontWeight: '800' }
});
