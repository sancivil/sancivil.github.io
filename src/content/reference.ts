/*
  The technical layer the owner content links to (src/data/technical, src/data/designer, src/data/iraq-solar.json)
  and the site reference built from it (contract §8). The importer checks snapshots against this reference,
  and /data/site-reference.v1.json serves it to the ERP.
*/
import {
  ACCEPTS_MAX_MINOR,
  CAPACITY_KEYS,
  CHEMISTRIES,
  DOC_LANGS,
  SOCIAL_NETWORKS,
  SPEC_KEYS,
  type CapacityKey,
  type Line,
  type SiteReferenceV1,
  type SocialNetwork,
} from './contract.ts';

/** Peimar's facts for a module series, keyed by the curatedKey that joins it to the owner content. */
export interface TechnicalSeries {
  key: string;
  name: string;
  series: 'S Series' | 'OR Series' | 'DR Series';
  /** Peimar's own wording: it drives the filters, glass type, certificates, warranty curves and JSON-LD fallbacks. */
  tagline: string | null;
  description: string | null;
  technology: string[];
  warranty: { product: number; power: number };
  powerRange: [number, number];
  efficiencyMax: number;
  cells: number[];
  finishes: { code: string; label: string | null }[];
  /** The Designer panels of the series (renders, the reference and the curated fallbacks). */
  panelIds: string[];
  /** Studio render sizes in public/images/products/modules (made with the 3D viewer at its home view). */
  render: { front: [number, number]; back?: [number, number] } | null;
}

export interface TechnicalFamily {
  key: string;
  group: 'onGrid' | 'hybrid' | 'micro';
  /** Peimar's description, the JSON-LD fallback of a family without an owner note. */
  description: string | null;
  inverterIds: string[];
}

/** The Designer's copy of a Peimar battery: owner edits never change it. */
export interface TechnicalBattery {
  key: string;
  name: string;
  family: string;
  role: string;
  capacity: Partial<Record<CapacityKey, number | [number, number]>> | null;
}

export interface Policy {
  linkHosts: string[];
  mapsHosts: string[];
  socialHosts: Record<SocialNetwork, string[]>;
}

export interface SiteImage {
  path: string;
  width: number;
  height: number;
}

export interface Technical {
  series: TechnicalSeries[];
  families: TechnicalFamily[];
  batteries: TechnicalBattery[];
  panels: { id: string; model: string; finish: { code: string } | null; series: string; power: number; bifacial: boolean }[];
  inverters: SiteReferenceV1['inverters'];
  cities: { id: string; name: string; nameAr: string; nameKu: string }[];
  policy: Policy;
  siteImages: SiteImage[];
}

export const LINE_PATHS: Record<Line, string> = {
  modules: '/products/modules/',
  hybrid: '/products/hybrid/',
  onGrid: '/products/on-grid/',
  micro: '/products/micro/',
  accessories: '/products/accessories/',
};

export const renderSrc = (key: string, view: 'front' | 'back' = 'front') =>
  `/images/products/modules/${key}${view === 'back' ? '-back' : ''}.webp`;

/** The reference without the fields of one build (builtAt, commits, publishId). */
export function siteReference(t: Technical): Omit<SiteReferenceV1, 'builtAt' | 'codeCommit' | 'contentCommit' | 'publishId'> {
  return {
    schema: 'faraday.site-reference',
    version: 1,
    accepts: { snapshotVersion: 1, maxMinor: ACCEPTS_MAX_MINOR },
    routes: {
      localePrefix: { en: '', ar: '/ar', ckb: '/ku' },
      series: '/products/modules/{slug}/',
      family: '/products/inverters/{slug}/',
      battery: '/products/storage/{slug}/',
      item: '/products/items/{slug}/',
      accessories: LINE_PATHS.accessories,
      projects: '/projects/#{slug}',
      line: LINE_PATHS,
    },
    curated: {
      series: t.series.map((s) => ({
        key: s.key,
        name: s.name,
        seriesFamily: s.series,
        warranty: s.warranty,
        powerRange: s.powerRange,
        efficiencyMax: s.efficiencyMax,
        cells: s.cells,
        finishes: s.finishes.map((f) => f.code),
        panelIds: s.panelIds,
        render: s.render && { src: renderSrc(s.key), width: s.render.front[0], height: s.render.front[1] },
      })),
      families: t.families.map(({ key, group, inverterIds }) => ({ key, group, inverterIds })),
      batteries: t.batteries.map(({ key }) => ({ key })),
    },
    panels: t.panels.map((p) => ({
      id: p.id,
      model: p.model,
      finish: p.finish?.code ?? null,
      series: p.series,
      power: p.power,
      bifacial: p.bifacial,
    })),
    inverters: t.inverters.map(({ id, model, type, phase, pnomAc }) => ({ id, model, type, phase, pnomAc })),
    cities: t.cities.map((c) => ({ id: c.id, name: { en: c.name, ckb: c.nameKu, ar: c.nameAr } })),
    vocab: {
      chemistries: [...CHEMISTRIES],
      capacityKeys: [...CAPACITY_KEYS],
      specKeys: [...SPEC_KEYS],
      docLangs: [...DOC_LANGS],
      socialNetworks: [...SOCIAL_NETWORKS],
    },
    policy: t.policy,
    sitePaths: t.siteImages,
  };
}
