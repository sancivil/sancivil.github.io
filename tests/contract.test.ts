import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  ACCEPTS_MAX_MINOR,
  COUNTS,
  LIMITS,
  MAX_MEDIA_BYTES,
  buildInfoV1Schema,
  canonicalJson,
  checkSnapshot,
  contentHash,
  designerRecord,
  formatJson,
  jsonSchemaFiles,
  normalizeWebText,
  panelName,
  siteReferenceV1Schema,
  siteSnapshotV1Schema,
  validateSnapshot,
  type ContractIssue,
} from '../src/content/contract.ts';

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8').replaceAll('\r\n', '\n');
const reference = siteReferenceV1Schema.parse(JSON.parse(read('../contract/fixtures/site-reference-v1.json')));

/** The fixtures are plain JSON; each case below edits a fresh copy. */
type Draft = any;
const fixture = (name: 'min' | 'full'): Draft => JSON.parse(read(`../contract/fixtures/snapshot-v1.${name}.json`));
const edited = (edit: (snapshot: Draft) => void, name: 'min' | 'full' = 'full') => {
  const snapshot = fixture(name);
  edit(snapshot);
  return snapshot;
};
const set = (target: Draft, path: string, value: unknown) => {
  const keys = path.split('.');
  const last = keys.pop()!;
  keys.reduce((node, key) => node[key], target)[last] = value;
};
const issuePaths = (snapshot: Draft) => {
  const result = siteSnapshotV1Schema.safeParse(snapshot);
  return result.success ? [] : result.error.issues.map((issue) => issue.path.join('.'));
};
const accepts = (edit: (snapshot: Draft) => void, what: string) =>
  assert.deepEqual(issuePaths(edited(edit)), [], `refused: ${what}`);
/** Each case breaks one rule and names the path the refusal must point at. */
const refuses = (cases: [what: string, edit: (snapshot: Draft) => void, path: string][]) => {
  for (const [what, edit, path] of cases) {
    const paths = issuePaths(edited(edit));
    assert.ok(paths.includes(path), `${what}: expected a refusal at "${path}", got ${JSON.stringify(paths)}`);
  }
};
const checks = (edit: (snapshot: Draft) => void, name: 'min' | 'full' = 'full') =>
  checkSnapshot(siteSnapshotV1Schema.parse(edited(edit, name)), reference);
const issue = (code: ContractIssue['code'], ref: string, level: ContractIssue['level'] = 'error'): ContractIssue => ({
  code,
  ref,
  level,
});
const FULL_WARNINGS = [
  issue('content/designer-missing', 'series:or-series-or10h:OR10H510MNDB (FB)', 'warning'),
  issue('content/designer-missing', 'family:psi-j-rf:PSI-J3000-RF', 'warning'),
];

/* ---------- files kept in both repos ---------- */

test('the JSON Schemas in contract/ are generated from the Zod contract', () => {
  for (const [file, text] of Object.entries(jsonSchemaFiles())) {
    assert.equal(read(`../contract/${file}`), text, `contract/${file} is out of date: write jsonSchemaFiles() to contract/`);
  }
});

test('the contract fixtures validate, in the snapshot.json layout', async () => {
  assert.deepEqual((await validateSnapshot(fixture('min'), reference)).issues, []);
  assert.deepEqual((await validateSnapshot(fixture('full'), reference)).issues, FULL_WARNINGS);
  for (const file of ['snapshot-v1.min.json', 'snapshot-v1.full.json', 'site-reference-v1.json']) {
    const text = read(`../contract/fixtures/${file}`);
    assert.equal(text, formatJson(JSON.parse(text)), file);
  }
});

test('the content hash matches the reference vector in contract/fixtures', async () => {
  const vector = JSON.parse(read('../contract/fixtures/canonical.json'));
  assert.equal(await contentHash(vector), read('../contract/fixtures/canonical.sha256').trim());
});

test('the site reference and build info are read leniently: keys a newer website adds are dropped', () => {
  const later = { ...JSON.parse(read('../contract/fixtures/site-reference-v1.json')), sitemap: '/sitemap-index.xml' };
  assert.equal('sitemap' in siteReferenceV1Schema.parse(later), false);
  const build = {
    schema: 'faraday.site-build',
    version: 1,
    channel: 'live',
    publishId: 0,
    contentHash: fixture('min').contentHash,
    contentCommit: null,
    codeCommit: '5577180d7c39ccc2bdc59273e586d27621085ab3',
    builtAt: '2026-11-23T17:35:22Z',
    accepts: { snapshotVersion: 1, maxMinor: 0 },
  };
  assert.deepEqual(buildInfoV1Schema.parse({ ...build, deployedBy: 'ci' }), build);
  assert.equal(buildInfoV1Schema.safeParse({ ...build, channel: 'staging' }).success, false);
  assert.equal(buildInfoV1Schema.safeParse({ ...build, accepts: { snapshotVersion: 2, maxMinor: 0 } }).success, false);
});

test('the day-one seed meets the contract', async () => {
  const text = read('./fixtures/content-seed.v1/snapshot.json');
  const { snapshot, issues } = await validateSnapshot(JSON.parse(text), reference);
  assert.ok(snapshot);
  assert.equal(text, formatJson(snapshot));
  assert.equal(snapshot.publishId, 0);
  assert.deepEqual(
    issues.filter((i) => i.level === 'error'),
    [],
  );
  const { series, families, batteries, accessoryGroups, accessories } = snapshot.catalog;
  assert.deepEqual(
    [
      series.length,
      series.flatMap((s) => s.models).length,
      families.length,
      batteries.length,
      accessoryGroups.length,
      accessories.length,
      snapshot.projects.length,
      snapshot.history.milestones.length,
    ],
    [7, 85, 21, 8, 9, 21, 6, 5],
  );
});

/* ---------- canonical JSON, hash and file format ---------- */

test('canonical JSON sorts keys by code unit and leaves out undefined keys', () => {
  assert.equal(
    canonicalJson({ b: [1, { d: null, c: 'x' }], a: true, A: -0, é: 'é', 10: 'ten', 9: 'nine', e: undefined }),
    '{"10":"ten","9":"nine","A":0,"a":true,"b":[1,{"c":"x","d":null}],"é":"é"}',
  );
});

test('canonical JSON refuses values that are not JSON', () => {
  for (const value of [undefined, NaN, Infinity, () => 1, 1n, new Date(0), [undefined], Symbol('s')]) {
    assert.throws(() => canonicalJson(value), TypeError);
  }
});

test('the content hash leaves out publishId, publishedAt and contentHash, and nothing else', async () => {
  const min = fixture('min');
  const same = { ...min, publishId: 99, publishedAt: '2027-01-01T00:00:00Z', contentHash: '0'.repeat(64) };
  assert.equal(await contentHash(same), min.contentHash);
  assert.notEqual(await contentHash({ ...min, minor: 1 }), min.contentHash);
});

test('formatJson sorts keys recursively, indents by two spaces and ends with a newline', () => {
  assert.equal(
    formatJson({ b: { d: 1, c: [2, { f: 3, e: 4 }] }, a: 'x' }),
    '{\n  "a": "x",\n  "b": {\n    "c": [\n      2,\n      {\n        "e": 4,\n        "f": 3\n      }\n    ],\n    "d": 1\n  }\n}\n',
  );
});

/* ---------- text hygiene ---------- */

test('text loses bidi controls and invisible separators, keeps ZWNJ and no-break spaces', () => {
  const bidiControls = ['\u200E', '\u200F', '\u202A', '\u202B', '\u202C', '\u202D', '\u202E', '\u2066', '\u2067', '\u2068', '\u2069'];
  const invisibles = ['\u200B', '\u2060', '\uFEFF'];
  for (const char of [...bidiControls, ...invisibles]) {
    assert.equal(normalizeWebText(`PSI${char}-X`), 'PSI-X', `U+${char.charCodeAt(0).toString(16)}`);
  }
  assert.equal(normalizeWebText('\u202Bموديل \u2066PSI-X1P6000-HY\u2069\u202C'), 'موديل PSI-X1P6000-HY');
  assert.equal(normalizeWebText('هاوکۆڵکە\u200Cی لـ\u00A0Peimar'), 'هاوکۆڵکە\u200Cی لـ\u00A0Peimar');
});

test('text gets Western digits for Arabic-Indic and Persian ones', () => {
  assert.equal(normalizeWebText('٠١٢٣٤٥٦٧٨٩ و ۰۱۲۳۴۵۶۷۸۹ kWp'), '0123456789 و 0123456789 kWp');
});

test('text is NFC and trimmed', () => {
  assert.equal(normalizeWebText('  Cafe\u0301\t\n'), 'Caf\u00E9');
  assert.equal(normalizeWebText('\u064A\u0654'), '\u0626');
  assert.equal(normalizeWebText('e\u200B\u0301'), '\u00E9');
});

test('multi-line text keeps its paragraphs, with LF line endings', () => {
  assert.equal(normalizeWebText('One.\r\n\r\nTwo.\rThree.', { multiline: true }), 'One.\n\nTwo.\nThree.');
  assert.equal(normalizeWebText('One.\r\nTwo.'), 'One.\r\nTwo.');
});

/* ---------- schema rules: each refusal points at the field ---------- */

test('every level is strict: unknown keys and flags are refused', () => {
  refuses([
    ['root', (s) => (s.extra = 1), ''],
    ['company', (s) => (s.company.fax = '+9647736989694'), 'company'],
    ['hidden entries are absent, never flagged', (s) => (s.catalog.series[0].visible = false), 'catalog.series.0'],
    ['language block', (s) => (s.catalog.series[0].text.en.subtitle = 'x'), 'catalog.series.0.text.en'],
    ['language key', (s) => (s.company.hoursNote.ku = 'x'), 'company.hoursNote'],
    ['image', (s) => (s.catalog.items[0].photos[0].caption = 'x'), 'catalog.items.0.photos.0'],
  ]);
});

test('every key is present, null only where the contract allows it', () => {
  refuses([
    ['missing key', (s) => delete s.company.address.postalCode, 'company.address.postalCode'],
    ['missing list', (s) => delete s.catalog.items, 'catalog.items'],
    ['null name', (s) => (s.catalog.series[0].name = null), 'catalog.series.0.name'],
    ['series without curatedKey', (s) => (s.catalog.series[0].curatedKey = null), 'catalog.series.0.curatedKey'],
    ['item with a curatedKey', (s) => (s.catalog.items[0].curatedKey = 'ground-mount-kit-2x6'), 'catalog.items.0.curatedKey'],
    ['document type', (s) => (s.schema = 'faraday.site-reference'), 'schema'],
  ]);
});

test('slugs, hashes, dates, phones and clock times have their formats', () => {
  refuses([
    ['upper case slug', (s) => (s.catalog.items[0].slug = 'Ground-kit'), 'catalog.items.0.slug'],
    ['double dash', (s) => (s.catalog.items[0].slug = 'ground--kit'), 'catalog.items.0.slug'],
    ['trailing dash', (s) => (s.catalog.items[0].slug = 'ground-kit-'), 'catalog.items.0.slug'],
    ['one-letter slug', (s) => (s.catalog.items[0].slug = 'g'), 'catalog.items.0.slug'],
    ['slug over 80', (s) => (s.catalog.items[0].slug = 'g'.repeat(81)), 'catalog.items.0.slug'],
    ['techRef', (s) => (s.catalog.series[0].models[3].techRef = 'OR10H560M'), 'catalog.series.0.models.3.techRef'],
    ['sha256', (s) => (s.media[0].sha256 = s.media[0].sha256.toUpperCase()), 'media.0.sha256'],
    ['contentHash', (s) => (s.contentHash = 'abc'), 'contentHash'],
    ['publishedAt with an offset', (s) => (s.publishedAt = '2026-12-02T12:14:00+03:00'), 'publishedAt'],
    ['publishedAt as a date', (s) => (s.publishedAt = '2026-12-02'), 'publishedAt'],
    ['e164 with a 0', (s) => (s.company.phones[0].e164 = '+09647736989694'), 'company.phones.0.e164'],
    ['e164 too short', (s) => (s.company.phones[0].e164 = '+9641234'), 'company.phones.0.e164'],
    ['display of another number', (s) => (s.company.phones[0].display = '+964 773 698 9695'), 'company.phones.0.display'],
    ['display with dashes', (s) => (s.company.phones[0].display = '+964-773-698-9694'), 'company.phones.0.display'],
    ['clock without a leading 0', (s) => (s.company.hours[0].open = '9:00'), 'company.hours.0.open'],
    ['clock at 24:00', (s) => (s.company.hours[0].close = '24:00'), 'company.hours.0.close'],
    ['email', (s) => (s.company.email = 'info at faradayiq.com'), 'company.email'],
    ['site path outside the site', (s) => (s.projects[0].cover.sitePath = 'images/x.jpg'), 'projects.0.cover.sitePath'],
    ['site path with ..', (s) => (s.projects[0].cover.sitePath = '/images/../x.jpg'), 'projects.0.cover.sitePath'],
  ]);
  accepts((s) => (s.company.hours[3].close = '23:59'), 'closing at 23:59');
  accepts((s) => (s.publishedAt = '2026-12-02T09:14:00.250Z'), 'fractional seconds');
});

test('text fields are clean plain text', () => {
  const tagline = 'catalog.series.0.text.en.tagline';
  refuses(
    (
      [
        ['empty', ''],
        ['leading space', ' Half-cell module'],
        ['trailing space', 'Half-cell module '],
        ['right-to-left mark', 'Half-cell\u200F module'],
        ['isolate', '\u2066Half-cell module\u2069'],
        ['zero-width space', 'Half\u200Bcell module'],
        ['Arabic-Indic digits', 'Module ٤٤٠ W'],
        ['Persian digits', 'Module ۴۴۰ W'],
        ['not NFC', 'Module de\u0301cor'],
        ['control character', 'Half-cell\u0007 module'],
        ['tab', 'Half-cell\tmodule'],
        ['line break in a one-line field', 'Half-cell\nmodule'],
        ['HTML tag', 'Half-cell <b>module</b>'],
        ['HTML character reference', 'Half-cell&nbsp;module'],
        ['Markdown emphasis', 'Half-cell **module**'],
        ['Markdown underscores', 'Half-cell __module__'],
        ['Markdown code', 'Half-cell `module`'],
        ['Markdown link', 'See [Peimar](https://peimar.com)'],
        ['Markdown heading', '# Half-cell module'],
      ] as const
    ).map(([what, value]): [string, (s: Draft) => void, string] => [what, (s) => set(s, tagline, value), tagline]),
  );
  const description = 'catalog.items.0.text.en.description';
  refuses([
    ['carriage return in a multi-line field', (s) => set(s, description, 'One.\r\nTwo.'), description],
    ['tab in a multi-line field', (s) => set(s, description, 'One.\n\tTwo.'), description],
  ]);
  accepts((s) => set(s, description, 'One.\n\nTwo.\nThree.'), 'paragraphs in a multi-line field');
  accepts((s) => set(s, tagline, 'C&I < 2 MW, 4.5% · TOPCon'), 'ampersand, less-than and symbols');
  accepts((s) => set(s, 'catalog.series.0.text.ckb.tagline', 'پانێڵی خانە\u200Cنیوەبڕاو لـ\u00A0Peimar'), 'ZWNJ and no-break space');
});

test('language-neutral values have no right-to-left letters', () => {
  refuses([
    ['entry name', (s) => (s.catalog.items[0].name = 'کیتی سەر زەوی'), 'catalog.items.0.name'],
    ['brand', (s) => (s.catalog.items[0].brand = 'فاراداي'), 'catalog.items.0.brand'],
    ['model name', (s) => (s.catalog.series[0].models[0].name = 'OR10H مودێل'), 'catalog.series.0.models.0.name'],
    ['variant', (s) => (s.catalog.accessories[1].variants[0] = 'شاحن'), 'catalog.accessories.1.variants.0'],
    ['spec value', (s) => (s.catalog.items[0].specs[0].value = 'فولاذ'), 'catalog.items.0.specs.0.value'],
    ['document label', (s) => (s.catalog.series[0].docs[0].label = 'ورقة البيانات'), 'catalog.series.0.docs.0.label'],
    ['accessory group key', (s) => (s.catalog.accessoryGroups[0].key = 'عدادات'), 'catalog.accessoryGroups.0.key'],
    ['company name', (s) => (s.company.name = 'فاراداي'), 'company.name'],
    ['postal code', (s) => (s.company.address.postalCode = '٤٦٠٠١'), 'company.address.postalCode'],
    ['organisation description', (s) => (s.site.organization.description = 'وكيل Peimar'), 'site.organization.description'],
    ['photo credit', (s) => (s.media[3].credit = 'صورة'), 'media.3.credit'],
  ]);
  accepts((s) => (s.catalog.items[0].name = 'Ground mount kit 2×6 – Ø 40 mm'), 'Latin with symbols');
});

test('language blocks hold text or are left out; L3 texts exist in all three languages', () => {
  refuses([
    ['empty block', (s) => (s.catalog.series[0].text.ar = {}), 'catalog.series.0.text.ar'],
    ['empty technology list', (s) => (s.catalog.series[0].text.en.technology = []), 'catalog.series.0.text.en.technology'],
    ['empty variants list', (s) => (s.catalog.accessories[1].variants = []), 'catalog.accessories.1.variants'],
    ['category one-liner', (s) => delete s.site.categoryText.micro.ckb, 'site.categoryText.micro.ckb'],
    ['category line', (s) => delete s.site.categoryText.micro, 'site.categoryText.micro'],
    ['project title', (s) => delete s.projects[1].text.ar, 'projects.1.text.ar'],
    ['milestone text', (s) => delete s.history.milestones[0].text.ckb.text, 'history.milestones.0.text.ckb.text'],
    ['"Today"', (s) => delete s.history.today.ar, 'history.today.ar'],
    ['accessory group name', (s) => delete s.catalog.accessoryGroups[0].name.ar, 'catalog.accessoryGroups.0.name.ar'],
    ['address part', (s) => delete s.company.address.text.ckb.street, 'company.address.text.ckb.street'],
    ['phone label', (s) => delete s.company.phones[1].label.ckb, 'company.phones.1.label.ckb'],
    ['custom spec label', (s) => delete s.catalog.items[0].specs[1].label.ar, 'catalog.items.0.specs.1.label.ar'],
    ['projects-page lead', (s) => delete s.site.pages.projects.lead.ckb, 'site.pages.projects.lead.ckb'],
    ['projects-page meta description', (s) => delete s.site.pages.projects.metaDescription.ar, 'site.pages.projects.metaDescription.ar'],
    ['project cover alt', (s) => delete s.projects[1].cover.alt.ar, 'projects.1.cover'],
  ]);
  accepts((s) => (s.catalog.batteries[0].photos[0].alt = {}), 'a product photo without alt text');
  accepts((s) => delete s.catalog.series[0].text.ar, 'a missing optional language');
});

test('length limits, at the limit and one past it', () => {
  const fields: [limit: keyof typeof LIMITS, path: string, value: (length: number) => string][] = [
    ['name', 'catalog.series.0.name', (n) => 'N'.repeat(n)],
    ['name', 'catalog.items.0.brand', (n) => 'B'.repeat(n)],
    ['name', 'catalog.series.0.models.0.name', (n) => 'M'.repeat(n)],
    ['name', 'catalog.accessoryGroups.0.name.ckb', (n) => 'ن'.repeat(n)],
    ['label', 'catalog.series.0.docs.0.label', (n) => 'L'.repeat(n)],
    ['label', 'company.phones.1.label.ar', (n) => 'م'.repeat(n)],
    ['label', 'company.address.text.en.street', (n) => 'S'.repeat(n)],
    ['label', 'catalog.items.0.specs.1.label.en', (n) => 'L'.repeat(n)],
    ['label', 'media.3.credit', (n) => 'C'.repeat(n)],
    ['slug', 'catalog.items.0.slug', (n) => 's'.repeat(n)],
    ['tagline', 'catalog.series.0.text.en.tagline', (n) => 't'.repeat(n)],
    ['description', 'catalog.series.0.text.ckb.description', (n) => 'د'.repeat(n)],
    ['description', 'catalog.batteries.0.text.en.description', (n) => 'd'.repeat(n)],
    ['itemDescription', 'catalog.items.0.text.en.description', (n) => 'd'.repeat(n)],
    ['technology', 'catalog.series.0.text.en.technology.0', (n) => 'T'.repeat(n)],
    ['note', 'catalog.families.0.text.en.note', (n) => 'n'.repeat(n)],
    ['note', 'company.hoursNote.ar', (n) => 'ر'.repeat(n)],
    ['accessoryLine', 'catalog.accessories.0.text.en.line', (n) => 'l'.repeat(n)],
    ['itemSummary', 'catalog.items.0.text.ar.summary', (n) => 'ه'.repeat(n)],
    ['batteryFamily', 'catalog.batteries.0.text.en.family', (n) => 'f'.repeat(n)],
    ['batteryRole', 'catalog.batteries.1.text.en.role', (n) => 'r'.repeat(n)],
    ['warrantyNote', 'catalog.batteries.1.text.en.warrantyNote', (n) => 'w'.repeat(n)],
    ['alt', 'catalog.items.0.photos.0.alt.en', (n) => 'a'.repeat(n)],
    ['url', 'catalog.series.0.docs.0.url', (n) => `https://peimar.com/${'u'.repeat(n - 19)}`],
    ['specValue', 'catalog.items.0.specs.0.value', (n) => 'v'.repeat(n)],
    ['projectTitle', 'projects.1.text.en.title', (n) => 't'.repeat(n)],
    ['projectLine', 'projects.1.text.ckb.line', (n) => 'ل'.repeat(n)],
    ['milestoneTitle', 'history.milestones.0.text.en.title', (n) => 't'.repeat(n)],
    ['milestoneTitle', 'history.today.en.label', (n) => 'l'.repeat(n)],
    ['milestoneText', 'history.milestones.0.text.ar.text', (n) => 'ن'.repeat(n)],
    ['milestoneText', 'history.today.en.text', (n) => 't'.repeat(n)],
    ['categoryLine', 'site.categoryText.modules.en', (n) => 'c'.repeat(n)],
    ['orgDescription', 'site.organization.description', (n) => 'o'.repeat(n)],
    ['orgDescription', 'site.pages.projects.lead.en', (n) => 'p'.repeat(n)],
    ['slogan', 'site.organization.slogan', (n) => 's'.repeat(n)],
  ];
  assert.deepEqual(new Set(fields.map(([limit]) => limit)), new Set(Object.keys(LIMITS)), 'every limit is tested');
  for (const [limit, path, value] of fields) {
    accepts((s) => set(s, path, value(LIMITS[limit])), `${path} at ${LIMITS[limit]}`);
    refuses([[`${path} past ${LIMITS[limit]}`, (s) => set(s, path, value(LIMITS[limit] + 1)), path]]);
  }
});

test('count limits, at the limit and one past it', () => {
  const copies = (item: unknown, n: number) => Array.from({ length: n }, () => structuredClone(item));
  const lists: [limit: keyof typeof COUNTS, path: string, items: (s: Draft, n: number) => unknown[]][] = [
    ['models', 'catalog.series.0.models', (s, n) => copies(s.catalog.series[0].models[0], n)],
    ['models', 'catalog.accessories.1.variants', (_, n) => copies('PSI-X1-EVC7.2-SXC', n)],
    ['docs', 'catalog.families.0.docs', (s, n) => copies(s.catalog.families[0].docs[0], n)],
    ['photos', 'catalog.items.0.photos', (s, n) => copies(s.catalog.items[0].photos[0], n)],
    ['technology', 'catalog.series.0.text.en.technology', (_, n) => copies('TOPCon', n)],
    ['phones', 'company.phones', (s, n) => [s.company.phones[0], ...copies(s.company.phones[1], n - 1)]],
    ['socials', 'company.socials', (s, n) => copies(s.company.socials[0], n)],
    ['specs', 'catalog.items.0.specs', (s, n) => copies(s.catalog.items[0].specs[0], n)],
    ['projects', 'projects', (s, n) => copies(s.projects[0], n)],
    ['milestones', 'history.milestones', (s, n) => copies(s.history.milestones[0], n)],
    ['redirects', 'redirects', (s, n) => copies(s.redirects[0], n)],
    ['media', 'media', (s, n) => copies(s.media[0], n)],
  ];
  assert.deepEqual(new Set(lists.map(([limit]) => limit)), new Set(Object.keys(COUNTS)), 'every count is tested');
  for (const [limit, path, items] of lists) {
    accepts((s) => set(s, path, items(s, COUNTS[limit])), `${COUNTS[limit]} in ${path}`);
    refuses([[`${COUNTS[limit] + 1} in ${path}`, (s) => set(s, path, items(s, COUNTS[limit] + 1)), path]]);
  }
  refuses([
    ['no phone', (s) => (s.company.phones = []), 'company.phones'],
    ['no model', (s) => (s.catalog.families[0].models = []), 'catalog.families.0.models'],
    ['photo over 5 MiB', (s) => (s.media[0].bytes = MAX_MEDIA_BYTES + 1), 'media.0.bytes'],
    ['empty photo file', (s) => (s.media[0].bytes = 0), 'media.0.bytes'],
  ]);
  accepts((s) => (s.media[0].bytes = MAX_MEDIA_BYTES), 'a photo of exactly 5 MiB');
});

test('links are https and well formed', () => {
  const url = 'catalog.series.0.docs.0.url';
  refuses([
    ['http', (s) => set(s, url, 'http://peimar.com/datasheet/x.pdf'), url],
    ['no host', (s) => set(s, url, 'https:///datasheet/x.pdf'), url],
    ['credentials', (s) => set(s, url, 'https://user:secret@peimar.com/x.pdf'), url],
    ['a port', (s) => set(s, url, 'https://peimar.com:8443/x.pdf'), url],
    ['a backslash', (s) => set(s, url, 'https://peimar.com\\@example.com/x.pdf'), url],
    ['a space', (s) => set(s, url, 'https://peimar.com/data sheet.pdf'), url],
    ['a zero-width space', (s) => set(s, url, 'https://peimar.com/datasheet/x.pdf\u200B'), url],
    ['a control character', (s) => set(s, url, 'https://peimar.com/datasheet/x\u0001.pdf'), url],
    ['javascript', (s) => set(s, url, 'javascript:alert(1)'), url],
    ['maps link', (s) => (s.company.address.mapsUrl = 'http://maps.google.com/?q=Sulaymaniyah'), 'company.address.mapsUrl'],
    ['social link', (s) => (s.company.socials[0].url = 'www.facebook.com/102574992430776'), 'company.socials.0.url'],
  ]);
  accepts((s) => set(s, url, 'https://peimar.com/datasheet/Peimar_EN_SA455M(BF).pdf?v=2#page=1'), 'path, query and fragment');
  accepts((s) => set(s, url, 'https://peimar.com/documents/Peimar__EN**2026.pdf?a=1&b=2'), 'markup-like characters in a URL');
});

test('phones: one to five, exactly one primary, at least one on WhatsApp', () => {
  refuses([
    ['two primaries', (s) => (s.company.phones[1].primary = true), 'company.phones'],
    ['no primary', (s) => (s.company.phones[0].primary = false), 'company.phones'],
    [
      'no WhatsApp',
      (s) => {
        for (const phone of s.company.phones) phone.whatsapp = false;
      },
      'company.phones',
    ],
  ]);
  accepts((s) => (s.company.phones = [s.company.phones[0]]), 'one phone, primary and on WhatsApp');
});

test('hours: seven rows, Saturday to Friday, open before close, both times or neither', () => {
  refuses([
    ['six rows', (s) => s.company.hours.pop(), 'company.hours'],
    ['eight rows', (s) => s.company.hours.push(s.company.hours[0]), 'company.hours'],
    ['out of order', (s) => s.company.hours.reverse(), 'company.hours'],
    ['a day twice', (s) => (s.company.hours[6] = { ...s.company.hours[5] }), 'company.hours'],
    ['unknown day', (s) => (s.company.hours[6].day = 'friday'), 'company.hours.6.day'],
    ['closing before opening', (s) => (s.company.hours[0].close = '08:00'), 'company.hours.0'],
    ['closing when opening', (s) => (s.company.hours[0].close = '09:00'), 'company.hours.0'],
    ['opening time only', (s) => (s.company.hours[6].open = '09:00'), 'company.hours.6'],
  ]);
});

test('years: founded and agent since are 1990 to this year, other years 1990 to 2100', () => {
  const thisYear = new Date().getUTCFullYear();
  refuses([
    ['founded before 1990', (s) => (s.company.foundedYear = 1989), 'company.foundedYear'],
    ['founded next year', (s) => (s.company.foundedYear = thisYear + 1), 'company.foundedYear'],
    ['agent since next year', (s) => (s.site.figures.peimarAgentSince = thisYear + 1), 'site.figures.peimarAgentSince'],
    ['founded in a fraction', (s) => (s.company.foundedYear = 2017.5), 'company.foundedYear'],
    ['project year', (s) => (s.projects[1].year = 1989), 'projects.1.year'],
    ['milestone year', (s) => (s.history.milestones[0].year = 2101), 'history.milestones.0.year'],
  ]);
  accepts((s) => (s.company.foundedYear = thisYear), 'founded this year');
});

test('figures, ranges and capacities make sense', () => {
  refuses([
    ['share above 100 %', (s) => (s.site.figures.iraqSharePct = 100.5), 'site.figures.iraqSharePct'],
    ['negative share', (s) => (s.site.figures.iraqSharePct = -1), 'site.figures.iraqSharePct'],
    ['half a distributor', (s) => (s.site.figures.distributors = 100.5), 'site.figures.distributors'],
    ['negative MW', (s) => (s.site.figures.installedMw = -5), 'site.figures.installedMw'],
    ['power range upside down', (s) => (s.catalog.families[0].powerRange = [6000, 3000]), 'catalog.families.0.powerRange'],
    ['power range at zero', (s) => (s.catalog.families[0].powerRange = [0, 3000]), 'catalog.families.0.powerRange.0'],
    ['capacity range upside down', (s) => (s.catalog.batteries[0].capacity.modules = [10, 2]), 'catalog.batteries.0.capacity.modules'],
    ['half a module', (s) => (s.catalog.batteries[0].capacity.modules = [2, 9.5]), 'catalog.batteries.0.capacity'],
    ['depth of discharge above 1', (s) => (s.catalog.batteries[0].capacity.depthOfDischarge = 90), 'catalog.batteries.0.capacity'],
    ['empty capacity', (s) => (s.catalog.batteries[0].capacity = {}), 'catalog.batteries.0.capacity'],
    ['unknown capacity key', (s) => (s.catalog.batteries[0].capacity.peakKw = 5), 'catalog.batteries.0.capacity'],
    ['zero capacity', (s) => (s.catalog.batteries[0].capacity.moduleKwh = 0), 'catalog.batteries.0.capacity.moduleKwh'],
    ['zero warranty', (s) => (s.catalog.batteries[0].warrantyYears = 0), 'catalog.batteries.0.warrantyYears'],
    ['zero kWp', (s) => (s.projects[1].sizeKwp = 0), 'projects.1.sizeKwp'],
    ['zero width', (s) => (s.media[0].width = 0), 'media.0.width'],
  ]);
  accepts((s) => (s.catalog.batteries[0].capacity = null), 'a battery without capacity figures');
});

test('closed lists take only their values', () => {
  refuses([
    ['chemistry', (s) => (s.catalog.batteries[0].chemistry = 'LiPo'), 'catalog.batteries.0.chemistry'],
    ['document language', (s) => (s.catalog.series[0].docs[0].lang = 'de'), 'catalog.series.0.docs.0.lang'],
    ['document kind', (s) => (s.catalog.series[0].docs[0].kind = 'brochure'), 'catalog.series.0.docs.0.kind'],
    ['spec key', (s) => (s.catalog.items[0].specs[0].key = 'colour'), 'catalog.items.0.specs.0.key'],
    ['social network', (s) => (s.company.socials[0].network = 'whatsapp'), 'company.socials.0.network'],
    ['product line', (s) => (s.catalog.items[0].line = 'storage'), 'catalog.items.0.line'],
    ['family group', (s) => (s.catalog.families[0].group = 'accessories'), 'catalog.families.0.group'],
    ['phase', (s) => (s.catalog.families[0].phase = 'split_phase'), 'catalog.families.0.phase'],
    ['project category', (s) => (s.projects[1].category = 'industrial'), 'projects.1.category'],
    ['redirect kind', (s) => (s.redirects[0].kind = 'accessory'), 'redirects.0.kind'],
    ['photo type', (s) => (s.media[0].ext = 'gif'), 'media.0.ext'],
    ['photo rights', (s) => (s.media[0].rights = 'unknown'), 'media.0.rights'],
    ['people in a photo', (s) => (s.media[0].people = 'yes'), 'media.0.people'],
  ]);
});

test('specs: a label for custom specs only; images: media or a site path, not both', () => {
  refuses([
    ['custom spec without a label', (s) => (s.catalog.items[0].specs[1].label = null), 'catalog.items.0.specs.1.label'],
    ['named spec with a label', (s) => (s.catalog.items[0].specs[0].label = s.catalog.items[0].specs[1].label), 'catalog.items.0.specs.0.label'],
    ['media and site path', (s) => (s.catalog.items[0].photos[0].sitePath = '/images/x.jpg'), 'catalog.items.0.photos.0'],
    ['neither', (s) => delete s.catalog.items[0].photos[0].media, 'catalog.items.0.photos.0'],
  ]);
});

/* ---------- checks across the document and against the site reference ---------- */

test('slugs are unique per kind, model names per entry, keys per list', () => {
  assert.deepEqual(
    checks((s) => s.catalog.series.push(structuredClone(s.catalog.series[0]))),
    [issue('content/duplicate-slug', 'series:or-series-or10h'), ...FULL_WARNINGS.slice(0, 1), ...FULL_WARNINGS],
  );
  assert.deepEqual(checks((s) => (s.catalog.items[0].slug = 'psi-x1p-hy')), FULL_WARNINGS, 'kinds have their own namespaces');
  const cases: [(s: Draft) => void, string][] = [
    [(s) => (s.catalog.families[0].models[1].name = 'PSI-X1P3000-HY'), 'family:psi-x1p-hy:PSI-X1P3000-HY'],
    [(s) => (s.projects[2].slug = s.projects[0].slug), 'project:3-kwp-for-emergency-power-water-station'],
    [(s) => (s.history.milestones[1].key = 'founded'), 'milestone:founded'],
    [(s) => (s.catalog.accessoryGroups[1].key = 'Meter'), 'catalog.accessoryGroups.1'],
  ];
  for (const [edit, ref] of cases) {
    assert.ok(
      checks(edit).some((i) => i.code === 'content/duplicate-slug' && i.ref === ref && i.level === 'error'),
      ref,
    );
  }
});

test('an accessory belongs to a listed group; served cities come from the reference, once each', () => {
  assert.deepEqual(checks((s) => (s.catalog.accessories[1].group = 'EV Chargers')), [
    issue('content/schema', 'accessory:psi-x1-evc'),
    ...FULL_WARNINGS,
  ]);
  assert.deepEqual(checks((s) => s.site.organization.areaServed.push('london', 'erbil')), [
    ...FULL_WARNINGS,
    issue('content/schema', 'site.organization.areaServed.3'),
    issue('content/schema', 'site.organization.areaServed.4'),
  ]);
});

test('at least one series and one family', () => {
  const issues = checks((s) => {
    s.catalog.series = [];
    s.catalog.families = [];
  }, 'min');
  assert.deepEqual(issues, [issue('content/minimum', 'catalog.series'), issue('content/minimum', 'catalog.families')]);
});

test('a series needs a model with Designer panel data; other models without it are warnings', () => {
  assert.deepEqual(
    checks((s) => {
      for (const model of s.catalog.series[0].models) model.techRef = 'no-such-panel';
    }),
    [issue('content/no-designer-model', 'series:or-series-or10h'), FULL_WARNINGS[1]],
  );
  assert.deepEqual(checks((s) => (s.catalog.families[0].models[0].techRef = 'psi-x1p3000-hy-v2')), [
    ...FULL_WARNINGS.slice(0, 1),
    issue('content/designer-missing', 'family:psi-x1p-hy:PSI-X1P3000-HY', 'warning'),
    FULL_WARNINGS[1],
  ]);
});

test('Designer links: techRef first, then the name as Peimar prints it', () => {
  const panels = reference.panels;
  assert.equal(panelName({ model: 'OR10H440MNDB', finish: 'BF' }), 'OR10H440MNDB (BF)');
  assert.equal(panelName({ model: 'OR10H560M', finish: null }), 'OR10H560M');
  assert.equal(designerRecord({ name: 'OR10H440MNDB (BF)', techRef: null }, panels, panelName)?.id, 'or10h440mndb-bf');
  assert.equal(designerRecord({ name: 'OR10H 560M', techRef: 'or10h560m' }, panels, panelName)?.id, 'or10h560m');
  assert.equal(designerRecord({ name: 'OR10H440MNDB(BF)', techRef: null }, panels, panelName), undefined);
  assert.equal(designerRecord({ name: 'OR10H440MNDB (BF)', techRef: 'no-such-panel' }, panels, panelName), undefined);
});

test('an unknown curated key is a warning', () => {
  assert.deepEqual(checks((s) => (s.catalog.batteries[1].curatedKey = 'psi-x-hs-9-9')), [
    issue('content/unknown-curated', 'battery:psi-x-hs-3-6', 'warning'),
    ...FULL_WARNINGS,
  ]);
});

test('links point at the hosts the website allows', () => {
  assert.deepEqual(
    checks((s) => {
      s.catalog.items[0].docs = [{ kind: 'document', label: 'Assembly guide', url: 'https://example.com/guide.pdf', lang: 'en' }];
      s.company.address.mapsUrl = 'https://www.bing.com/maps?q=Sulaymaniyah';
      s.company.socials[1].url = 'https://www.facebook.com/faraday.example';
    }),
    [
      ...FULL_WARNINGS,
      issue('content/link-host', 'item:ground-mount-kit-2x6'),
      issue('content/link-host', 'company.address.mapsUrl'),
      issue('content/link-host', 'company.socials.1.url'),
    ],
  );
});

test('site paths come from the reference; media rows match the references exactly', () => {
  const [or10h, battery] = fixture('full').media.map((m: { sha256: string }) => m.sha256.slice(0, 12));
  assert.deepEqual(checks((s) => (s.projects[0].cover.sitePath = '/images/legacy/project-rooftop-array-crop720.jpg')), [
    ...FULL_WARNINGS,
    issue('content/site-path', 'project:3-kwp-for-emergency-power-water-station'),
  ]);
  assert.deepEqual(checks((s) => s.media.shift()), [...FULL_WARNINGS, issue('content/media-missing', or10h)]);
  assert.deepEqual(checks((s) => (s.catalog.batteries[0].photos = [])), [
    ...FULL_WARNINGS,
    issue('content/media-mismatch', battery),
  ]);
  assert.deepEqual(checks((s) => s.media.push(structuredClone(s.media[0]))), [
    ...FULL_WARNINGS,
    issue('content/media-mismatch', or10h),
  ]);
});

test('redirects start at a page that is gone and end at one that exists, on the right line', () => {
  const cases: [string, (s: Draft) => void, string][] = [
    ['from a page that is built', (s) => (s.redirects[2].from = 'psi-x-hs-3-6'), 'battery:psi-x-hs-3-6'],
    ['to a page that is not built', (s) => (s.redirects[2].to = 'psi-x-hs-7-5'), 'battery:psi-x-hs-5'],
    ['twice from one page', (s) => s.redirects.push({ ...s.redirects[1], permanent: true }), 'family:psi-j-mirus-line'],
    ['a family to the modules line', (s) => (s.redirects[1].line = 'modules'), 'family:psi-j-mirus-line'],
    ['a battery to the micro line', (s) => Object.assign(s.redirects[2], { to: null, line: 'micro' }), 'battery:psi-x-hs-5'],
    ['to a family on another line', (s) => Object.assign(s.redirects[1], { to: 'psi-x1p-hy', line: 'onGrid' }), 'family:psi-j-mirus-line'],
  ];
  for (const [what, edit, ref] of cases) {
    assert.deepEqual(checks(edit), [...FULL_WARNINGS, issue('content/redirect-conflict', ref)], what);
  }
  assert.deepEqual(checks((s) => Object.assign(s.redirects[1], { to: 'psi-x1p-hy', line: 'hybrid' })), FULL_WARNINGS);
});

test('snapshot.json stays within 2 MB', () => {
  const issues = checks((s) => {
    const item = s.catalog.items[0];
    item.text.en.description = 'd'.repeat(LIMITS.itemDescription);
    s.catalog.items = Array.from({ length: 700 }, (_, i) => ({ ...structuredClone(item), slug: `kit-${i + 1}` }));
    s.redirects = s.redirects.filter((r: { kind: string }) => r.kind !== 'item');
  });
  assert.deepEqual(issues, [...FULL_WARNINGS, issue('content/budget', 'snapshot.json')]);
});

/* ---------- validateSnapshot: version gate, schema, hash ---------- */

test('validation refuses a newer contract before reading anything else', async () => {
  for (const [version, minor] of [
    [1, ACCEPTS_MAX_MINOR + 1],
    [2, 0],
  ]) {
    const result = await validateSnapshot(
      edited((s) => Object.assign(s, { version, minor, surprise: true })),
      reference,
    );
    assert.deepEqual(result, { snapshot: null, issues: [issue('content/version', `${version}.${minor}`)] });
  }
});

test('validation reports schema problems by path and a changed snapshot by its hash', async () => {
  assert.deepEqual(await validateSnapshot(edited((s) => (s.catalog.series[0].name = '')), reference), {
    snapshot: null,
    issues: [issue('content/schema', 'catalog.series.0.name')],
  });
  const changed = edited((s) => (s.company.email = 'sales@faradayiq.com'));
  const { snapshot, issues } = await validateSnapshot(changed, reference);
  assert.ok(snapshot);
  assert.deepEqual(issues, [issue('content/hash', changed.contentHash.slice(0, 12)), ...FULL_WARNINGS]);
});
