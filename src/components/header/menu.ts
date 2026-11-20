import catalog from '../../data/catalog.json';
import designerPanels from '../../data/designer/panels.json';
import designerInverters from '../../data/designer/inverters.json';
import { productNav, type ProductNavKey } from '../../data/site.ts';

export type CountKey = 'series' | 'products' | 'models';

export interface MenuCategory {
  key: ProductNavKey;
  href: string;
  image: { src: string; width: number; height: number };
  count: { key: CountKey; n: number };
  /** Power span in Latin units, e.g. "205–735 W". */
  range?: string;
}

const trim = (n: number) => String(Number(n.toFixed(1)));

function powerSpan(items: { powerRange: number[] | null }[]): string {
  const watts = items.flatMap((item) => item.powerRange ?? []);
  const min = Math.min(...watts);
  const max = Math.max(...watts);
  return min < 1000 ? `${min}–${max} W` : `${trim(min / 1000)}–${trim(max / 1000)} kW`;
}

const { modules, inverters, batteries, accessories } = catalog;
const href = (key: ProductNavKey) => productNav.find((item) => item.key === key)!.href;

/** Menu order: storage first, it is what most Iraqi homes ask for. */
export const menuCategories: MenuCategory[] = [
  {
    key: 'hybrid',
    href: href('hybrid'),
    image: { src: '/images/products/thumbs/hybrid.webp', width: 480, height: 480 },
    count: { key: 'products', n: inverters.hybrid.length + batteries.length },
    range: powerSpan(inverters.hybrid),
  },
  {
    key: 'modules',
    href: href('modules'),
    image: { src: '/images/products/thumbs/modules.webp', width: 226, height: 480 },
    count: { key: 'series', n: modules.length },
    range: powerSpan(modules),
  },
  {
    key: 'onGrid',
    href: href('onGrid'),
    image: { src: '/images/products/thumbs/on-grid.webp', width: 480, height: 480 },
    count: { key: 'products', n: inverters.onGrid.length },
    range: powerSpan(inverters.onGrid),
  },
  {
    key: 'micro',
    href: href('micro'),
    image: { src: '/images/products/thumbs/micro.webp', width: 448, height: 480 },
    count: { key: 'models', n: inverters.micro.reduce((sum, family) => sum + family.models.length, 0) },
    range: powerSpan(inverters.micro),
  },
  {
    key: 'accessories',
    href: href('accessories'),
    image: { src: '/images/products/thumbs/accessories.webp', width: 480, height: 480 },
    count: { key: 'products', n: accessories.length },
  },
];

export const designerLibrary = { modules: designerPanels.length, inverters: designerInverters.length };
