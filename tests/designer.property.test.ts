/**
 * Property test: an independent re-implementation of the Peimar Designer rules (it does not import any
 * engine check function) is compared with the engine over many seeded pseudo-random projects.
 *
 * Rules (Peimar installer tool, verified to the volt on the reference case):
 *   X(T) = X_stc × (1 + coef/100 × (T − 25)); Voc and Vmp follow ctVoc, Imp follows ctIsc.
 *   Per MPPT group, s in series and p strings:
 *     Voc@Tmax·s > vstart, Voc@Tmin·s < vmaxDc, Voc@Tmin·s < module vdcMax,
 *     Vmp@Tmax·s > vminMppt, Vmp@Tmin·s < vmaxMppt, Imp@Tmax·p ≤ group Imax (parallel MPPTs sum),
 *     n·s·p ≤ panels still free (the group's own selection counts as free).
 *   Amber: R = pnomDc ÷ (cell W + W already on the inverter's other groups); amber if R > percPminCc or R < percPmaxCc.
 *   n identical inverters repeat the stringing n times.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { MATRIX_COLS, MATRIX_ROWS, evaluateCell, groupContext, lastValidSeries, matrixStart, summarize } from '../src/lib/designer/calc.ts';
import type { Catalog, Inverter, InverterBlock, Panel, Project, SubArray, Temps } from '../src/lib/designer/types.ts';

const json = (path: string) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const panels: Panel[] = json('../src/data/designer/panels.json');
const inverters: Inverter[] = json('../src/data/designer/inverters.json');
const mpptConfigs: { key: string; name: string; labels: string[] }[] = json('../src/data/designer/mppt-configs.json');
const ref = json('./fixtures/peimar-reference.json');
const catalog: Catalog = { panels, inverters };

/* ------------------------------------------------------------------ reference model */

const ORDER = ['vstart', 'vmaxDc', 'vdcModule', 'vminMppt', 'vmaxMppt', 'imax', 'panels'];
const at = (stc: number, coef: number, t: number) => stc * (1 + (coef / 100) * (t - 25));

/** Imax of each MPPT group of a configuration key; parallel MPPTs add their currents. */
function refGroupImax(inv: Inverter, key: string): number[] {
  if (!key) return [];
  const parts = key === 'ALL' ? [inv.imaxPerMppt.map((_, i) => i + 1)] : key.split(',').map((p) => p.split('-').map(Number));
  return parts.map((ms) => ms.reduce((sum, m) => sum + inv.imaxPerMppt[m - 1], 0));
}

function refVoltageFails(panel: Panel, inv: Inverter, t: Temps, s: number): string[] {
  const f: string[] = [];
  const vocHot = at(panel.voc, panel.ctVoc, t.tmax) * s;
  const vocCold = at(panel.voc, panel.ctVoc, t.tmin) * s;
  const vmpHot = at(panel.vmp, panel.ctVoc, t.tmax) * s;
  const vmpCold = at(panel.vmp, panel.ctVoc, t.tmin) * s;
  if (!(vocHot > inv.vstart)) f.push('vstart');
  if (!(vocCold < inv.vmaxDc)) f.push('vmaxDc');
  if (!(vocCold < panel.vdcMax)) f.push('vdcModule');
  if (!(vmpHot > inv.vminMppt)) f.push('vminMppt');
  if (!(vmpCold < inv.vmaxMppt)) f.push('vmaxMppt');
  return f;
}

function refFails(panel: Panel, inv: Inverter, imax: number, t: Temps, s: number, p: number, need: number, free: number): string[] {
  const f = refVoltageFails(panel, inv, t, s);
  if (!(at(panel.imp, panel.ctIsc, t.tmax) * p <= imax)) f.push('imax');
  if (!(need <= free)) f.push('panels');
  return f;
}

const refTone = (inv: Inverter, r: number) => (r > inv.percPminCc || r < inv.percPmaxCc ? 'amber' : 'green');
const refCount = (b: InverterBlock) => (Number.isInteger(b.count) && b.count >= 1 ? b.count : 1);
const refTempsOk = (t: Temps) =>
  [t.tmin, t.tnom, t.tmax].every((v) => Number.isFinite(v) && v >= -60 && v <= 110) && t.tmin < t.tnom && t.tnom < t.tmax;

type RefCtx = { inv: Inverter; panel: Panel; sa: SubArray; imax: number; n: number; free: number; otherW: number };

function refModel(project: Project, cat: Catalog) {
  const panelOf = (id: string) => (id ? (project.customPanels.find((c) => c.id === id) ?? cat.panels.find((c) => c.id === id) ?? null) : null);
  const invOf = (id: string) => (id ? (cat.inverters.find((i) => i.id === id) ?? null) : null);
  const saOf = (id: string) => project.subArrays.find((s) => s.id === id) ?? null;
  const complete = (g: { subArrayId: string; series: number; strings: number } | undefined) =>
    !!g && g.series > 0 && g.strings > 0 && !!g.subArrayId;

  const used = new Map<string, number>();
  for (const b of project.inverters) {
    const inv = invOf(b.inverterId);
    if (!inv) continue;
    refGroupImax(inv, b.configKey).forEach((_, i) => {
      const g = b.groups[i];
      if (complete(g)) used.set(g.subArrayId, (used.get(g.subArrayId) ?? 0) + refCount(b) * g.series * g.strings);
    });
  }

  const ctx = (b: InverterBlock, i: number): RefCtx | null => {
    const inv = invOf(b.inverterId);
    const g = b.groups[i];
    if (!inv || !g || !refTempsOk(project.temps)) return null;
    const imaxes = refGroupImax(inv, b.configKey);
    if (i >= imaxes.length) return null;
    const sa = saOf(g.subArrayId);
    const panel = sa ? panelOf(sa.panelId) : null;
    if (!sa || !panel || !(sa.count > 0)) return null;
    const n = refCount(b);
    const own = complete(g) ? n * g.series * g.strings : 0;
    const free = sa.count - ((used.get(sa.id) ?? 0) - own);
    let otherW = 0;
    imaxes.forEach((_, j) => {
      const o = b.groups[j];
      if (j === i || !complete(o)) return;
      const osa = saOf(o.subArrayId);
      const op = osa ? panelOf(osa.panelId) : null;
      if (op) otherW += o.series * o.strings * op.power;
    });
    return { inv, panel, sa, imax: imaxes[i], n, free, otherW };
  };

  const cell = (c: RefCtx, s: number, p: number) => {
    const power = s * p * c.panel.power;
    const failed = refFails(c.panel, c.inv, c.imax, project.temps, s, p, c.n * s * p, c.free);
    const ratio = c.inv.pnomDc / (power + c.otherW);
    return { power, failed, ratio, state: failed.length ? 'invalid' : refTone(c.inv, ratio) };
  };

  const firstValid = (c: RefCtx) => {
    for (let s = 1; s <= 200; s++) if (!refVoltageFails(c.panel, c.inv, project.temps, s).length) return s;
    return null;
  };
  const lastValid = (c: RefCtx) => {
    let last: number | null = null;
    for (let s = 1; s <= 200; s++) if (!refVoltageFails(c.panel, c.inv, project.temps, s).length) last = s;
    return last;
  };

  const summary = () => {
    let connectedW = 0;
    let dcNomW = 0;
    let acW = 0;
    let invertersTotal = 0;
    let allValid = project.inverters.length > 0;
    const blocks = project.inverters.map((b) => {
      const inv = invOf(b.inverterId);
      if (!inv) {
        allValid = false;
        return { pvW: 0, tone: null as string | null };
      }
      let pvW = 0;
      let any = false;
      refGroupImax(inv, b.configKey).forEach((_, i) => {
        const g = b.groups[i];
        if (!complete(g)) return;
        any = true;
        const c = ctx(b, i);
        if (!c) {
          allValid = false;
          return;
        }
        const x = cell(c, g.series, g.strings);
        pvW += x.power;
        if (x.state === 'invalid') allValid = false;
      });
      if (!any) allValid = false;
      const n = refCount(b);
      connectedW += n * pvW;
      if (pvW > 0) dcNomW += n * inv.pnomDc;
      acW += n * inv.pnomAc;
      invertersTotal += n;
      return { pvW, tone: pvW > 0 ? refTone(inv, inv.pnomDc / pvW) : null };
    });
    const subArrays = project.subArrays.map((sa) => {
      const panel = panelOf(sa.panelId);
      const u = used.get(sa.id) ?? 0;
      if (u > sa.count) allValid = false;
      return { used: u, installedW: panel && sa.count > 0 ? sa.count * panel.power : 0 };
    });
    return { blocks, subArrays, connectedW, dcNomW, acW, invertersTotal, ratio: connectedW > 0 ? dcNomW / connectedW : Infinity, allValid };
  };

  return { ctx, cell, firstValid, lastValid, summary };
}

/* ------------------------------------------------------------------ comparison */

type Stats = { projects: number; groups: number; cells: number; mismatches: string[] };
const newStats = (): Stats => ({ projects: 0, groups: 0, cells: 0, mismatches: [] });

const close = (a: number, b: number) => a === b || (Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b)));

function compareProject(project: Project, cat: Catalog, stats: Stats, label: string, extraCells: [number, number][] = []) {
  stats.projects++;
  const r = refModel(project, cat);
  const miss = (msg: string) => {
    if (stats.mismatches.length < 40) stats.mismatches.push(`${label}: ${msg}`);
    else stats.mismatches.length++;
  };

  project.inverters.forEach((b, bi) => {
    const inv = cat.inverters.find((i) => i.id === b.inverterId);
    const n = inv ? refGroupImax(inv, b.configKey).length : 0;
    for (let i = 0; i < Math.max(n, b.groups.length); i++) {
      stats.groups++;
      const e = groupContext(project, cat, b, i);
      const x = r.ctx(b, i);
      if (!e !== !x) {
        miss(`block ${bi} group ${i}: context engine=${!!e} reference=${!!x}`);
        continue;
      }
      if (!e || !x) continue;
      if (!close(e.free, x.free)) miss(`block ${bi} group ${i}: free engine=${e.free} reference=${x.free}`);
      if (!close(e.otherW, x.otherW)) miss(`block ${bi} group ${i}: otherW engine=${e.otherW} reference=${x.otherW}`);
      if (!close(e.group.imax, x.imax)) miss(`block ${bi} group ${i}: imax engine=${e.group.imax} reference=${x.imax}`);
      const first = r.firstValid(x) ?? 1;
      if (matrixStart(e) !== first) miss(`block ${bi} group ${i}: matrixStart engine=${matrixStart(e)} reference=${first}`);
      const last = r.lastValid(x);
      if (lastValidSeries(e.mod, e.panel, e.inv) !== last) miss(`block ${bi} group ${i}: lastValid engine=${lastValidSeries(e.mod, e.panel, e.inv)} reference=${last}`);
      const sel = b.groups[i];
      const cells: [number, number][] = [...extraCells];
      for (let row = 1; row <= MATRIX_ROWS; row++) for (let col = 0; col < MATRIX_COLS; col++) cells.push([first + col, row]);
      if (sel.series > 0 && sel.strings > 0) cells.push([sel.series, sel.strings]);
      for (const [s, p] of cells) {
        stats.cells++;
        const ec = evaluateCell(e, s, p);
        const xc = r.cell(x, s, p);
        const ef = ec.failed.map((c) => c.id).sort((a, z) => ORDER.indexOf(a) - ORDER.indexOf(z));
        if (ec.state !== xc.state || ef.join() !== xc.failed.join() || !close(ec.power, xc.power) || !close(ec.ratio, xc.ratio)) {
          miss(
            `block ${bi} (${b.inverterId} ×${b.count} ${b.configKey}) group ${i} cell ${p}×${s}: engine ${ec.state} [${ef}] ${ec.power} W r=${ec.ratio} | reference ${xc.state} [${xc.failed}] ${xc.power} W r=${xc.ratio}`,
          );
        }
      }
    }
  });

  const es = summarize(project, cat);
  const xs = r.summary();
  if (!close(es.connectedW, xs.connectedW)) miss(`summary connectedW engine=${es.connectedW} reference=${xs.connectedW}`);
  if (!close(es.dcNomW, xs.dcNomW)) miss(`summary dcNomW engine=${es.dcNomW} reference=${xs.dcNomW}`);
  if (!close(es.ratio, xs.ratio)) miss(`summary ratio engine=${es.ratio} reference=${xs.ratio}`);
  if (!close(es.acW, xs.acW)) miss(`summary acW engine=${es.acW} reference=${xs.acW}`);
  if (es.invertersTotal !== xs.invertersTotal) miss(`summary invertersTotal engine=${es.invertersTotal} reference=${xs.invertersTotal}`);
  if (es.allValid !== xs.allValid) miss(`summary allValid engine=${es.allValid} reference=${xs.allValid}`);
  es.subArrays.forEach((s, k) => {
    if (s.used !== xs.subArrays[k].used) miss(`sub-array ${k} used engine=${s.used} reference=${xs.subArrays[k].used}`);
    if (!close(s.installedW, xs.subArrays[k].installedW)) miss(`sub-array ${k} installedW engine=${s.installedW} reference=${xs.subArrays[k].installedW}`);
  });
  es.blocks.forEach((b, k) => {
    if (!close(b.pvW, xs.blocks[k].pvW)) miss(`block ${k} pvW engine=${b.pvW} reference=${xs.blocks[k].pvW}`);
    if (b.tone !== xs.blocks[k].tone) miss(`block ${k} tone engine=${b.tone} reference=${xs.blocks[k].tone}`);
  });
}

function report(stats: Stats, what: string) {
  console.log(`[property] ${what}: ${stats.projects} projects, ${stats.groups} MPPT groups, ${stats.cells} cells compared, ${stats.mismatches.length} discrepancies`);
  assert.deepEqual(stats.mismatches, [], `${what}: engine and reference disagree`);
}

/* ------------------------------------------------------------------ seeded generators */

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Rand = () => number;
const int = (rnd: Rand, lo: number, hi: number) => lo + Math.floor(rnd() * (hi - lo + 1));
const pick = <T>(rnd: Rand, list: T[]): T => list[Math.floor(rnd() * list.length)];
const round = (v: number, d: number) => Number(v.toFixed(d));

function randomCustomPanel(rnd: Rand, id: string): Panel {
  const voc = round(20 + rnd() * 40, 2);
  const imp = round(5 + rnd() * 15, 2);
  return {
    id,
    model: `Custom ${id}`,
    series: 'custom',
    finish: null,
    bifacial: false,
    power: int(rnd, 100, 700),
    vmp: round(voc * (0.78 + rnd() * 0.08), 2),
    imp,
    voc,
    isc: round(imp * 1.06, 2),
    vdcMax: pick(rnd, [600, 1000, 1500]),
    efficiency: null,
    ctPmax: rnd() < 0.5 ? null : round(-0.25 - rnd() * 0.2, 3),
    ctVoc: round(-0.2 - rnd() * 0.2, 3),
    ctIsc: round(0.02 + rnd() * 0.05, 3),
    width: null,
    height: null,
    custom: true,
  };
}

function randomTemps(rnd: Rand): Temps {
  const t = (lo: number, hi: number) => (rnd() < 0.7 ? int(rnd, lo, hi) : round(lo + rnd() * (hi - lo), 1));
  return { tmin: t(-25, 10), tnom: t(20, 60), tmax: t(40, 90) };
}

/** A random project; selections favour usable series counts so the panels check is exercised. */
function randomProject(rnd: Rand, opts: { inverterPool?: Inverter[]; panelPool?: Panel[]; customRate?: number } = {}): Project {
  const invPool = opts.inverterPool ?? inverters;
  const panelPool = opts.panelPool ?? panels;
  const temps = randomTemps(rnd);
  const customPanels: Panel[] = [];
  const subArrays: SubArray[] = Array.from({ length: int(rnd, 1, 3) }, (_, k) => {
    let panelId: string;
    if (rnd() < (opts.customRate ?? 0.08)) {
      const c = randomCustomPanel(rnd, `custom-${customPanels.length + 1}`);
      customPanels.push(c);
      panelId = c.id;
    } else panelId = pick(rnd, panelPool).id;
    return { id: `a${k + 1}`, name: '', panelId, count: int(rnd, 1, 400) };
  });
  const panelOf = (id: string) => customPanels.find((c) => c.id === id) ?? panels.find((p) => p.id === id)!;
  const blocks: InverterBlock[] = Array.from({ length: int(rnd, 1, 3) }, (_, k) => {
    const inv = pick(rnd, invPool);
    const configKey = pick(rnd, inv.mpptConfigs).key;
    const groups = refGroupImax(inv, configKey).map(() => {
      const sa = pick(rnd, subArrays);
      if (rnd() < 0.15) return { subArrayId: rnd() < 0.5 ? sa.id : '', series: 0, strings: 0 };
      const panel = panelOf(sa.panelId);
      const valid: number[] = [];
      for (let s = 1; s <= 60; s++) if (!refVoltageFails(panel, inv, temps, s).length) valid.push(s);
      const series = valid.length && rnd() < 0.75 ? pick(rnd, valid) : int(rnd, 1, 40);
      const strings = rnd() < 0.6 ? 1 : int(rnd, 1, 6);
      return { subArrayId: sa.id, series, strings };
    });
    return { id: `i${k + 1}`, inverterId: inv.id, count: int(rnd, 1, 4), configKey, groups };
  });
  return {
    name: 'Property',
    number: '',
    client: '',
    address: '',
    notes: '',
    cityId: '',
    temps,
    subArrays,
    customPanels,
    inverters: blocks,
    finance: { currency: 'IQD', cost: NaN, pricePerKwh: NaN, useKwh: NaN },
  };
}

/* ------------------------------------------------------------------ tests */

const RANDOM_CASES = 4000;

test(`property: engine matches the reference model on ${RANDOM_CASES} random projects (all panels, inverters, MPPT configs)`, () => {
  const rnd = mulberry32(20261120);
  const stats = newStats();
  const seenInv = new Set<string>();
  const seenCfg = new Set<string>();
  for (let k = 0; k < RANDOM_CASES; k++) {
    const p = randomProject(rnd);
    p.inverters.forEach((b) => {
      seenInv.add(b.inverterId);
      seenCfg.add(`${b.inverterId}|${b.configKey}`);
    });
    const extra: [number, number][] = [
      [int(rnd, 1, 60), int(rnd, 1, 8)],
      [int(rnd, 1, 60), int(rnd, 1, 8)],
    ];
    compareProject(p, catalog, stats, `random #${k}`, extra);
  }
  const allCfg = inverters.reduce((n, i) => n + i.mpptConfigs.length, 0);
  console.log(`[property] coverage: ${seenInv.size}/${inverters.length} inverters, ${seenCfg.size}/${allCfg} inverter configurations`);
  report(stats, 'random projects');
});

test('property: every Peimar panel on the microinverters (60 V, 2 MPPTs)', () => {
  const micros = inverters.filter((i) => i.type === 'micro');
  assert.deepEqual(micros.map((i) => i.model).sort(), ['PSI-X1P1000-MIC', 'PSI-X1P800-MIC']);
  for (const m of micros) assert.equal(m.vmaxDc, 60);
  const rnd = mulberry32(800);
  const stats = newStats();
  for (const inv of micros) {
    for (const panel of panels) {
      for (const temps of [ref.temps as Temps, { tmin: -25, tnom: 45, tmax: 90 }, { tmin: 10, tnom: 30, tmax: 40 }, randomTemps(rnd)]) {
        const p: Project = {
          ...randomProject(rnd),
          temps,
          customPanels: [],
          subArrays: [{ id: 'a1', name: '', panelId: panel.id, count: int(rnd, 1, 8) }],
          inverters: [
            {
              id: 'i1',
              inverterId: inv.id,
              count: int(rnd, 1, 4),
              configKey: '1,2',
              groups: [
                { subArrayId: 'a1', series: 1, strings: 1 },
                { subArrayId: 'a1', series: int(rnd, 0, 2), strings: int(rnd, 0, 2) },
              ],
            },
          ],
        };
        const cells: [number, number][] = [];
        for (let s = 1; s <= 3; s++) for (let q = 1; q <= 3; q++) cells.push([s, q]);
        compareProject(p, catalog, stats, `${inv.model} + ${panel.id} @ ${temps.tmin}/${temps.tmax}`, cells);
      }
    }
  }
  report(stats, 'microinverters × all panels');
});

test('property: largest three-phase units with 9 and 12 MPPTs, every configuration', () => {
  const big = ['psi-x3p100000-tpm', 'psi-x3p125000-tpm'].map((id) => inverters.find((i) => i.id === id)!);
  assert.deepEqual(big.map((i) => i.numMppt), [9, 12]);
  const rnd = mulberry32(125000);
  const stats = newStats();
  for (let k = 0; k < 600; k++) {
    const p = randomProject(rnd, { inverterPool: big });
    compareProject(p, catalog, stats, `big #${k}`, [[int(rnd, 10, 40), int(rnd, 1, 8)]]);
  }
  report(stats, '9- and 12-MPPT inverters');
});

test('property: every parallel MPPT configuration in mppt-configs.json', () => {
  const parallelKeys = mpptConfigs.filter((c) => c.key === 'ALL' || c.key.includes('-')).map((c) => c.key);
  assert.ok(parallelKeys.length >= 4);
  const rnd = mulberry32(4242);
  const stats = newStats();
  let combos = 0;
  for (const inv of inverters) {
    for (const cfg of inv.mpptConfigs.filter((c) => parallelKeys.includes(c.key))) {
      combos++;
      for (let k = 0; k < 25; k++) {
        const p = randomProject(rnd, { inverterPool: [inv] });
        p.inverters = p.inverters.map((b) => ({
          ...b,
          configKey: cfg.key,
          groups: refGroupImax(inv, cfg.key).map((_, i) => b.groups[i] ?? { subArrayId: p.subArrays[0].id, series: int(rnd, 1, 20), strings: int(rnd, 1, 6) }),
        }));
        compareProject(p, catalog, stats, `${inv.model} ${cfg.key} #${k}`, [[int(rnd, 1, 30), int(rnd, 1, 8)]]);
      }
    }
  }
  console.log(`[property] parallel configurations exercised: ${combos} inverter/config pairs`);
  report(stats, 'parallel MPPT configurations');
});

test('property: custom panels only', () => {
  const rnd = mulberry32(31337);
  const stats = newStats();
  for (let k = 0; k < 800; k++) compareProject(randomProject(rnd, { customRate: 1 }), catalog, stats, `custom #${k}`, [[int(rnd, 1, 50), int(rnd, 1, 6)]]);
  report(stats, 'custom panels');
});

test('property: the reference fixture agrees with the reference model and with the Peimar numbers', () => {
  const panel: Panel = { ...ref.module, id: 'ref-or10h560m', series: 'OR10H', finish: null, bifacial: false, efficiency: null, width: null, height: null };
  const inv: Inverter = {
    ...ref.inverter,
    id: 'ref-psi-x1p6000-hy',
    phase: 'single_phase',
    type: 'hybrid',
    image: null,
    mpptConfigs: [{ key: '1,2', name: 'two_indipendent', labels: ['mppt_1', 'mppt_2'] }],
  };
  const t: Temps = ref.temps;
  assert.equal(Math.round(at(panel.voc, panel.ctVoc, t.tmax) * 6), ref.expected.vocAtTmax);
  assert.equal(Math.round(at(panel.voc, panel.ctVoc, t.tmin) * 6), ref.expected.vocAtTmin);
  assert.equal(Math.round(at(panel.vmp, panel.ctVoc, t.tmax) * 6), ref.expected.vmpAtTmax);
  assert.equal(Math.round(at(panel.vmp, panel.ctVoc, t.tmin) * 6), ref.expected.vmpAtTmin);
  assert.equal(Number(at(panel.imp, panel.ctIsc, t.tmax).toFixed(2)), ref.expected.impAtTmax);
  const cat: Catalog = { panels: [panel], inverters: [inv] };
  const stats = newStats();
  const base: Project = {
    name: 'Reference',
    number: '',
    client: '',
    address: '',
    notes: '',
    cityId: '',
    temps: t,
    subArrays: [{ id: 'a1', name: '', panelId: panel.id, count: ref.panels }],
    customPanels: [],
    inverters: [{ id: 'i1', inverterId: inv.id, count: 1, configKey: '1,2', groups: [{ subArrayId: 'a1', series: 6, strings: 1 }, { subArrayId: 'a1', series: 6, strings: 1 }] }],
    finance: { currency: 'IQD', cost: NaN, pricePerKwh: NaN, useKwh: NaN },
  };
  const all: [number, number][] = [];
  for (let s = 1; s <= 14; s++) for (let q = 1; q <= 5; q++) all.push([s, q]);
  compareProject(base, cat, stats, 'reference', all);
  const r = refModel(base, cat).summary();
  assert.equal(Number((r.ratio * 100).toFixed(2)), ref.expected.nominalPowerRatioPct);
  assert.equal(r.connectedW / 1000, ref.expected.pvPeakKwp);
  const withOther = { ...base, inverters: [{ ...base.inverters[0], groups: [{ subArrayId: 'a1', series: 0, strings: 0 }, base.inverters[0].groups[1]] }] };
  const m = refModel(withOther, cat);
  const c = m.ctx(withOther.inverters[0], 0)!;
  const tones = Object.fromEntries([3, 4, 5, 6, 7].map((s) => [s, refTone(inv, inv.pnomDc / (s * 560 + c.otherW))]));
  assert.deepEqual(tones, ref.expected.matrixWithOtherMpptAt1x6);
  compareProject(withOther, cat, stats, 'reference, MPPT 2 at 1×6', all);
  report(stats, 'reference fixture');
});

test('property: random projects with counts typed half-way (empty, 0, negative, fractional) still agree', () => {
  const rnd = mulberry32(99);
  const stats = newStats();
  const odd = [NaN, 0, -2, 2.5, Infinity];
  for (let k = 0; k < 600; k++) {
    const p = randomProject(rnd);
    p.inverters = p.inverters.map((b) => (rnd() < 0.5 ? { ...b, count: pick(rnd, odd) } : b));
    compareProject(p, catalog, stats, `odd count #${k}`, [[int(rnd, 1, 40), int(rnd, 1, 6)]]);
  }
  report(stats, 'invalid inverter counts');
});
