/** Edge cases that once broke the Designer engine, plus the inputs a demo audience is most likely to try. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { evaluateCell, groupContext, matrixBlockers, panelsUsed, summarize, tempsValid } from '../src/lib/designer/calc.ts';
import { iraqDate, latinDigits, parseNumber } from '../src/lib/designer/format.ts';
import {
  addSubArray,
  createProject,
  hasWork,
  inverterErrors,
  normalizeProject,
  projectErrors,
  removeSubArray,
  setGroup,
  setInverterConfig,
  setInverterCount,
  setInverterModel,
  setTemps,
  updateSubArray,
} from '../src/lib/designer/project.ts';
import { decodeProject, encodeProject, fromCompact, shareCode, shareMove, toCompact, type Saved } from '../src/lib/designer/share.ts';
import { projectFromSizing, sizeFromNeeds, type Needs } from '../src/lib/designer/sizing.ts';
import type { Battery, Catalog, City, Inverter, Panel, Project } from '../src/lib/designer/types.ts';

const json = (path: string) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const panels: Panel[] = json('../src/data/designer/panels.json');
const inverters: Inverter[] = json('../src/data/designer/inverters.json');
const cities: City[] = json('../src/data/iraq-solar.json').cities;
const batteries: Battery[] = json('../src/data/technical/batteries.json');
const catalog: Catalog = { panels, inverters };
const data = { panels, inverters, cities, batteries };

/** 12 × OR10H610MNDB on a PSI-X1P6000-HY, 1 × 6 on each MPPT. */
function home(): Project {
  let p = { ...createProject(), name: 'Home' };
  p = updateSubArray(p, 'a1', { panelId: 'or10h610mndb', count: 12 });
  p = setInverterModel(p, catalog, 'i1', 'psi-x1p6000-hy');
  p = setGroup(p, 'i1', 0, { series: 6, strings: 1 });
  return setGroup(p, 'i1', 1, { series: 6, strings: 1 });
}

const finite = (s: ReturnType<typeof summarize>) =>
  [s.connectedW, s.installedW, s.acW, s.dcNomW, s.panelsTotal, s.invertersTotal, s.stringsSelected, ...s.subArrays.map((x) => x.used)].every(Number.isFinite);

test('inverter count while typing (empty, 0, negative, fractional) counts as one inverter everywhere', () => {
  for (const count of [NaN, 0, -3, 2.5, Infinity]) {
    const p = setInverterCount(home(), 'i1', count);
    const s = summarize(p, catalog);
    assert.ok(finite(s), `count ${count}: totals stay finite`);
    assert.equal(s.subArrays[0].used, 12, `count ${count}: usage`);
    assert.equal(s.connectedW, 12 * 610, `count ${count}: connected W`);
    assert.equal(s.invertersTotal, 1);
    assert.equal(s.blocks[0].count, 1);
    const ctx = groupContext(p, catalog, p.inverters[0], 0)!;
    assert.equal(ctx.count, 1);
    assert.equal(evaluateCell(ctx, 6, 1).state, 'green', `count ${count}: the matrix does not go grey`);
    assert.equal(inverterErrors(p, catalog)['i1.count'], 'count', `count ${count}: the field is still flagged`);
  }
});

test('a negative count on one block never frees panels for another block', () => {
  let p = home();
  p = { ...p, inverters: [...p.inverters, { id: 'i2', inverterId: 'psi-x1p6000-hy', count: -5, configKey: '1,2', groups: [{ subArrayId: 'a1', series: 6, strings: 1 }, { subArrayId: '', series: 0, strings: 0 }] }] };
  assert.equal(panelsUsed(p, 'a1'), 18);
  const s = summarize(p, catalog);
  assert.equal(s.subArrays[0].used, 18);
  assert.equal(s.allValid, false);
  const ctx = groupContext(p, catalog, p.inverters[0], 0)!;
  assert.equal(ctx.free, 0);
  assert.deepEqual(evaluateCell(ctx, 6, 1).failed.map((c) => c.id), ['panels']);
});

test('share links: truncated, corrupted and foreign codes never throw and fall back to null', () => {
  const code = encodeProject(home());
  const tries: string[] = ['', '=', 'p', 'e30', '%%%', 'bnVsbA', 'WzEsMiwzXQ', 'W10', btoa('{"a":1}'), btoa('[1,2,3,4,5,6,7,8,9,10]'), code + 'x', code + '=='];
  for (let n = 0; n < code.length; n++) tries.push(code.slice(0, n));
  let seed = 7;
  const next = () => (seed = (seed * 1103515245 + 12345) % 2147483648);
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  for (let k = 0; k < 400; k++) {
    const chars = code.split('');
    for (let m = 0; m < 1 + (k % 4); m++) chars[next() % chars.length] = alphabet[next() % alphabet.length];
    tries.push(chars.join(''));
  }
  let decoded = 0;
  for (const t of tries) {
    let p: Project | null = null;
    assert.doesNotThrow(() => {
      p = decodeProject(t, catalog);
    }, `decode ${t.slice(0, 24)}`);
    if (!p) continue;
    decoded++;
    const project: Project = p;
    assert.doesNotThrow(() => {
      const s = summarize(project, catalog);
      assert.ok(finite(s));
      projectErrors(project);
      inverterErrors(project, catalog);
      project.inverters.forEach((b) => b.groups.forEach((_, i) => groupContext(project, catalog, b, i)));
    });
  }
  assert.equal(decodeProject(code.slice(0, code.length - 3)), null);
  assert.ok(decoded < tries.length);
});

test('share links in a hash: an encoded "=", line breaks and punctuation glued to the end are tolerated', () => {
  const code = encodeProject(home());
  const forms = [`#p=${code}`, `#p=${code}.`, `#p=${code})`, `#p=${code},`, `#p%3D${code}`, `#p%3d${code}`, `#p=${code.slice(0, 40)}%0A${code.slice(40)}`, `#p=${code.slice(0, 40)} ${code.slice(40)}`];
  for (const hash of forms) assert.equal(shareCode(hash), code, hash.slice(-16));
  assert.equal(shareCode('#p=Ab_-.'), 'Ab_-');
  assert.equal(shareCode('#p=Ab_-)'), 'Ab_-');
  assert.equal(shareCode('#p%3DAb_-'), 'Ab_-');
  assert.equal(shareCode('#p=%E0%A4%A'), '', 'a stray % sign: still a share link, with nothing to open');
  for (const hash of ['', '#', '#designer', '#main', '#pp=Ab', '#P=Ab', '#xp=Ab']) assert.equal(shareCode(hash), null, hash);
  assert.equal(decodeProject(shareCode(`#p=${code.slice(0, -12)}`)!, catalog), null, 'a cut link is a share link that cannot open');
});

test('a share link never drops work that exists only on this device', () => {
  const mine = { ...home(), name: 'Mine' };
  const theirs = { ...home(), name: 'Theirs' };
  const third = { ...home(), name: 'Third' };
  const own = (p: Project): Saved => ({ project: p, from: '' });
  const opened = (p: Project): Saved => ({ project: p, from: encodeProject(p) });
  /** Step 1 filled in for a customer, nothing chosen yet. */
  const typed = { ...createProject(), client: 'Ahmed Karim', notes: 'Roof faces south' };
  /** What a city page's link to the Designer leaves in the project. */
  const cityOnly = setTemps({ ...createProject(), cityId: 'erbil' }, { tmin: -12, tnom: 57, tmax: 77 });
  assert.equal(hasWork(createProject()), false);
  assert.equal(hasWork(cityOnly), false);
  assert.equal(hasWork({ ...createProject(), name: '  ' }), false);
  for (const field of ['name', 'number', 'client', 'address', 'notes'] as const) assert.equal(hasWork({ ...createProject(), [field]: 'x' }), true, field);
  assert.equal(hasWork(updateSubArray(createProject(), 'a1', { name: 'East roof' })), true);
  assert.equal(hasWork(updateSubArray(createProject(), 'a1', { panelId: 'or10h610mndb' })), true);
  assert.equal(hasWork(setInverterModel(createProject(), catalog, 'i1', 'psi-x1p6000-hy')), true);

  assert.equal(shareMove(own(createProject()), null, theirs), 'open', 'nothing entered yet');
  assert.equal(shareMove(own(cityOnly), null, theirs), 'open', 'a city alone is not work');
  assert.equal(shareMove(own(theirs), own(mine), theirs), 'open', 'the same project is already open');
  assert.equal(shareMove(opened(theirs), own(mine), third), 'open', 'an unchanged shared project lives on in its link');
  assert.equal(shareMove(opened(theirs), null, third), 'keep', 'a free slot keeps even an unchanged shared project');
  assert.equal(shareMove(opened(theirs), opened(mine), third), 'keep', 'both in their links: the newer one stays');
  assert.equal(shareMove(own(mine), null, theirs), 'keep', 'own work becomes the other project');
  assert.equal(shareMove(own(typed), null, theirs), 'keep', 'typed project data is work too');
  assert.equal(shareMove(own(mine), own(createProject()), theirs), 'keep', 'the other slot holds no work');
  assert.equal(shareMove(own(mine), own(typed), theirs), 'ask', 'the other slot holds typed project data');
  assert.equal(shareMove(own(mine), opened(third), theirs), 'keep', 'the other project lives on in its link');
  assert.equal(shareMove(own(mine), own(mine), theirs), 'keep', 'the other project is a copy of the open one');
  assert.equal(shareMove(own(mine), own(theirs), theirs), 'keep', 'the other project is the shared one');
  const edited: Saved = { project: { ...theirs, notes: 'changed after opening' }, from: encodeProject(theirs) };
  assert.equal(shareMove(edited, own(mine), third), 'ask', 'two projects that exist only here');
  assert.equal(shareMove(own(third), own(mine), theirs), 'ask');
});

test('share links and the saved project keep the 200-character project number the field accepts', () => {
  const p = { ...home(), number: 'N'.repeat(195) + '-2026' };
  assert.equal(fromCompact(toCompact(p))!.number, p.number);
  assert.equal(decodeProject(encodeProject(p), catalog)!.number, p.number);
  assert.equal(fromCompact(toCompact({ ...p, number: 'N'.repeat(260) }))!.number.length, 200);
});

test('typed numbers: decimal commas, thousands separators, Arabic-Indic and Persian digits', () => {
  const cases: [string, number][] = [
    ['0,12', 0.12],
    ['4,5', 4.5],
    ['-4,5', -4.5],
    ['−4,5', -4.5],
    ['41,5', 41.5],
    ['0,048', 0.048],
    ['0,123', 0.123],
    ['12,3456', 12.3456],
    ['١,٥', 1.5],
    ['٠٫١٢', 0.12],
    ['۰٫۱۲', 0.12],
    ['9,000,000', 9_000_000],
    ['٩٬٠٠٠٬٠٠٠', 9_000_000],
    ['1,234.5', 1234.5],
    ['1,500', 1500],
    ['9 000', 9000],
    ['1 234,5', 1234.5],
    ['۶۱۰', 610],
    ['\u2066150\u2069', 150],
    ['\u200f42', 42],
    ['.5', 0.5],
    [',5', 0.5],
    ['5,', 5],
    ['0.12', 0.12],
  ];
  for (const [text, value] of cases) assert.equal(parseNumber(text), value, text);
  for (const text of ['', ' ', '-', ',', '1,2,3', '1.234,5', '١٬٥', '150 IQD', '1e3', '+5', '1.5.5']) assert.ok(Number.isNaN(parseNumber(text)), text);
  assert.equal(latinDigits('OR10H٦١٠ ۶۱۰ ٢٣٫٦١'), 'OR10H610 610 23٫61');
});

test('the report date is the calendar day in Iraq, whatever the time zone of the device', () => {
  assert.equal(iraqDate(new Date('2026-11-23T22:30:00Z')), '2026-11-24', '01:30 in Baghdad');
  assert.equal(iraqDate(new Date('2026-11-23T20:59:59Z')), '2026-11-23', '23:59:59 in Baghdad');
  assert.equal(iraqDate(new Date('2026-11-24T12:00:00Z')), '2026-11-24');
  assert.equal(iraqDate(new Date('2026-12-31T21:00:00Z')), '2027-01-01', 'new year in Baghdad');
});

test('share links: fractional or absurd series and strings are dropped, not trusted', () => {
  const raw = toCompact(home()) as unknown[];
  raw[9] = [['i1', 'psi-x1p6000-hy', 1, '1,2', [['a1', 6.5, 1], ['a1', 6, 1e9]]]];
  const p = fromCompact(raw)!;
  assert.deepEqual(p.inverters[0].groups, [
    { subArrayId: 'a1', series: 0, strings: 0 },
    { subArrayId: 'a1', series: 0, strings: 0 },
  ]);
  assert.equal(summarize(p, catalog).connectedW, 0);
});

test('setGroup pads a groups list that is shorter than the MPPT count (old or damaged link)', () => {
  const p = { ...home(), inverters: [{ ...home().inverters[0], groups: [{ subArrayId: 'a1', series: 6, strings: 1 }] }] };
  const q = setGroup(p, 'i1', 1, { series: 6, strings: 1 });
  assert.deepEqual(q.inverters[0].groups, [
    { subArrayId: 'a1', series: 6, strings: 1 },
    { subArrayId: 'a1', series: 6, strings: 1 },
  ]);
  assert.equal(summarize(q, catalog).allValid, true);
  assert.equal(setGroup(p, 'i1', -1, { series: 3 }), p);
});

test('normalizeProject repairs stale inverter data and leaves a consistent project as it is', () => {
  const ok = home();
  assert.deepEqual(normalizeProject(ok, catalog), ok);
  assert.deepEqual(decodeProject(encodeProject(ok), catalog), ok);

  const stale: Project = {
    ...ok,
    inverters: [
      { id: 'i1', inverterId: 'psi-x1p6000-hy', count: 1, configKey: '1,2,3', groups: [{ subArrayId: 'a1', series: 6, strings: 1 }, { subArrayId: 'a1', series: 6, strings: 1 }, { subArrayId: 'a1', series: 6, strings: 1 }] },
      { id: 'i2', inverterId: 'gone-model', count: 1, configKey: '1', groups: [{ subArrayId: 'a1', series: 3, strings: 1 }] },
      { id: 'i3', inverterId: 'psi-x1p6000-hy', count: 1, configKey: '1,2', groups: [{ subArrayId: 'deleted', series: 6, strings: 1 }] },
    ],
  };
  const n = normalizeProject(stale, catalog);
  assert.equal(n.inverters[0].configKey, '1,2');
  assert.deepEqual(n.inverters[0].groups, [
    { subArrayId: 'a1', series: 0, strings: 0 },
    { subArrayId: 'a1', series: 0, strings: 0 },
  ]);
  assert.deepEqual(n.inverters[1], { id: 'i2', inverterId: '', count: 1, configKey: '', groups: [] });
  assert.deepEqual(n.inverters[2].groups, [
    { subArrayId: '', series: 0, strings: 0 },
    { subArrayId: 'a1', series: 0, strings: 0 },
  ]);
  assert.ok(finite(summarize(n, catalog)));
});

test('matrixBlockers says why a whole matrix is grey', () => {
  const ok = home();
  assert.deepEqual(matrixBlockers(groupContext(ok, catalog, ok.inverters[0], 0)!), []);

  // 17.41 A OR12H module on the 15 A microinverter inputs: every cell fails on current.
  let micro = { ...createProject(), name: 'Micro' };
  micro = updateSubArray(micro, 'a1', { panelId: 'or12h715mndb', count: 2 });
  micro = setInverterModel(micro, catalog, 'i1', 'psi-x1p800-mic');
  const mctx = groupContext(micro, catalog, micro.inverters[0], 0)!;
  assert.deepEqual(matrixBlockers(mctx).map((c) => c.id), ['imax']);
  for (let s = 1; s <= 5; s++) for (let q = 1; q <= 5; q++) assert.equal(evaluateCell(mctx, s, q).state, 'invalid');

  // One module already above the 60 V microinverter limit at −25 °C.
  const hot: Panel = { ...panels.find((x) => x.id === 'or10h610mndb')!, id: 'custom-1', model: 'High-voltage', voc: 58, vmp: 48, custom: true };
  let hv = { ...micro, customPanels: [hot], temps: { tmin: -25, tnom: 45, tmax: 70 } };
  hv = updateSubArray(hv, 'a1', { panelId: 'custom-1' });
  const hctx = groupContext(hv, catalog, hv.inverters[0], 0)!;
  const why = matrixBlockers(hctx);
  assert.deepEqual(why.map((c) => c.id), ['vmaxDc']); // Vmp: 48 V × 1.125 = 54 V, still under the 60 V MPPT limit
  assert.ok(why[0].value > 60 && why[0].limit === 60);

  // Fewer free panels than the shortest valid string.
  // Fewer free panels than the shortest valid string (2 × 610 W here): 1 panel left.
  const few = setGroup(updateSubArray(ok, 'a1', { count: 7 }), 'i1', 0, { series: 0, strings: 0 });
  const fctx = groupContext(few, catalog, few.inverters[0], 0)!;
  assert.equal(fctx.free, 1);
  assert.deepEqual(matrixBlockers(fctx).map((c) => c.id), ['panels']);
});

test('deleting a sub-array that MPPT groups use clears those selections only', () => {
  let p = home();
  p = addSubArray(addSubArray(p));
  p = updateSubArray(p, 'a2', { panelId: 'or10h610mndb', count: 6 });
  p = updateSubArray(p, 'a3', { panelId: 'or10h610mndb', count: 6 });
  p = setGroup(p, 'i1', 1, { subArrayId: 'a2', series: 6, strings: 1 });
  const q = removeSubArray(p, 'a2');
  assert.deepEqual(q.inverters[0].groups, [
    { subArrayId: 'a1', series: 6, strings: 1 },
    { subArrayId: '', series: 0, strings: 0 },
  ]);
  const s = summarize(q, catalog);
  assert.deepEqual(s.subArrays.map((x) => x.used), [6, 0]);
  assert.ok(finite(s));
});

test('lowering the panel count below what is assigned flags the sub-array and the selected cells', () => {
  const p = updateSubArray(home(), 'a1', { count: 8 });
  const s = summarize(p, catalog);
  assert.equal(s.subArrays[0].used, 12);
  assert.equal(s.allValid, false);
  assert.equal(inverterErrors(p, catalog)['a1.over'], 'over');
  assert.deepEqual(s.blocks[0].groups.map((g) => g.cell!.failed.map((c) => c.id)), [['panels'], ['panels']]);
  for (const count of [NaN, 0, -4]) {
    const q = updateSubArray(home(), 'a1', { count });
    assert.equal(groupContext(q, catalog, q.inverters[0], 0), null);
    assert.equal(summarize(q, catalog).allValid, false);
  }
});

test('changing inverter model or configuration after selecting clears the stale strings', () => {
  const p = home();
  const model = setInverterModel(p, catalog, 'i1', 'psi-x3p30000-hym');
  assert.equal(model.inverters[0].groups.length, 3);
  assert.ok(model.inverters[0].groups.every((g) => g.series === 0 && g.strings === 0));
  assert.equal(summarize(model, catalog).subArrays[0].used, 0);
  const cfg = setInverterConfig(p, catalog, 'i1', 'ALL');
  assert.deepEqual(cfg.inverters[0].groups, [{ subArrayId: 'a1', series: 0, strings: 0 }]);
  // Changing the module keeps the strings but re-checks them against the new module.
  const other = updateSubArray(p, 'a1', { panelId: 'or12h715mndb' });
  assert.ok(summarize(other, catalog).blocks[0].groups.every((g) => g.cell!.failed.some((c) => c.id === 'imax')));
});

test('temperatures: empty, out of range or out of order block the matrix without throwing', () => {
  for (const t of [{ tmin: NaN }, { tmin: 70, tmax: 60 }, { tmin: 10, tnom: 10 }, { tnom: 80, tmax: 70 }, { tmax: 500 }, { tmin: -Infinity }]) {
    const p = setTemps(home(), t);
    assert.equal(tempsValid(p.temps), false);
    assert.equal(groupContext(p, catalog, p.inverters[0], 0), null);
    assert.ok(Object.keys(projectErrors(p)).length > 0);
    assert.equal(summarize(p, catalog).allValid, false);
  }
});

test('empty project and very large projects keep finite totals', () => {
  const empty = summarize(createProject(), catalog);
  assert.ok(finite(empty));
  assert.equal(empty.allValid, false);
  let big = { ...createProject(), name: 'Plant' };
  big = updateSubArray(big, 'a1', { panelId: 'or10h610mndb', count: 9999 });
  big = setInverterModel(big, catalog, 'i1', 'psi-x3p125000-tpm');
  for (let g = 0; g < 12; g++) big = setGroup(big, 'i1', g, { series: 20, strings: 2 });
  big = setInverterCount(big, 'i1', 9999);
  const s = summarize(big, catalog);
  assert.equal(s.subArrays[0].used, 9999 * 12 * 40);
  assert.equal(s.connectedW, 9999 * 12 * 40 * 610);
  assert.equal(inverterErrors(big, catalog)['a1.over'], 'over');
});

test('needs sizing extremes give a result or a clear reason, never a broken project', () => {
  const ask = (n: Partial<Needs>) => sizeFromNeeds({ cityId: 'baghdad', monthlyKwh: 1000, gridHours: 12, backupKw: NaN, backupHours: NaN, phase: 'single_phase', ...n }, data);

  const tiny = ask({ monthlyKwh: 50 });
  assert.deepEqual([tiny.ok, !tiny.ok && tiny.reason, !tiny.ok && tiny.limit], [false, 'noFit', 'small']);
  if (!tiny.ok) assert.ok(tiny.minKwp! > tiny.targetKwp!);
  const smallThree = ask({ monthlyKwh: 300, phase: 'three_phase' });
  assert.equal(!smallThree.ok && smallThree.limit, 'small');

  const hugeSingle = ask({ monthlyKwh: 20000 });
  assert.equal(!hugeSingle.ok && hugeSingle.limit, 'large');
  const hugeThree = ask({ monthlyKwh: 20000, phase: 'three_phase', backupKw: 60, backupHours: 4 });
  assert.equal(hugeThree.ok, true);
  if (hugeThree.ok) {
    const p = projectFromSizing(hugeThree.sizing, 'Plant');
    assert.equal(summarize(p, catalog).allValid, true);
    assert.ok(hugeThree.sizing.inverter.pnomAc * hugeThree.sizing.inverterCount >= 60000);
  }

  // The energy need fits, the backup load does not: above six of the largest hybrids of the phase (36 kW single-phase,
  // 180 kW three-phase), or carried only by inverters that need more PV than this need.
  const loads: [Partial<Needs>, string, number | undefined][] = [
    [{ backupKw: 40, backupHours: 4 }, 'backupLoad', 36],
    [{ backupKw: 500, backupHours: 2 }, 'backupLoad', 36],
    [{ backupKw: 200, backupHours: 4, phase: 'three_phase' }, 'backupLoad', 180],
    [{ backupKw: 90, backupHours: 4, phase: 'three_phase' }, 'backupPv', undefined],
    [{ monthlyKwh: 200, backupKw: 5, backupHours: 4 }, 'backupPv', undefined],
    [{ monthlyKwh: 200, backupKw: 5 }, 'backupPv', undefined],
  ];
  for (const [n, limit, maxLoadKw] of loads) {
    const out = ask(n);
    assert.deepEqual(out.ok ? null : [out.reason, out.limit, out.maxLoadKw], ['noFit', limit, maxLoadKw], JSON.stringify(n));
  }
  // 5 kW single-phase hybrids exist, so 200 kWh with a 5 kW load is a PV limit, not a load the inverters cannot carry.
  assert.ok(inverters.some((i) => i.type === 'hybrid' && i.phase === 'single_phase' && i.pnomAc >= 5000));

  assert.deepEqual(ask({ monthlyKwh: NaN }), { ok: false, reason: 'input' });
  assert.deepEqual(ask({ monthlyKwh: -5 }), { ok: false, reason: 'input' });
  assert.deepEqual(ask({ cityId: 'atlantis' }), { ok: false, reason: 'input' });

  for (const monthlyKwh of [150, 400, 700, 1500, 2500, 4000]) {
    for (const phase of ['single_phase', 'three_phase'] as const) {
      const out = ask({ monthlyKwh, phase, backupKw: 3, backupHours: 5 });
      if (!out.ok) continue;
      const s = summarize(projectFromSizing(out.sizing, 'x'), catalog);
      assert.equal(s.allValid, true, `${monthlyKwh} kWh ${phase}`);
      assert.ok(s.blocks.every((b) => b.tone === 'green'));
    }
  }
});
