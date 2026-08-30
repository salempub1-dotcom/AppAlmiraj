import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../../components/Screen';
import { useAuth } from '../../../context/AuthProvider';
import { useTheme } from '../../../context/ThemeProvider';

const themes = [
  { key: 'system' as const, label: 'النظام', icon: 'phone-portrait-outline' as const },
  { key: 'dark' as const, label: 'داكن', icon: 'moon-outline' as const },
  { key: 'light' as const, label: 'فاتح', icon: 'sunny-outline' as const }
];

export function ProfileScreen({ navigation }: any) {
  const { session, isGuest, signOut } = useAuth();
  const { colors, preference, setPreference } = useTheme();

  return (
    <Screen scroll style={styles.page}>
      <View style={styles.headerRow}>
        <View style={[styles.headerIcon, { backgroundColor: `${colors.primary}18` }]}>
          <Ionicons name="person-outline" size={22} color={colors.primary} />
        </View>
        <View style={styles.headerCopy}>
          <Text style={[styles.title, { color: colors.text }]}>حسابي</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>إعداداتك وبياناتك في مكان واحد</Text>
        </View>
      </View>

      {isGuest ? (
        <View style={styles.guestHero}>
          <View style={styles.guestAvatar}>
            <Ionicons name="person" size={31} color="#0B1833" />
          </View>
          <Text style={styles.guestTitle}>مرحبًا بك في المعراج</Text>
          <Text style={styles.guestText}>يمكنك التصفح كزائر، لكن الحفظ والطلبات والتفضيلات الشخصية تحتاج حسابًا.</Text>
          <Pressable onPress={() => navigation.navigate('SignIn')} style={styles.primaryButton}>
            <Ionicons name="log-in-outline" size={19} color="#0B1833" />
            <Text style={styles.primaryButtonText}>تسجيل الدخول</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate('SignUp')} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>إنشاء حساب جديد</Text>
          </Pressable>
        </View>
      ) : (
        <View style={[styles.accountCard, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <View style={[styles.avatar, { backgroundColor: `${colors.primary}18` }]}>
            <Ionicons name="person" size={28} color={colors.primary} />
          </View>
          <View style={styles.accountCopy}>
            <Text style={[styles.accountLabel, { color: colors.muted }]}>حساب الأستاذ</Text>
            <Text numberOfLines={1} style={[styles.email, { color: colors.text }]}>{session?.user.email}</Text>
          </View>
          <View style={[styles.verified, { backgroundColor: `${colors.primary}18` }]}>
            <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
          </View>
        </View>
      )}

      {!isGuest && (
        <View style={styles.menuList}>
          <Pressable onPress={() => navigation.navigate('EditProfile')} style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.border }]}> 
            <Ionicons name="chevron-back" size={18} color={colors.muted} />
            <View style={styles.menuCopy}>
              <Text style={[styles.menuTitle, { color: colors.text }]}>تعديل الملف الشخصي</Text>
              <Text style={[styles.menuText, { color: colors.muted }]}>الاسم، المادة، المستوى والولاية</Text>
            </View>
            <View style={[styles.menuIcon, { backgroundColor: `${colors.primary}16` }]}>
              <Ionicons name="create-outline" size={20} color={colors.primary} />
            </View>
          </Pressable>

          <View style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.border }]}> 
            <Ionicons name="chevron-back" size={18} color={colors.muted} />
            <View style={styles.menuCopy}>
              <Text style={[styles.menuTitle, { color: colors.text }]}>طلباتي</Text>
              <Text style={[styles.menuText, { color: colors.muted }]}>ستظهر هنا طلبات المتجر لاحقًا</Text>
            </View>
            <View style={[styles.menuIcon, { backgroundColor: `${colors.primary}16` }]}>
              <Ionicons name="cube-outline" size={20} color={colors.primary} />
            </View>
          </View>
        </View>
      )}

      <View>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>المظهر</Text>
        <Text style={[styles.sectionText, { color: colors.muted }]}>اختر الوضع الذي يناسبك أثناء الاستخدام</Text>
      </View>

      <View style={[styles.themeSelector, { backgroundColor: colors.card, borderColor: colors.border }]}> 
        {themes.map((item) => {
          const active = preference === item.key;
          return (
            <Pressable
              key={item.key}
              onPress={() => setPreference(item.key)}
              style={[styles.themeItem, active && { backgroundColor: colors.primary }]}
            >
              <Ionicons name={item.icon} size={18} color={active ? '#0B1833' : colors.muted} />
              <Text style={[styles.themeText, { color: active ? '#0B1833' : colors.text }]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {!isGuest && (
        <Pressable onPress={() => signOut()} style={[styles.signOut, { borderColor: colors.border }]}> 
          <Ionicons name="log-out-outline" size={19} color={colors.danger} />
          <Text style={[styles.signOutText, { color: colors.danger }]}>تسجيل الخروج</Text>
        </Pressable>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { gap: 22 },
  headerRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12 },
  headerIcon: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1 },
  title: { fontSize: 29, fontWeight: '900', textAlign: 'right' },
  subtitle: { textAlign: 'right', marginTop: 3, fontSize: 12.5 },
  guestHero: { backgroundColor: '#0B1833', borderRadius: 30, padding: 22, gap: 12, alignItems: 'flex-end' },
  guestAvatar: { width: 54, height: 54, borderRadius: 18, backgroundColor: '#D4AF37', alignItems: 'center', justifyContent: 'center' },
  guestTitle: { color: '#FFFFFF', fontSize: 24, lineHeight: 34, fontWeight: '900', textAlign: 'right' },
  guestText: { color: '#C6D0DE', textAlign: 'right', writingDirection: 'rtl', lineHeight: 23 },
  primaryButton: { width: '100%', minHeight: 52, borderRadius: 16, backgroundColor: '#D4AF37', flexDirection: 'row-reverse', gap: 8, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  primaryButtonText: { color: '#0B1833', fontWeight: '900', fontSize: 15.5 },
  secondaryButton: { width: '100%', minHeight: 50, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  secondaryButtonText: { color: '#FFFFFF', fontWeight: '800' },
  accountCard: { borderWidth: 1, borderRadius: 22, padding: 16, flexDirection: 'row-reverse', alignItems: 'center', gap: 12 },
  avatar: { width: 50, height: 50, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  accountCopy: { flex: 1 },
  accountLabel: { textAlign: 'right', fontSize: 11.5, marginBottom: 3 },
  email: { textAlign: 'right', fontWeight: '800', fontSize: 14 },
  verified: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  menuList: { gap: 10 },
  menuItem: { borderWidth: 1, borderRadius: 20, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  menuCopy: { flex: 1 },
  menuTitle: { textAlign: 'right', fontWeight: '900' },
  menuText: { textAlign: 'right', marginTop: 4, fontSize: 11.5 },
  menuIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 20, fontWeight: '900', textAlign: 'right' },
  sectionText: { textAlign: 'right', marginTop: 3, fontSize: 12 },
  themeSelector: { borderWidth: 1, borderRadius: 20, padding: 6, flexDirection: 'row-reverse', gap: 5 },
  themeItem: { flex: 1, minHeight: 48, borderRadius: 15, flexDirection: 'row-reverse', gap: 6, alignItems: 'center', justifyContent: 'center' },
  themeText: { fontWeight: '800', fontSize: 12.5 },
  signOut: { borderWidth: 1, borderRadius: 18, minHeight: 52, flexDirection: 'row-reverse', gap: 8, alignItems: 'center', justifyContent: 'center' },
  signOutText: { fontWeight: '900' }
});
