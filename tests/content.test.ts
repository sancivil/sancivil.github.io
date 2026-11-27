import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { contentHash, designerRecord, formatJson, type OpeningDay, type SiteSnapshotV1 } from '../src/content/contract.ts';
import { closedDays, hoursLine, hoursRows, hoursSentence, openingHoursSpecification } from '../src/content/hours.ts';
import { accessories, batteries, families, items, modules, paragraphs } from '../src/content/index.ts';
import { redirectRules } from '../src/integrations/content-htaccess.ts';
import { accessoryText, familyNote, itemText, seriesText, storageText } from '../src/i18n/catalog-text.ts';
import { company } from '../src/i18n/company.ts';
import { faq, type SiteFacts } from '../src/i18n/faq.ts';
import { product } from '../src/lib/seo/schema.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
const json = (path: string) => JSON.parse(readFileSync(join(root, path), 'utf8'));
const seed: SiteSnapshotV1 = json('tests/fixtures/content-seed.v1/snapshot.json');
const LOCALES = ['en', 'ar', 'ckb'] as const;

/* ---------- opening hours: the day-one strings, exactly ---------- */

/* Word joiner, left-to-right isolate, pop directional isolate and no-break space, as the site writes them. */
const WJ = String.fromCharCode(0x2060);
const LRI = String.fromCharCode(0x2066);
const PDI = String.fromCharCode(0x2069);
const NBSP = String.fromCharCode(0xa0);
const keep = (s: string) => s.replaceAll('–', WJ + '–' + WJ);
const isolate = (s: string) => LRI + keep(s) + PDI;
const week = seed.company.hours;

test('the hours formatter writes the day-one strings in all three languages', () => {
  assert.equal(hoursLine('en', week), `Saturday–Thursday ${keep('09:00–17:00')} · Friday closed`);
  assert.equal(hoursLine('ar', week), `من السبت إلى الخميس ${isolate('09:00–17:00')} · الجمعة عطلة`);
  assert.equal(hoursLine('ckb', week), `شەممە تا پێنجشەممە ${isolate('09:00–17:00')} · هەینی داخراوە`);
  assert.equal(hoursSentence('en', week), 'Saturday to Thursday, 09:00–17:00');
  assert.equal(hoursSentence('ar', week), 'من السبت إلى الخميس، 09:00–17:00');
  assert.equal(hoursSentence('ckb', week), 'شەممە تا پێنجشەممە، 09:00–17:00');
  assert.deepEqual(hoursRows('en', week), [
    { days: 'Saturday–Thursday', time: '09:00–17:00' },
    { days: 'Friday', time: null },
  ]);
  assert.deepEqual(hoursRows('ckb', week), [
    { days: 'شەممە تا پێنجشەممە', time: '09:00–17:00' },
    { days: 'هەینی', time: null },
  ]);
  assert.deepEqual(
    LOCALES.map((locale) => closedDays(locale, week)),
    ['Friday', 'الجمعة', 'هەینی'],
  );
  assert.deepEqual(openingHoursSpecification(week), [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
      opens: '09:00',
      closes: '17:00',
    },
  ]);
});

test('the hours formatter groups changed days and keeps them in week order', () => {
  const changed: OpeningDay[] = week.map((day) =>
    day.day === 'thu' ? { ...day, close: '13:00' } : day.day === 'tue' ? { day: 'tue', open: null, close: null } : day,
  );
  assert.equal(
    hoursLine('en', changed),
    [
      `Saturday–Monday ${keep('09:00–17:00')}`,
      'Tuesday closed',
      `Wednesday ${keep('09:00–17:00')}`,
      `Thursday ${keep('09:00–13:00')}`,
      'Friday closed',
    ].join(' · '),
  );
  assert.equal(
    hoursSentence('en', changed),
    'Saturday to Monday, 09:00–17:00; Wednesday, 09:00–17:00; Thursday, 09:00–13:00',
  );
  assert.equal(closedDays('en', changed), 'Tuesday and Friday');
  assert.equal(closedDays('ar', changed), 'الثلاثاء والجمعة');
  assert.deepEqual(
    openingHoursSpecification(changed).map((spec) => [spec.dayOfWeek.join(' '), spec.closes]),
    [
      ['Saturday Sunday Monday Wednesday', '17:00'],
      ['Thursday', '13:00'],
    ],
  );
});

test('the contact page description reproduces the day-one text', () => {
  const describe = (locale: (typeof LOCALES)[number], street: string, city: string) =>
    company[locale].contactPage.meta.description(street, city, hoursSentence(locale, week));
  assert.equal(
    describe('en', 'Qasmlu Street', 'Sulaymaniyah'),
    'Call, message on WhatsApp or visit Faraday on Qasmlu Street, Sulaymaniyah. Saturday to Thursday, 09:00–17:00.',
  );
  assert.equal(
    describe('ar', 'شارع قاسملو', 'السليمانية'),
    'اتصل بنا أو راسلنا على واتساب، أو زر مكتب Faraday في شارع قاسملو بالسليمانية. الدوام من السبت إلى الخميس، 09:00–17:00.',
  );
  assert.equal(
    describe('ckb', 'شەقامی قاسملۆ', 'سلێمانی'),
    'تەلەفۆنمان بۆ بکە، لە واتسئاپ نامە بنێرە یان سەردانی نووسینگەی Faraday بکە لە شەقامی قاسملۆ لە سلێمانی. دەوام شەممە تا پێنجشەممە، 09:00–17:00.',
  );
  assert.equal(company.en.contactPage.meta.description('A', 'B', ''), 'Call, message on WhatsApp or visit Faraday on A, B.');
});

/* ---------- the FAQ answers that read the content ---------- */

const ltr = (s: string) => LRI + s.replaceAll(' ', NBSP) + PDI;
const facts = (locale: (typeof LOCALES)[number], extra: Partial<SiteFacts> = {}): SiteFacts => ({
  ...{ founded: '2007', brescia: '2017', sProduct: '30', sPower: '30', orProduct: '25', orPower: '30', insurer: 'QBE' },
  ...{ batteryYears: '10', ctTopcon: '−0.29', ctMono: '−0.37', ctPoly: '−0.39', heatCity: 'Baghdad', heatT: '60' },
  ...{ lossTopcon: '10.2', lossMono: '13.0', lossPoly: '13.7', sizeCity: 'Baghdad', sizeCityId: 'baghdad', sizeY: '1,644.4' },
  ...{ sizeKwp: '7.30', sizePanels: '12', model: 'OR10H610MNDB', watts: '610', installed: '7.32', area: '31.0' },
  ...{ useMin: '300', useMax: '2,000', cityCount: '22', north: 'Zakho', south: 'Basra', cityList: ['Erbil', 'Duhok'] },
  ...{ low: 'Zakho', lowY: '1,525.6', high: 'Ramadi', highY: '1,681.8', email: 'info@faradayiq.com' },
  street: { en: 'Qasmlu Street', ar: 'شارع قاسملو', ckb: 'شەقامی قاسملۆ' }[locale],
  city: { en: 'Sulaymaniyah', ar: 'السليمانية', ckb: 'سلێمانی' }[locale],
  country: { en: 'Iraq', ar: 'العراق', ckb: 'عێراق' }[locale],
  postal: '46001',
  hours: {
    open: [{ days: { en: 'Saturday to Thursday', ar: 'من السبت إلى الخميس', ckb: 'شەممە تا پێنجشەممە' }[locale], open: '09:00', close: '17:00' }],
    closed: closedDays(locale, week),
  },
  phones: ['+964 773 698 9694'],
  whatsapp: ['+964 773 698 9694'],
  phone: '+964 773 698 9694',
  single: ['PSI-X1P HY', 'PSI-A1P'],
  singleKw: '3–6',
  three: ['PSI-X3S HY'],
  threeKw: '6–15',
  storage: { min: '3.8', minName: 'PSI-A-BT3.8S', max: '47.9', maxName: 'PSI-X-HS 3.6', modules: '13' },
  ...extra,
});
const answer = (locale: (typeof LOCALES)[number], extra?: Partial<SiteFacts>, index = 1) => faq[locale].qas(facts(locale, extra))[index].a;

test('the FAQ office answer reproduces the day-one text and follows the phones', () => {
  assert.equal(
    answer('en'),
    'Faraday’s office is on Qasmlu Street, Sulaymaniyah 46001, Iraq. It is open Saturday to Thursday from 09:00 to 17:00 and closed on Friday. Phone and WhatsApp: +964 773 698 9694.',
  );
  assert.equal(
    answer('ar'),
    `مكتبنا في شارع قاسملو، السليمانية ${ltr('46001')}، العراق. الدوام من السبت إلى الخميس، من ${ltr('09:00')} إلى ${ltr('17:00')}، والجمعة عطلة. الهاتف وواتساب: ${ltr('+964 773 698 9694')}.`,
  );
  assert.equal(
    answer('ckb'),
    `نووسینگەکەمان دەکەوێتە شەقامی قاسملۆ، سلێمانی ${ltr('46001')}، عێراق. شەممە تا پێنجشەممە لە ${ltr('09:00')} تا ${ltr('17:00')} کراوەین و هەینی پشووە. تەلەفۆن و واتسئاپ: ${ltr('+964 773 698 9694')}.`,
  );
  const twoPhones = { phones: ['+964 750 000 0001', '+964 770 000 0002'], whatsapp: ['+964 770 000 0002'], postal: null };
  assert.equal(
    answer('en', twoPhones),
    'Faraday’s office is on Qasmlu Street, Sulaymaniyah, Iraq. It is open Saturday to Thursday from 09:00 to 17:00 and closed on Friday. Phone: +964 750 000 0001, +964 770 000 0002. WhatsApp: +964 770 000 0002.',
  );
});

test('the FAQ storage answer leaves out what the site does not show', () => {
  assert.match(answer('en', {}, 5), /^Yes, with a hybrid inverter and batteries\. Peimar’s hybrid families are PSI-X1P HY and PSI-A1P for single-phase homes \(3–6 kW\) and PSI-X3S HY for three-phase supplies \(6–15 kW\)\. Peimar LFP storage starts at 3\.8 kWh/);
  assert.equal(
    answer('en', { three: [], storage: null }, 5),
    'Yes, with a hybrid inverter and batteries. Peimar’s hybrid families are PSI-X1P HY and PSI-A1P for single-phase homes (3–6 kW). Faraday sizes the battery to the outage hours you want to cover.',
  );
  assert.equal(
    answer('en', { single: [], three: [], storage: null }, 5),
    'Yes, with a hybrid inverter and batteries. Faraday sizes the battery to the outage hours you want to cover.',
  );
  assert.ok(!answer('ckb', { single: [] }, 5).includes('بۆ ماڵی تاک فاز'));
  assert.ok(answer('ckb', { single: [] }, 5).includes('بۆ کارەبای سێ فاز بریتین لە'));
});

/* ---------- Designer links (contract §5) ---------- */

test('model names link to the Designer records the curated layer lists: 76 module ids and 71 inverter ids, in order', () => {
  const panels: { id: string; model: string; finish: { code: string } | null }[] = json('src/data/designer/panels.json');
  const inverters: { id: string; model: string }[] = json('src/data/designer/inverters.json');
  const technicalSeries: { key: string; panelIds: string[] }[] = json('src/data/technical/series.json');
  const technicalFamilies: { key: string; inverterIds: string[] }[] = json('src/data/technical/families.json');
  const panelName = (p: (typeof panels)[number]) => (p.finish ? `${p.model} (${p.finish.code})` : p.model);
  const moduleIds = seed.catalog.series.map((s) => s.models.flatMap((m) => designerRecord(m, panels, panelName)?.id ?? []));
  const inverterIds = seed.catalog.families.map((f) => f.models.flatMap((m) => designerRecord(m, inverters, (r) => r.model)?.id ?? []));
  assert.deepEqual(moduleIds, seed.catalog.series.map((s) => technicalSeries.find((t) => t.key === s.curatedKey)!.panelIds));
  assert.deepEqual(inverterIds, seed.catalog.families.map((f) => technicalFamilies.find((t) => t.key === f.curatedKey)!.inverterIds));
  assert.equal(moduleIds.flat().length, 76);
  assert.equal(inverterIds.flat().length, 71);
});

/* ---------- redirects (.htaccess) ---------- */

test('the redirect builder writes one rule per redirect, for all three languages', () => {
  assert.deepEqual(
    redirectRules([
      { kind: 'family', from: 'psi-j-rf', to: null, line: 'hybrid', permanent: false },
      { kind: 'battery', from: 'psi-x-hs-5-0', to: 'psi-x-hs-5-0-v2', line: 'hybrid', permanent: true },
      { kind: 'item', from: 'mount-kit', to: null, line: 'onGrid', permanent: true },
    ]),
    [
      '  RewriteRule ^((?:ar|ku)/)?products/inverters/psi-j-rf/?$ /$1products/hybrid/ [L,R=302]',
      '  RewriteRule ^((?:ar|ku)/)?products/storage/psi-x-hs-5-0/?$ /$1products/storage/psi-x-hs-5-0-v2/ [L,R=301]',
      '  RewriteRule ^((?:ar|ku)/)?products/items/mount-kit/?$ /$1products/on-grid/ [L,R=301]',
    ],
  );
});

test('the redirect builder refuses slugs outside the contract, so no text reaches .htaccess', () => {
  for (const from of ['Bad', 'a b', 'x/../y', 'x$', 'x [L]', '']) {
    assert.throws(() => redirectRules([{ kind: 'series', from, to: null, line: 'modules', permanent: true }]), /slug/);
  }
  assert.throws(() => redirectRules([{ kind: 'series', from: 'ok', to: 'not ok', line: 'modules', permanent: true }]), /slug/);
});

/* ---------- JSON-LD ---------- */

test('product JSON-LD names Peimar as manufacturer only for Peimar products', () => {
  const base = { model: 'X1', description: 'd', image: '/a.png', url: 'https://faradayiq.com/products/items/x1/' };
  const peimar = product({ ...base, name: 'Peimar X1', brand: 'Peimar' });
  const faraday = product({ ...base, name: 'Faraday X1', brand: 'Faraday' });
  assert.deepEqual(peimar.brand, { '@type': 'Brand', name: 'Peimar' });
  assert.deepEqual(peimar.manufacturer, { '@type': 'Organization', name: 'Peimar S.r.l.', url: 'https://peimar.com/' });
  assert.deepEqual(faraday.brand, { '@type': 'Brand', name: 'Faraday' });
  assert.equal('manufacturer' in faraday, false);
});

/* ---------- languages (contract §4) ---------- */

test('text lookups return the entry’s own language block and never fall back to another language', () => {
  for (const locale of LOCALES) {
    for (const s of modules) assert.equal(seriesText(locale, s.slug), s.text[locale]);
    for (const b of batteries) assert.equal(storageText(locale, b.slug), b.text[locale]);
    for (const f of Object.values(families).flat()) assert.equal(familyNote(locale, f.slug), f.text[locale]?.note);
    for (const a of accessories) assert.equal(accessoryText(locale, a.slug), a.text[locale]?.line);
    for (const i of items) assert.equal(itemText(locale, i.slug), i.text[locale]);
  }
  assert.equal(seriesText('ar', 'no-such-series'), undefined);
});

test('a description splits into paragraphs on blank lines and drops empty ones', () => {
  assert.deepEqual(paragraphs('One.\n\nTwo,\nstill two.\n\n\n\nThree.'), ['One.', 'Two,\nstill two.', 'Three.']);
  assert.deepEqual(paragraphs('Only one.'), ['Only one.']);
});

/* ---------- the importer ---------- */

/** Runs the importer in check mode on a copy of the seed edited by `edit`, with a fresh content hash. */
async function importEdited(edit: (snapshot: any) => void, rehash = true) {
  const dir = mkdtempSync(join(tmpdir(), 'faraday-content-'));
  const snapshot = structuredClone(seed) as any;
  edit(snapshot);
  if (rehash) snapshot.contentHash = await contentHash(snapshot);
  writeFileSync(join(dir, 'snapshot.json'), formatJson(snapshot));
  const run = spawnSync(process.execPath, ['scripts/content/import.ts', '--check'], {
    cwd: root,
    env: { ...process.env, CONTENT_DIR: dir },
    encoding: 'utf8',
  });
  rmSync(dir, { recursive: true });
  return { status: run.status, out: run.stdout };
}

test('the day-one seed imports: 7 series, 21 families, 8 batteries, 21 accessories, 6 projects', async () => {
  const { status, out } = await importEdited(() => {}, false);
  assert.equal(status, 0, out);
  assert.match(out, /content 0: 7 series, 21 families, 8 batteries, 21 accessories, 0 items, 6 projects, 0 photos; 12 warnings/);
  assert.doesNotMatch(out, /::error/);
});

test('the importer fails closed on a broken contract, with codes and references only', async () => {
  const cases: [what: string, edit: (s: any) => void, rehash: boolean, annotation: RegExp][] = [
    ['an unknown key', (s) => (s.company.fax = '1'), true, /::error title=content\/schema::company/],
    ['a stale content hash', (s) => (s.company.email = 'sales@faradayiq.com'), false, new RegExp(`::error title=content/hash::${seed.contentHash.slice(0, 12)}`)],
    ['a newer contract minor', (s) => (s.minor = 1), true, /::error title=content\/version::1\.1/],
    ['a doc on another host', (s) => (s.catalog.batteries[0].docs[0].url = 'https://example.com/x.pdf'), true, /::error title=content\/link-host::battery:psi-x-5-8mst-v2/],
    ['an upload without its file', (s) => {
      s.catalog.items.push({ slug: 'kit', curatedKey: null, name: 'Kit', brand: 'Faraday', line: 'accessories', photos: [{ media: 'a'.repeat(64), alt: {} }], docs: [], specs: [], text: {} });
      s.media.push({ sha256: 'a'.repeat(64), ext: 'jpg', bytes: 1000, width: 800, height: 600, rights: 'own', people: 'none', credit: null });
    }, true, /::error title=content\/media-missing::aaaaaaaaaaaa/],
  ];
  for (const [what, edit, rehash, annotation] of cases) {
    const { status, out } = await importEdited(edit, rehash);
    assert.equal(status, 1, `${what}: ${out}`);
    assert.match(out, annotation, what);
    assert.doesNotMatch(out, /Qasmlu|sales@/, `${what}: content text in the log`);
  }
});

test('the importer leaves out a series it cannot show, with a warning', async () => {
  const { status, out } = await importEdited((s) => (s.catalog.series[2].curatedKey = 'unknown-series'));
  assert.equal(status, 0, out);
  assert.match(out, /::warning title=content\/unknown-curated::series:revamping-line/);
  assert.match(out, /content 0: 6 series,/);
});
