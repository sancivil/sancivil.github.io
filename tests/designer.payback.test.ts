import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  AGEING,
  PAYBACK_YEARS,
  designTech,
  money,
  moduleTech,
  outputFactor,
  payback,
  perKwh,
  priceFromBill,
  yearsMonths,
} from '../src/lib/designer/payback.ts';
import { createProject, setGroup, setInverterModel, updateSubArray } from '../src/lib/designer/project.ts';
import { decodeProject, encodeProject, fromCompact, toCompact } from '../src/lib/designer/share.ts';
import { projectFromSizing, sizeFromNeeds } from '../src/lib/designer/sizing.ts';
import type { Battery, Catalog, City, Inverter, Panel, Project } from '../src/lib/designer/types.ts';
import { designer } from '../src/i18n/designer.ts';

const json = (path: string) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const panels: Panel[] = json('../src/data/designer/panels.json');
const inverters: Inverter[] = json('../src/data/designer/inverters.json');
const cities: City[] = json('../src/data/iraq-solar.json').cities;
const batteries: Battery[] = json('../src/data/catalog.json').batteries;
const catalog: Catalog = { panels, inverters };

const flat = { firstYear: 0, perYear: 0 };
const close = (a: number, b: number, eps = 1e-6) => assert.ok(Math.abs(a - b) <= eps * Math.max(1, Math.abs(b)), `${a} ≈ ${b}`);

test('payback without ageing is cost ÷ yearly savings, rounded up to whole months', () => {
  const r = payback({ cost: 9_000_000, pricePerKwh: 150, annualKwh: 12_000, ageing: flat })!;
  assert.equal(r.yearly, 1_800_000);
  assert.equal(r.monthly, 150_000);
  close(r.crossing!, 5);
  assert.equal(r.months, 60);
  assert.equal(r.breakEvenYear, 5);
  assert.deepEqual(yearsMonths(r.months!), { years: 5, months: 0 });
  assert.equal(r.total, 1_800_000 * PAYBACK_YEARS);
  assert.equal(r.cumulative.length, PAYBACK_YEARS + 1);

  const odd = payback({ cost: 1000, pricePerKwh: 1, annualKwh: 300, ageing: flat })!;
  assert.equal(odd.months, 40);
  assert.deepEqual(yearsMonths(odd.months!), { years: 3, months: 4 });
  assert.equal(odd.breakEvenYear, 4);
  assert.equal(payback({ cost: 1, pricePerKwh: 1000, annualKwh: 12_000, ageing: flat })!.months, 1, 'never shows 0 months');
});

test('TOPCon ageing follows the Peimar warranty line from year 2 and delays the payback', () => {
  const a = AGEING.topcon;
  assert.equal(outputFactor(1, a), 1);
  close(outputFactor(2, a), 0.99);
  close(outputFactor(3, a), 0.987);
  close(outputFactor(25, a), 0.921);
  const r = payback({ cost: 9_000_000, pricePerKwh: 150, annualKwh: 12_000, ageing: a })!;
  const factors = Array.from({ length: PAYBACK_YEARS }, (_, i) => outputFactor(i + 1, a));
  close(r.total, 1_800_000 * factors.reduce((s, f) => s + f, 0));
  close(r.total, 1_800_000 * 23.932);
  const five = 1_800_000 * (1 + 0.99 + 0.987 + 0.984 + 0.981);
  close(r.crossing!, 5 + (9_000_000 - five) / (1_800_000 * 0.978));
  assert.equal(r.months, 61);
  assert.equal(r.breakEvenYear, 6);
  for (let k = 1; k <= PAYBACK_YEARS; k++) assert.ok(r.cumulative[k] > r.cumulative[k - 1]);
});

test('savings never exceed the yearly consumption when it is known', () => {
  const r = payback({ cost: 9_000_000, pricePerKwh: 150, annualKwh: 13_000, useKwh: 12_000, ageing: AGEING.topcon })!;
  assert.equal(r.yearly, 12_000 * 150);
  const last = r.cumulative[25] - r.cumulative[24];
  close(last, 13_000 * outputFactor(25, AGEING.topcon) * 150);
  for (const useKwh of [NaN, 0, -5, undefined]) {
    assert.equal(payback({ cost: 1e6, pricePerKwh: 100, annualKwh: 13_000, useKwh, ageing: flat })!.yearly, 1_300_000, `useKwh ${useKwh} means unknown`);
  }
});

test('empty, zero, negative and absurd inputs give no result instead of NaN or Infinity', () => {
  const ok = { cost: 9_000_000, pricePerKwh: 150, annualKwh: 12_000, ageing: AGEING.perc };
  for (const bad of [NaN, 0, -1, Infinity, -Infinity]) {
    assert.equal(payback({ ...ok, cost: bad }), null, `cost ${bad}`);
    assert.equal(payback({ ...ok, pricePerKwh: bad }), null, `price ${bad}`);
    assert.equal(payback({ ...ok, annualKwh: bad }), null, `kWh ${bad}`);
  }
  assert.equal(payback({ ...ok, cost: 1e300, pricePerKwh: 1e306 }), null, 'overflow');
  const never = payback({ ...ok, cost: 1e12 })!;
  assert.equal(never.months, null);
  assert.equal(never.breakEvenYear, null);
  assert.equal(never.crossing, null);
  assert.ok(Number.isFinite(never.total));

  let seed = 11;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let k = 0; k < 2000; k++) {
    const r = payback({ cost: rnd() * 1e8, pricePerKwh: rnd() * 500, annualKwh: rnd() * 50_000, useKwh: rnd() < 0.5 ? rnd() * 40_000 : undefined, ageing: AGEING.topcon });
    if (!r) continue;
    assert.ok([r.yearly, r.monthly, r.total, ...r.cumulative].every(Number.isFinite));
    if (r.months !== null) assert.ok(r.months >= 1 && r.months <= PAYBACK_YEARS * 12 && Number.isInteger(r.months));
  }
});

test('the monthly bill becomes a price per kWh only when bill and consumption are positive', () => {
  assert.equal(priceFromBill(150_000, 1000), 150);
  for (const [bill, kwh] of [[NaN, 1000], [150_000, NaN], [0, 1000], [150_000, 0], [-1, 1000]]) assert.ok(Number.isNaN(priceFromBill(bill, kwh)));
});

test('module technology comes from the Peimar code; a mixed design takes the steepest line', () => {
  const byModel = (model: string) => panels.find((p) => p.model === model)!;
  assert.equal(moduleTech(byModel('OR10H610MNDB')), 'topcon');
  assert.equal(moduleTech(byModel('OR10L460MN')), 'topcon');
  assert.equal(moduleTech(byModel('SG250P')), 'poly');
  assert.equal(moduleTech(byModel('OR10H560M')), 'perc');
  assert.equal(moduleTech({ ...byModel('OR10H610MNDB'), custom: true }), 'perc');
  assert.equal(designTech([byModel('OR10H610MNDB'), byModel('OR12H715MNDB')]), 'topcon');
  assert.equal(designTech([byModel('OR10H610MNDB'), byModel('SG250P')]), 'poly');
  assert.equal(designTech([byModel('SG250P'), byModel('OR10H560M')]), 'perc');
});

test('money keeps Latin digits, separators and the currency code', () => {
  assert.equal(money(1_250_000, 'IQD'), '1,250,000 IQD');
  assert.equal(money(150_000.6, 'IQD'), '150,001 IQD');
  assert.equal(money(112.5, 'USD'), '112.50 USD');
  assert.equal(money(35_000.4, 'USD'), '35,000 USD');
  assert.equal(perKwh(150, 'IQD'), '150 IQD/kWh');
  assert.equal(perKwh(136.3636, 'IQD'), '136.4 IQD/kWh');
  assert.equal(perKwh(0.085, 'USD'), '0.085 USD/kWh');
});

test('payback durations read naturally in English, Arabic and Sorani', () => {
  const d = (l: 'en' | 'ar' | 'ckb', y: number, m: number) => designer[l].payback.duration(y, m, String).join('');
  assert.equal(d('en', 3, 7), '3 years 7 months');
  assert.equal(d('en', 1, 1), '1 year 1 month');
  assert.equal(d('en', 0, 5), '5 months');
  assert.equal(d('ar', 3, 7), '3 سنوات و7 أشهر');
  assert.equal(d('ar', 1, 0), 'سنة واحدة');
  assert.equal(d('ar', 2, 2), 'سنتان وشهران');
  assert.equal(d('ar', 11, 11), '11 سنة و11 شهرًا');
  assert.equal(d('ckb', 3, 7), '3 ساڵ و 7 مانگ');
  assert.equal(d('ckb', 0, 1), '1 مانگ');
});

/** 12 × OR10H610MNDB on a PSI-X1P6000-HY, 1 × 6 on each MPPT. */
function home(): Project {
  let p = { ...createProject(), name: 'Home' };
  p = updateSubArray(p, 'a1', { panelId: 'or10h610mndb', count: 12 });
  p = setInverterModel(p, catalog, 'i1', 'psi-x1p6000-hy');
  p = setGroup(p, 'i1', 0, { series: 6, strings: 1 });
  return setGroup(p, 'i1', 1, { series: 6, strings: 1 });
}

const toCode = (raw: unknown) =>
  btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(raw)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

test('share links: the payback inputs round-trip, and links made before them still open', () => {
  const p: Project = { ...home(), finance: { currency: 'USD', cost: 6500, pricePerKwh: 0.12, useKwh: 12_000 } };
  assert.deepEqual(decodeProject(encodeProject(p), catalog), p);

  const old = toCompact(home()).slice(0, 10);
  const opened = decodeProject(toCode(old), catalog)!;
  assert.ok(opened, 'a 10-field link still opens');
  assert.deepEqual(opened, home());
  assert.equal(opened.finance.currency, 'IQD');
  assert.ok(Number.isNaN(opened.finance.cost) && Number.isNaN(opened.finance.pricePerKwh) && Number.isNaN(opened.finance.useKwh));

  const raw = toCompact(home()) as unknown[];
  raw[10] = ['EUR', 'a lot', null, -3];
  const odd = fromCompact(raw)!;
  assert.equal(odd.finance.currency, 'IQD');
  assert.ok(Number.isNaN(odd.finance.cost) && Number.isNaN(odd.finance.pricePerKwh));
  assert.equal(odd.finance.useKwh, -3);
  raw[10] = 'garbage';
  assert.equal(fromCompact(raw)!.finance.currency, 'IQD');
});

test('needs path: Baghdad at 1,000 kWh a month pays back from the bill, and the design keeps the inputs', () => {
  const outcome = sizeFromNeeds({ cityId: 'baghdad', monthlyKwh: 1000, gridHours: NaN, backupKw: NaN, backupHours: NaN, phase: 'single_phase' }, { panels, inverters, cities, batteries });
  assert.ok(outcome.ok);
  const s = outcome.sizing;
  const price = priceFromBill(150_000, 1000);
  const r = payback({ cost: 9_000_000, pricePerKwh: price, annualKwh: s.productionKwh, useKwh: s.annualKwh, ageing: AGEING[moduleTech(s.panel)] })!;
  assert.ok(s.productionKwh >= s.annualKwh, 'the system covers the consumption');
  assert.equal(r.yearly, 12 * 150_000, 'at full coverage the yearly saving is twelve bills');
  assert.ok(r.months! >= 60 && r.months! <= 62);
  const p = { ...projectFromSizing(s, 'Home'), finance: { currency: 'IQD' as const, cost: 9_000_000, pricePerKwh: price, useKwh: s.annualKwh } };
  assert.deepEqual(decodeProject(encodeProject(p), catalog)!.finance, p.finance);
});
