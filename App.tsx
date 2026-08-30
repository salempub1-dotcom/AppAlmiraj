import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { AuthProvider } from './src/context/AuthProvider';
import { CartProvider } from './src/context/CartProvider';
import { LanguageProvider } from './src/context/LanguageProvider';
import { ThemeProvider, useTheme } from './src/context/ThemeProvider';
import { RootNavigator } from './src/navigation/RootNavigator';
import { ensureRTL } from './src/utils/rtl';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } }
});

function AppShell() {
  const { mode, colors } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <RootNavigator />
    </View>
  );
}

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    ensureRTL().finally(() => setReady(true));
  }, []);

  if (!ready) return <ActivityIndicator style={{ flex: 1 }} />;

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <CartProvider>
              <AppShell />
            </CartProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
