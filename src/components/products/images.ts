/*
  Product renders and photos in public/images/products as responsive WebP. scripts/images/products.ts writes a WebP
  copy of each one, transparency kept, at every width of IMAGE_WIDTHS below its own and, for a PNG, at its own width:
  "psi-j1000-tl.png" (720 px) has "psi-j1000-tl-240.webp", "-480.webp" and "-720.webp". A WebP original is its own
  full-size copy.
*/
export const IMAGE_WIDTHS = [240, 480, 960, 1600];

/** The WebP versions of an image this wide, from the smallest: [width, site path]. */
export function imageCandidates(src: string, width: number): [number, string][] {
  const copy = (w: number): [number, string] => [w, src.replace(/\.(png|webp)$/, `-${w}.webp`)];
  return [...IMAGE_WIDTHS.filter((w) => w < width).map(copy), src.endsWith('.webp') ? [width, src] : copy(width)];
}

/** An image of public/images/products with its WebP versions in srcset; the original stays the plain src. */
export function productImage(src: string, [width, height]: [number, number]) {
  return {
    src,
    srcset: imageCandidates(src, width)
      .map(([w, path]) => `${path} ${w}w`)
      .join(', '),
    width,
    height,
  };
}
