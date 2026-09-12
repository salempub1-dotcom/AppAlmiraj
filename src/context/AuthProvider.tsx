import type { Session } from '@supabase/supabase-js';
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import { Linking } from 'react-native';
import { authRepository, GOOGLE_REDIRECT_URL } from '../repositories/authRepository';

type AuthValue = {
  session: Session | null;
  loading: boolean;
  isGuest: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    authRepository.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setLoading(false);
    });

    const handleOAuthUrl = async (url: string | null) => {
      if (!url || !url.startsWith(GOOGLE_REDIRECT_URL)) return;
      try {
        const result = await authRepository.finishOAuthFromUrl(url);
        if (mounted && result?.session) {
          setSession(result.session);
          setLoading(false);
        }
      } catch (error) {
        console.warn('Google OAuth callback failed', error);
      }
    };

    Linking.getInitialURL().then((url) => void handleOAuthUrl(url));
    const linkingSubscription = Linking.addEventListener('url', ({ url }) => {
      void handleOAuthUrl(url);
    });

    const { data } = authRepository.onAuthStateChange(async (_event, nextSession) => {
      if (mounted) {
        setSession(nextSession);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      linkingSubscription.remove();
      data.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthValue>(() => ({
    session,
    loading,
    isGuest: !session,
    signOut: async () => { await authRepository.signOut(); }
  }), [session, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
