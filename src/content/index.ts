/*
  The one adapter between the owner content and the pages. It reads the snapshot the importer prepared
  (src/content/generated, from scripts/content/import.ts) and joins it to the technical layer
  (src/data/technical, src/data/designer): curated entries by curatedKey, models by their Designer name.
  Pages read the shapes below and never the snapshot itself. The JSON imports carry their type so that
  Node can load this module for the tests too.
*/
import generated from './generated/snapshot.json' with { type: 'json' };
import report from './generated/report.json' with { type: 'json' };
import technicalSeries from '../data/technical/series.json' with { type: 'json' };
import technicalFamilies from '../data/technical/families.json' with { type: 'json' };
import technicalBatteries from '../data/technical/batteries.json' with { type: 'json' };
import panelData from '../data/designer/panels.json' with { type: 'json' };
import inverterData from '../data/designer/inverters.json' with { type: 'json' };
import {
  designerRecord,
  type Accessory as ContentAccessory,
  type Battery as ContentBattery,
  type Catalog,
  type Doc,
  type Family as ContentFamily,
  type Item as ContentItem,
  type L,
  type L3,
  type Line,
  type Model,
  type Project as ContentProject,
  type Series as ContentSeries,
  type SiteSnapshotV1,
} from './contract.ts';
import type { TechnicalBattery, TechnicalFamily, TechnicalSeries } from './reference.ts';
import { closedDays, dayRange, hoursGroups, hoursLine, hoursSentence, openingHoursSpecification } from './hours.ts';
import type { Locale } from '../i18n/config.ts';

export type { Doc, Line };

/** A photo as the importer resolved it: a re-encoded upload with its srcset, or an image already on the site. */
export interface WebImage {
  src: string;
  srcset: string | null;
  width: number;
  height: number;
  alt: L<string>;
}
type WithPhotos<T extends { photos: unknown }> = Omit<T, 'photos'> & { photos: WebImage[] };

/** The snapshot as src/content/generated/snapshot.json holds it: images resolved, skipped series left out. */
export interface WebSnapshot extends Omit<SiteSnapshotV1, 'catalog' | 'projects'> {
  catalog: {
    series: WithPhotos<ContentSeries>[];
    families: WithPhotos<ContentFamily>[];
    batteries: WithPhotos<ContentBattery>[];
    accessoryGroups: Catalog['accessoryGroups'];
    accessories: WithPhotos<ContentAccessory>[];
    items: WithPhotos<ContentItem>[];
  };
  projects: (Omit<ContentProject, 'cover'> & { cover: (WebImage & { alt: L3<string> }) | null })[];
}

const snapshot = generated as WebSnapshot;
const { catalog, company, site, history } = snapshot;

export type GroupKey = ContentFamily['group'];
export type Phase = ContentFamily['phase'];

interface Entry {
  slug: string;
  /** Joins the entry to the technical layer; null for entries the owner created. */
  curatedKey: string | null;
  name: string;
  /** "Peimar" gets Peimar wording and Peimar as manufacturer in JSON-LD; any other brand stands alone. */
  brand: string;
  photos: WebImage[];
  docs: Doc[];
  datasheets: Doc[];
}

/** A module series: the owner's entry on the curated Peimar facts. */
export interface Series extends Entry, Omit<TechnicalSeries, 'key' | 'name' | 'panelIds'> {
  curatedKey: string;
  models: string[];
  /** Designer panel ids of the models shown, in their order. */
  designerModels: string[];
  text: ContentSeries['text'];
}

export interface Family extends Entry {
  group: GroupKey;
  phase: Phase;
  powerRange: [number, number] | null;
  /** Peimar's description of a curated family, the JSON-LD fallback when the owner wrote no note. */
  description: string | null;
  models: string[];
  designerModels: string[];
  text: ContentFamily['text'];
}

export interface Battery extends Entry {
  /** Peimar's line name of a curated battery, the fallback where the owner wrote none. */
  family: string | null;
  capacity: ContentBattery['capacity'];
  chemistry: ContentBattery['chemistry'];
  warrantyYears: number | null;
  text: ContentBattery['text'];
}

export interface Accessory extends Entry {
  group: string;
  variants: string[] | null;
  text: ContentAccessory['text'];
}

export interface Item extends Entry {
  line: Line;
  specs: ContentItem['specs'];
  text: ContentItem['text'];
}

/** The paragraphs of a multi-line description: a blank line starts a new one, empty ones are dropped. */
export const paragraphs = (text: string) =>
  text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

/* ---------- Designer links (contract §5) ---------- */

type Named = { id: string; model: string };
const panelRecords = panelData as (Named & { finish: { code: string } | null })[];
const inverterRecords = inverterData as Named[];
const panelName = (p: (typeof panelRecords)[number]) => (p.finish ? `${p.model} (${p.finish.code})` : p.model);

const panelIdsOf = (models: Model[]) => models.flatMap((m) => designerRecord(m, panelRecords, panelName)?.id ?? []);
const inverterIdsOf = (models: Model[]) =>
  models.flatMap((m) => designerRecord(m, inverterRecords, (r) => r.model)?.id ?? []);

/* ---------- catalog ---------- */

/** The technical layer (src/data/technical), every curated entry whether the owner shows it or not. */
export const curatedSeries = technicalSeries as TechnicalSeries[];
export const curatedFamilies = technicalFamilies as TechnicalFamily[];
export const curatedBatteries = technicalBatteries as TechnicalBattery[];
const familyByKey = new Map(curatedFamilies.map((f) => [f.key, f]));
const batteryByKey = new Map(curatedBatteries.map((b) => [b.key, b]));

const entry = (e: WithPhotos<ContentSeries | ContentFamily | ContentBattery | ContentAccessory | ContentItem>): Entry => ({
  slug: e.slug,
  curatedKey: e.curatedKey,
  name: e.name,
  brand: e.brand,
  photos: e.photos,
  docs: e.docs,
  datasheets: e.docs.filter((doc) => doc.kind === 'datasheet'),
});

/** Module series in the owner's order. Each has a curated key: the importer skips the ones without. */
export const modules: Series[] = catalog.series.flatMap((s) => {
  const t = curatedSeries.find((c) => c.key === s.curatedKey);
  if (!t) return [];
  return [
    {
      ...entry(s),
      curatedKey: s.curatedKey,
      series: t.series,
      tagline: t.tagline,
      description: t.description,
      technology: t.technology,
      warranty: t.warranty,
      powerRange: t.powerRange,
      efficiencyMax: t.efficiencyMax,
      cells: t.cells,
      finishes: t.finishes,
      render: t.render,
      models: s.models.map((m) => m.name),
      designerModels: panelIdsOf(s.models),
      text: s.text,
    },
  ];
});

const familyList: Family[] = catalog.families.map((f) => ({
  ...entry(f),
  group: f.group,
  phase: f.phase,
  powerRange: f.powerRange,
  description: (f.curatedKey && familyByKey.get(f.curatedKey)?.description) ?? null,
  models: f.models.map((m) => m.name),
  designerModels: inverterIdsOf(f.models),
  text: f.text,
}));

/** Inverter families per product line, each in the owner's order. */
export const families: Record<GroupKey, Family[]> = {
  onGrid: familyList.filter((f) => f.group === 'onGrid'),
  hybrid: familyList.filter((f) => f.group === 'hybrid'),
  micro: familyList.filter((f) => f.group === 'micro'),
};

export const batteries: Battery[] = catalog.batteries.map((b) => ({
  ...entry(b),
  family: (b.curatedKey && batteryByKey.get(b.curatedKey)?.family) ?? null,
  capacity: b.capacity,
  chemistry: b.chemistry,
  warrantyYears: b.warrantyYears,
  text: b.text,
}));

/** Accessory groups in page order (#group-N anchors follow it). */
export const accessoryGroups = catalog.accessoryGroups;

export const accessories: Accessory[] = catalog.accessories.map((a) => ({
  ...entry(a),
  group: a.group,
  variants: a.variants,
  text: a.text,
}));

/** Generic product pages, /products/items/<slug>/. */
export const items: Item[] = catalog.items.map((i) => ({ ...entry(i), line: i.line, specs: i.specs, text: i.text }));
export const itemsByLine = (line: Line) => items.filter((i) => i.line === line);

/* ---------- company ---------- */

/** The office address in one language: "Qasmlu Street" and "Sulaymaniyah, Iraq". */
export function address(locale: Locale) {
  const { street, city, country } = company.address.text[locale];
  return { street, city, country, place: `${city}${locale === 'en' ? ',' : '،'} ${country}` };
}

export const openingHours = company.hours;
export const hoursText = (locale: Locale, style: 'short' | 'sentence') =>
  style === 'short' ? hoursLine(locale, company.hours) : hoursSentence(locale, company.hours);
export const hoursNote = (locale: Locale) => company.hoursNote[locale];
export const openingHoursSchema = openingHoursSpecification(company.hours);

/** Open days with their times and the closed days, for sentences such as the FAQ answer. */
export const hoursParts = (locale: Locale) => ({
  open: hoursGroups(company.hours).flatMap((g) =>
    g.open && g.close ? [{ days: dayRange(locale, g.days, true), open: g.open, close: g.close }] : [],
  ),
  closed: closedDays(locale, company.hours),
});

export const socials = company.socials;

/* ---------- site ---------- */

export const { figures, organization, featured } = site;
export const categoryText = (locale: Locale, line: Line) => site.categoryText[line][locale];
export const projectsPage = (locale: Locale) => ({
  lead: site.pages.projects.lead[locale],
  metaDescription: site.pages.projects.metaDescription[locale],
});

/** Largest system first. */
export const projects = [...snapshot.projects].sort((a, b) => b.sizeKwp - a.sizeKwp);

/** Oldest first. */
export const milestones = [...history.milestones].sort((a, b) => a.year - b.year);
export const historyToday = (locale: Locale) => history.today[locale];

/** What this build is made of, for /build.json and the site reference. */
export const buildInfo = {
  publishId: snapshot.publishId,
  contentHash: snapshot.contentHash,
  codeCommit: report.codeCommit,
  contentCommit: report.contentCommit as string | null,
  builtAt: new Date().toISOString().replace(/\.\d+Z$/, 'Z'),
};
