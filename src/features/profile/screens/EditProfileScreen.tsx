import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import { Button } from '../../../components/Button';
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
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    profileRepository.getMyProfile().then(({ data }) => {
      if (data) {
        setName(data.full_name ?? '');
        setPhone(data.phone ?? '');
        setSubject(data.subject ?? '');
        setWilaya(data.wilaya ?? '');
      }
    });
  }, []);

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

      // Teacher names/subject shown on posts come from the public teacher profile
      // queries. Invalidate every cached variant immediately so the new identity
      // appears in the feed/profile without requiring a manual refresh.
      await Promise.all([
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

  return (
    <Screen scroll style={styles.page}>
      <Text style={[styles.title, { color: colors.text }]}>تعديل الملف الشخصي</Text>
      <TextField label="الاسم" value={name} onChangeText={setName} />
      <TextField label="الهاتف" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <TextField label="المادة" value={subject} onChangeText={setSubject} />
      <TextField label="الولاية" value={wilaya} onChangeText={setWilaya} />
      <Button title={saving ? 'جارٍ الحفظ…' : 'حفظ'} onPress={save} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { gap: 18 },
  title: { fontSize: 30, fontWeight: '800', textAlign: 'right' }
});
