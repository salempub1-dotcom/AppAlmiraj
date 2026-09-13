import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { AuthProvider, useAuth } from './src/context/AuthProvider';
import { CartProvider } from './src/context/CartProvider';
import { LanguageProvider } from './src/context/LanguageProvider';
import { ThemeProvider, useTheme } from './src/context/ThemeProvider';
import { SplashScreen } from './src/features/splash/SplashScreen';
import { RootNavigator } from './src/navigation/RootNavigator';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } }
});

function AppShell() {
  const { mode, colors } = useTheme();
  const { loading: authLoading } = useAuth();
  const [minimumSplashFinished, setMinimumSplashFinished] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMinimumSplashFinished(true), 1400);
    return () => clearTimeout(timer);
  }, []);

  if (!minimumSplashFinished || authLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#08111F' }}>
        <StatusBar style="light" />
        <SplashScreen />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <RootNavigator />
    </View>
  );
}

export default function App() {
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
