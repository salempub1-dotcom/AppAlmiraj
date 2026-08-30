import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import { Button } from '../../../components/Button';
import { Screen } from '../../../components/Screen';
import { TextField } from '../../../components/TextField';
import { useTheme } from '../../../context/ThemeProvider';
import { profileRepository } from '../../../repositories/profileRepository';

export function EditProfileScreen({ navigation }: any) {
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [wilaya, setWilaya] = useState('');

  useEffect(() => { profileRepository.getMyProfile().then(({ data }) => { if (data) { setName(data.full_name ?? ''); setPhone(data.phone ?? ''); setSubject(data.subject ?? ''); setWilaya(data.wilaya ?? ''); } }); }, []);

  const save = async () => {
    const { error } = await profileRepository.updateMyProfile({ full_name: name.trim(), phone: phone.trim() || null, subject: subject.trim() || null, wilaya: wilaya.trim() || null });
    if (error) Alert.alert('تعذر الحفظ', error.message); else { Alert.alert('تم الحفظ'); navigation.goBack(); }
  };

  return <Screen scroll style={styles.page}><Text style={[styles.title, { color: colors.text }]}>تعديل الملف الشخصي</Text><TextField label="الاسم" value={name} onChangeText={setName} /><TextField label="الهاتف" value={phone} onChangeText={setPhone} keyboardType="phone-pad" /><TextField label="المادة" value={subject} onChangeText={setSubject} /><TextField label="الولاية" value={wilaya} onChangeText={setWilaya} /><Button title="حفظ" onPress={save} /></Screen>;
}
const styles = StyleSheet.create({ page: { gap: 18 }, title: { fontSize: 30, fontWeight: '800', textAlign: 'right' } });
