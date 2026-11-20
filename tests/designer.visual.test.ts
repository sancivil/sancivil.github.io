import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { evaluateCell, groupContext } from '../src/lib/designer/calc.ts';
import { createProject, setGroup, setInverterModel, updateSubArray } from '../src/lib/designer/project.ts';
import { GAUGE_MAX, GAUGE_MIN, along, gaugeAt, labelRows, seriesRenders, stringRun, voltageRuler } from '../src/lib/designer/visual.ts';
import type { Catalog, Inverter, Panel } from '../src/lib/designer/types.ts';

const json = (path: string) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const panels: Panel[] = json('../src/data/designer/panels.json');
const modules: { slug: string; designerModels: string[] }[] = json('../src/data/catalog.json').modules;
const ref = json('./fixtures/peimar-reference.json');

const refPanel: Panel = { ...ref.module, id: 'ref-or10h560m', series: 'OR10H', finish: null, bifacial: false, efficiency: null, width: null, height: null };
const refInverter: Inverter = {
  ...ref.inverter,
  id: 'ref-psi-x1p6000-hy',
  phase: 'single_phase',
  type: 'hybrid',
  image: null,
  mpptConfigs: [{ key: '1,2', name: 'two_indipendent', labels: ['mppt_1', 'mppt_2'] }],
};
const refCatalog: Catalog = { panels: [refPanel], inverters: [refInverter] };

function refContext() {
  let p = createProject();
  p = { ...p, temps: { ...ref.temps } };
  p = updateSubArray(p, 'a1', { panelId: refPanel.id, count: ref.panels });
  p = setInverterModel(p, refCatalog, 'i1', refInverter.id);
  p = setGroup(p, 'i1', 1, { series: 6, strings: 1 });
  return groupContext(p, refCatalog, p.inverters[0], 0)!;
}

test('stringRun: short strings draw every module, long ones keep a lead run, an ellipsis slot and the last module', () => {
  assert.deepEqual(stringRun(6, 10), { lead: 6, hidden: 0, trail: 0 });
  assert.deepEqual(stringRun(10, 10), { lead: 10, hidden: 0, trail: 0 });
  assert.deepEqual(stringRun(18, 10), { lead: 8, hidden: 9, trail: 1 });
  for (let s = 11; s <= 40; s++) {
    const r = stringRun(s, 10);
    assert.equal(r.lead + r.hidden + r.trail, s);
    assert.equal(r.lead + 1 + r.trail, 10);
  }
});

test('voltageRuler: the reference 1 × 6 string reads its marks from the engine checks', () => {
  const ctx = refContext();
  const r = voltageRuler(evaluateCell(ctx, 6, 1));
  assert.equal(r.max, 1500);
  assert.deepEqual([r.vstart, r.vmaxDc, r.vdcModule, r.window], [90, 600, 1500, [70, 550]]);
  assert.deepEqual(
    [...r.vmp, ...r.voc].map((m) => Math.round(m.value)),
    [ref.expected.vmpAtTmax, ref.expected.vmpAtTmin, ref.expected.vocAtTmax, ref.expected.vocAtTmin],
  );
  assert.ok([...r.vmp, ...r.voc, r.current].every((m) => m.pass));
  assert.equal(Number(r.current.value.toFixed(2)), ref.expected.impAtTmax);
  assert.equal(r.current.limit, 16);
});

test('voltageRuler: failing strings turn their marks red and stretch the scale past the limits', () => {
  const ctx = refContext();
  const short = voltageRuler(evaluateCell(ctx, 2, 1));
  assert.equal(short.voc[0].pass, false);
  assert.equal(short.vmp[0].pass, true);
  const long = voltageRuler(evaluateCell(ctx, 12, 1));
  assert.equal(long.voc[1].pass, false);
  assert.equal(long.max, 1500);
  const huge = voltageRuler(evaluateCell(ctx, 60, 1));
  assert.ok(huge.max > huge.voc[1].value);
  assert.equal(along(huge.voc[1].value, huge.max) < 1, true);
  const twoStrings = voltageRuler(evaluateCell(ctx, 6, 2));
  assert.equal(twoStrings.current.pass, false);
});

test('along and gaugeAt clamp to the scale', () => {
  assert.equal(along(300, 600), 0.5);
  assert.equal(along(-5, 600), 0);
  assert.equal(along(900, 600), 1);
  assert.equal(along(5, 0), 0);
  assert.equal(gaugeAt(GAUGE_MIN), 0);
  assert.equal(gaugeAt(GAUGE_MAX), 1);
  assert.ok(Math.abs(gaugeAt(1) - 0.5) < 1e-9);
  assert.equal(gaugeAt(Infinity), 0);
  assert.equal(gaugeAt(3), 1);
});

test('labelRows: labels closer than the gap move to the next free row', () => {
  assert.deepEqual(labelRows([0.05, 0.06, 0.37, 0.4, 1], 0.1), [0, 1, 0, 1, 0]);
  assert.deepEqual(labelRows([0.9, 0.1, 0.5], 0.1), [0, 0, 0]);
  assert.deepEqual(labelRows([0.5, 0.5, 0.5], 0.1), [0, 1, 2]);
  assert.deepEqual(labelRows([], 0.1), []);
});

test('seriesRenders: catalog models, then series codes; custom panels and series without a render get none', () => {
  const render = seriesRenders(modules, panels);
  const byId = (id: string) => panels.find((p) => p.id === id)!;
  assert.equal(render(byId('or10h560m')), '/images/products/modules/or-series-or10h.webp');
  assert.equal(render(byId('or10h460m')), '/images/products/modules/or-series-or10h.webp');
  assert.equal(render(byId('or12h700mndb')), '/images/products/modules/or-series-or12h.webp');
  assert.equal(render(byId('or6h450m')), null);
  assert.equal(render({ ...byId('or10h560m'), id: 'c1', custom: true }), null);
  for (const p of panels) {
    const src = render(p);
    if (src) assert.ok(modules.some((m) => src === `/images/products/modules/${m.slug}.webp`));
  }
});
