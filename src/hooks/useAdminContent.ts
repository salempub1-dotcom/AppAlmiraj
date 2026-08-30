import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  adminContentRepository,
  type AdminContentFilters,
  type ContentInput,
  type PostStatus
} from '../repositories/contentRepository';
import { contentMediaRepository, type PickedFile } from '../repositories/contentMediaRepository';

export function useAdminContentList(filters: AdminContentFilters) {
  const { status, postType, subject, level, term, sequence, search, limit } = filters;
  return useQuery({
    queryKey: [
      'admin-content',
      'list',
      status ?? 'all',
      postType ?? 'all',
      subject ?? '',
      level ?? '',
      term ?? '',
      sequence ?? '',
      search ?? '',
      limit ?? 200
    ],
    queryFn: async () => {
      const { data, error } = await adminContentRepository.listAll(filters);
      if (error) throw error;
      return data ?? [];
    }
  });
}

export function useAdminContentCounts() {
  return useQuery({
    queryKey: ['admin-content', 'counts'],
    queryFn: async () => {
      const { data, error } = await adminContentRepository.getCounts();
      if (error) throw error;
      return data;
    }
  });
}

export function useAdminContentDetail(id: string) {
  return useQuery({
    queryKey: ['admin-content', 'detail', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data, error } = await adminContentRepository.getByIdAdmin(id);
      if (error) throw error;
      return data;
    }
  });
}

function useInvalidateContent() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ['admin-content'] });
    queryClient.invalidateQueries({ queryKey: ['content'] });
  };
}

export function useCreateContent() {
  const invalidate = useInvalidateContent();
  return useMutation({
    mutationFn: async (input: ContentInput) => {
      const { data, error } = await adminContentRepository.create(input);
      if (error) throw error;
      return data;
    },
    onSuccess: invalidate
  });
}

export function useUpdateContent() {
  const invalidate = useInvalidateContent();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<ContentInput> }) => {
      const { data, error } = await adminContentRepository.update(id, patch);
      if (error) throw error;
      return data;
    },
    onSuccess: invalidate
  });
}

export function useSetContentStatus() {
  const invalidate = useInvalidateContent();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: PostStatus }) => {
      const { data, error } = await adminContentRepository.setStatus(id, status);
      if (error) throw error;
      return data;
    },
    onSuccess: invalidate
  });
}

export function useDuplicateContent() {
  const invalidate = useInvalidateContent();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await adminContentRepository.duplicate(id);
      if (error) throw error;
      return data;
    },
    onSuccess: invalidate
  });
}

export function useDeleteContent() {
  const invalidate = useInvalidateContent();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await adminContentRepository.remove(id);
      if (error) throw error;
    },
    onSuccess: invalidate
  });
}

export function useUploadCoverImage() {
  return useMutation({ mutationFn: (file: PickedFile) => contentMediaRepository.uploadCoverImage(file) });
}

export function useUploadResourceFile() {
  return useMutation({ mutationFn: (file: PickedFile) => contentMediaRepository.uploadResourceFile(file) });
}
