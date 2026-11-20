import catalog from '../../data/catalog.json';
import panelData from '../../data/designer/panels.json';
import inverterData from '../../data/designer/inverters.json';
import { productNav, type ProductNavKey } from '../../data/site.ts';
import type { PanelRecord } from '../../lib/three/types.ts';

export type Doc = { label: string; url: string };
export type Phase = 'single_phase' | 'three_phase';
export type GroupKey = 'hybrid' | 'onGrid' | 'micro';
export type CategoryKey = ProductNavKey;

export interface Series {
  series: string;
  name: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  technology: string[];
  warranty: { product: number; power: number };
  models: string[];
  powerRange: number[];
  efficiencyMax: number;
  cells: number[];
  finishes: { code: string; label: string | null }[];
  datasheets: Doc[];
  designerModels: string[];
}

export interface Panel extends PanelRecord {
  vmp: number;
  imp: number;
  voc: number;
  isc: number;
  vdcMax: number;
  imaxFuse: number;
  efficiency: number | null;
  ctPmax: number;
  ctVoc: number;
  ctIsc: number;
  weight: number;
  cellType: string;
  protectionClass: string;
}

export interface Family {
  name: string;
  slug: string;
  phase: Phase;
  powerRange: number[] | null;
  description: string | null;
  datasheets: Doc[];
  manual?: string;
  models: string[];
  designerModels: string[];
}

export interface Inverter {
  id: string;
  model: string;
  phase: Phase;
  type: 'hybrid' | 'on-grid' | 'micro';
  pnomAc: number;
  pnomDc: number;
  vmaxDc: number;
  vminMppt: number;
  vmaxMppt: number;
  numMppt: number;
  imaxPerMppt: number[];
  efficiencyMax: number | null;
  efficiencyEu: number | null;
  protectionClass: string;
  width: number;
  height: number;
  depth: number;
  weight: number;
  communication: string;
  spd: string;
  image: string | null;
}

export type CapacityKey =
  | 'totalKwh'
  | 'usableKwh'
  | 'ratedKwh'
  | 'nominalKwh'
  | 'moduleKwh'
  | 'usableKwhPerModule'
  | 'modules'
  | 'depthOfDischarge';

export interface Battery {
  name: string;
  slug: string;
  family: string;
  role: string;
  capacity: Partial<Record<CapacityKey, number | number[]>> | null;
  chemistry: string | null;
  warrantyYears?: number;
  description: string | null;
  datasheets: Doc[];
}

export interface Accessory {
  group: string;
  name: string;
  slug: string;
  description: string | null;
  datasheets: Doc[];
}

export const modules = catalog.modules as Series[];
export const families = catalog.inverters as Record<GroupKey, Family[]>;
export const batteries = catalog.batteries as Battery[];
export const accessories = catalog.accessories as Accessory[];
export const { warranty, documents } = catalog;

const panels = panelData as Panel[];
const inverters = inverterData as Inverter[];

export const GROUPS: GroupKey[] = ['hybrid', 'onGrid', 'micro'];

export const categoryHref = (key: CategoryKey) => productNav.find((item) => item.key === key)!.href;

/** Category photos in public/images/products with their intrinsic sizes. */
export const categoryImage: Record<CategoryKey, { src: string; size: [number, number] }> = {
  modules: { src: catalog.categories.modules.image, size: [1024, 1024] },
  hybrid: { src: catalog.categories.hybrid.image, size: [1024, 1024] },
  onGrid: { src: catalog.categories.onGrid.image, size: [1024, 1024] },
  micro: { src: catalog.categories.micro.image, size: [954, 1024] },
  accessories: { src: catalog.categories.accessories.image, size: [1600, 1600] },
};
export const INVERTER_IMAGE_SIZE: [number, number] = [720, 720];

/* ---------- formatting ---------- */

const trim = (n: number, digits = 2) => String(+n.toFixed(digits));
export const pct = (ratio: number, digits = 2) => (ratio * 100).toFixed(digits);
export const kw = (watts: number) => trim(watts / 1000);
export const signed = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : '0');
export const extent = (xs: number[]): [number, number] => [Math.min(...xs), Math.max(...xs)];
export const pad2 = (i: number) => String(i + 1).padStart(2, '0');
export const span = ([min, max]: [string, string]) => (min === max ? min : `${min}–${max}`);

/** A power range as figure parts, in W below 2 kW and in kW above. */
export function powerParts([min, max]: number[]): { value: [string, string]; unit: string } {
  return max < 2000 ? { value: [String(min), String(max)], unit: 'W' } : { value: [kw(min), kw(max)], unit: 'kW' };
}

export type DocLang = 'EN' | 'IT' | 'FR' | 'AR';
/* "(FR)" is also the Red Line finish code, so it counts as a language only after another suffix: "SF400M (BF) (FR)". */
const LANG_TAG = / \((IT|US|EN|EN-[A-Z]{2})\)$|(?<=\)) \((FR)\)$/;
const LANGS: Record<string, DocLang> = { EN: 'EN', 'EN-CA': 'EN', 'EN-IN': 'EN', US: 'EN', USA: 'EN', IT: 'IT', FR: 'FR', AR: 'AR' };

/** Peimar marks a document's language in the file name ("Peimar_EN_…") or at the end of its label ("(IT)"). */
export function docInfo(doc: Doc): { label: string; lang: DocLang | null; pdf: boolean } {
  const tag = doc.label.match(LANG_TAG);
  const code = doc.url.match(/Peimar_([A-Z]+(?:-[A-Z]+)?)_/)?.[1] ?? tag?.[1] ?? tag?.[2];
  return {
    label: doc.label.replace(LANG_TAG, ''),
    lang: (code && LANGS[code]) || null,
    pdf: /\.pdf$/i.test(doc.url),
  };
}

/** A document ready for DocList, optionally with a translated label. */
export const docItem = (doc: Doc, label?: string) => {
  const info = docInfo(doc);
  return { ...info, label: label ?? info.label, url: doc.url };
};

/* ---------- modules ---------- */

export const panelName = (p: Panel) => (p.finish ? `${p.model} (${p.finish.code})` : p.model);
export const seriesBySlug = (slug: string) => modules.find((s) => s.slug === slug);

export function seriesPanels(series: Series): Panel[] {
  return series.designerModels
    .map((id) => panels.find((p) => p.id === id))
    .filter((p): p is Panel => p !== undefined)
    .sort((a, b) => a.power - b.power || panelName(a).localeCompare(panelName(b)));
}

export const datasheetsFor = (series: Series, name: string) =>
  series.datasheets.filter((d) => docInfo(d).label === name);

/** Models Peimar lists for a series without full figures in panels.json. */
export function datasheetOnly(series: Series) {
  const known = new Set(seriesPanels(series).map(panelName));
  return series.models.filter((name) => !known.has(name)).map((name) => ({ name, sheets: datasheetsFor(series, name) }));
}

export function largestPanel(series: Series): Panel {
  return seriesPanels(series).reduce((a, b) => (b.width * b.height > a.width * a.height ? b : a));
}

/** One scale for every module drawing on a page. */
export const drawingBox = (() => {
  const largest = modules.map(largestPanel);
  return { width: Math.max(...largest.map((p) => p.width)), height: Math.max(...largest.map((p) => p.height)) };
})();

export const bestEfficiencyPanel = (series: Series) =>
  seriesPanels(series).find((p) => p.efficiency !== null && Math.abs(p.efficiency - series.efficiencyMax) < 1e-6);

export type Trait = 'italy' | 'topcon' | 'perc' | 'bifacial' | 'coloured';

/** Filter keys, read from Peimar's own wording in catalog.json. */
export function seriesTraits(series: Series): Trait[] {
  const tech = series.technology.join(' ');
  const traits: [Trait, boolean][] = [
    ['italy', /Made in Italy/.test(series.tagline ?? '')],
    ['topcon', /TOPCon/.test(tech)],
    ['perc', /PERC/.test(tech)],
    ['bifacial', /bifacial/i.test(tech)],
    ['coloured', series.finishes.some((f) => f.code === 'FR' || f.code === 'FG')],
  ];
  return traits.filter(([, on]) => on).map(([key]) => key);
}

export const moduleCount = modules.reduce((n, s) => n + s.models.length, 0);
export const modulePower = extent(modules.flatMap((s) => s.powerRange));
export const moduleEfficiency = Math.max(...modules.map((s) => s.efficiencyMax));

/* ---------- inverters ---------- */

export const familyInverters = (family: Family): Inverter[] =>
  family.designerModels
    .map((id) => inverters.find((r) => r.id === id))
    .filter((r): r is Inverter => r !== undefined)
    .sort((a, b) => a.pnomAc - b.pnomAc);

export function familyBySlug(slug: string): { family: Family; group: GroupKey } | undefined {
  for (const group of GROUPS) {
    const family = families[group].find((f) => f.slug === slug);
    if (family) return { family, group };
  }
}

export function familyPower(family: Family): [number, number] | null {
  if (family.powerRange) return [family.powerRange[0], family.powerRange[1]];
  const models = familyInverters(family);
  return models.length ? extent(models.map((m) => m.pnomAc)) : null;
}

export function familyImage(family: Family): string | null {
  const withImage = familyInverters(family).filter((m) => m.image);
  return withImage.length ? withImage[withImage.length - 1].image : null;
}

export const groupModels = (group: GroupKey) => families[group].reduce((n, f) => n + f.models.length, 0);
export const groupInverters = (group: GroupKey) => families[group].flatMap(familyInverters);
export function groupPower(group: GroupKey): [number, number] {
  return extent(families[group].flatMap((f) => familyPower(f) ?? []));
}

/** Peimar's EU efficiency can never exceed peak efficiency; such values are data errors and stay unstated. */
export const euEfficiency = (r: Inverter) =>
  r.efficiencyEu !== null && (r.efficiencyMax === null || r.efficiencyEu <= r.efficiencyMax) ? r.efficiencyEu : null;

export const storageReady = (r: Inverter) => r.type === 'hybrid';

/** "32" when every MPPT allows the same current, otherwise "44 / 33 / 33". */
export function mpptCurrents(r: Inverter): string {
  const values = r.imaxPerMppt.map((a) => trim(a, 1));
  return values.every((v) => v === values[0]) ? values[0] : values.join(' / ');
}

/* ---------- storage ---------- */

export const batteryBySlug = (slug: string) => batteries.find((b) => b.slug === slug);

/** The figure that best describes a storage product's size, as Peimar states it. */
export function headlineCapacity(b: Battery): [string, string] | null {
  const c = b.capacity;
  if (!c) return null;
  const v = c.totalKwh ?? c.nominalKwh ?? c.ratedKwh;
  if (v === undefined) return null;
  return Array.isArray(v) ? [trim(v[0]), trim(v[1])] : [trim(v), trim(v)];
}

export const CAPACITY_KEYS: CapacityKey[] = [
  'totalKwh',
  'ratedKwh',
  'nominalKwh',
  'usableKwh',
  'moduleKwh',
  'usableKwhPerModule',
  'modules',
  'depthOfDischarge',
];

export function capacityValue(key: CapacityKey, v: number | number[]): { value: [string, string]; unit?: string } {
  const pair = (Array.isArray(v) ? v : [v, v]).map((n) => (key === 'depthOfDischarge' ? trim(n * 100, 1) : trim(n, 3)));
  const unit = key === 'modules' ? undefined : key === 'depthOfDischarge' ? '%' : 'kWh';
  return { value: [pair[0], pair[1]], unit };
}

/* ---------- studio renders: public/images/products/modules, made with the 3D viewer at its home view ---------- */

const RENDERS: Record<string, { front: [number, number]; back?: [number, number] }> = {
  's-series-sa': { front: [666, 1400], back: [756, 1400] },
  's-series-sf': { front: [670, 1400] },
  'revamping-line': { front: [670, 1400] },
  'or-series-or10e': { front: [810, 1400], back: [932, 1400] },
  'or-series-or10h': { front: [658, 1400], back: [750, 1400] },
  'or-series-or12h': { front: [708, 1400], back: [812, 1400] },
  'dr-series-dr10h': { front: [658, 1400] },
};

export interface Render {
  src: string;
  size: [number, number];
  /** The model the render shows: the series' most powerful panel, which the viewer opens on. */
  model: string;
}

/** Front three-quarter render of a series, or its rear view where the rear is glass or transparent. */
export function seriesRender(series: Series, view: 'front' | 'back' = 'front'): Render | null {
  const entry = RENDERS[series.slug];
  const size = entry?.[view];
  if (!size) return null;
  const suffix = view === 'back' ? '-back' : '';
  return { src: `/images/products/modules/${series.slug}${suffix}.webp`, size, model: panelName(seriesPanels(series).at(-1)!) };
}

/* ---------- warranty curves (Peimar PV module warranty 2026) ---------- */

export type OutputKey = 'monoTopcon' | 'monoPerc' | 'polycrystalline';
export const OUTPUT_KEYS: OutputKey[] = ['monoTopcon', 'monoPerc', 'polycrystalline'];

/** Loss in year one, loss per year after that and the guaranteed output in year 30, in %. */
export function outputTerms(key: OutputKey) {
  const [first, yearly, end] = [...warranty.powerOutput[key].matchAll(/([\d,]+)%/g)].map((m) => m[1].replace(',', '.'));
  return { first, yearly, end };
}

/** The warranty curves that match the cell technologies Peimar names for a series. */
export function seriesOutputs(series: Series): OutputKey[] {
  const tech = series.technology.join(' ');
  const test: Record<OutputKey, RegExp> = { monoTopcon: /TOPCon/, monoPerc: /PERC/, polycrystalline: /Polycrystalline/ };
  return OUTPUT_KEYS.filter((key) => test[key].test(tech));
}

/* ---------- construction ---------- */

/** S Series: 3.2 mm anti-reflective front glass. OR double glass: 2.0 mm rear glass (all models, or the MNDB ones). */
export function seriesGlass(series: Series): 'front' | 'double' | 'doubleSome' | null {
  const tech = series.technology.join(' ');
  if (series.series === 'S Series') return 'front';
  if (/Double glass \(MNDB\)/.test(tech)) return 'doubleSome';
  if (/Double glass/.test(tech)) return 'double';
  return null;
}
export const GLASS_MM = { front: '3.2', rear: '2.0' };

/** Finish codes present in a series, with "std" for models sold without a suffix (silver frame). */
export function seriesFinishes(series: Series): string[] {
  const codes = series.finishes.map((f) => f.code);
  if (seriesPanels(series).some((p) => !p.finish)) codes.push('std');
  return codes;
}

export type CertKey = 'iec' | 'pid' | 'ammonia' | 'salt' | 'dust' | 'ul' | 'adqcc' | 'iso9001' | 'iso14001' | 'iso45001';
export const CERTS: { key: CertKey; code: string }[] = [
  { key: 'iec', code: 'IEC 61215 · IEC 61730' },
  { key: 'pid', code: 'IEC TS 62804-1' },
  { key: 'ammonia', code: 'IEC 62716' },
  { key: 'salt', code: 'IEC 61701' },
  { key: 'dust', code: 'IEC 60068-2-68' },
  { key: 'ul', code: 'UL 61730' },
  { key: 'adqcc', code: 'ADQCC' },
  { key: 'iso9001', code: 'ISO 9001:2015' },
  { key: 'iso14001', code: 'ISO 14001:2015' },
  { key: 'iso45001', code: 'ISO 45001:2018' },
];

/** Certificates that apply to a series: dust and sand only on double glass, the ISO site certificates only on Made in Italy series. */
export function seriesCerts(series: Series): { key: CertKey; code: string; by?: string }[] {
  const italy = seriesTraits(series).includes('italy');
  const glass = seriesGlass(series);
  const by = series.series === 'S Series' ? 'Kiwa' : series.series === 'OR Series' ? 'TÜV' : undefined;
  return CERTS.filter(
    (c) => (c.key !== 'dust' || glass === 'double' || glass === 'doubleSome') && (!c.key.startsWith('iso') || italy),
  ).map((c) => (c.key === 'iec' && by ? { ...c, by } : c));
}
