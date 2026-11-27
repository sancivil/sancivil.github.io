// Content import (contract v1): validates the site snapshot and prepares it for the build.
//   node scripts/content/import.ts [--check]   reads CONTENT_DIR/snapshot.json (default tests/fixtures/content-seed.v1)
// Writes src/content/generated/ (snapshot.json with resolved images, contact.json, report.json) and the
// photo variants in public/media/; --check validates and writes nothing. Problems go out as GitHub
// annotations with a contract §9 code and a reference, never with content text, because build logs are
// public. Any error writes nothing and exits 1.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import {
  MAX_SNAPSHOT_BYTES,
  formatJson,
  validateSnapshot,
  type ContractIssue,
  type ImageRef,
  type IssueCode,
  type Media,
  type SiteSnapshotV1,
} from '../../src/content/contract.ts';
import { siteReference, type Technical } from '../../src/content/reference.ts';
import type { WebImage, WebSnapshot } from '../../src/content/index.ts';

const check = process.argv.includes('--check');
const root = fileURLToPath(new URL('../../', import.meta.url));
const at = (...path: string[]) => join(root, ...path);
const json = (file: string) => JSON.parse(readFileSync(file, 'utf8'));
const contentDir = resolve(root, process.env.CONTENT_DIR ?? 'tests/fixtures/content-seed.v1');

const issues: ContractIssue[] = [];
const warn = (code: IssueCode, ref: string) => issues.push({ code, ref, level: 'warning' });
const fail = (code: IssueCode, ref: string) => issues.push({ code, ref, level: 'error' });
const annotate = () => {
  for (const { code, ref, level } of issues) console.log(`::${level} title=${code}::${ref}`);
};
const errors = () => issues.filter((issue) => issue.level === 'error').length;

function stop(): never {
  annotate();
  console.log(`content import failed: ${errors()} errors`);
  process.exit(1);
}

const technical: Technical = {
  series: json(at('src/data/technical/series.json')),
  families: json(at('src/data/technical/families.json')),
  batteries: json(at('src/data/technical/batteries.json')),
  panels: json(at('src/data/designer/panels.json')),
  inverters: json(at('src/data/designer/inverters.json')),
  cities: json(at('src/data/iraq-solar.json')).cities,
  policy: json(at('src/data/technical/policy.json')),
  siteImages: json(at('src/data/technical/site-images.json')),
};

/* ---------- read and validate ---------- */

const snapshotFile = join(contentDir, 'snapshot.json');
if (!existsSync(snapshotFile)) {
  fail('content/schema', 'snapshot.json');
  stop();
}
if (statSync(snapshotFile).size > MAX_SNAPSHOT_BYTES) {
  fail('content/budget', 'snapshot.json');
  stop();
}
let input: unknown;
try {
  input = json(snapshotFile);
} catch {
  fail('content/schema', 'snapshot.json');
  stop();
}
const validated = await validateSnapshot(input, siteReference(technical));
/* The site leaves out a series it cannot show (contract §3): one with no Designer panel or no technical layer. */
const skipped = new Set<string>();
for (const issue of validated.issues) {
  const slug = issue.ref.match(/^series:([^:]+)$/)?.[1];
  if (slug && (issue.code === 'content/no-designer-model' || issue.code === 'content/unknown-curated')) {
    skipped.add(slug);
    warn(issue.code, issue.ref);
  } else issues.push(issue);
}
const snapshot = validated.snapshot;
if (!snapshot || errors()) stop();

const series = snapshot.catalog.series.filter((s) => !skipped.has(s.slug));
if (series.length === 0) fail('content/minimum', 'catalog.series');

/* ---------- featured picks: the site falls back to its automatic choice ---------- */

const panelName = (p: Technical['panels'][number]) => (p.finish ? `${p.model} (${p.finish.code})` : p.model);
const recordId = <T extends { id: string }>(name: string, techRef: string | null, records: T[], nameOf: (r: T) => string) =>
  (techRef === null ? records.find((r) => nameOf(r) === name) : records.find((r) => r.id === techRef))?.id;
const shownPanels = new Set(series.flatMap((s) => s.models.map((m) => recordId(m.name, m.techRef, technical.panels, panelName))));
const shownInverters = new Set(
  snapshot.catalog.families.flatMap((f) => f.models.map((m) => recordId(m.name, m.techRef, technical.inverters, (i) => i.model))),
);
const rendered = new Set(technical.series.filter((s) => s.render).map((s) => s.key));
const { featured } = snapshot.site;
if (featured.heroPanel !== null && !shownPanels.has(featured.heroPanel)) warn('content/designer-missing', 'site.featured.heroPanel');
if (featured.productsHeroSeries !== null && !series.some((s) => s.curatedKey === featured.productsHeroSeries && rendered.has(s.curatedKey))) {
  warn('content/unknown-curated', 'site.featured.productsHeroSeries');
}
featured.tickerInverters?.forEach((id, i) => {
  if (!shownInverters.has(id)) warn('content/designer-missing', `site.featured.tickerInverters.${i}`);
});
featured.tickerBatteries?.forEach((slug, i) => {
  if (!snapshot.catalog.batteries.some((b) => b.slug === slug)) warn('content/unknown-curated', `site.featured.tickerBatteries.${i}`);
});

/* ---------- photos: each file must be its Media row ---------- */

const MAGIC: Record<Media['ext'], (bytes: Buffer) => boolean> = {
  jpg: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  png: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  webp: (b) => b.toString('latin1', 0, 4) === 'RIFF' && b.toString('latin1', 8, 12) === 'WEBP',
};
const decode = (bytes: Buffer) => sharp(bytes, { limitInputPixels: 40e6, failOn: 'error' });
const sha256 = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');

const photos: { media: Media; bytes: Buffer }[] = [];
for (const media of snapshot.media) {
  const ref = media.sha256.slice(0, 12);
  const file = join(contentDir, 'media', `${media.sha256}.${media.ext}`);
  if (!existsSync(file)) {
    fail('content/media-missing', ref);
    continue;
  }
  const bytes = readFileSync(file);
  if (sha256(bytes) !== media.sha256 || bytes.length !== media.bytes) {
    fail('content/media-mismatch', ref);
    continue;
  }
  const meta = MAGIC[media.ext](bytes) ? await decode(bytes).metadata().catch(() => null) : null;
  if (!meta) fail('content/media-decode', ref);
  else if (meta.width !== media.width || meta.height !== media.height) fail('content/media-dimensions', ref);
  else photos.push({ media, bytes });
}
if (errors()) stop();

const { publishId, catalog } = snapshot;
const counts =
  `content ${publishId}: ${series.length} series, ${catalog.families.length} families, ${catalog.batteries.length} batteries, ` +
  `${catalog.accessories.length} accessories, ${catalog.items.length} items, ${snapshot.projects.length} projects, ` +
  `${photos.length} photos; ${issues.length} warnings`;
if (check) {
  annotate();
  console.log(counts);
  process.exit(0);
}

/* ---------- photo variants: WebP at 480, 960 and 1600 px, never upscaled, metadata stripped ---------- */

const WIDTHS = [480, 960, 1600];
/* Bump when the encoder settings change, so cached variants are made again. */
const cacheDir = at('.cache/media', 'webp-q80-v1');
/* Made even without photos: CI caches .cache/media and warns when the folder is missing. */
mkdirSync(cacheDir, { recursive: true });
const encoded: { media: Media; files: { width: number; cached: string }[] }[] = [];
for (const { media, bytes } of photos) {
  const files = [...new Set(WIDTHS.map((w) => Math.min(w, media.width)))].map((width) => ({
    width,
    cached: join(cacheDir, `${media.sha256}-${width}.webp`),
  }));
  for (const { width, cached } of files) {
    if (existsSync(cached)) continue;
    /* Written under a temporary name first, so a failed encode never leaves a cached file behind. */
    const done = await decode(bytes)
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(`${cached}.part`)
      .then(
        () => true,
        () => false,
      );
    if (done) renameSync(`${cached}.part`, cached);
    else fail('content/media-decode', media.sha256.slice(0, 12));
  }
  encoded.push({ media, files });
}
if (errors()) stop();

const mediaDir = at('public/media');
const variants = new Map<string, Omit<WebImage, 'alt'>>();
const written = new Set<string>();
for (const { media, files } of encoded) {
  const out: { name: string; width: number; height: number }[] = [];
  for (const { width, cached } of files) {
    const webp = readFileSync(cached);
    const { height = 0 } = await sharp(webp).metadata();
    const name = `${media.sha256.slice(0, 12)}-${width}.${sha256(webp).slice(0, 8)}.webp`;
    mkdirSync(mediaDir, { recursive: true });
    if (!existsSync(join(mediaDir, name))) writeFileSync(join(mediaDir, name), webp);
    written.add(name);
    out.push({ name, width, height });
  }
  const largest = out[out.length - 1];
  variants.set(media.sha256, {
    src: `/media/${largest.name}`,
    srcset: out.length > 1 ? out.map((v) => `/media/${v.name} ${v.width}w`).join(', ') : null,
    width: largest.width,
    height: largest.height,
  });
}
if (existsSync(mediaDir)) {
  for (const name of readdirSync(mediaDir)) if (!written.has(name)) rmSync(join(mediaDir, name));
}

/* ---------- the generated content ---------- */

const siteImages = new Map(technical.siteImages.map((image) => [image.path, image]));
/** The contract guarantees a Media row for every upload and a site image for every sitePath. */
function resolveImage<A>(image: ImageRef & { alt: A }): Omit<WebImage, 'alt'> & { alt: A } {
  if ('media' in image) return { ...variants.get(image.media)!, alt: image.alt };
  const { width, height } = siteImages.get(image.sitePath)!;
  return { src: image.sitePath, srcset: null, width, height, alt: image.alt };
}
const withPhotos = <T extends { photos: ImageRef[] }>(entry: T) => ({ ...entry, photos: entry.photos.map(resolveImage) });

/* A skipped series answers like a hidden one: a 302 to the modules page, and redirects that pointed at it go there too. */
const redirects: SiteSnapshotV1['redirects'] = [
  ...snapshot.redirects.map((r) => (r.kind === 'series' && r.to !== null && skipped.has(r.to) ? { ...r, to: null } : r)),
  ...[...skipped].map((from) => ({ kind: 'series' as const, from, to: null, line: 'modules' as const, permanent: false })),
];

const web: WebSnapshot = {
  ...snapshot,
  catalog: {
    ...catalog,
    series: series.map(withPhotos),
    families: catalog.families.map(withPhotos),
    batteries: catalog.batteries.map(withPhotos),
    accessories: catalog.accessories.map(withPhotos),
    items: catalog.items.map(withPhotos),
  },
  projects: snapshot.projects.map((p) => ({ ...p, cover: p.cover && resolveImage(p.cover) })),
  redirects,
};

const { company } = snapshot;
const contact = {
  name: company.name,
  phones: company.phones,
  email: company.email,
  address: company.address,
  foundedYear: company.foundedYear,
};

const git = (...args: string[]) => execFileSync('git', args, { encoding: 'utf8' }).trim();
const report = {
  codeCommit: process.env.GITHUB_SHA ?? git('-C', root, 'rev-parse', 'HEAD'),
  contentCommit: existsSync(join(contentDir, '.git')) ? git('-C', contentDir, 'rev-parse', 'HEAD') : null,
  issues,
};

const generated = at('src/content/generated');
mkdirSync(generated, { recursive: true });
const write = (name: string, value: unknown) => {
  const text = formatJson(value);
  const file = join(generated, name);
  if (!existsSync(file) || readFileSync(file, 'utf8') !== text) writeFileSync(file, text);
};
write('snapshot.json', web);
write('contact.json', contact);
write('report.json', report);

annotate();
console.log(counts);
