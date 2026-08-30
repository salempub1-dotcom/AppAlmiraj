import { useQuery } from '@tanstack/react-query';
import {
  contentRepository,
  type ContentFilters,
  type PostType
} from '../repositories/contentRepository';

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

export function useContentDetail(id: string) {
  return useQuery({
    queryKey: ['content', 'detail', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data, error } = await contentRepository.getById(id);
      if (error) throw error;
      return data;
    }
  });
}

export function useExploreContent(filters: ContentFilters) {
  const { postType, search, subject, level, term, limit = 40 } = filters;

  return useQuery({
    queryKey: ['content', 'explore', postType ?? 'all', search ?? '', subject ?? '', level ?? '', term ?? '', limit],
    queryFn: async () => {
      const { data, error } = await contentRepository.explore({
        postType,
        search,
        subject,
        level,
        term,
        limit
      });
      if (error) throw error;
      return data ?? [];
    }
  });
}
