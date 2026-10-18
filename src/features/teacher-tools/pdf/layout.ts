import { PDFDocument } from 'pdf-lib';

export type PdfSettings = { paper: 'A4' | 'A3'; landscape: boolean; marginMm: number };
export const MAX_IMAGES = 20;
export const MAX_SOURCE_BYTES = 25 * 1024 * 1024;
export const MAX_SOURCE_PIXELS = 50_000_000;
export const MAX_EMBEDDED_BYTES = 24 * 1024 * 1024;
export const mmToPoints = (mm: number) => mm * 72 / 25.4;

export function pageSize(settings: PdfSettings): [number, number] {
  const [w, h] = settings.paper === 'A3' ? [297, 420] : [210, 297];
  return (settings.landscape ? [h, w] : [w, h]).map(mmToPoints) as [number, number];
}

export function fitImage(width: number, height: number, settings: PdfSettings) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0 ||
      !Number.isFinite(settings.marginMm) || settings.marginMm < 0 || settings.marginMm > 30) {
    throw new Error('INVALID_LAYOUT');
  }
  const [pageWidth, pageHeight] = pageSize(settings);
  const margin = mmToPoints(settings.marginMm);
  const scale = Math.min((pageWidth - 2 * margin) / width, (pageHeight - 2 * margin) / height);
  const w = width * scale;
  const h = height * scale;
  return { x: (pageWidth - w) / 2, y: (pageHeight - h) / 2, width: w, height: h };
}

export async function appendImagePage(doc: PDFDocument, bytes: Uint8Array, settings: PdfSettings, png = false) {
  const image = png ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
  const page = doc.addPage(pageSize(settings));
  page.drawImage(image, fitImage(image.width, image.height, settings));
  return page;
}
