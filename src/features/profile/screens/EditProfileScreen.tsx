import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../../components/Screen';
import { TextField } from '../../../components/TextField';
import { useTheme } from '../../../context/ThemeProvider';
import { profileRepository } from '../../../repositories/profileRepository';

export function EditProfileScreen({ navigation }: any) {
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [wilaya, setWilaya] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    profileRepository.getMyProfile().then(({ data }) => {
      if (data) {
        setName(data.full_name ?? '');
        setPhone(data.phone ?? '');
        setSubject(data.subject ?? '');
        setWilaya(data.wilaya ?? '');
        setAvatarUrl(data.avatar_url ?? null);
      }
    });
  }, []);

  const chooseAvatar = async () => {
    if (uploadingAvatar) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('السماح بالصور', 'اسمح للتطبيق بالوصول إلى الصور لاختيار صورة للملف الشخصي.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85
    });
    if (result.canceled || !result.assets?.[0]?.uri) return;

    setUploadingAvatar(true);
    try {
      const prepared = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 720, height: 720 } }],
        { compress: 0.82, format: ImageManipulator.SaveFormat.JPEG }
      );
      const url = await profileRepository.uploadAvatar(prepared.uri);
      setAvatarUrl(url);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['profile', 'me'] }),
        queryClient.invalidateQueries({ queryKey: ['community', 'public-profiles'] }),
        queryClient.invalidateQueries({ queryKey: ['community', 'public-profile'] }),
        queryClient.invalidateQueries({ queryKey: ['community', 'feed'] })
      ]);
    } catch (error: any) {
      Alert.alert('تعذر رفع الصورة', error?.message ?? 'حاول مرة أخرى.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const save = async () => {
    if (saving) return;
    const cleanName = name.trim();
    if (!cleanName) return Alert.alert('الاسم', 'اكتب اسمًا صالحًا قبل الحفظ.');

    setSaving(true);
    try {
      const { error } = await profileRepository.updateMyProfile({
        full_name: cleanName,
        phone: phone.trim() || null,
        subject: subject.trim() || null,
        wilaya: wilaya.trim() || null
      });

      if (error) return Alert.alert('تعذر الحفظ', error.message);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['profile', 'me'] }),
        queryClient.invalidateQueries({ queryKey: ['community', 'public-profiles'] }),
        queryClient.invalidateQueries({ queryKey: ['community', 'public-profile'] }),
        queryClient.invalidateQueries({ queryKey: ['community', 'feed'] })
      ]);

      Alert.alert('تم الحفظ');
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  };

  const initial = name.trim()?.[0]?.toUpperCase() || 'A';

  return (
    <Screen scroll style={styles.page}>
      <View style={styles.hero}>
        <Pressable onPress={chooseAvatar} style={styles.avatarWrap}>
          {avatarUrl ? <Image source={{ uri: avatarUrl }} style={styles.avatarImage} /> : <View style={styles.avatar}><Text style={styles.avatarText}>{initial}</Text></View>}
          <View style={styles.cameraBadge}>
            <Ionicons name={uploadingAvatar ? 'hourglass-outline' : 'camera'} size={16} color="#0B1833" />
          </View>
        </Pressable>
        <View style={styles.heroCopy}>
          <Text style={styles.eyebrow}>PROFILE SETTINGS</Text>
          <Text style={styles.title}>تعديل الملف الشخصي</Text>
          <Text style={styles.subtitle}>{uploadingAvatar ? 'جارٍ رفع الصورة…' : 'اضغط على الصورة لتغييرها وحدّث بياناتك.'}</Text>
        </View>
      </View>

      <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.sectionHeading}>
          <View style={styles.sectionIcon}><Ionicons name="person-outline" size={18} color="#D4AF37" /></View>
          <View style={styles.sectionCopy}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>المعلومات الأساسية</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.muted }]}>هذه المعلومات تساعد الأساتذة على التعرف عليك.</Text>
          </View>
        </View>

        <TextField compact label="الاسم" value={name} onChangeText={setName} />
        <TextField compact label="الهاتف" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <TextField compact label="المادة" value={subject} onChangeText={setSubject} />
        <TextField compact label="الولاية" value={wilaya} onChangeText={setWilaya} />
      </View>

      <Pressable
        onPress={save}
        disabled={saving}
        style={({ pressed }) => [styles.saveButton, saving && styles.disabled, pressed && !saving && styles.pressed]}
      >
        <Ionicons name={saving ? 'hourglass-outline' : 'checkmark-circle-outline'} size={20} color="#0B1833" />
        <Text style={styles.saveText}>{saving ? 'جارٍ الحفظ…' : 'حفظ التعديلات'}</Text>
      </Pressable>

      <Text style={[styles.hint, { color: colors.muted }]}>ستظهر صورتك وبياناتك في حسابك وفضاء الأستاذ.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { gap: 16 },
  hero: { backgroundColor: '#0B1833', borderRadius: 26, padding: 20, flexDirection: 'row-reverse', alignItems: 'center', gap: 14 },
  avatarWrap: { width: 72, height: 72, position: 'relative' },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#D4AF37', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#FFFFFF' },
  avatarImage: { width: 72, height: 72, borderRadius: 36, borderWidth: 3, borderColor: '#FFFFFF' },
  avatarText: { color: '#0B1833', fontSize: 27, fontWeight: '900' },
  cameraBadge: { position: 'absolute', right: -2, bottom: -2, width: 28, height: 28, borderRadius: 14, backgroundColor: '#D4AF37', borderWidth: 2, borderColor: '#0B1833', alignItems: 'center', justifyContent: 'center' },
  heroCopy: { flex: 1, alignItems: 'flex-end' },
  eyebrow: { color: '#D4AF37', fontSize: 10, fontWeight: '900', letterSpacing: 0.8 },
  title: { color: '#FFFFFF', fontSize: 23, fontWeight: '900', textAlign: 'right', marginTop: 4 },
  subtitle: { color: '#C7D0DF', fontSize: 12.5, lineHeight: 20, textAlign: 'right', marginTop: 3 },
  formCard: { borderWidth: 1, borderRadius: 22, padding: 16, gap: 13 },
  sectionHeading: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10, marginBottom: 2 },
  sectionIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#0B1833', alignItems: 'center', justifyContent: 'center' },
  sectionCopy: { flex: 1, alignItems: 'flex-end' },
  sectionTitle: { fontSize: 16, fontWeight: '900', textAlign: 'right' },
  sectionSubtitle: { fontSize: 11.5, marginTop: 2, textAlign: 'right' },
  saveButton: { minHeight: 54, borderRadius: 17, backgroundColor: '#D4AF37', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8 },
  saveText: { color: '#0B1833', fontSize: 15, fontWeight: '900' },
  hint: { textAlign: 'center', fontSize: 11.5, lineHeight: 19, paddingHorizontal: 12 },
  pressed: { opacity: 0.84, transform: [{ scale: 0.99 }] },
  disabled: { opacity: 0.55 }
});
