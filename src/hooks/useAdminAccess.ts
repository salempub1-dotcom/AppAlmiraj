import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthProvider';
import { profileRepository } from '../repositories/profileRepository';

export function useMyProfile() {
  const { session } = useAuth();
  return useQuery({
    queryKey: ['profile', 'me', session?.user.id ?? null],
    enabled: Boolean(session),
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
 */
export function useIsAdmin() {
  const profile = useMyProfile();
  return { isAdmin: profile.data?.role === 'admin', isLoading: profile.isLoading };
}
