import designerPanels from '../../data/designer/panels.json';
import designerInverters from '../../data/designer/inverters.json';
import { productNav, type ProductNavKey } from '../../data/site.ts';
import { accessories, batteries, families, itemsByLine, modules } from '../../content/index.ts';

export type CountKey = 'series' | 'products' | 'models';

export interface MenuCategory {
  key: ProductNavKey;
  href: string;
  image: { src: string; width: number; height: number };
  /** Absent when the line shows nothing. */
  count?: { key: CountKey; n: number };
  /** Power span in Latin units, e.g. "205–735 W". */
  range?: string;
}

const trim = (n: number) => String(Number(n.toFixed(1)));

function powerSpan(items: { powerRange: number[] | null }[]): string | undefined {
  const watts = items.flatMap((item) => item.powerRange ?? []);
  if (!watts.length) return undefined;
  const min = Math.min(...watts);
  const max = Math.max(...watts);
  return min < 1000 ? `${min}–${max} W` : `${trim(min / 1000)}–${trim(max / 1000)} kW`;
}

const href = (key: ProductNavKey) => productNav.find((item) => item.key === key)!.href;

/** A line's own count, or a product count once the owner adds generic products to it; nothing when it is empty. */
function count(key: ProductNavKey, own: { key: CountKey; n: number }, entries: number) {
  const items = itemsByLine(key).length;
  if (entries + items === 0) return undefined;
  return items ? { key: 'products' as const, n: entries + items } : own;
}

/** Menu order: storage first, it is what most Iraqi homes ask for. */
export const menuCategories: MenuCategory[] = [
  {
    key: 'hybrid',
    href: href('hybrid'),
    image: { src: '/images/products/thumbs/hybrid.webp', width: 480, height: 480 },
    count: count('hybrid', { key: 'products', n: families.hybrid.length + batteries.length }, families.hybrid.length + batteries.length),
    range: powerSpan(families.hybrid),
  },
  {
    key: 'modules',
    href: href('modules'),
    image: { src: '/images/products/thumbs/modules.webp', width: 226, height: 480 },
    count: count('modules', { key: 'series', n: modules.length }, modules.length),
    range: powerSpan(modules),
  },
  {
    key: 'onGrid',
    href: href('onGrid'),
    image: { src: '/images/products/thumbs/on-grid.webp', width: 480, height: 480 },
    count: count('onGrid', { key: 'products', n: families.onGrid.length }, families.onGrid.length),
    range: powerSpan(families.onGrid),
  },
  {
    key: 'micro',
    href: href('micro'),
    image: { src: '/images/products/thumbs/micro.webp', width: 448, height: 480 },
    count: count(
      'micro',
      { key: 'models', n: families.micro.reduce((sum, family) => sum + family.models.length, 0) },
      families.micro.length,
    ),
    range: powerSpan(families.micro),
  },
  {
    key: 'accessories',
    href: href('accessories'),
    image: { src: '/images/products/thumbs/accessories.webp', width: 480, height: 480 },
    count: count('accessories', { key: 'products', n: accessories.length }, accessories.length),
  },
];

export const designerLibrary = { modules: designerPanels.length, inverters: designerInverters.length };
