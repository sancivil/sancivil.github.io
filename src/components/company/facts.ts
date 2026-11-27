import programme from '../../data/technical/programme.json';
import panels from '../../data/designer/panels.json';
import iraq from '../../data/iraq-solar.json';
import { productNav, type ProductNavKey } from '../../data/site.ts';
import { accessories, curatedSeries, families, featured, itemsByLine, modules, projects } from '../../content/index.ts';
import { localeMeta, type Locale } from '../../i18n/config.ts';
import { specFromPanel, type PanelRecord } from '../../lib/three/types.ts';

/** Peimar figures from research/peimar-notes.md (peimar.com: home, who-we-are, products-services). */
export const peimar = {
  founded: 2007,
  bresciaSince: 2017,
  capacityGw: 1.5,
};

/** OR10H TOPCon double-glass modules with a black frame among the given Designer ids: the home hero's choice. */
const heroCandidates = (ids: Set<string>) =>
  panels.filter(
    (p) =>
      ids.has(p.id) &&
      p.series === 'OR10H' &&
      p.model.endsWith('MNDB') &&
      (p.finish?.code === 'BF' || p.finish?.code === 'FB'),
  );
const strongest = (list: typeof panels) => list.reduce((best, p) => (p.power > best.power ? p : best));
const shown = new Set(modules.flatMap((m) => m.designerModels));
const shownCandidates = heroCandidates(shown);

/** The owner's pick when it is shown, else the most powerful candidate shown, else the same over every curated panel. */
const heroPanel: PanelRecord =
  panels.find((p) => p.id === featured.heroPanel && shown.has(p.id)) ??
  strongest(shownCandidates.length ? shownCandidates : heroCandidates(new Set(curatedSeries.flatMap((s) => s.panelIds))));

export const heroSpec = specFromPanel(heroPanel);

export const peakEfficiency = Math.max(...modules.map((m) => m.efficiencyMax));

const moduleWarranty = programme.warranty.modules;
export const warranty = {
  linearPowerYears: Math.min(...Object.values(moduleWarranty).map((w) => w.power)),
  sSeries: moduleWarranty['S Series'],
  orDrSeries: moduleWarranty['OR Series'],
};

type Span = [number, number];

function span(ranges: (number[] | null)[]): Span | null {
  const values = ranges.flatMap((r) => r ?? []);
  return values.length ? [Math.min(...values), Math.max(...values)] : null;
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
  return { key, href: hrefOf(key), image: { src: programme.categories[key].image, width, height }, lines, power };
}

/** Hybrid first: storage is what keeps a house supplied through grid outages. */
export const rangeRows = [
  rangeRow('hybrid', families.hybrid.length, span(families.hybrid.map((i) => i.powerRange))),
  rangeRow('modules', modules.length, span(modules.map((m) => m.powerRange))),
  rangeRow('onGrid', families.onGrid.length, span(families.onGrid.map((i) => i.powerRange))),
  rangeRow('micro', families.micro.length, span(families.micro.map((i) => i.powerRange))),
  rangeRow('accessories', accessories.length + itemsByLine('accessories').length, null),
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

/** Projects, largest first, each with its cover photo or null for a typographic tile. */
export const projectList = projects.map((p) => ({
  slug: p.slug,
  kwp: p.sizeKwp,
  category: p.category,
  photo: p.cover && { src: p.cover.src, srcset: p.cover.srcset, width: p.cover.width, height: p.cover.height },
  text: p.text,
  alt: p.cover?.alt,
}));

export type Project = (typeof projectList)[number];

const kwps = projectList.map((p) => p.kwp);
/** Null when there are no projects to sum up. */
export const projectSpan = kwps.length ? { count: kwps.length, min: Math.min(...kwps), max: Math.max(...kwps) } : null;

export const cityCount = iraq.cities.length;

export function cityOptions(locale: Locale) {
  const name = (c: (typeof iraq.cities)[number]) => (locale === 'ar' ? c.nameAr : locale === 'ckb' ? c.nameKu : c.name);
  return iraq.cities
    .map((c) => ({ id: c.id, name: name(c) }))
    .sort((a, b) => a.name.localeCompare(b.name, localeMeta[locale].lang));
}
