// WebP versions of the product images, for srcset (src/components/products/images.ts):
//   node scripts/images/products.ts
// Every PNG and WebP in public/images/products, the menu thumbnails in thumbs/ aside, gets the copies that
// imageCandidates() lists, transparency kept, at the content importer's encoder settings. Copies that no image lists
// any more are deleted. Run it after adding or replacing a product image and commit the copies with the image.
// Copies are named <name>-<width>.webp, so no product image may be named like that: it would be deleted as a copy.
import { existsSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { imageCandidates } from '../../src/components/products/images.ts';

const publicDir = fileURLToPath(new URL('../../public', import.meta.url));
const COPY = /-\d+\.webp$/;
const files = readdirSync(join(publicDir, 'images/products'), { recursive: true, encoding: 'utf8' }).map(
  (file) => `/images/products/${file.replaceAll('\\', '/')}`,
);
const sources = files.filter((path) => /\.(png|webp)$/.test(path) && !COPY.test(path) && !path.startsWith('/images/products/thumbs/'));

const written = new Set<string>();
let bytes = 0;
for (const source of sources) {
  const input = readFileSync(join(publicDir, source));
  const { width } = await sharp(input).metadata();
  for (const [w, path] of imageCandidates(source, width)) {
    if (path === source) continue;
    const webp = await sharp(input).resize({ width: w }).webp({ quality: 80 }).toBuffer();
    const file = join(publicDir, path);
    if (!existsSync(file) || !readFileSync(file).equals(webp)) writeFileSync(file, webp);
    written.add(path);
    bytes += webp.length;
  }
}
for (const path of files) if (COPY.test(path) && !written.has(path)) rmSync(join(publicDir, path));
console.log(`${sources.length} product images, ${written.size} WebP copies, ${Math.round(bytes / 1024)} KB`);
