/*
  Contract v1 between the Faraday ERP and the website (contract/README.md): the site snapshot the ERP
  publishes, the site reference and build info the website serves, the canonical JSON and content hash,
  and the text rules both sides enforce. The same text lives in the website (src/content/contract.ts,
  importing astro/zod) and in the ERP (src/lib/website/contract.ts, importing zod). The JSON Schemas in
  contract/ are generated from it, and a test in each repo keeps them equal.
*/
import { z } from 'astro/zod';

/** The highest contract minor this copy knows: the website accepts snapshots up to it, the ERP writes it. */
export const ACCEPTS_MAX_MINOR = 0;

export const LOCALES = ['en', 'ckb', 'ar'] as const;
export const LINES = ['modules', 'hybrid', 'onGrid', 'micro', 'accessories'] as const;
export const DAYS = ['sat', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri'] as const;
export const SOCIAL_NETWORKS = ['facebook', 'instagram', 'tiktok', 'youtube', 'linkedin', 'telegram', 'x'] as const;
export const CAPACITY_KEYS = [
  'totalKwh',
  'usableKwh',
  'ratedKwh',
  'nominalKwh',
  'moduleKwh',
  'usableKwhPerModule',
  'modules',
  'depthOfDischarge',
] as const;
export const CHEMISTRIES = ['Li-ion (LFP)', 'LiFePO4', 'Lithium-ion (LiFePO4)', 'LFP (LiFePO4)'] as const;
export const SPEC_KEYS = [
  'power',
  'voltage',
  'current',
  'capacity',
  'efficiency',
  'dimensions',
  'weight',
  'crossSection',
  'length',
  'material',
  'protection',
  'temperature',
  'warranty',
  'certification',
  'compatibility',
  'custom',
] as const;
export const DOC_KINDS = ['datasheet', 'manual', 'document'] as const;
export const DOC_LANGS = ['en', 'it', 'fr', 'ar', 'ckb', 'multi'] as const;
export const PROJECT_CATEGORIES = ['public', 'residential', 'advertising', 'commercial', 'agriculture'] as const;
export const ENTRY_KINDS = ['series', 'family', 'battery', 'accessory', 'item'] as const;
/** Entry kinds with their own pages, and so with redirects. */
export const PAGE_KINDS = ['series', 'family', 'battery', 'item'] as const;
export const FAMILY_GROUPS = ['onGrid', 'hybrid', 'micro'] as const;
export const PHASES = ['single_phase', 'three_phase'] as const;
export const MEDIA_EXTS = ['jpg', 'png', 'webp'] as const;
export const MEDIA_RIGHTS = ['own', 'manufacturer', 'licensed'] as const;
export const MEDIA_PEOPLE = ['none', 'consented'] as const;

export type Locale = (typeof LOCALES)[number];
/** Per language, optional: a missing language is simply not shown on that language's pages. */
export type L<T> = Partial<Record<Locale, T>>;
/** Required in all three languages. */
export type L3<T> = Record<Locale, T>;
export type Slug = string;
export type Sha256 = string;
export type Line = (typeof LINES)[number];
export type Day = (typeof DAYS)[number];
export type SocialNetwork = (typeof SOCIAL_NETWORKS)[number];
export type CapacityKey = (typeof CAPACITY_KEYS)[number];
export type Chemistry = (typeof CHEMISTRIES)[number];
export type SpecKey = (typeof SPEC_KEYS)[number];
export type DocLang = (typeof DOC_LANGS)[number];
export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number];
export type EntryKind = (typeof ENTRY_KINDS)[number];

/**
  Length limits in characters (contract §3). Fields the table leaves open use the nearest row: address
  parts, postal code, credit and group keys use `label`; brand, model names and variants use `name`; the
  hours note uses `note`; "Today" uses the milestone limits; the projects-page texts use `orgDescription`.
*/
export const LIMITS = {
  name: 120,
  label: 120,
  slug: 80,
  tagline: 120,
  description: 1200,
  itemDescription: 3000,
  technology: 80,
  note: 600,
  accessoryLine: 300,
  itemSummary: 160,
  batteryFamily: 120,
  batteryRole: 160,
  warrantyNote: 300,
  alt: 200,
  url: 500,
  specValue: 120,
  projectTitle: 80,
  projectLine: 160,
  milestoneTitle: 80,
  milestoneText: 300,
  categoryLine: 160,
  orgDescription: 300,
  slogan: 60,
} as const;

/** Count limits (contract §2 and §3). Variants follow the models limit. */
export const COUNTS = {
  models: 60,
  docs: 60,
  photos: 12,
  technology: 8,
  phones: 5,
  socials: 8,
  specs: 30,
  projects: 200,
  milestones: 50,
  redirects: 2000,
  media: 300,
} as const;

export const MAX_MEDIA_BYTES = 5 * 1024 * 1024;
export const MAX_SNAPSHOT_BYTES = 2_000_000;

/* ---------- text (contract §3) ---------- */

const STRIPPED = /[\u200B\u200E\u200F\u202A-\u202E\u2060\u2066-\u2069\uFEFF]/g;
const EASTERN_DIGITS = /[\u0660-\u0669\u06F0-\u06F9]/g;
const CONTROL = /[\u0000-\u001F]/;
const CONTROL_EXCEPT_NEWLINE = /[\u0000-\u0009\u000B-\u001F]/;
/** HTML tags and character references, Markdown emphasis, code, links and headings. */
const MARKUP = /<[a-z!/?]|&(?:[a-z]+|#\d+|#x[\da-f]+);|\*\*|__|`|\]\(|^#{1,6} /im;
const RIGHT_TO_LEFT = /[\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFE]/;

/**
  Text as the contract stores it: bidi marks, embeddings, isolates, zero-width space, word joiner and BOM
  removed (ZWNJ and no-break spaces stay), Arabic-Indic and Persian digits as 0–9, NFC, trimmed.
  Multi-line text gets LF line endings; a blank line starts a new paragraph.
*/
export function normalizeWebText(value: string, { multiline = false }: { multiline?: boolean } = {}): string {
  const text = multiline ? value.replace(/\r\n?/g, '\n') : value;
  return text
    .replace(STRIPPED, '')
    .replace(EASTERN_DIGITS, (digit) => String(digit.charCodeAt(0) & 15))
    .normalize('NFC')
    .trim();
}

const isClean = (value: string, multiline: boolean) =>
  value === normalizeWebText(value, { multiline }) && !(multiline ? CONTROL_EXCEPT_NEWLINE : CONTROL).test(value);

/* ---------- canonical JSON, hash and file format (contract §6) ---------- */

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' &&
  value !== null &&
  !Array.isArray(value) &&
  [Object.prototype, null].includes(Object.getPrototypeOf(value));

/** Keys sorted by code unit, no whitespace. Object keys whose value is undefined are left out, as JSON does. */
export function canonicalJson(value: unknown): string {
  if (value === null || typeof value === 'boolean' || typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'number' && Number.isFinite(value)) return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (isPlainObject(value)) {
    const keys = Object.keys(value).filter((key) => value[key] !== undefined);
    return `{${keys
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(',')}}`;
  }
  throw new TypeError(`canonicalJson: ${String(value)} is not a JSON value`);
}

const UNHASHED = new Set(['publishId', 'publishedAt', 'contentHash']);

/** sha256 (hex) of the canonical JSON of the snapshot without publishId, publishedAt and contentHash. */
export async function contentHash(snapshot: Record<string, unknown>): Promise<Sha256> {
  const content = Object.fromEntries(Object.entries(snapshot).filter(([key]) => !UNHASHED.has(key)));
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonicalJson(content)));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/** The snapshot.json layout: keys sorted recursively, 2-space indent, LF line endings, final newline. */
export const formatJson = (value: unknown): string =>
  `${JSON.stringify(
    value,
    (_key, item: unknown) =>
      isPlainObject(item) ? Object.fromEntries(Object.keys(item).sort().map((key) => [key, item[key]])) : item,
    2,
  )}\n`;

/* ---------- building blocks ---------- */

const text = (max: number, multiline = false) =>
  z
    .string()
    .min(1)
    .max(max)
    .refine((value) => isClean(value, multiline) && !MARKUP.test(value), { error: 'Not clean plain text (contract §3)' });
/** Names, codes, brand, spec values and other values shown unchanged in every language. */
const neutral = (max: number) =>
  text(max).refine((value) => !RIGHT_TO_LEFT.test(value), { error: 'Language-neutral values are in Latin script' });
const slug = z
  .string()
  .min(2)
  .max(LIMITS.slug)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/);
const sha256 = z.string().regex(/^[0-9a-f]{64}$/);
const httpsUrl = z
  .string()
  .max(LIMITS.url)
  .regex(/^https:\/\/[a-z0-9.-]+(?:[/?#][^\s\\]*)?$/i)
  .refine((url) => isClean(url, false) && URL.canParse(url), { error: 'Not a clean https URL' });
const sitePath = z
  .string()
  .max(LIMITS.url)
  .regex(/^(?:\/[\w-][\w.-]*)+$/);
const year = z.int().min(1990).max(2100);
const pastYear = z
  .int()
  .min(1990)
  .refine((value) => value <= new Date().getUTCFullYear(), { error: 'Year is in the future' });
const range = z
  .tuple([z.number().positive(), z.number().positive()])
  .refine(([min, max]) => min <= max, { error: 'Range minimum is above its maximum' });

const perLanguage = <T extends z.ZodType>(value: T) =>
  z.strictObject({ en: value.optional(), ckb: value.optional(), ar: value.optional() });
const inAllLanguages = <T extends z.ZodType>(value: T) => z.strictObject({ en: value, ckb: value, ar: value });
/** One language's text: only the fields that have text, and at least one of them. */
const textBlock = <T extends z.ZodRawShape>(shape: T) =>
  z
    .strictObject(shape)
    .refine((block) => Object.values(block).some((field) => field !== undefined), {
      error: 'An empty language block is left out',
    });

/* ---------- site snapshot v1 (contract §2) ---------- */

const imageRef = <T extends z.ZodType>(alt: T) =>
  z.union([z.strictObject({ alt, media: sha256 }), z.strictObject({ alt, sitePath })]);

const docSchema = z.strictObject({
  kind: z.enum(DOC_KINDS),
  label: neutral(LIMITS.label),
  url: httpsUrl,
  lang: z.enum(DOC_LANGS).nullable(),
});

const modelSchema = z.strictObject({ name: neutral(LIMITS.name), techRef: slug.nullable() });
const models = z.array(modelSchema).min(1).max(COUNTS.models);

const entryBase = {
  slug,
  curatedKey: slug.nullable(),
  name: neutral(LIMITS.name),
  brand: neutral(LIMITS.name),
  photos: z.array(imageRef(perLanguage(text(LIMITS.alt)))).max(COUNTS.photos),
  docs: z.array(docSchema).max(COUNTS.docs),
};

const seriesSchema = z.strictObject({
  ...entryBase,
  curatedKey: slug,
  models,
  text: perLanguage(
    textBlock({
      tagline: text(LIMITS.tagline).optional(),
      description: text(LIMITS.description, true).optional(),
      technology: z.array(text(LIMITS.technology)).min(1).max(COUNTS.technology).optional(),
    }),
  ),
});

const familySchema = z.strictObject({
  ...entryBase,
  group: z.enum(FAMILY_GROUPS),
  phase: z.enum(PHASES),
  powerRange: range.nullable(),
  models,
  text: perLanguage(textBlock({ note: text(LIMITS.note).optional() })),
});

const capacitySchema = z
  .partialRecord(z.enum(CAPACITY_KEYS), z.union([z.number().positive(), range]))
  .refine((capacity) => Object.values(capacity).some((value) => value !== undefined), {
    error: 'A battery without capacity figures has capacity null',
  })
  .refine((capacity) => [capacity.modules ?? []].flat().every(Number.isInteger), {
    error: 'Module counts are whole numbers',
  })
  .refine((capacity) => [capacity.depthOfDischarge ?? []].flat().every((value) => value <= 1), {
    error: 'Depth of discharge is a fraction',
  });

const batterySchema = z.strictObject({
  ...entryBase,
  capacity: capacitySchema.nullable(),
  chemistry: z.enum(CHEMISTRIES).nullable(),
  warrantyYears: z.int().positive().nullable(),
  text: perLanguage(
    textBlock({
      family: text(LIMITS.batteryFamily).optional(),
      role: text(LIMITS.batteryRole).optional(),
      description: text(LIMITS.description, true).optional(),
      warrantyNote: text(LIMITS.warrantyNote).optional(),
    }),
  ),
});

const accessorySchema = z.strictObject({
  ...entryBase,
  group: neutral(LIMITS.label),
  variants: z.array(neutral(LIMITS.name)).min(1).max(COUNTS.models).nullable(),
  text: perLanguage(textBlock({ line: text(LIMITS.accessoryLine).optional() })),
});

const specSchema = z
  .strictObject({
    key: z.enum(SPEC_KEYS),
    label: inAllLanguages(text(LIMITS.label)).nullable(),
    value: neutral(LIMITS.specValue),
  })
  .refine((spec) => (spec.key === 'custom') === (spec.label !== null), {
    error: 'Custom specs, and only they, have a label',
    path: ['label'],
  });

const itemSchema = z.strictObject({
  ...entryBase,
  curatedKey: z.null(),
  line: z.enum(LINES),
  specs: z.array(specSchema).max(COUNTS.specs),
  text: perLanguage(
    textBlock({
      summary: text(LIMITS.itemSummary).optional(),
      description: text(LIMITS.itemDescription, true).optional(),
    }),
  ),
});

const phoneSchema = z
  .strictObject({
    e164: z.string().regex(/^\+[1-9]\d{7,14}$/),
    display: z.string().regex(/^\+\d+(?: \d+)*$/),
    whatsapp: z.boolean(),
    primary: z.boolean(),
    label: inAllLanguages(text(LIMITS.label)).nullable(),
  })
  .refine((phone) => phone.display.replaceAll(' ', '') === phone.e164, {
    error: 'The displayed number is not the e164 number',
    path: ['display'],
  });

const clock = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/);
const openingDaySchema = z
  .strictObject({ day: z.enum(DAYS), open: clock.nullable(), close: clock.nullable() })
  .refine((day) => (day.open === null) === (day.close === null), { error: 'A closed day has neither time' })
  .refine((day) => day.open === null || day.close === null || day.open < day.close, {
    error: 'Opening time is not before closing time',
  });

const companySchema = z.strictObject({
  name: neutral(LIMITS.name),
  phones: z
    .array(phoneSchema)
    .min(1)
    .max(COUNTS.phones)
    .refine((phones) => phones.filter((phone) => phone.primary).length === 1, { error: 'Exactly one primary phone' })
    .refine((phones) => phones.some((phone) => phone.whatsapp), { error: 'At least one WhatsApp number' }),
  email: z.email(),
  address: z.strictObject({
    text: inAllLanguages(
      z.strictObject({ street: text(LIMITS.label), city: text(LIMITS.label), country: text(LIMITS.label) }),
    ),
    postalCode: neutral(LIMITS.label).nullable(),
    mapsUrl: httpsUrl.nullable(),
  }),
  hours: z
    .array(openingDaySchema)
    .length(DAYS.length)
    .refine((hours) => hours.every((row, i) => row.day === DAYS[i]), { error: 'One row per day, Saturday to Friday' }),
  hoursNote: perLanguage(text(LIMITS.note)),
  socials: z.array(z.strictObject({ network: z.enum(SOCIAL_NETWORKS), url: httpsUrl })).max(COUNTS.socials),
  foundedYear: pastYear,
});

const siteSchema = z.strictObject({
  figures: z.strictObject({
    iraqSharePct: z.number().min(0).max(100).nullable(),
    distributors: z.int().min(0).nullable(),
    installedMw: z.number().min(0).nullable(),
    peimarAgentSince: pastYear.nullable(),
  }),
  categoryText: z.record(z.enum(LINES), inAllLanguages(text(LIMITS.categoryLine))),
  organization: z.strictObject({
    description: neutral(LIMITS.orgDescription),
    slogan: neutral(LIMITS.slogan),
    areaServed: z.array(slug),
  }),
  featured: z.strictObject({
    heroPanel: slug.nullable(),
    productsHeroSeries: slug.nullable(),
    tickerInverters: z.array(slug).nullable(),
    tickerBatteries: z.array(slug).nullable(),
  }),
  pages: z.strictObject({
    projects: z.strictObject({
      lead: inAllLanguages(text(LIMITS.orgDescription)),
      metaDescription: inAllLanguages(text(LIMITS.orgDescription)),
    }),
  }),
});

const projectSchema = z.strictObject({
  slug,
  sizeKwp: z.number().positive(),
  category: z.enum(PROJECT_CATEGORIES),
  year: year.nullable(),
  cover: imageRef(inAllLanguages(text(LIMITS.alt))).nullable(),
  text: inAllLanguages(z.strictObject({ title: text(LIMITS.projectTitle), line: text(LIMITS.projectLine) })),
});

const historySchema = z.strictObject({
  milestones: z
    .array(
      z.strictObject({
        key: slug,
        year,
        text: inAllLanguages(
          z.strictObject({ title: text(LIMITS.milestoneTitle), text: text(LIMITS.milestoneText) }),
        ),
      }),
    )
    .max(COUNTS.milestones),
  today: inAllLanguages(
    z.strictObject({
      label: text(LIMITS.milestoneTitle),
      title: text(LIMITS.milestoneTitle),
      text: text(LIMITS.milestoneText),
    }),
  ),
});

const redirectSchema = z.strictObject({
  kind: z.enum(PAGE_KINDS),
  from: slug,
  to: slug.nullable(),
  line: z.enum(LINES),
  permanent: z.boolean(),
});

const mediaSchema = z.strictObject({
  sha256,
  ext: z.enum(MEDIA_EXTS),
  bytes: z.int().min(1).max(MAX_MEDIA_BYTES),
  width: z.int().positive(),
  height: z.int().positive(),
  rights: z.enum(MEDIA_RIGHTS),
  people: z.enum(MEDIA_PEOPLE),
  credit: neutral(LIMITS.label).nullable(),
});

export const siteSnapshotV1Schema = z.strictObject({
  schema: z.literal('faraday.site-snapshot'),
  version: z.literal(1),
  minor: z.int().min(0),
  publishId: z.int().min(0),
  publishedAt: z.iso.datetime(),
  contentHash: sha256,
  company: companySchema,
  site: siteSchema,
  catalog: z.strictObject({
    series: z.array(seriesSchema),
    families: z.array(familySchema),
    batteries: z.array(batterySchema),
    accessoryGroups: z.array(z.strictObject({ key: neutral(LIMITS.label), name: inAllLanguages(text(LIMITS.name)) })),
    accessories: z.array(accessorySchema),
    items: z.array(itemSchema),
  }),
  projects: z.array(projectSchema).max(COUNTS.projects),
  history: historySchema,
  redirects: z.array(redirectSchema).max(COUNTS.redirects),
  media: z.array(mediaSchema).max(COUNTS.media),
});

export type SiteSnapshotV1 = z.infer<typeof siteSnapshotV1Schema>;
export type Company = z.infer<typeof companySchema>;
export type Phone = z.infer<typeof phoneSchema>;
export type OpeningDay = z.infer<typeof openingDaySchema>;
export type Site = z.infer<typeof siteSchema>;
export type Catalog = SiteSnapshotV1['catalog'];
export type Model = z.infer<typeof modelSchema>;
export type Series = z.infer<typeof seriesSchema>;
export type Family = z.infer<typeof familySchema>;
export type Battery = z.infer<typeof batterySchema>;
export type Accessory = z.infer<typeof accessorySchema>;
export type Item = z.infer<typeof itemSchema>;
export type Spec = z.infer<typeof specSchema>;
export type ImageRef = Series['photos'][number];
export type Doc = z.infer<typeof docSchema>;
export type Project = z.infer<typeof projectSchema>;
export type History = z.infer<typeof historySchema>;
export type Redirect = z.infer<typeof redirectSchema>;
export type Media = z.infer<typeof mediaSchema>;

/* ---------- site reference v1 and build info (contract §8) ---------- */

/*
  The website ships a contract change before the ERP does, so the ERP reads these two documents leniently:
  keys it does not know yet are dropped instead of refused.
*/
const keyed = <K extends string, T extends z.ZodType>(keys: readonly K[], value: T) =>
  z.object(Object.fromEntries(keys.map((key) => [key, value])) as Record<K, T>);
const accepts = z.object({ snapshotVersion: z.literal(1), maxMinor: z.int().min(0) });

export const siteReferenceV1Schema = z.object({
  schema: z.literal('faraday.site-reference'),
  version: z.literal(1),
  builtAt: z.iso.datetime(),
  codeCommit: z.string().min(1),
  contentCommit: z.string().min(1).nullable(),
  publishId: z.int().min(0).nullable(),
  accepts,
  routes: z.object({
    localePrefix: keyed(LOCALES, z.string()),
    series: z.string(),
    family: z.string(),
    battery: z.string(),
    item: z.string(),
    accessories: z.string(),
    projects: z.string(),
    line: keyed(LINES, z.string()),
  }),
  curated: z.object({
    series: z.array(
      z.object({
        key: slug,
        name: z.string(),
        seriesFamily: z.enum(['S Series', 'OR Series', 'DR Series']),
        warranty: z.object({ product: z.number(), power: z.number() }),
        powerRange: z.tuple([z.number(), z.number()]),
        efficiencyMax: z.number(),
        cells: z.array(z.number()),
        finishes: z.array(z.string()),
        panelIds: z.array(z.string()),
        render: z.object({ src: z.string(), width: z.int(), height: z.int() }).nullable(),
      }),
    ),
    families: z.array(z.object({ key: slug, group: z.enum(FAMILY_GROUPS), inverterIds: z.array(z.string()) })),
    batteries: z.array(z.object({ key: slug })),
  }),
  panels: z.array(
    z.object({
      id: z.string(),
      model: z.string(),
      finish: z.string().nullable(),
      series: z.string(),
      power: z.number(),
      bifacial: z.boolean(),
    }),
  ),
  inverters: z.array(
    z.object({
      id: z.string(),
      model: z.string(),
      type: z.enum(['hybrid', 'on-grid', 'micro']),
      phase: z.enum(PHASES),
      pnomAc: z.number(),
    }),
  ),
  cities: z.array(z.object({ id: z.string(), name: keyed(LOCALES, z.string()) })),
  vocab: z.object({
    chemistries: z.array(z.string()),
    capacityKeys: z.array(z.string()),
    specKeys: z.array(z.string()),
    docLangs: z.array(z.string()),
    socialNetworks: z.array(z.string()),
  }),
  policy: z.object({
    linkHosts: z.array(z.string()),
    mapsHosts: z.array(z.string()),
    socialHosts: keyed(SOCIAL_NETWORKS, z.array(z.string())),
  }),
  sitePaths: z.array(z.object({ path: z.string(), width: z.int().positive(), height: z.int().positive() })),
});

export type SiteReferenceV1 = z.infer<typeof siteReferenceV1Schema>;

/** /build.json, served without caching. */
export const buildInfoV1Schema = z.object({
  schema: z.literal('faraday.site-build'),
  version: z.literal(1),
  channel: z.enum(['preview', 'live']),
  publishId: z.int().min(0).nullable(),
  contentHash: sha256.nullable(),
  contentCommit: z.string().min(1).nullable(),
  codeCommit: z.string().min(1),
  builtAt: z.iso.datetime(),
  accepts,
});

export type BuildInfoV1 = z.infer<typeof buildInfoV1Schema>;

/** contract/*.schema.json as committed: what each side accepts, generated from the schemas above. */
export const jsonSchemaFiles = (): Record<string, string> => ({
  'snapshot-v1.schema.json': formatJson(z.toJSONSchema(siteSnapshotV1Schema, { io: 'input' })),
  'site-reference-v1.schema.json': formatJson(z.toJSONSchema(siteReferenceV1Schema, { io: 'input' })),
});

/* ---------- references between the two sides (contract §5) ---------- */

/** A Designer panel's name as Peimar prints it: "OR10H440MNDB (BF)", or the model alone without a finish. */
export const panelName = (panel: { model: string; finish: string | null }) =>
  panel.finish ? `${panel.model} (${panel.finish})` : panel.model;

/** The Designer record a model links to: its techRef when set, otherwise the record named like the model. */
export function designerRecord<T extends { id: string }>(
  model: Model,
  records: readonly T[],
  nameOf: (record: T) => string,
): T | undefined {
  return model.techRef === null
    ? records.find((record) => nameOf(record) === model.name)
    : records.find((record) => record.id === model.techRef);
}

/* ---------- checks that span the document or need the site reference (contract §3, §9) ---------- */

export const ISSUE_CODES = [
  'content/schema',
  'content/hash',
  'content/version',
  'content/signature',
  'content/duplicate-slug',
  'content/unknown-curated',
  'content/no-designer-model',
  'content/designer-missing',
  'content/link-host',
  'content/site-path',
  'content/media-missing',
  'content/media-mismatch',
  'content/media-decode',
  'content/media-dimensions',
  'content/redirect-conflict',
  'content/minimum',
  'content/budget',
] as const;

export type IssueCode = (typeof ISSUE_CODES)[number];

/** `ref` is kind:slug[:model], a JSON path or a sha256 prefix: never content text (contract §9). */
export interface ContractIssue {
  code: IssueCode;
  ref: string;
  level: 'error' | 'warning';
}

/** The parts of the site reference the checks read. */
export type ReferenceData = Pick<
  SiteReferenceV1,
  'curated' | 'panels' | 'inverters' | 'cities' | 'policy' | 'sitePaths'
>;

/** The site still builds past these: the entry loses its Designer data or its technical layer. */
const WARNINGS: ReadonlySet<IssueCode> = new Set(['content/designer-missing', 'content/unknown-curated']);

const REDIRECT_LINES: Record<(typeof PAGE_KINDS)[number], readonly Line[]> = {
  series: ['modules'],
  family: FAMILY_GROUPS,
  battery: ['hybrid'],
  item: LINES,
};

const duplicates = (values: readonly string[]) => new Set(values.filter((value, i) => values.indexOf(value) !== i));
const onHosts = (url: string, hosts: readonly string[]) => hosts.includes(new URL(url).hostname);

/** The rules a parsed snapshot must also meet. Codes in WARNINGS are warnings, every other code is an error. */
export function checkSnapshot(snapshot: SiteSnapshotV1, reference: ReferenceData): ContractIssue[] {
  const issues: ContractIssue[] = [];
  const report = (code: IssueCode, ref: string) =>
    issues.push({ code, ref, level: WARNINGS.has(code) ? 'warning' : 'error' });
  const { catalog, company, projects } = snapshot;
  const entries = [
    ...catalog.series.map((entry) => ({ kind: 'series', entry }) as const),
    ...catalog.families.map((entry) => ({ kind: 'family', entry }) as const),
    ...catalog.batteries.map((entry) => ({ kind: 'battery', entry }) as const),
    ...catalog.accessories.map((entry) => ({ kind: 'accessory', entry }) as const),
    ...catalog.items.map((entry) => ({ kind: 'item', entry }) as const),
  ];

  for (const kind of ENTRY_KINDS) {
    for (const slug of duplicates(entries.filter((e) => e.kind === kind).map((e) => e.entry.slug))) {
      report('content/duplicate-slug', `${kind}:${slug}`);
    }
  }
  for (const { kind, entry } of entries) {
    if (!('models' in entry)) continue;
    for (const name of duplicates(entry.models.map((model) => model.name))) {
      report('content/duplicate-slug', `${kind}:${entry.slug}:${name}`);
    }
  }
  for (const slug of duplicates(projects.map((project) => project.slug))) {
    report('content/duplicate-slug', `project:${slug}`);
  }
  for (const key of duplicates(snapshot.history.milestones.map((milestone) => milestone.key))) {
    report('content/duplicate-slug', `milestone:${key}`);
  }
  const groupKeys = catalog.accessoryGroups.map((group) => group.key);
  groupKeys.forEach((key, i) => {
    if (groupKeys.indexOf(key) !== i) report('content/duplicate-slug', `catalog.accessoryGroups.${i}`);
  });
  for (const accessory of catalog.accessories) {
    if (!groupKeys.includes(accessory.group)) report('content/schema', `accessory:${accessory.slug}`);
  }

  if (catalog.series.length === 0) report('content/minimum', 'catalog.series');
  if (catalog.families.length === 0) report('content/minimum', 'catalog.families');

  const curated: Partial<Record<EntryKind, ReadonlySet<string>>> = {
    series: new Set(reference.curated.series.map((series) => series.key)),
    family: new Set(reference.curated.families.map((family) => family.key)),
    battery: new Set(reference.curated.batteries.map((battery) => battery.key)),
  };
  for (const { kind, entry } of entries) {
    const known = curated[kind];
    if (known && entry.curatedKey !== null && !known.has(entry.curatedKey)) {
      report('content/unknown-curated', `${kind}:${entry.slug}`);
    }
  }
  for (const series of catalog.series) {
    const missing = series.models.filter((model) => !designerRecord(model, reference.panels, panelName));
    if (missing.length === series.models.length) report('content/no-designer-model', `series:${series.slug}`);
    else for (const model of missing) report('content/designer-missing', `series:${series.slug}:${model.name}`);
  }
  for (const family of catalog.families) {
    for (const model of family.models) {
      if (!designerRecord(model, reference.inverters, (inverter) => inverter.model)) {
        report('content/designer-missing', `family:${family.slug}:${model.name}`);
      }
    }
  }

  const { linkHosts, mapsHosts, socialHosts } = reference.policy;
  for (const { kind, entry } of entries) {
    if (entry.docs.some((doc) => !onHosts(doc.url, linkHosts))) report('content/link-host', `${kind}:${entry.slug}`);
  }
  if (company.address.mapsUrl !== null && !onHosts(company.address.mapsUrl, mapsHosts)) {
    report('content/link-host', 'company.address.mapsUrl');
  }
  company.socials.forEach((social, i) => {
    if (!onHosts(social.url, socialHosts[social.network])) report('content/link-host', `company.socials.${i}.url`);
  });

  const images = [
    ...entries.flatMap(({ kind, entry }) => entry.photos.map((image) => ({ ref: `${kind}:${entry.slug}`, image }))),
    ...projects.flatMap((project) => (project.cover ? [{ ref: `project:${project.slug}`, image: project.cover }] : [])),
  ];
  const sitePaths = new Set(reference.sitePaths.map((path) => path.path));
  for (const { ref, image } of images) {
    if ('sitePath' in image && !sitePaths.has(image.sitePath)) report('content/site-path', ref);
  }
  const referenced = new Set(images.flatMap(({ image }) => ('media' in image ? [image.media] : [])));
  const rows = snapshot.media.map((media) => media.sha256);
  for (const sha of referenced) if (!rows.includes(sha)) report('content/media-missing', sha.slice(0, 12));
  for (const sha of new Set(rows)) {
    if (!referenced.has(sha) || duplicates(rows).has(sha)) report('content/media-mismatch', sha.slice(0, 12));
  }

  const pageLines = new Map<string, Line>([
    ...catalog.series.map((entry) => [`series:${entry.slug}`, 'modules'] as const),
    ...catalog.families.map((entry) => [`family:${entry.slug}`, entry.group] as const),
    ...catalog.batteries.map((entry) => [`battery:${entry.slug}`, 'hybrid'] as const),
    ...catalog.items.map((entry) => [`item:${entry.slug}`, entry.line] as const),
  ]);
  const redirected = new Set<string>();
  for (const redirect of snapshot.redirects) {
    const from = `${redirect.kind}:${redirect.from}`;
    const target = redirect.to === null ? null : pageLines.get(`${redirect.kind}:${redirect.to}`);
    const lines = target === null ? REDIRECT_LINES[redirect.kind] : target === undefined ? [] : [target];
    if (redirected.has(from) || pageLines.has(from) || !lines.includes(redirect.line)) {
      report('content/redirect-conflict', from);
    }
    redirected.add(from);
  }

  const cities = new Set(reference.cities.map((city) => city.id));
  snapshot.site.organization.areaServed.forEach((id, i, ids) => {
    if (!cities.has(id) || ids.indexOf(id) !== i) report('content/schema', `site.organization.areaServed.${i}`);
  });

  if (new TextEncoder().encode(formatJson(snapshot)).length > MAX_SNAPSHOT_BYTES) {
    report('content/budget', 'snapshot.json');
  }
  return issues;
}

/**
  Everything a snapshot must pass, in order: the version gate, the schema, the content hash and checkSnapshot.
  The parsed snapshot comes back whenever its structure is valid, so callers can report on it.
*/
export async function validateSnapshot(
  input: unknown,
  reference: ReferenceData,
): Promise<{ snapshot: SiteSnapshotV1 | null; issues: ContractIssue[] }> {
  const head = z.object({ version: z.number(), minor: z.number() }).safeParse(input);
  if (head.success && (head.data.version !== 1 || head.data.minor > ACCEPTS_MAX_MINOR)) {
    const ref = `${head.data.version}.${head.data.minor}`;
    return { snapshot: null, issues: [{ code: 'content/version', ref, level: 'error' }] };
  }
  const parsed = siteSnapshotV1Schema.safeParse(input);
  if (!parsed.success) {
    const issues = parsed.error.issues.map(
      (issue): ContractIssue => ({
        code: 'content/schema',
        ref: issue.path.map(String).join('.') || 'snapshot',
        level: 'error',
      }),
    );
    return { snapshot: null, issues };
  }
  const issues = checkSnapshot(parsed.data, reference);
  if ((await contentHash(parsed.data)) !== parsed.data.contentHash) {
    issues.unshift({ code: 'content/hash', ref: parsed.data.contentHash.slice(0, 12), level: 'error' });
  }
  return { snapshot: parsed.data, issues };
}
