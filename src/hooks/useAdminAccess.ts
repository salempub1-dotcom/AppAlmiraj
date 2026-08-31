import { useFocusEffect } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useAuth } from '../context/AuthProvider';
import { profileRepository } from '../repositories/profileRepository';

export function useMyProfile() {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['profile', 'me', session?.user.id ?? null],
    enabled: Boolean(session),
    // Role changes (e.g. an admin promoting an account directly in Supabase)
    // must be picked up without the user reinstalling the app. Treat the
    // cached profile as immediately stale so every mount/focus revalidates
    // it, instead of trusting the query client's global 30s staleTime.
    staleTime: 0,
    queryFn: async () => {
      const { data, error } = await profileRepository.getMyProfile();
      if (error) throw error;
      return data;
    }
  });
}

/**
 * App-side gate for showing/hiding the Content Manager entry point.
 * The real security boundary is the `public.is_admin()` RLS policy on
 * `posts` and `storage.objects` - this hook only controls UI visibility.
 *
 * Because `staleTime` alone only marks the cached profile as stale, it still
 * needs a trigger to actually revalidate. Refetching on screen focus means
 * simply returning to the Profile (or Content Manager) screen after a role
 * change is enough - no sign-out/sign-in or app reinstall required.
 */
export function useIsAdmin() {
  const profile = useMyProfile();
  const refetch = profile.refetch;

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  return { isAdmin: profile.data?.role === 'admin', isLoading: profile.isLoading, refetch };
}
