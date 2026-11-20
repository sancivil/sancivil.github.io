import catalog from '../../data/catalog.json';
import company from '../../data/company.json';
import panels from '../../data/designer/panels.json';
import projects from '../../data/projects.json';
import iraq from '../../data/iraq-solar.json';
import { productNav, type ProductNavKey } from '../../data/site.ts';
import { localeMeta, type Locale } from '../../i18n/config.ts';
import { specFromPanel, type PanelRecord } from '../../lib/three/types.ts';

/** Peimar figures from research/peimar-notes.md (peimar.com: home, who-we-are, products-services). */
export const peimar = {
  founded: 2007,
  bresciaSince: 2017,
  capacityGw: 1.5,
};

const currentModels = new Set(catalog.modules.flatMap((m) => m.designerModels));

const heroPanel: PanelRecord = panels
  .filter(
    (p) =>
      currentModels.has(p.id) &&
      p.series === 'OR10H' &&
      p.model.endsWith('MNDB') &&
      (p.finish?.code === 'BF' || p.finish?.code === 'FB'),
  )
  .reduce((best, p) => (p.power > best.power ? p : best));

export const heroSpec = specFromPanel(heroPanel);

export const peakEfficiency = Math.max(...catalog.modules.map((m) => m.efficiencyMax));

const moduleWarranty = catalog.warranty.modules;
export const warranty = {
  linearPowerYears: Math.min(...Object.values(moduleWarranty).map((w) => w.power)),
  sSeries: moduleWarranty['S Series'],
  orDrSeries: moduleWarranty['OR Series'],
};

type Span = [number, number];

function span(ranges: (number[] | null)[]): Span {
  const values = ranges.flatMap((r) => r ?? []);
  return [Math.min(...values), Math.max(...values)];
}

export function formatPower([min, max]: Span) {
  return min >= 1000 ? { value: `${min / 1000}–${max / 1000}`, unit: 'kW' } : { value: `${min}–${max}`, unit: 'W' };
}

const categoryImageSize: Record<ProductNavKey, [number, number]> = {
  hybrid: [1024, 1024],
  modules: [1024, 1024],
  onGrid: [1024, 1024],
  micro: [954, 1024],
  accessories: [1600, 1600],
};

const hrefOf = (key: ProductNavKey) => productNav.find((p) => p.key === key)?.href ?? '/products/';

function rangeRow(key: ProductNavKey, lines: number, power: Span | null) {
  const [width, height] = categoryImageSize[key];
  return { key, href: hrefOf(key), image: { src: catalog.categories[key].image, width, height }, lines, power };
}

/** Hybrid first: storage is what keeps a house supplied through grid outages. */
export const rangeRows = [
  rangeRow('hybrid', catalog.inverters.hybrid.length, span(catalog.inverters.hybrid.map((i) => i.powerRange))),
  rangeRow('modules', catalog.modules.length, span(catalog.modules.map((m) => m.powerRange))),
  rangeRow('onGrid', catalog.inverters.onGrid.length, span(catalog.inverters.onGrid.map((i) => i.powerRange))),
  rangeRow('micro', catalog.inverters.micro.length, span(catalog.inverters.micro.map((i) => i.powerRange))),
  rangeRow('accessories', catalog.accessories.length, null),
];

const referencePanel = panels.find((p) => p.model === 'OR10H560M');
if (!referencePanel) throw new Error('OR10H560M is missing from panels.json');

/**
 * Peimar Designer reference (tests/fixtures/peimar-reference.json): OR10H560M on PSI-X1P6000-HY,
 * MPPT 2 fixed at 1 string of 6. Row 1 shows MPPT 1 options; 2+ strings exceed the MPPT current.
 */
export const stringMatrix = {
  panel: referencePanel.model,
  inverter: 'PSI-X1P6000-HY',
  power: referencePanel.power,
  series: [3, 4, 5, 6, 7],
  strings: [1, 2, 3, 4],
  firstRow: { 3: 'warn', 4: 'warn', 5: 'ok', 6: 'ok', 7: 'ok' } as Record<number, 'ok' | 'warn'>,
  selected: 6,
  mppts: 2,
};

const photoSize: Record<string, [number, number]> = {
  '/images/legacy/project-3kwp-emergency-water-station.jpg': [1024, 803],
  '/images/legacy/project-12kwp-apartments-1.jpg': [1024, 768],
  '/images/legacy/project-3-6kwp-house.jpg': [1024, 1024],
  '/images/legacy/project-1-8kwp-advertising-board.jpg': [1024, 755],
  '/images/legacy/project-30kwp-big-company.jpg': [1024, 768],
};

type ProjectCategory = 'public' | 'residential' | 'advertising' | 'commercial' | 'agriculture';

/** A stockReason means the archived cover does not show that installation, so it gets a typographic tile. */
export const projectList = [...projects]
  .sort((a, b) => b.sizeKwp - a.sizeKwp)
  .map((p) => {
    const size = photoSize[p.cover];
    const photo = !p.likelyStock && !p.stockReason && size ? { src: p.cover, width: size[0], height: size[1] } : null;
    return { slug: p.slug, kwp: p.sizeKwp, category: p.category as ProjectCategory, photo };
  });

export type Project = (typeof projectList)[number];

const kwps = projectList.map((p) => p.kwp);
export const projectSpan = { count: projectList.length, min: Math.min(...kwps), max: Math.max(...kwps) };

const openDay = company.hours.find((d) => d.open && d.close);
export const officeHours = openDay ? `${openDay.open}–${openDay.close}` : '';

export const cityCount = iraq.cities.length;

export function cityOptions(locale: Locale) {
  const name = (c: (typeof iraq.cities)[number]) => (locale === 'ar' ? c.nameAr : locale === 'ckb' ? c.nameKu : c.name);
  return iraq.cities
    .map((c) => ({ id: c.id, name: name(c) }))
    .sort((a, b) => a.name.localeCompare(b.name, localeMeta[locale].lang));
}
