import { useQuery } from '@tanstack/react-query';
import { contentRepository, PostType } from '../repositories/contentRepository';

export function useLatestContent(limit = 8) {
  return useQuery({
    queryKey: ['content', 'latest', limit],
    queryFn: async () => {
      const { data, error } = await contentRepository.getLatest(limit);
      if (error) throw error;
      return data ?? [];
    }
  });
}

export function useContentByType(type: PostType) {
  return useQuery({
    queryKey: ['content', type],
    queryFn: async () => {
      const { data, error } = await contentRepository.getByType(type);
      if (error) throw error;
      return data ?? [];
    }
  });
}
