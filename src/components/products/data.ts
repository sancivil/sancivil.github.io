import programme from '../../data/technical/programme.json';
import panelData from '../../data/designer/panels.json';
import inverterData from '../../data/designer/inverters.json';
import { productNav, type ProductNavKey } from '../../data/site.ts';
import {
  accessories,
  batteries,
  families,
  modules,
  type Accessory,
  type Battery,
  type Doc,
  type Family,
  type GroupKey,
  type Phase,
  type Series,
} from '../../content/index.ts';
import type { CapacityKey } from '../../content/contract.ts';
import type { PanelRecord } from '../../lib/three/types.ts';
import { productImage } from './images.ts';

export type { Accessory, Battery, CapacityKey, Doc, Family, GroupKey, Phase, Series };
export type CategoryKey = ProductNavKey;
export { productImage };

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

export { accessories, batteries, families, modules };
export const { warranty, documents } = programme;

const panels = panelData as Panel[];
const inverters = inverterData as Inverter[];

export const GROUPS: GroupKey[] = ['hybrid', 'onGrid', 'micro'];

export const categoryHref = (key: CategoryKey) => productNav.find((item) => item.key === key)!.href;

/** Category photos in public/images/products with their intrinsic sizes. */
export const categoryImage: Record<CategoryKey, { src: string; size: [number, number] }> = {
  modules: { src: programme.categories.modules.image, size: [1024, 1024] },
  hybrid: { src: programme.categories.hybrid.image, size: [1024, 1024] },
  onGrid: { src: programme.categories.onGrid.image, size: [1024, 1024] },
  micro: { src: programme.categories.micro.image, size: [954, 1024] },
  accessories: { src: programme.categories.accessories.image, size: [1600, 1600] },
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
/** A name, label or code value as pages show it: Peimar groups variants with " | " ("PSI-OP650 | PSI-OPSW"), set as "PSI-OP650 / PSI-OPSW". */
export const displayName = (name: string) => name.replaceAll(' | ', ' / ');

/** A power range as figure parts, in W below 2 kW and in kW above. */
export function powerParts([min, max]: number[]): { value: [string, string]; unit: string } {
  return max < 2000 ? { value: [String(min), String(max)], unit: 'W' } : { value: [kw(min), kw(max)], unit: 'kW' };
}

export type DocLang = 'EN' | 'IT' | 'FR' | 'AR' | 'KU' | 'MULTI';
/* "(FR)" is also the Red Line finish code, so it counts as a language only after another suffix: "SF400M (BF) (FR)". */
const LANG_TAG = / \((IT|US|EN|EN-[A-Z]{2})\)$|(?<=\)) \((FR)\)$/;
const LANGS: Record<string, DocLang> = { EN: 'EN', 'EN-CA': 'EN', 'EN-IN': 'EN', US: 'EN', USA: 'EN', IT: 'IT', FR: 'FR', AR: 'AR' };
const DOC_LANGS: Record<NonNullable<Doc['lang']>, DocLang> = { en: 'EN', it: 'IT', fr: 'FR', ar: 'AR', ckb: 'KU', multi: 'MULTI' };

/**
  A document's language: the owner's choice, or what Peimar marks in the file name ("Peimar_EN_…")
  or at the end of the label ("(IT)").
*/
export function docInfo(doc: { label: string; url: string; lang?: Doc['lang'] }): { label: string; lang: DocLang | null; pdf: boolean } {
  const tag = doc.label.match(LANG_TAG);
  const code = doc.url.match(/Peimar_([A-Z]+(?:-[A-Z]+)?)_/)?.[1] ?? tag?.[1] ?? tag?.[2];
  return {
    label: doc.label.replace(LANG_TAG, ''),
    lang: doc.lang ? DOC_LANGS[doc.lang] : (code && LANGS[code]) || null,
    pdf: /\.pdf$/i.test(doc.url),
  };
}

/** A document ready for DocList, optionally with a translated label. */
export const docItem = (doc: { label: string; url: string; lang?: Doc['lang'] }, label?: string) => {
  const info = docInfo(doc);
  return { ...info, label: displayName(label ?? info.label), url: doc.url };
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

/** Models listed for a series without full figures in panels.json. */
export function datasheetOnly(series: Series) {
  const known = new Set(seriesPanels(series).map(panelName));
  return series.models.filter((name) => !known.has(name)).map((name) => ({ name, sheets: datasheetsFor(series, name) }));
}

export const bestEfficiencyPanel = (series: Series) =>
  seriesPanels(series).find((p) => p.efficiency !== null && Math.abs(p.efficiency - series.efficiencyMax) < 1e-6);

export type Trait = 'italy' | 'topcon' | 'perc' | 'bifacial' | 'coloured';

/** Filter keys, read from Peimar's own wording in src/data/technical/series.json. */
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

/* The contract keeps at least one series visible, so these never meet an empty list. */
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

/** Peimar's photo of the family's most powerful model that has one. */
export function familyImage(family: Family): string | null {
  const withImage = familyInverters(family).filter((m) => m.image);
  return withImage.length ? withImage[withImage.length - 1].image : null;
}

export const groupModels = (group: GroupKey) => families[group].reduce((n, f) => n + f.models.length, 0);
export const groupInverters = (group: GroupKey) => families[group].flatMap(familyInverters);
/** The power span of a product line, or null when none of its families states one. */
export function groupPower(group: GroupKey): [number, number] | null {
  const powers = families[group].flatMap((f) => familyPower(f) ?? []);
  return powers.length ? extent(powers) : null;
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

export interface Render {
  src: string;
  /** Its WebP versions, or an uploaded photo's resized copies; null for a photo without any. */
  srcset: string | null;
  size: [number, number];
  /** The model the render shows: the series' most powerful panel, which the viewer opens on. */
  model: string;
}

/** Front three-quarter render of a series, or its rear view where the rear is glass or transparent. */
export function seriesRender(series: Series, view: 'front' | 'back' = 'front'): Render | null {
  const size = series.render?.[view];
  if (!size) return null;
  const shown = seriesPanels(series).at(-1);
  const src = `/images/products/modules/${series.curatedKey}${view === 'back' ? '-back' : ''}.webp`;
  return { src, srcset: productImage(src, size).srcset, size, model: shown ? panelName(shown) : series.name };
}

/** The series' studio render or, until it has one, the owner's first photo or the modules photo. */
export function seriesImage(series: Series): Render {
  const photo = series.photos[0];
  const { src, size } = categoryImage.modules;
  return (
    seriesRender(series) ??
    (photo
      ? { src: photo.src, srcset: photo.srcset, size: [photo.width, photo.height], model: series.name }
      : { src, srcset: productImage(src, size).srcset, size, model: series.name })
  );
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
