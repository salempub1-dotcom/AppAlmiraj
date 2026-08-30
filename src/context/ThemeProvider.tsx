import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { AppColors, darkColors, lightColors } from '../theme/tokens';

type ThemePreference = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

type ThemeContextValue = {
  preference: ThemePreference;
  mode: ResolvedTheme;
  colors: AppColors;
  setPreference: (value: ThemePreference) => Promise<void>;
};

const STORAGE_KEY = 'almiraj.theme';
const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: PropsWithChildren) {
  const system = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((value) => {
      if (value === 'light' || value === 'dark' || value === 'system') setPreferenceState(value);
    });
  }, []);

  const mode: ResolvedTheme = preference === 'system' ? (system === 'dark' ? 'dark' : 'light') : preference;
  const colors = mode === 'dark' ? darkColors : lightColors;

  const value = useMemo<ThemeContextValue>(() => ({
    preference,
    mode,
    colors,
    setPreference: async (next) => {
      setPreferenceState(next);
      await AsyncStorage.setItem(STORAGE_KEY, next);
    }
  }), [preference, mode, colors]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used inside ThemeProvider');
  return value;
}
