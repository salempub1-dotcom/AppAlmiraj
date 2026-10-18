import { Directory, File, Paths } from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { PDFDocument } from 'pdf-lib';
import { appendImagePage, fitImage, MAX_EMBEDDED_BYTES, MAX_IMAGES, PdfSettings } from './layout';

export type PdfImage = { id: string; uri: string; thumbnailUri?: string; width: number; height: number; name: string };
export type SavedPdf = { uri: string; name: string; size: number };
const savedDirectory = () => new Directory(Paths.document, 'teacher-toolkit');
const tempDirectory = () => new Directory(Paths.cache, 'teacher-toolkit');
export const makeJobId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export function savedPdfs(): SavedPdf[] {
  const dir = savedDirectory();
  if (!dir.exists) return [];
  return dir.list().filter((entry): entry is File => entry instanceof File && entry.name.endsWith('.pdf'))
    .map(file => ({ uri: file.uri, name: file.name, size: file.size }))
    .sort((a, b) => b.name.localeCompare(a.name));
}

// Only toolkit-owned stale scratch files; never picker originals or saved documents.
export function cleanStaleScratch() {
  const dir = tempDirectory();
  if (!dir.exists) return;
  for (const entry of dir.list()) {
    const timestamp = Number(entry.name.split('-')[0]);
    if (timestamp && Date.now() - timestamp > 24 * 60 * 60 * 1000) {
      try { entry.delete(); } catch { /* Retry at next visit. */ }
    }
  }
}

export async function thumbnailFor(uri: string): Promise<string> {
  tempDirectory().create({ intermediates: true, idempotent: true });
  const context = ImageManipulator.ImageManipulator.manipulate(uri);
  let rendered: Awaited<ReturnType<typeof context.renderAsync>> | undefined;
  let output: File | undefined;
  const destination = new File(tempDirectory(), `${makeJobId()}-thumb.jpg`);
  try {
    context.resize({ width: 240 });
    rendered = await context.renderAsync();
    output = new File((await rendered.saveAsync({ format: ImageManipulator.SaveFormat.JPEG, compress: 0.7 })).uri);
    await output.copy(destination);
    return destination.uri;
  } catch (error) {
    if (destination.exists) destination.delete();
    throw error;
  } finally {
    if (output?.exists && output.uri !== uri) { try { output.delete(); } catch {} }
    rendered?.release(); context.release();
  }
}

export function removeThumbnail(uri: string | undefined) {
  if (!uri || !uri.startsWith(tempDirectory().uri.replace(/\/$/, '') + '/')) return;
  try { const file = new File(uri); if (file.exists) file.delete(); } catch { /* Stale cleanup retries. */ }
}

export async function createImagesPdf(images: PdfImage[], settings: PdfSettings, signal: AbortSignal,
  onProgress: (done: number, total: number) => void): Promise<SavedPdf> {
  if (!images.length || images.length > MAX_IMAGES) throw new Error('INVALID_LAYOUT');
  const check = () => { if (signal.aborted) throw new Error('CANCELLED'); };
  const dir = new Directory(tempDirectory(), makeJobId());
  dir.create({ intermediates: true, idempotent: true });
  const doc = await PDFDocument.create();
  let embeddedBytes = 0;
  try {
    for (let index = 0; index < images.length; index++) {
      check();
      const source = images[index]!;
      const fit = fitImage(source.width, source.height, settings);
      // 200 DPI target with a 3000px ceiling; never upscale. Device limits remain to be benchmarked.
      const ratio = Math.min(1, fit.width / 72 * 200 / source.width, fit.height / 72 * 200 / source.height,
        3000 / Math.max(source.width, source.height));
      const context = ImageManipulator.ImageManipulator.manipulate(source.uri);
      let rendered: Awaited<ReturnType<typeof context.renderAsync>> | undefined;
      let generated: File | undefined;
      try {
        context.resize({ width: Math.max(1, Math.round(source.width * ratio)), height: Math.max(1, Math.round(source.height * ratio)) });
        rendered = await context.renderAsync();
        check();
        const output = await rendered.saveAsync({ format: /\.png$/i.test(source.name) ? ImageManipulator.SaveFormat.PNG : ImageManipulator.SaveFormat.JPEG, compress: 0.9 });
        generated = new File(output.uri);
        check();
        embeddedBytes += generated.size;
        if (embeddedBytes > MAX_EMBEDDED_BYTES) throw new Error('TOO_LARGE');
        await appendImagePage(doc, await generated.bytes(), settings, /\.png$/i.test(source.name));
      } finally {
        if (generated?.exists && generated.uri !== source.uri) { try { generated.delete(); } catch {} }
        rendered?.release();
        context.release();
      }
      check();
      onProgress(index + 1, images.length);
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    check();
    const bytes = await doc.save();
    check();
    const filename = `${makeJobId()}.pdf`;
    const temp = new File(dir, filename);
    temp.write(bytes);
    savedDirectory().create({ intermediates: true, idempotent: true });
    const destination = new File(savedDirectory(), filename);
    try { await temp.copy(destination); check(); } catch (error) {
      if (destination.exists) destination.delete();
      throw error;
    }
    return { uri: destination.uri, name: filename, size: destination.size };
  } finally {
    try { if (dir.exists) dir.delete(); } catch { /* Cleaned on a later visit. */ }
  }
}
