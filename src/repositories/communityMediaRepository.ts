import { supabase } from '../services/supabase';

// Storage helpers for Teacher Space post media.
//
// V1 scope: image or PDF only - no video upload helper exists here on
// purpose. Files are written under the uploading teacher's own folder
// (bucket-path/{auth.uid()}/...), matching the storage RLS policies in
// 0005_community.sql, which is a different (self-serve, not admin-gated)
// write model from contentMediaRepository.ts's `content-media` bucket.

export type PickedCommunityFile = {
  uri: string;
  name: string;
  mimeType?: string | null;
};

const BUCKET = 'community-media';

export const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
export const ALLOWED_PDF_MIME_TYPES = ['application/pdf'];

// Conservative caps for the Supabase Free plan (1GB total storage, 5GB/month
// egress) - well under the platform's 50MB hard upload limit.
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_PDF_BYTES = 10 * 1024 * 1024;

function extensionFromName(name: string, mimeType?: string | null) {
  const fromName = name.split('.').pop();
  if (fromName && fromName.length > 0 && fromName.length <= 5 && fromName !== name) return fromName.toLowerCase();
  if (mimeType?.includes('/')) return mimeType.split('/')[1];
  return 'bin';
}

// Path convention: community-media/{auth.uid()}/{postId}/{file} - matches
// the storage.foldername(name)[1] = auth.uid() check in 0005_community.sql.
// `postId` scopes the file to the post it belongs to (created first by the
// caller - see useCreateCommunityPost), so orphaned uploads are easy to
// reason about and clean up.
async function uploadFile(kind: 'image' | 'pdf', file: PickedCommunityFile, postId: string) {
  const allowed = kind === 'image' ? ALLOWED_IMAGE_MIME_TYPES : ALLOWED_PDF_MIME_TYPES;
  if (file.mimeType && !allowed.includes(file.mimeType)) {
    throw new Error('نوع الملف غير مدعوم.');
  }

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('يجب تسجيل الدخول');

  const response = await fetch(file.uri);
  const arrayBuffer = await response.arrayBuffer();
  const ext = extensionFromName(file.name, file.mimeType);
  const path = `${auth.user.id}/${postId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, arrayBuffer, {
    contentType: file.mimeType ?? undefined,
    upsert: false
  });
  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { type: kind, path, url: data.publicUrl, name: file.name };
}

export const communityMediaRepository = {
  uploadImage: (file: PickedCommunityFile, postId: string) => uploadFile('image', file, postId),
  uploadPdf: (file: PickedCommunityFile, postId: string) => uploadFile('pdf', file, postId),
  async remove(path: string) {
    return supabase.storage.from(BUCKET).remove([path]);
  }
};
