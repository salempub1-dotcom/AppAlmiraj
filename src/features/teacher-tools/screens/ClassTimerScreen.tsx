import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../../components/Screen';
import { useTheme } from '../../../context/ThemeProvider';

const presets = [60, 180, 300, 600];

export function ClassTimerScreen() {
  const { colors } = useTheme();
  const [seconds, setSeconds] = useState(300);
  const [initialSeconds, setInitialSeconds] = useState(300);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    if (seconds <= 0) {
      setRunning(false);
      return;
    }
    const id = setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => clearInterval(id);
  }, [running, seconds]);

  const display = useMemo(() => {
    const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${minutes}:${secs}`;
  }, [seconds]);

  const choosePreset = (value: number) => {
    setRunning(false);
    setInitialSeconds(value);
    setSeconds(value);
  };

  const reset = () => {
    setRunning(false);
    setSeconds(initialSeconds);
  };

  return (
    <Screen scroll style={styles.page}>
      <View style={[styles.timerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.icon, { backgroundColor: `${colors.primary}18` }]}>
          <Ionicons name="timer-outline" size={30} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>مؤقت القسم</Text>
        <Text style={[styles.clock, { color: seconds === 0 ? colors.danger : colors.text }]}>{display}</Text>
        <Text style={[styles.caption, { color: colors.muted }]}>{seconds === 0 ? 'انتهى الوقت' : running ? 'المؤقت يعمل الآن' : 'جاهز للبدء'}</Text>
      </View>

      <View style={styles.presets}>
        {presets.map((value) => (
          <Pressable key={value} onPress={() => choosePreset(value)} style={[styles.preset, { backgroundColor: initialSeconds === value ? `${colors.primary}18` : colors.card, borderColor: initialSeconds === value ? colors.primary : colors.border }]}>
            <Text style={[styles.presetText, { color: colors.text }]}>{value / 60} د</Text>
          </Pressable>
        ))}
      </View>

      <Pressable onPress={() => setRunning((value) => !value)} disabled={seconds === 0} style={[styles.mainButton, { backgroundColor: colors.primary, opacity: seconds === 0 ? 0.5 : 1 }]}>
        <Ionicons name={running ? 'pause' : 'play'} size={22} color="#0B1833" />
        <Text style={styles.mainButtonText}>{running ? 'إيقاف مؤقت' : 'ابدأ'}</Text>
      </Pressable>

      <Pressable onPress={reset} style={[styles.secondaryButton, { borderColor: colors.border, backgroundColor: colors.card }]}>
        <Ionicons name="refresh-outline" size={20} color={colors.muted} />
        <Text style={[styles.secondaryText, { color: colors.text }]}>إعادة الضبط</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { gap: 18 },
  timerCard: { borderWidth: 1, borderRadius: 30, padding: 26, alignItems: 'center', gap: 10 },
  icon: { width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '900' },
  clock: { fontSize: 64, fontWeight: '900', letterSpacing: 2 },
  caption: { fontWeight: '700' },
  presets: { flexDirection: 'row-reverse', gap: 10, flexWrap: 'wrap' },
  preset: { flexGrow: 1, minWidth: '21%', borderWidth: 1, borderRadius: 16, paddingVertical: 14, alignItems: 'center' },
  presetText: { fontWeight: '900' },
  mainButton: { minHeight: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center', flexDirection: 'row-reverse', gap: 9 },
  mainButtonText: { color: '#0B1833', fontSize: 17, fontWeight: '900' },
  secondaryButton: { minHeight: 54, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row-reverse', gap: 8 },
  secondaryText: { fontWeight: '800' }
});
