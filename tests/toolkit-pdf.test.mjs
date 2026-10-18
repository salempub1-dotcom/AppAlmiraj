import test from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument } from 'pdf-lib';
import { appendImagePage, fitImage, pageSize, mmToPoints } from '../src/features/teacher-tools/pdf/layout.ts';

for (const paper of ['A4', 'A3']) for (const landscape of [false, true]) {
  test(`${paper} ${landscape ? 'landscape' : 'portrait'} contains portrait and landscape images without stretching`, () => {
    const settings = { paper, landscape, marginMm: 10 };
    const [w, h] = pageSize(settings);
    assert.equal(w > h, landscape);
    for (const [iw, ih] of [[600, 1200], [1600, 600], [1, 1]]) {
      const fit = fitImage(iw, ih, settings);
      assert.ok(Math.abs(fit.width / fit.height - iw / ih) < 1e-8);
      assert.ok(fit.x >= mmToPoints(10) - 1e-8 && fit.y >= mmToPoints(10) - 1e-8);
      assert.ok(fit.x + fit.width <= w - mmToPoints(10) + 1e-8);
      assert.ok(fit.y + fit.height <= h - mmToPoints(10) + 1e-8);
    }
    assert.ok(Math.abs(Math.min(w, h) / 72 * 25.4 - (paper === 'A4' ? 210 : 297)) < 1e-8);
  });
}
test('invalid dimensions and margins cannot generate broken layouts', () => {
  for (const marginMm of [-1, 31, NaN]) assert.throws(() => fitImage(100, 100, { paper: 'A4', landscape: false, marginMm }));
  assert.throws(() => fitImage(0, 100, { paper: 'A4', landscape: false, marginMm: 0 }));
});
test('real PDF serializes and reloads with ordered page dimensions', async () => {
  const png = Uint8Array.from(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64'));
  const doc = await PDFDocument.create();
  const settings = [
    { paper: 'A4', landscape: false, marginMm: 10 },
    { paper: 'A3', landscape: true, marginMm: 5 },
    { paper: 'A4', landscape: true, marginMm: 0 },
  ];
  for (const setting of settings) await appendImagePage(doc, png, setting, true);
  const bytes = await doc.save();
  const restored = await PDFDocument.load(bytes);
  assert.equal(restored.getPageCount(), 3);
  restored.getPages().forEach((page, index) => {
    const [w, h] = pageSize(settings[index]);
    assert.ok(Math.abs(page.getWidth() - w) < 1e-6);
    assert.ok(Math.abs(page.getHeight() - h) < 1e-6);
  });
});
