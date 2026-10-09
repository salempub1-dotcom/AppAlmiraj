import * as Print from 'expo-print';
import { File, Paths } from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';

export type PdfPaper = 'A4' | 'A3';
export type PdfOrientation = 'portrait' | 'landscape';
export type PdfImage = { id: string; uri: string };

const SIZE_MM: Record<PdfPaper, [number, number]> = { A4: [210, 297], A3: [297, 420] };
const mmToPt = (mm: number) => mm * 72 / 25.4;

function escapeAttr(s: string) {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

/** Generate PDF locally. All images are inlined: WKWebView on iOS cannot print file:// image URLs. */
export async function exportImagesPdf(
  images: PdfImage[],
  paper: PdfPaper,
  orientation: PdfOrientation,
  marginMm: number
): Promise<string> {
  if (images.length === 0) throw new Error('EMPTY_SELECTION');
  if (images.length > 30) throw new Error('TOO_MANY_IMAGES');
  if (!Number.isFinite(marginMm) || marginMm < 0 || marginMm > 25) throw new Error('INVALID_MARGINS');
  const [short, long] = SIZE_MM[paper];
  const widthMm = orientation === 'portrait' ? short : long;
  const heightMm = orientation === 'portrait' ? long : short;
  const pages: string[] = [];
  // Work in sequence to avoid reading all source files concurrently.
  let bytesTotal = 0;
  for (const image of images) {
    // HEIC, HEIF and WebP must be converted before being embedded in print HTML.
    const lower = image.uri.toLowerCase().split('?')[0] ?? '';
    const supported = lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png');
    let uri = image.uri;
    if (!supported) {
      const context = ImageManipulator.ImageManipulator.manipulate(image.uri);
      const rendered = await context.renderAsync();
      const converted = await rendered.saveAsync({ format: ImageManipulator.SaveFormat.JPEG, compress: 0.92 });
      uri = converted.uri;
    }
    const file = new File(uri);
    if (!file.exists) throw new Error('IMAGE_UNAVAILABLE');
    bytesTotal += file.size;
    // Inline image HTML can exhaust mobile WebView memory. Explicit conservative limit.
    if (bytesTotal > 24 * 1024 * 1024) throw new Error('IMAGES_TOO_LARGE');
    const mime = (uri.toLowerCase().split('?')[0] ?? '').endsWith('.png') ? 'image/png' : 'image/jpeg';
    const data = await file.base64();
    pages.push(`<section class="sheet"><img src="${escapeAttr(`data:${mime};base64,${data}`)}" /></section>`);
  }
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>
  @page { size: ${widthMm}mm ${heightMm}mm; margin: 0; }
  * { box-sizing: border-box; } html,body { padding:0; margin:0; }
  .sheet { width: ${widthMm}mm; height: ${heightMm}mm; padding: ${marginMm}mm; break-after: page; page-break-after: always; display:flex; align-items:center; justify-content:center; overflow:hidden; }
  .sheet:last-child { break-after:auto; page-break-after:auto; }
  img { display:block; max-width:100%; max-height:100%; object-fit:contain; }
  </style></head><body>${pages.join('')}</body></html>`;
  const result = await Print.printToFileAsync({ html, width: mmToPt(widthMm), height: mmToPt(heightMm) });
  // Keep the export in application documents, not the temporary print cache.
  const source = new File(result.uri);
  const destination = new File(Paths.document, `AlMiraj-${Date.now()}.pdf`);
  source.copy(destination);
  return destination.uri;
}
