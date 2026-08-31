import * as ImageManipulator from 'expo-image-manipulator';
import { Image } from 'react-native';
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

// Thrown instead of a plain Error when a file is still over its cap after
// every mitigation (compression for images, the picker's own check for
// PDFs) - lets the screen show the specific "file too large" copy instead
// of the generic publish-failed message.
export class CommunityMediaTooLargeError extends Error {
  kind: 'image' | 'pdf';
  constructor(kind: 'image' | 'pdf') {
    super(kind === 'image' ? 'Image is too large.' : 'File is too large.');
    this.name = 'CommunityMediaTooLargeError';
    this.kind = kind;
  }
}

export const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
export const ALLOWED_PDF_MIME_TYPES = ['application/pdf'];

// Conservative caps for the Supabase Free plan (1GB total storage, 5GB/month
// egress) - well under the platform's 50MB hard upload limit. Images are
// capped tighter than PDFs on purpose: an image auto-renders for every
// viewer who scrolls past it in the feed, so its bytes are downloaded far
// more often than a PDF, which only downloads when a teacher explicitly
// taps "Open PDF". Supabase Free has no server-side image transform/resize,
// so client-side compression (see compressImageForUpload below, Phase C.1)
// is what keeps images under this cap before they ever reach Storage.
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
export const MAX_PDF_BYTES = 10 * 1024 * 1024;

// --- Phase C.1: client-side image compression -----------------------------
//
// Goal: shrink a teacher's picked photo before it ever reaches
// community-media, without asking them to compress it themselves first.
// A modern phone camera photo is very often 3-8MB straight out of the
// gallery, well over MAX_IMAGE_BYTES, so this step - not a stricter picker
// check - is what makes uploads small.
const MAX_LONG_EDGE = 1600;
const IMAGE_COMPRESS_QUALITY = 0.82;

// Progressive fallback if the first pass is still over MAX_IMAGE_BYTES
// (e.g. a very busy/high-detail photo that doesn't compress as well at the
// target quality). Each step tries a smaller long edge and/or a lower JPEG
// quality. A resize action is only ever added when the *original* long
// edge exceeds the attempt's target, so a smaller source photo is never
// upscaled - it only ever gets re-compressed.
const COMPRESSION_ATTEMPTS: Array<{ longEdge: number; quality: number }> = [
  { longEdge: MAX_LONG_EDGE, quality: IMAGE_COMPRESS_QUALITY },
  { longEdge: MAX_LONG_EDGE, quality: 0.7 },
  { longEdge: 1280, quality: 0.7 },
  { longEdge: 1024, quality: 0.6 }
];

function getImageSize(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    Image.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      (error) => reject(error)
    );
  });
}

function jpegName(originalName: string) {
  const base = originalName.replace(/\.[^./\\]+$/, '');
  return `${base || 'image'}.jpg`;
}

// Resizes (only if the photo is unnecessarily large) and re-encodes a
// picked image to JPEG before it reaches Supabase Storage. The original,
// uncompressed file is never uploaded - this function's output entirely
// replaces it as the thing that gets sent to `uploadFile` below.
//
// JPEG (not WebP) is the target format on purpose: expo-image-manipulator's
// WebP *save* support is inconsistent across iOS/Android, and this app
// needs to run reliably in Expo Go on both platforms plus Android
// generally. JPEG at ~0.6-0.82 quality gets the same practical size
// reduction with universal support, so it's the safe choice here.
async function compressImageForUpload(
  file: PickedCommunityFile
): Promise<{ file: PickedCommunityFile; arrayBuffer: ArrayBuffer }> {
  let width = 0;
  let height = 0;
  try {
    ({ width, height } = await getImageSize(file.uri));
  } catch {
    // Dimensions unavailable (rare, platform-dependent): longEdge stays 0
    // below, so every resize check is skipped and only compression quality
    // is applied. Never upscales - just falls back to compress-only passes.
  }
  const longEdge = Math.max(width, height);

  let compressed: { file: PickedCommunityFile; arrayBuffer: ArrayBuffer } | null = null;

  for (const attempt of COMPRESSION_ATTEMPTS) {
    const actions: ImageManipulator.Action[] = [];
    if (longEdge > attempt.longEdge) {
      actions.push(width >= height ? { resize: { width: attempt.longEdge } } : { resize: { height: attempt.longEdge } });
    }

    const result = await ImageManipulator.manipulateAsync(file.uri, actions, {
      compress: attempt.quality,
      format: ImageManipulator.SaveFormat.JPEG
    });
    const response = await fetch(result.uri);
    const arrayBuffer = await response.arrayBuffer();
    compressed = { file: { uri: result.uri, name: jpegName(file.name), mimeType: 'image/jpeg' }, arrayBuffer };

    if (arrayBuffer.byteLength <= MAX_IMAGE_BYTES) {
      return compressed;
    }
  }

  // Every attempt still exceeded the cap (unusual - e.g. an extremely
  // busy/high-entropy photo even at the smallest attempted size). Return
  // the last (smallest) attempt rather than throwing here; the byte-length
  // guard in uploadFile() below still rejects it with the normal
  // "file too large" message instead of silently uploading an oversized
  // file.
  return compressed!;
}
// ---------------------------------------------------------------------------

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

  // Images are compressed (resized/re-encoded to JPEG) before upload; the
  // original picked file is never sent to Storage. PDFs are uploaded as-is
  // - Phase C.1 explicitly keeps PDF handling unchanged.
  let uploadPayload: PickedCommunityFile = file;
  let arrayBuffer: ArrayBuffer;
  if (kind === 'image') {
    const prepared = await compressImageForUpload(file);
    uploadPayload = prepared.file;
    arrayBuffer = prepared.arrayBuffer;
  } else {
    const response = await fetch(file.uri);
    arrayBuffer = await response.arrayBuffer();
  }

  // Defense in depth: images are already brought under MAX_IMAGE_BYTES by
  // compressImageForUpload() above on the normal path, and the create-post
  // screen already checks a picked PDF's reported size before calling this.
  // Re-check the actual bytes here too, since a picker's reported size can
  // be missing on some platforms and a pathological photo can still exceed
  // the cap after every compression attempt.
  const maxBytes = kind === 'image' ? MAX_IMAGE_BYTES : MAX_PDF_BYTES;
  if (arrayBuffer.byteLength > maxBytes) {
    throw new CommunityMediaTooLargeError(kind);
  }

  const ext = extensionFromName(uploadPayload.name, uploadPayload.mimeType);
  const path = `${auth.user.id}/${postId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, arrayBuffer, {
    contentType: uploadPayload.mimeType ?? undefined,
    upsert: false
  });
  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { type: kind, path, url: data.publicUrl, name: uploadPayload.name };
}

export const communityMediaRepository = {
  uploadImage: (file: PickedCommunityFile, postId: string) => uploadFile('image', file, postId),
  uploadPdf: (file: PickedCommunityFile, postId: string) => uploadFile('pdf', file, postId),
  async remove(path: string) {
    return supabase.storage.from(BUCKET).remove([path]);
  }
};
