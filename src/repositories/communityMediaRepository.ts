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

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf'];

function extensionFromName(name: string, mimeType?: string | null) {
  const fromName = name.split('.').pop();
  if (fromName && fromName.length > 0 && fromName.length <= 5 && fromName !== name) return fromName.toLowerCase();
  if (mimeType?.includes('/')) return mimeType.split('/')[1];
  return 'bin';
}

async function uploadFile(kind: 'image' | 'pdf', file: PickedCommunityFile) {
  if (file.mimeType && !ALLOWED_MIME_TYPES.includes(file.mimeType)) {
    throw new Error('نوع الملف غير مدعوم. يُسمح فقط بالصور أو ملفات PDF.');
  }

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('يجب تسجيل الدخول');

  const response = await fetch(file.uri);
  const arrayBuffer = await response.arrayBuffer();
  const ext = extensionFromName(file.name, file.mimeType);
  const path = `${auth.user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, arrayBuffer, {
    contentType: file.mimeType ?? undefined,
    upsert: false
  });
  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { type: kind, path, url: data.publicUrl, name: file.name };
}

export const communityMediaRepository = {
  uploadImage: (file: PickedCommunityFile) => uploadFile('image', file),
  uploadPdf: (file: PickedCommunityFile) => uploadFile('pdf', file),
  async remove(path: string) {
    return supabase.storage.from(BUCKET).remove([path]);
  }
};
