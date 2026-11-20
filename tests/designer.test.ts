import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  evaluateCell,
  groupContext,
  matrix,
  matrixStart,
  moduleAt,
  mpptGroups,
  powerRatio,
  ratioTone,
  stringChecks,
  summarize,
} from '../src/lib/designer/calc.ts';
import {
  addCustomPanel,
  addSubArray,
  createProject,
  inverterErrors,
  setGroup,
  setInverterConfig,
  setInverterCount,
  setInverterModel,
  updateSubArray,
} from '../src/lib/designer/project.ts';
import { decodeProject, encodeProject } from '../src/lib/designer/share.ts';
import { autoLayout, projectFromSizing, sizeFromNeeds } from '../src/lib/designer/sizing.ts';
import type { Battery, Catalog, City, Inverter, Panel, Project } from '../src/lib/designer/types.ts';
import { designer } from '../src/i18n/designer.ts';

const json = (path: string) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const panels: Panel[] = json('../src/data/designer/panels.json');
const inverters: Inverter[] = json('../src/data/designer/inverters.json');
const cities: City[] = json('../src/data/iraq-solar.json').cities;
const batteries: Battery[] = json('../src/data/catalog.json').batteries;
const ref = json('./fixtures/peimar-reference.json');

const refPanel: Panel = {
  ...ref.module,
  id: 'ref-or10h560m',
  series: 'OR10H',
  finish: null,
  bifacial: false,
  efficiency: null,
  width: null,
  height: null,
};
const refInverter: Inverter = {
  ...ref.inverter,
  id: 'ref-psi-x1p6000-hy',
  phase: 'single_phase',
  type: 'hybrid',
  image: null,
  mpptConfigs: [
    { key: '1,2', name: 'two_indipendent', labels: ['mppt_1', 'mppt_2'] },
    { key: 'ALL', name: 'parallel_all', labels: ['mppt_1_parallel_2_parallel_3'] },
  ],
};
const refCatalog: Catalog = { panels: [refPanel], inverters: [refInverter] };
const catalog: Catalog = { panels, inverters };

function referenceProject(selection: { mppt: number; series: number; strings: number }[] = ref.selection): Project {
  let p = createProject();
  p = { ...p, name: 'Reference', temps: { ...ref.temps } };
  p = updateSubArray(p, 'a1', { panelId: refPanel.id, count: ref.panels });
  p = setInverterModel(p, refCatalog, 'i1', refInverter.id);
  for (const s of selection) p = setGroup(p, 'i1', s.mppt - 1, { series: s.series, strings: s.strings });
  return p;
}

test('reference case: string voltages and current match the Peimar Designer', () => {
  const m = moduleAt(refPanel, ref.temps);
  const configKey = refInverter.mpptConfigs.find((c) => c.name === ref.config)!.key;
  const [group] = mpptGroups(refInverter, configKey);
  const checks = Object.fromEntries(stringChecks(m, refPanel, refInverter, group, 6, 1).map((c) => [c.id, c]));
  assert.equal(Math.round(checks.vstart.value), ref.expected.vocAtTmax);
  assert.equal(Math.round(checks.vmaxDc.value), ref.expected.vocAtTmin);
  assert.equal(Math.round(checks.vdcModule.value), ref.expected.vocAtTmin);
  assert.equal(Math.round(checks.vminMppt.value), ref.expected.vmpAtTmax);
  assert.equal(Math.round(checks.vmaxMppt.value), ref.expected.vmpAtTmin);
  assert.equal(Number(checks.imax.value.toFixed(2)), ref.expected.impAtTmax);
  assert.deepEqual(
    Object.values(checks).map((c) => [c.limit, c.pass]),
    [
      [90, true],
      [600, true],
      [1500, true],
      [70, true],
      [550, true],
      [16, true],
    ],
  );
});

test('reference case: nominal power ratio 107.14 % and 6.72 kWp', () => {
  const s = summarize(referenceProject(), refCatalog);
  assert.equal(Number((s.ratio * 100).toFixed(2)), ref.expected.nominalPowerRatioPct);
  assert.equal(s.connectedW / 1000, ref.expected.pvPeakKwp);
  assert.equal(Number((powerRatio(refInverter, 6720) * 100).toFixed(2)), 107.14);
  assert.equal(s.subArrays[0].used, 12);
  assert.equal(s.allValid, true);
  assert.deepEqual(s.blocks[0].groups.map((g) => [g.sel.strings, g.sel.series]), [
    [1, 6],
    [1, 6],
  ]);
});

test('matrix: one string valid from 3 to 11 in series, two or more strings fail on current', () => {
  const p = referenceProject([]);
  const ctx = groupContext(p, refCatalog, p.inverters[0], 0)!;
  assert.equal(matrixStart(ctx), 3);
  const validSeries = [];
  for (let s = 1; s <= 14; s++) if (evaluateCell(ctx, s, 1).state !== 'invalid') validSeries.push(s);
  assert.deepEqual(validSeries, [3, 4, 5, 6, 7, 8, 9, 10, 11]);
  assert.deepEqual(evaluateCell(ctx, 2, 1).failed.map((c) => c.id), ['vstart']);
  assert.deepEqual(evaluateCell(ctx, 12, 1).failed.map((c) => c.id), ['vmaxDc']);
  for (let s = 3; s <= 11; s++) {
    const cell = evaluateCell(ctx, s, 2);
    assert.equal(cell.state, 'invalid');
    assert.ok(cell.failed.some((c) => c.id === 'imax'));
  }
  const grid = matrix(ctx, 3);
  assert.equal(grid.length, 5);
  assert.deepEqual(grid[0].map((c) => `${c.power} (${c.modules})`), ['1680 (3)', '2240 (4)', '2800 (5)', '3360 (6)', '3920 (7)']);
});

test('matrix colours with MPPT 2 at 1x6: 3 and 4 amber, 5 to 7 green (ratio rule)', () => {
  const p = referenceProject([{ mppt: 2, series: 6, strings: 1 }]);
  const ctx = groupContext(p, refCatalog, p.inverters[0], 0)!;
  assert.equal(ctx.otherW, 3360);
  const tones = Object.fromEntries([3, 4, 5, 6, 7].map((s) => [s, ratioTone(refInverter, powerRatio(refInverter, s * 560 + ctx.otherW))]));
  assert.deepEqual(tones, ref.expected.matrixWithOtherMpptAt1x6);
  assert.equal(evaluateCell(ctx, 3, 1).state, 'amber');
  assert.equal(evaluateCell(ctx, 4, 1).state, 'amber');
  assert.equal(evaluateCell(ctx, 5, 1).state, 'green');
  assert.equal(evaluateCell(ctx, 6, 1).state, 'green');
  // 12 panels, 6 already on MPPT 2: a 7-panel string needs one panel more than the sub-array has left.
  assert.deepEqual(evaluateCell(ctx, 7, 1).failed.map((c) => c.id), ['panels']);
  const bigger = groupContext(updateSubArray(p, 'a1', { count: 13 }), refCatalog, p.inverters[0], 0)!;
  assert.equal(evaluateCell(bigger, 7, 1).state, 'green');
});

test('own selection counts as free when re-choosing a cell', () => {
  const p = referenceProject();
  const ctx = groupContext(p, refCatalog, p.inverters[0], 0)!;
  assert.equal(ctx.free, 6);
  assert.equal(evaluateCell(ctx, 6, 1).state, 'green');
  assert.equal(evaluateCell(ctx, 5, 1).state, 'green');
});

test('n identical inverters repeat the stringing n times', () => {
  let p = referenceProject();
  p = updateSubArray(p, 'a1', { count: 36 });
  p = setInverterCount(p, 'i1', 3);
  const s = summarize(p, refCatalog);
  assert.equal(s.subArrays[0].used, 36);
  assert.equal(s.connectedW, 3 * 6720);
  assert.equal(s.invertersTotal, 3);
  assert.equal(s.acW, 18000);
  assert.equal(Number((s.ratio * 100).toFixed(2)), 107.14);
  const short = summarize(updateSubArray(p, 'a1', { count: 30 }), refCatalog);
  assert.equal(short.allValid, false);
  assert.ok(inverterErrors(updateSubArray(p, 'a1', { count: 30 }), refCatalog)['i1.strings']);
});

test('three-phase inverter with three independent MPPTs', () => {
  const inv = inverters.find((i) => i.id === 'psi-x3p30000-hym')!;
  assert.equal(inv.phase, 'three_phase');
  let p = { ...createProject(), name: 'C&I', temps: { tmin: -2, tnom: 60, tmax: 80 } };
  p = updateSubArray(p, 'a1', { panelId: 'or10h610mndb', count: 51 });
  p = setInverterModel(p, catalog, 'i1', inv.id);
  assert.equal(p.inverters[0].configKey, '1,2,3');
  assert.equal(p.inverters[0].groups.length, 3);
  for (let g = 0; g < 3; g++) p = setGroup(p, 'i1', g, { series: 17, strings: 1 });
  const s = summarize(p, catalog);
  assert.equal(s.connectedW, 51 * 610);
  assert.equal(s.blocks[0].tone, 'green');
  assert.equal(s.allValid, true);
  const ctx = groupContext(p, catalog, p.inverters[0], 0)!;
  assert.deepEqual(evaluateCell(ctx, 18, 1).failed.map((c) => c.id), ['vmaxDc', 'panels']);
});

test('parallel MPPT configuration sums the MPPT currents', () => {
  let p = referenceProject([]);
  p = setInverterConfig(p, refCatalog, 'i1', 'ALL');
  const groups = mpptGroups(refInverter, 'ALL');
  assert.deepEqual(groups, [{ mppts: [1, 2], imax: 32 }]);
  const ctx = groupContext(p, refCatalog, p.inverters[0], 0)!;
  assert.equal(evaluateCell(ctx, 6, 2).state, 'green');
  assert.deepEqual(evaluateCell(ctx, 4, 3).failed.map((c) => c.id), ['imax']);
  const j25 = inverters.find((i) => i.id === 'psi-j25000-tp')!;
  assert.deepEqual(mpptGroups(j25, '1-3,2'), [
    { mppts: [1, 3], imax: 44 },
    { mppts: [2], imax: 22 },
  ]);
});

test('custom panel is used like a catalogue module', () => {
  let p = referenceProject([]);
  p = addCustomPanel(
    p,
    { model: 'Site panel 400', series: 'custom', finish: null, bifacial: false, power: 400, vmp: 34, imp: 11.8, voc: 41, isc: 12.4, vdcMax: 1000, efficiency: null, ctPmax: -0.35, ctVoc: -0.27, ctIsc: 0.05, width: null, height: null },
    'a1',
  );
  assert.equal(p.subArrays[0].panelId, 'custom-1');
  const ctx = groupContext(p, refCatalog, p.inverters[0], 0)!;
  assert.equal(ctx.panel.custom, true);
  const cell = evaluateCell(ctx, 8, 1);
  assert.equal(cell.power, 3200);
  assert.equal(cell.state, 'amber');
  assert.ok(cell.checks.find((c) => c.id === 'vmaxDc')!.pass);
});

test('share link round-trip keeps the whole project', () => {
  let p = referenceProject();
  p = addSubArray(p);
  p = updateSubArray(p, 'a2', { name: 'سطح الكراج', panelId: 'sa500m-bf', count: 4 });
  p = { ...p, client: 'کڕیار', notes: 'Line 1\nLine 2', cityId: 'sulaymaniyah' };
  p = addCustomPanel(p, { model: 'X', series: 'custom', finish: null, bifacial: false, power: 300, vmp: 30, imp: 10, voc: 36, isc: 10.5, vdcMax: 1000, efficiency: null, ctPmax: null, ctVoc: -0.3, ctIsc: 0.05, width: null, height: null }, 'a2');
  const code = encodeProject(p);
  assert.match(code, /^[A-Za-z0-9_-]+$/);
  assert.deepEqual(decodeProject(code), p);
  assert.equal(decodeProject('not-a-project'), null);
});

test('needs sizing: Baghdad, 1000 kWh per month, single-phase with backup', () => {
  const out = sizeFromNeeds(
    { cityId: 'baghdad', monthlyKwh: 1000, gridHours: 12, backupKw: 2, backupHours: 6, phase: 'single_phase' },
    { panels, inverters, cities, batteries },
  );
  assert.equal(out.ok, true);
  if (!out.ok) return;
  const s = out.sizing;
  assert.equal(Number(s.targetKwp.toFixed(2)), 7.3);
  assert.equal(s.panel.id, 'or10h610mndb');
  assert.equal(s.panelCount, 12);
  assert.equal(s.kwp, 7.32);
  assert.equal(s.inverter.id, 'psi-x1p6000-hy');
  assert.equal(s.inverterCount, 1);
  assert.deepEqual(s.layout.groups, [
    { series: 6, strings: 1 },
    { series: 6, strings: 1 },
  ]);
  assert.equal(s.outageHours, 12);
  assert.equal(Number(s.battery!.neededKwh.toFixed(2)), 13.33);
  assert.deepEqual(s.battery!.items.map((i) => [i.name, i.qty]), [
    ['PSI-X-5.8MST-V2', 1],
    ['PSI-X-5.8SLV-V2', 2],
  ]);
  const p = projectFromSizing(s, 'Home');
  const summary = summarize(p, catalog);
  assert.equal(summary.allValid, true);
  assert.equal(summary.blocks[0].tone, 'green');
  assert.equal(summary.subArrays[0].used, 12);
});

test('needs sizing: three-phase picks a three-phase hybrid; large single-phase splits into identical inverters', () => {
  const data = { panels, inverters, cities, batteries };
  const three = sizeFromNeeds({ cityId: 'basra', monthlyKwh: 1800, gridHours: NaN, backupKw: NaN, backupHours: NaN, phase: 'three_phase' }, data);
  assert.equal(three.ok, true);
  if (three.ok) {
    assert.equal(three.sizing.inverter.phase, 'three_phase');
    assert.equal(summarize(projectFromSizing(three.sizing, 'x'), catalog).allValid, true);
  }
  const big = sizeFromNeeds({ cityId: 'erbil', monthlyKwh: 3000, gridHours: 8, backupKw: 3, backupHours: 4, phase: 'single_phase' }, data);
  assert.equal(big.ok, true);
  if (big.ok) {
    assert.ok(big.sizing.inverterCount > 1);
    assert.ok(big.sizing.ratio >= big.sizing.inverter.percPmaxCc && big.sizing.ratio <= big.sizing.inverter.percPminCc);
    assert.equal(summarize(projectFromSizing(big.sizing, 'x'), catalog).allValid, true);
  }
  const tiny = sizeFromNeeds({ cityId: 'erbil', monthlyKwh: 60, gridHours: NaN, backupKw: NaN, backupHours: NaN, phase: 'three_phase' }, data);
  assert.deepEqual(tiny.ok, false);
});

test('auto layout prefers one comfortable string over two short ones', () => {
  const panel = panels.find((p) => p.id === 'or10h610mndb')!;
  const inv = inverters.find((i) => i.id === 'psi-x1p3000-hy')!;
  const layout = autoLayout(panel, inv, { tmin: -2, tnom: 60, tmax: 80 }, 4)!;
  assert.deepEqual(layout.groups, [
    { series: 4, strings: 1 },
    { series: 0, strings: 0 },
  ]);
});

function shape(value: unknown): unknown {
  if (typeof value === 'function') return 'fn';
  if (Array.isArray(value)) return `array:${value.length}`;
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((k) => [k, shape((value as Record<string, unknown>)[k])]));
  }
  return typeof value;
}

test('English, Arabic and Kurdish dictionaries have the same keys', () => {
  assert.deepEqual(shape(designer.ar), shape(designer.en));
  assert.deepEqual(shape(designer.ckb), shape(designer.en));
});
