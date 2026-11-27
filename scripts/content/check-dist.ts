// Checks a built site before it is deployed:
//   node scripts/content/check-dist.ts dist [--preview]
// - the product pages are exactly the ones in the content, in all three languages;
// - every internal link, image and anchor resolves, in the pages and in llms.txt;
// - the sitemap lists exactly the indexable pages, and each of them has a complete hreflang set;
// - every JSON-LD block parses and has no raw "<"; every <img> has a width and a height;
// - the .htaccess redirect block is exactly what the content asks for;
// - build.json and the site reference parse and match the content;
// - with --preview: every page is noindex and llms.txt is the pointer to the live file.
// Problems are printed as ::error title=build/check-dist::<what>, and the exit code is 1.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { buildInfoV1Schema, siteReferenceV1Schema } from '../../src/content/contract.ts';
import type { WebSnapshot } from '../../src/content/index.ts';
import { MARKER, redirectRules } from '../../src/integrations/content-htaccess.ts';

const args = process.argv.slice(2);
const preview = args.includes('--preview');
const dist = resolve(args.find((arg) => !arg.startsWith('--')) ?? 'dist');
const root = new URL('../../', import.meta.url);
const SITE = 'https://faradayiq.com';
const LOCALES = ['', 'ar/', 'ku/'];

const problems: string[] = [];
const problem = (what: string) => problems.push(what);
const read = (path: string) => readFileSync(join(dist, path), 'utf8');

const snapshot: WebSnapshot = JSON.parse(readFileSync(new URL('src/content/generated/snapshot.json', root), 'utf8'));
const files = readdirSync(dist, { recursive: true, encoding: 'utf8' }).map((path) => path.replaceAll('\\', '/'));
const fileSet = new Set(files);
const pages = files.filter((path) => path.endsWith('.html')).sort();

/** The file a site path is served from, or null when the build has none. */
function target(path: string): string | null {
  const clean = decodeURI(path.replace(/[?#].*$/, '')).replace(/^\//, '');
  const file = clean === '' || clean.endsWith('/') ? `${clean}index.html` : clean;
  return fileSet.has(file) ? file : null;
}
const pageUrl = (file: string) => `${SITE}/${file.replace(/index\.html$/, '')}`;

/* ---------- product pages: exactly the content's ---------- */

const folders = { modules: snapshot.catalog.series, inverters: snapshot.catalog.families, storage: snapshot.catalog.batteries, items: snapshot.catalog.items };
for (const [folder, entries] of Object.entries(folders)) {
  const expected = new Set(LOCALES.flatMap((prefix) => entries.map((e) => `${prefix}products/${folder}/${e.slug}/index.html`)));
  const built = pages.filter((page) => new RegExp(`^(?:ar/|ku/)?products/${folder}/[^/]+/index\\.html$`).test(page));
  for (const page of expected) if (!fileSet.has(page)) problem(`missing page ${page}`);
  for (const page of built) if (!expected.has(page)) problem(`page not in the content: ${page}`);
}

/* ---------- pages: links, anchors, images, JSON-LD, hreflang ---------- */

const ids = new Map<string, Set<string>>();
const idsOf = (file: string) => {
  if (!ids.has(file)) ids.set(file, new Set([...read(file).matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
  return ids.get(file)!;
};
const attr = (tag: string, name: string) => tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1];

function checkLink(from: string, url: string) {
  if (/^(?:mailto:|tel:|data:|javascript:)/.test(url)) return;
  const local = url.startsWith(`${SITE}/`) ? url.slice(SITE.length) : url.startsWith('/') ? url : null;
  if (url.startsWith('#')) {
    if (url.length > 1 && !idsOf(from).has(decodeURIComponent(url.slice(1)))) problem(`${from}: no anchor ${url}`);
    return;
  }
  if (local === null) return;
  const file = target(local);
  if (!file) return problem(`${from}: broken link ${url}`);
  const hash = local.match(/#(.+)$/)?.[1];
  if (hash && file.endsWith('.html') && !idsOf(file).has(decodeURIComponent(hash))) problem(`${from}: no anchor ${url}`);
}

const indexable = new Map<string, string>();
// Google wants each FAQ question marked up on one page only (the home page shows its questions without markup).
const faqOwners = new Map<string, string[]>();
for (const page of pages) {
  const html = read(page);
  for (const [, url] of html.matchAll(/\s(?:href|src)="([^"]+)"/g)) checkLink(page, url);
  for (const [, set] of html.matchAll(/\ssrcset="([^"]+)"/g)) {
    for (const part of set.split(',')) checkLink(page, part.trim().split(/\s+/)[0]);
  }
  for (const [tag] of html.matchAll(/<img\b[^>]*>/g)) {
    if (attr(tag, 'width') === undefined || attr(tag, 'height') === undefined) problem(`${page}: <img> without width or height`);
  }
  for (const [, json] of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    if (json.includes('<')) problem(`${page}: raw "<" in JSON-LD`);
    // Invisible formatting characters (word joiners, bidi isolates) belong in visible HTML only; ZWNJ/ZWJ spell words.
    if (/(?![‌‍])\p{Cf}/u.test(json)) problem(`${page}: invisible formatting character in JSON-LD`);
    try {
      for (const node of [JSON.parse(json)].flat().flatMap((n) => n['@graph'] ?? [n])) {
        if (node['@type'] !== 'FAQPage') continue;
        for (const q of node.mainEntity ?? []) faqOwners.set(q.name, [...(faqOwners.get(q.name) ?? []), page]);
      }
    } catch {
      problem(`${page}: JSON-LD does not parse`);
    }
  }
  const noindex = /<meta name="robots" content="noindex">/.test(html);
  if (preview && !noindex) problem(`${page}: preview page without noindex`);
  const canonical = html.match(/<link rel="canonical" href="([^"]+)">/)?.[1];
  if (!canonical) continue;
  if (canonical !== pageUrl(page)) problem(`${page}: canonical ${canonical}`);
  indexable.set(canonical, page);
  const alternates = new Map([...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)">/g)].map((m) => [m[1], m[2]]));
  for (const lang of ['en', 'ar', 'ku', 'x-default']) {
    const href = alternates.get(lang);
    if (!href || !target(href.slice(SITE.length))) problem(`${page}: hreflang ${lang} missing or broken`);
  }
  if (alternates.get('x-default') !== alternates.get('en')) problem(`${page}: x-default is not the English page`);
}
for (const [question, at] of faqOwners) if (at.length > 1) problem(`FAQ question marked up on ${at.join(', ')}: ${question}`);

/* ---------- sitemap ---------- */

const sitemap = new Set(
  (read('sitemap-index.xml').match(/<loc>[^<]+<\/loc>/g) ?? []).flatMap((loc) => {
    const file = loc.slice(5, -6).slice(SITE.length + 1);
    return (read(file).match(/<loc>[^<]+<\/loc>/g) ?? []).map((url) => url.slice(5, -6));
  }),
);
for (const url of sitemap) if (!indexable.has(url)) problem(`sitemap lists a page that is not indexable: ${url}`);
for (const url of indexable.keys()) if (!sitemap.has(url)) problem(`indexable page missing from the sitemap: ${url}`);

/* ---------- llms.txt ---------- */

const llms = read('llms.txt');
if (preview) {
  if (llms.trim().split('\n').length !== 1 || !llms.includes(`${SITE}/llms.txt`)) problem('llms.txt: preview builds carry only the pointer');
} else {
  for (const [, url] of llms.matchAll(/\]\((https:\/\/faradayiq\.com\/[^)]*)\)/g)) checkLink('llms.txt', url);
}

/* ---------- .htaccess redirect block ---------- */

const htaccess = read('.htaccess');
const at = htaccess.indexOf(`${MARKER}\n`);
if (at === -1) problem('.htaccess: no # CONTENT-REDIRECTS marker');
else {
  const after = htaccess.slice(at + MARKER.length + 1).split('\n');
  const rules = after.slice(0, after.indexOf(''));
  const expected = redirectRules(snapshot.redirects);
  if (rules.join('\n') !== expected.join('\n')) problem('.htaccess: the redirect block is not the content\'s');
  const shape = /^ {2}RewriteRule \^\(\(\?:ar\|ku\)\/\)\?products\/(?:modules|inverters|storage|items)\/[a-z0-9]+(?:-[a-z0-9]+)*\/\?\$ \/\$1products\/(?:[a-z-]+\/)(?:[a-z0-9]+(?:-[a-z0-9]+)*\/)? \[L,R=30[12]\]$/;
  for (const rule of rules) if (!shape.test(rule)) problem(`.htaccess: rule off the template: ${rule}`);
  expected.forEach((rule, i) => {
    const to = rule.match(/ \/\$1(\S+) /)?.[1];
    const { kind, from } = snapshot.redirects[i];
    if (!to || !target(`/${to}`)) problem(`.htaccess: redirect ${kind}:${from} points to a page that is not built`);
  });
}

/* ---------- build.json and the site reference ---------- */

const build = buildInfoV1Schema.safeParse(JSON.parse(read('build.json')));
if (!build.success) problem('build.json does not parse');
else {
  if (build.data.publishId !== snapshot.publishId || build.data.contentHash !== snapshot.contentHash) problem('build.json is not this content');
  if (build.data.channel !== (preview ? 'preview' : 'live')) problem(`build.json channel is ${build.data.channel}`);
}
if (!existsSync(join(dist, 'data/site-reference.v1.json')) || !siteReferenceV1Schema.safeParse(JSON.parse(read('data/site-reference.v1.json'))).success) {
  problem('data/site-reference.v1.json is missing or does not parse');
}

for (const what of problems) console.log(`::error title=build/check-dist::${what}`);
console.log(`check-dist ${preview ? 'preview ' : ''}${pages.length} pages, ${indexable.size} indexable, ${sitemap.size} in the sitemap: ${problems.length} problems`);
process.exit(problems.length ? 1 : 0);
