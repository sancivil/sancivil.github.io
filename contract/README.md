# Contract v1: site snapshot (ERP → website) and site reference (website → ERP)

The ERP and the website share no code. They meet only through two JSON documents, defined here. This text and the files below are copied verbatim into both repos under `contract/`.

## 1. Where things live

**Snapshot**
- Location: `snapshot.json` at the root of a new **private** repo, `sancivil/faraday-site-content`.
- Uploaded images sit beside it as `media/<sha256>.<ext>`.
- Branch `main` holds every snapshot the ERP has sent. Branch `live` holds the one faradayiq.com shows.
- Only the ERP writes it (`src/server/website/publish.ts`). The one exception is the bootstrap commit of the day-one seed, made by the developer.
- Only the website importer reads it (`scripts/content/import.ts`).

**Folder mode (development)**
- The same files go into a local folder: `WEBSITE_PUBLISH_DIR` on the ERP side, `CONTENT_DIR` on the website side.

**Reference**
- `/data/site-reference.v1.json` and `/build.json`, built by the website.
- Served by faradayiq.com and by the preview. The ERP reads them anonymously; in folder mode it reads them from a file.

**Files kept in both repos**
- `contract/README.md` (this text).
- `contract/snapshot-v1.schema.json` and `contract/site-reference-v1.schema.json`.
- `contract/fixtures/`: `snapshot-v1.min.json`, `snapshot-v1.full.json`, `site-reference-v1.json`, `canonical.json`, `canonical.sha256`.

**Keeping the two Zod copies in step**
- The ERP has `src/lib/website/contract.ts`; the website has `src/content/contract.ts`. The text is identical except the import line: `zod` in the ERP, `astro/zod` on the website. Both are zod 4.6.7.
- Each repo has a test that generates JSON Schema with `z.toJSONSchema()` and requires it to equal the committed schema file (keys sorted).
- A contract change is the same edit in both repos. If one repo lags, its test fails.

## 2. Types (version 1, minor 0)

Every key shown is always present. `| null` marks a key whose value may be null. `?` appears only inside per-language text blocks.

```ts
export type Locale = 'en' | 'ckb' | 'ar'        // both apps already use these codes; the website serves ckb under /ku/ (hreflang "ku", <html lang="ckb">)
export type L<T> = Partial<Record<Locale, T>>   // per language, optional: a missing language is simply not shown on that language's pages
export type L3<T> = Record<Locale, T>           // required in all three languages
export type Slug = string                       // ^[a-z0-9]+(-[a-z0-9]+)*$, 2–80 chars
export type Sha256 = string                     // ^[0-9a-f]{64}$
export type Line = 'modules' | 'hybrid' | 'onGrid' | 'micro' | 'accessories'   // the site's fixed product lines
export type Day = 'sat' | 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri'
export type SocialNetwork = 'facebook' | 'instagram' | 'tiktok' | 'youtube' | 'linkedin' | 'telegram' | 'x'
export type CapacityKey = 'totalKwh' | 'usableKwh' | 'ratedKwh' | 'nominalKwh' | 'moduleKwh' | 'usableKwhPerModule' | 'modules' | 'depthOfDischarge'
export type Chemistry = 'Li-ion (LFP)' | 'LiFePO4' | 'Lithium-ion (LiFePO4)' | 'LFP (LiFePO4)'   // Peimar's wordings; extended only by a contract minor
export type SpecKey = 'power' | 'voltage' | 'current' | 'capacity' | 'efficiency' | 'dimensions' | 'weight' | 'crossSection'
  | 'length' | 'material' | 'protection' | 'temperature' | 'warranty' | 'certification' | 'compatibility' | 'custom'
export type DocLang = 'en' | 'it' | 'fr' | 'ar' | 'ckb' | 'multi'
export type ProjectCategory = 'public' | 'residential' | 'advertising' | 'commercial' | 'agriculture'

export interface SiteSnapshotV1 {
  schema: 'faraday.site-snapshot'
  version: 1
  minor: number                 // 0 now; must be <= reference.accepts.maxMinor of the LIVE site
  publishId: number             // the owner's "version N"; strictly increasing; 0 = day-one seed
  publishedAt: string           // ISO 8601 UTC, e.g. "2026-12-02T09:14:00Z"
  contentHash: Sha256           // see §6
  company: Company
  site: Site
  catalog: Catalog
  projects: Project[]           // visible only; the site orders them by sizeKwp, largest first (as today)
  history: History
  redirects: Redirect[]
  media: Media[]                // exactly the uploads referenced above, nothing else
}

export interface Company {
  name: string                                           // "Faraday Co." (Latin)
  phones: Phone[]                                        // 1–5; exactly one primary; at least one whatsapp
  email: string
  address: {
    text: L3<{ street: string; city: string; country: string }>   // English also feeds JSON-LD PostalAddress
    postalCode: string | null
    mapsUrl: string | null                               // https, Google Maps host (reference.policy.mapsHosts)
  }
  hours: { day: Day; open: string | null; close: string | null }[]   // exactly 7 rows, sat→fri; "HH:MM", open < close; both null = closed
  hoursNote: L<string>                                   // e.g. Ramadan hours; per language, optional
  socials: { network: SocialNetwork; url: string }[]     // 0–8; https; host must match the network
  foundedYear: number
}
export interface Phone {
  e164: string          // ^\+[1-9]\d{7,14}$
  display: string       // "+964 773 698 9694", formatted by the ERP
  whatsapp: boolean
  primary: boolean
  label: L3<string> | null   // e.g. Sales / Support; when set, all three languages
}

export interface Site {
  figures: { iraqSharePct: number | null; distributors: number | null; installedMw: number | null; peimarAgentSince: number | null }  // null hides that figure
  categoryText: Record<Line, L3<string>>              // the one-liner under each product line
  organization: { description: string; slogan: string; areaServed: string[] }   // English (JSON-LD only); areaServed = city ids from the reference, in order
  featured: {                                           // null = the website's automatic choice (today's rule)
    heroPanel: string | null                            // Designer panel id for the home 3D hero
    productsHeroSeries: Slug | null                     // curatedKey of a visible series with a studio render
    tickerInverters: string[] | null                    // Designer inverter ids
    tickerBatteries: Slug[] | null                      // slugs of visible batteries
  }
  pages: { projects: { lead: L3<string>; metaDescription: L3<string> } }   // owner text that mentions the projects
}

export interface Catalog {
  series: Series[]                                      // display order
  families: Family[]                                    // kept in order for lists and FAQ; pages sort by phase, then power
  batteries: Battery[]
  accessoryGroups: { key: string; name: L3<string> }[]  // order = order on /products/accessories/ (#group-N anchors follow it)
  accessories: Accessory[]                              // grouped by group key, in array order
  items: Item[]                                         // generic product pages (new)
}
interface EntryBase {
  slug: Slug
  curatedKey: Slug | null   // day-one slug of a curated entry; joins the website's technical layer (renders, raw Peimar facts); never changes
  name: string              // Latin, never translated ("OR Series OR10H", "PSI-X-HS 3.6")
  brand: string             // "Peimar" -> Peimar wording and manufacturer in JSON-LD; anything else -> that brand only
  photos: ImageRef[]        // 0–12, the first one is the main photo
  docs: Doc[]               // 0–60
}
export interface Model { name: string; techRef: string | null }   // techRef = Designer record override; null = derived from the name (§5)
export interface Series extends EntryBase {
  curatedKey: Slug          // required: series come only from the curated layer
  models: Model[]           // >= 1, at least one resolving to a Designer panel record
  text: L<{ tagline?: string; description?: string; technology?: string[] }>
}
export interface Family extends EntryBase {
  group: 'onGrid' | 'hybrid' | 'micro'
  phase: 'single_phase' | 'three_phase'
  powerRange: [number, number] | null   // W; null = taken from its Designer models
  models: Model[]                        // >= 1
  text: L<{ note?: string }>
}
export interface Battery extends EntryBase {
  capacity: Partial<Record<CapacityKey, number | [number, number]>> | null
  chemistry: Chemistry | null
  warrantyYears: number | null
  text: L<{ family?: string; role?: string; description?: string; warrantyNote?: string }>
}
export interface Accessory extends EntryBase {
  group: string                          // an accessoryGroups[].key
  variants: string[] | null              // Latin model codes, shown "a · b"
  text: L<{ line?: string }>
}
export interface Item extends EntryBase {
  curatedKey: null
  line: Line                             // where it is listed and how its breadcrumbs read
  specs: { key: SpecKey; label: L3<string> | null; value: string }[]   // 0–30; label required when key = 'custom', otherwise null
  text: L<{ summary?: string; description?: string }>
}

export type ImageRef = { alt: L<string> } & ({ media: Sha256 } | { sitePath: string })   // exactly one of media / sitePath
export interface Doc { kind: 'datasheet' | 'manual' | 'document'; label: string; url: string; lang: DocLang | null }
export interface Project {
  slug: Slug; sizeKwp: number; category: ProjectCategory; year: number | null
  cover: ImageRef | null                 // when set, alt is required in all three languages
  text: L3<{ title: string; line: string }>
}
export interface History {
  milestones: { key: Slug; year: number; text: L3<{ title: string; text: string }> }[]   // the site sorts by year
  today: L3<{ label: string; title: string; text: string }>
}
export interface Redirect {
  kind: 'series' | 'family' | 'battery' | 'item'   // the kinds that have pages
  from: Slug
  to: Slug | null              // null = the product-line page
  line: Line                   // that line page
  permanent: boolean           // true -> 301 (renamed or retired), false -> 302 (hidden for now)
}
export interface Media {
  sha256: Sha256; ext: 'jpg' | 'png' | 'webp'; bytes: number; width: number; height: number
  rights: 'own' | 'manufacturer' | 'licensed'; people: 'none' | 'consented'; credit: string | null
}
```

## 3. Validation rules

Both sides enforce these rules: the ERP before it commits, the website importer before it builds.

**Structure**
- Zod `.strict()` at every level, so an unknown key is an error. A field can only reach the site once both copies of the contract list it.
- Hidden, draft and retired items are **absent**, never flagged.
- A language block that is present must have at least one non-empty field. Empty strings are not allowed; leave the field out instead.

**Text**
- Normalised to NFC and trimmed.
- These are stripped: U+200E, U+200F, U+202A–202E, U+2066–2069, U+200B, U+2060 and U+FEFF. ZWNJ (U+200C) and NBSP (U+00A0) are kept.
- Arabic-Indic (U+0660–0669) and Persian (U+06F0–06F9) digits become 0–9.
- No C0 control characters, except `\n` in multi-line fields, where a blank line starts a new paragraph.
- Plain text only, never HTML or Markdown.
- The text is the raw database value. It never passes through the ERP's `t()`, whose Kurdish and Arabic messages contain bidi isolates.

**Length limits**

| Field | Limit |
|---|---|
| name, label | 120 |
| slug | 80 |
| series tagline | 120 |
| description (series, battery) | 1200 |
| item description | 3000 |
| technology | 8 items × 80 |
| note | 600 |
| accessory line | 300 |
| item summary | 160 |
| battery family | 120 |
| battery role | 160 |
| warrantyNote | 300 |
| alt | 200 |
| url | 500 |
| spec value | 120 |
| project title | 80 |
| project line | 160 |
| milestone title | 80 |
| milestone text | 300 |
| category one-liner | 160 |
| org description | 300 |
| slogan | 60 |

**Count limits**
- Per entry: up to 60 models, 60 docs and 12 photos.
- Overall: up to 200 projects, 50 milestones, 2000 redirects and 300 media files, each at most 5 MiB.
- `snapshot.json` is at most 2 MB.

**Links**
- https only.
- Doc hosts must be in `reference.policy.linkHosts`; it starts as `peimar.com` and `www.peimar.com`, and the developer extends it.
- `mapsUrl` must be on `policy.mapsHosts`. Each social URL's host must match its network (`policy.socialHosts`).

**Identity**
- Slugs are unique per kind; series, family, battery and item each have their own URL namespace.
- Model names are unique within an entry.
- An accessory's group must exist.
- Every `sitePath` must be listed in `reference.sitePaths`.
- Every `media` reference must have exactly one `Media` row, and every `Media` row must be referenced.

**Business**
- Phones: 1–5, exactly one primary, at least one WhatsApp.
- Hours: exactly 7 distinct days.
- foundedYear: 1990 to the current year.

**Minimums**
- At least one series and one family.
- A series with no model that resolves to a Designer panel is an error. The ERP blocks it; the site would skip that series with a warning.

## 4. Languages and fallbacks

**Never English on /ar/ or /ku/.** If an optional text block or field is missing in a language, the website leaves that block out of that language's pages. The page itself still exists in all three languages; only the text is omitted.

These short texts must exist in all three languages (`L3`). The ERP blocks visibility or publishing until they do:
- project title and line;
- project cover alt;
- milestone title and text;
- "Today";
- accessory group names;
- category one-liners;
- address parts;
- phone labels (when used);
- custom spec labels;
- the projects-page lead and meta description.

Product photo alt is optional; it falls back to the entry name, which is Latin and language-neutral.

Language-neutral values are one string for every language: names, model codes, brand, spec values, variants, URLs and phone numbers. The website wraps them in `<bdi>`/`dir="ltr"`.

## 5. References between the two sides

**Designer links**
- The website derives a model's Designer record from its name.
- Panels: the record whose `panelName()` (`model + ' (' + finish + ')'`, or `model` when there is no finish) equals the name.
- Inverters: the record whose `model` equals the name.
- Checked on today's data: all 76 module ids and all 71 inverter ids come out in order, with no collisions.
- `techRef` is used only to override a genuine naming variant. An unknown `techRef` or name gives a datasheet-only row and a warning, never a failed build.

**Curated entries**
- `curatedKey` links an entry to `src/data/technical/*` on the website.
- Series: series family, raw Peimar tagline and technology strings that drive filters, certificates, glass type and warranty curves, warranty terms, power range, efficiency, cells, finishes, studio render.
- Families and batteries: the raw Peimar texts used in JSON-LD fallbacks.
- Day one: `curatedKey == slug`.

**Images**
- `{ media }` is an upload. The site re-encodes it: WebP at 480, 960 and 1600 px, with metadata stripped.
- `{ sitePath }` is an image already on the website. Day one uses this for the legacy project photos.

## 6. Canonical JSON, hash and file format

```
canonicalJson(v): null|boolean|finite number|string -> JSON.stringify(v)
                  array  -> '[' + items.map(canonicalJson).join(',') + ']'
                  object -> '{' + Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + canonicalJson(v[k])).join(',') + '}'
contentHash = sha256_hex(utf8(canonicalJson(snapshot without publishId, publishedAt, contentHash)))
```

- `contract/fixtures/canonical.json` and `canonical.sha256` hold the reference vector for this hash.
- `snapshot.json` is written pretty-printed: keys sorted recursively, 2-space indent, LF line endings, final newline. This keeps diffs readable.
- An equal hash means there is nothing to publish.
- Phase 1b adds a detached `snapshot.json.sig` (ed25519 over the exact file bytes). The snapshot type does not change.

## 7. Versioning

**Minor versions**
- A minor adds optional fields or new list values and nothing else.
- The website advertises `accepts.maxMinor` in its reference and in `build.json`.
- The ERP sends a minor no higher than the **live** site's `maxMinor`. Otherwise it refuses with "the website needs an update first".
- The importer refuses a higher minor and fails closed, so the live site is untouched.

**Major versions**
- A major is a breaking change. The website ships support for both v1 and v2 first, the ERP then switches, and v1 support is removed later.

**Known future minors (phase 2)**
- Per-page SEO overrides.
- Custom FAQ.
- Per-entry `updatedAt` for sitemap lastmod.
- PDF media (`ext: 'pdf'`).
- A Designer library filter.

## 8. Site reference v1 and build info (website → ERP, public)

```ts
export interface SiteReferenceV1 {
  schema: 'faraday.site-reference'; version: 1
  builtAt: string; codeCommit: string; contentCommit: string | null; publishId: number | null
  accepts: { snapshotVersion: 1; maxMinor: number }
  routes: {
    localePrefix: Record<Locale, string>        // { en: '', ar: '/ar', ckb: '/ku' }
    series: string; family: string; battery: string; item: string   // '/products/modules/{slug}/', '/products/inverters/{slug}/', '/products/storage/{slug}/', '/products/items/{slug}/'
    accessories: string; projects: string       // '/products/accessories/', '/projects/#{slug}'
    line: Record<Line, string>                  // '/products/modules/', '/products/hybrid/', '/products/on-grid/', '/products/micro/', '/products/accessories/'
  }
  curated: {
    series: { key: Slug; name: string; seriesFamily: 'S Series' | 'OR Series' | 'DR Series'; warranty: { product: number; power: number };
              powerRange: [number, number]; efficiencyMax: number; cells: number[]; finishes: string[]; panelIds: string[];
              render: { src: string; width: number; height: number } | null }[]
    families: { key: Slug; group: 'onGrid' | 'hybrid' | 'micro'; inverterIds: string[] }[]
    batteries: { key: Slug }[]
  }
  panels: { id: string; model: string; finish: string | null; series: string; power: number; bifacial: boolean }[]    // 125, the same ids the Designer bundle already ships
  inverters: { id: string; model: string; type: 'hybrid' | 'on-grid' | 'micro'; phase: 'single_phase' | 'three_phase'; pnomAc: number }[]  // 71
  cities: { id: string; name: L3<string> }[]                                                                          // 22
  vocab: { chemistries: string[]; capacityKeys: string[]; specKeys: string[]; docLangs: string[]; socialNetworks: string[] }
  policy: { linkHosts: string[]; mapsHosts: string[]; socialHosts: Record<SocialNetwork, string[]> }
  sitePaths: { path: string; width: number; height: number }[]   // existing site images the ERP may reference
}
export interface BuildInfoV1 {            // /build.json, no-cache
  schema: 'faraday.site-build'; version: 1; channel: 'preview' | 'live'
  publishId: number | null; contentHash: string | null; contentCommit: string | null
  codeCommit: string; builtAt: string; accepts: { snapshotVersion: 1; maxMinor: number }
}
```

## 9. Error vocabulary (CI → ERP)

The importer, the build and the deploy report problems as GitHub annotations with a code and a reference, never with text:
- `::error title=<code>::<ref>`, or `::warning title=<code>::<ref>`.
- `<ref>` is `kind:slug[:model]`, a JSON path or a sha256 prefix.

The ERP reads them through the check-runs annotations API and maps each code to an owner message in its `website.ci.*` messages.

**Content codes:** `content/schema`, `content/hash`, `content/version`, `content/signature`, `content/duplicate-slug`, `content/unknown-curated`, `content/no-designer-model`, `content/designer-missing` (warning), `content/link-host`, `content/site-path`, `content/media-missing`, `content/media-mismatch`, `content/media-decode`, `content/media-dimensions`, `content/redirect-conflict`, `content/minimum`, `content/budget`.

**Build codes:** `build/test`, `build/astro-check`, `build/astro-build`, `build/check-dist`.

**Deploy codes:** `deploy/ftps-connect`, `deploy/ftps-upload`, `deploy/required-files`, `deploy/removal-guard`, `deploy/verify`.

## 10. Short example (trimmed)

```json
{
  "schema": "faraday.site-snapshot", "version": 1, "minor": 0,
  "publishId": 43, "publishedAt": "2026-12-02T09:14:00Z", "contentHash": "4f1c…",
  "company": {
    "name": "Faraday Co.",
    "phones": [{ "e164": "+9647736989694", "display": "+964 773 698 9694", "whatsapp": true, "primary": true, "label": null }],
    "email": "info@faradayiq.com",
    "address": { "text": { "en": { "street": "Qasmlu Street", "city": "Sulaymaniyah", "country": "Iraq" },
                           "ar": { "street": "شارع قاسملو", "city": "السليمانية", "country": "العراق" },
                           "ckb": { "street": "شەقامی قاسملۆ", "city": "سلێمانی", "country": "عێراق" } },
                 "postalCode": "46001", "mapsUrl": "https://www.google.com/maps/search/?api=1&query=…" },
    "hours": [{ "day": "sat", "open": "09:00", "close": "17:00" }, "… sun–thu …", { "day": "fri", "open": null, "close": null }],
    "hoursNote": {}, "socials": [{ "network": "facebook", "url": "https://www.facebook.com/102574992430776" }], "foundedYear": 2017
  },
  "catalog": {
    "series": [{ "slug": "or-series-or10h", "curatedKey": "or-series-or10h", "name": "OR Series OR10H", "brand": "Peimar", "photos": [],
                 "docs": [{ "kind": "datasheet", "label": "OR10H440MNDB (BF)", "url": "https://peimar.com/…pdf", "lang": null }],
                 "models": [{ "name": "OR10H440MNDB (BF)", "techRef": null }],
                 "text": { "en": { "tagline": "…", "description": "…", "technology": ["…"] }, "ar": { "…": "…" }, "ckb": { "…": "…" } } }],
    "batteries": [{ "slug": "psi-x-hs-5-0", "curatedKey": null, "name": "PSI-X-HS 5.0", "brand": "Peimar",
                    "photos": [{ "media": "9b2e…", "alt": {} }], "docs": [],
                    "capacity": { "moduleKwh": 5, "modules": [2, 10] }, "chemistry": "LiFePO4", "warrantyYears": 10,
                    "text": { "en": { "description": "…" }, "ckb": { "description": "…" } } }],
    "items": [{ "slug": "ground-mount-kit-2x6", "curatedKey": null, "name": "Ground mount kit 2×6", "brand": "Faraday", "line": "accessories",
                "photos": [], "docs": [], "specs": [{ "key": "material", "label": null, "value": "Galvanised steel" }],
                "text": { "en": { "summary": "…" } } }],
    "families": ["…"], "accessoryGroups": ["…"], "accessories": ["…"]
  },
  "redirects": [{ "kind": "family", "from": "psi-j-rf", "to": null, "line": "hybrid", "permanent": false }],
  "media": [{ "sha256": "9b2e…", "ext": "jpg", "bytes": 734221, "width": 2048, "height": 1536, "rights": "own", "people": "none", "credit": null }],
  "site": { "…": "…" }, "projects": ["…"], "history": { "…": "…" }
}
```

In this example, the battery has no Arabic block: its Arabic page is built, but shows no lead text.
