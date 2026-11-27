import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { IMAGE_WIDTHS, imageCandidates, productImage } from '../src/components/products/images.ts';
import { catalogText } from '../src/i18n/catalog-text.ts';
import { products } from '../src/i18n/products.ts';

const publicDir = fileURLToPath(new URL('../public', import.meta.url));

/* ---------- "years" after a figure ---------- */

test('Arabic years after a figure: the plural for 3 to 10 (and 103 to 110), the singular otherwise', () => {
  const years = products.ar.years;
  for (const n of [3, 9, 10, 103, 110]) assert.equal(years(n), 'سنوات', String(n));
  for (const n of [1, 11, 12, 15, 25, 30, 99, 100, 102, 111]) assert.equal(years(n), 'سنة', String(n));
  assert.match(catalogText.ar.batteryWarranty(10), /^10 سنوات /);
});

test('Kurdish keeps the singular after any figure, English the plural from 2', () => {
  for (const n of [1, 9, 10, 25]) assert.equal(products.ckb.years(n), 'ساڵ');
  assert.equal(products.en.years(1), 'year');
  assert.equal(products.en.years(9), 'years');
});

/* ---------- product images as responsive WebP ---------- */

test('imageCandidates: copies below the width, then the full size (a WebP original is its own)', () => {
  assert.deepEqual(imageCandidates('/images/products/inverters/x.png', 720), [
    [240, '/images/products/inverters/x-240.webp'],
    [480, '/images/products/inverters/x-480.webp'],
    [720, '/images/products/inverters/x-720.webp'],
  ]);
  assert.deepEqual(imageCandidates('/images/products/modules/y.webp', 658), [
    [240, '/images/products/modules/y-240.webp'],
    [480, '/images/products/modules/y-480.webp'],
    [658, '/images/products/modules/y.webp'],
  ]);
  assert.deepEqual(imageCandidates('/a.png', 1600).map(([w]) => w), IMAGE_WIDTHS);
  assert.deepEqual(productImage('/a.png', [480, 300]), {
    src: '/a.png',
    srcset: '/a-240.webp 240w, /a-480.webp 480w',
    width: 480,
    height: 300,
  });
});

test('every product image has its WebP copies, at their widths and its proportions, with transparency', async () => {
  const files = readdirSync(join(publicDir, 'images/products'), { recursive: true, encoding: 'utf8' }).map(
    (file) => `/images/products/${file.replaceAll('\\', '/')}`,
  );
  const copies = new Set(files.filter((path) => /-\d+\.webp$/.test(path)));
  const sources = files.filter((path) => /\.(png|webp)$/.test(path) && !copies.has(path) && !path.startsWith('/images/products/thumbs/'));
  assert.ok(sources.length >= 80, `${sources.length} product images`);
  for (const source of sources) {
    const original = await sharp(join(publicDir, source)).metadata();
    for (const [width, path] of imageCandidates(source, original.width)) {
      const copy = await sharp(join(publicDir, path)).metadata();
      assert.equal(copy.format, 'webp', path);
      assert.equal(copy.width, width, path);
      assert.ok(Math.abs(copy.height - (original.height * width) / original.width) <= 1, `${path} keeps the proportions`);
      assert.equal(copy.hasAlpha, original.hasAlpha, `${path} keeps the transparency`);
      copies.delete(path);
    }
  }
  assert.deepEqual([...copies], [], 'copies of no product image');
});
