import { supabase } from '../services/supabase';

// Supabase Storage helpers for CMS media. Binary files never touch the
// database - only the resulting public URL/path is stored inside
// posts.media (jsonb), per the CMS architecture requirements.

export type PickedFile = {
  uri: string;
  name: string;
  mimeType?: string | null;
};

const BUCKET = 'content-media';

function extensionFromName(name: string, mimeType?: string | null) {
  const fromName = name.split('.').pop();
  if (fromName && fromName.length > 0 && fromName.length <= 5 && fromName !== name) return fromName.toLowerCase();
  if (mimeType?.includes('/')) return mimeType.split('/')[1];
  return 'bin';
}

async function uploadFile(folder: 'covers' | 'files', file: PickedFile) {
  const response = await fetch(file.uri);
  const arrayBuffer = await response.arrayBuffer();
  const ext = extensionFromName(file.name, file.mimeType);
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, arrayBuffer, {
    contentType: file.mimeType ?? undefined,
    upsert: false
  });
  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { path, url: data.publicUrl, name: file.name };
}

export const contentMediaRepository = {
  uploadCoverImage: (file: PickedFile) => uploadFile('covers', file),
  uploadResourceFile: (file: PickedFile) => uploadFile('files', file),
  async remove(path: string) {
    return supabase.storage.from(BUCKET).remove([path]);
  }
};
