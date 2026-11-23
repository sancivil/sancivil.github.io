import { findInverter, findPanel, mpptGroups, summarize, tempsValid } from './calc.ts';
import type { Catalog, Finance, GroupSel, InverterBlock, Panel, Project, SubArray, Temps } from './types.ts';

export const PEIMAR_DEFAULT_TEMPS: Temps = { tmin: -10, tnom: 45, tmax: 70 };
export const MAX_COUNT = 9999;
export const emptyFinance = (): Finance => ({ currency: 'IQD', cost: NaN, pricePerKwh: NaN, useKwh: NaN });

export function createProject(): Project {
  return {
    name: '',
    number: '',
    client: '',
    address: '',
    notes: '',
    cityId: '',
    temps: { ...PEIMAR_DEFAULT_TEMPS },
    subArrays: [{ id: 'a1', name: '', panelId: '', count: NaN }],
    customPanels: [],
    inverters: [{ id: 'i1', inverterId: '', count: 1, configKey: '', groups: [] }],
    finance: emptyFinance(),
  };
}

function nextId(prefix: string, ids: string[]): string {
  const max = ids.reduce((m, id) => Math.max(m, Number(id.slice(prefix.length)) || 0), 0);
  return `${prefix}${max + 1}`;
}

const emptyGroup = (subArrayId: string): GroupSel => ({ subArrayId, series: 0, strings: 0 });

export function addSubArray(p: Project): Project {
  const id = nextId('a', p.subArrays.map((s) => s.id));
  return { ...p, subArrays: [...p.subArrays, { id, name: '', panelId: '', count: NaN }] };
}

export function removeSubArray(p: Project, id: string): Project {
  if (p.subArrays.length <= 1) return p;
  const subArrays = p.subArrays.filter((s) => s.id !== id);
  const fallback = subArrays.length === 1 ? subArrays[0].id : '';
  return {
    ...p,
    subArrays,
    inverters: p.inverters.map((b) => ({
      ...b,
      groups: b.groups.map((g) => (g.subArrayId === id ? emptyGroup(fallback) : g)),
    })),
  };
}

export function updateSubArray(p: Project, id: string, patch: Partial<SubArray>): Project {
  return { ...p, subArrays: p.subArrays.map((s) => (s.id === id ? { ...s, ...patch } : s)) };
}

export function addCustomPanel(p: Project, panel: Omit<Panel, 'id'>, subArrayId: string): Project {
  const id = nextId('custom-', p.customPanels.map((c) => c.id));
  const withPanel = { ...p, customPanels: [...p.customPanels, { ...panel, id, custom: true }] };
  return updateSubArray(withPanel, subArrayId, { panelId: id });
}

export function addInverter(p: Project): Project {
  const id = nextId('i', p.inverters.map((b) => b.id));
  return { ...p, inverters: [...p.inverters, { id, inverterId: '', count: 1, configKey: '', groups: [] }] };
}

export function removeInverter(p: Project, id: string): Project {
  if (p.inverters.length <= 1) return p;
  return { ...p, inverters: p.inverters.filter((b) => b.id !== id) };
}

function patchBlock(p: Project, id: string, fn: (b: InverterBlock) => InverterBlock): Project {
  return { ...p, inverters: p.inverters.map((b) => (b.id === id ? fn(b) : b)) };
}

function defaultSubArray(p: Project): string {
  return p.subArrays.length === 1 ? p.subArrays[0].id : '';
}

export function setInverterModel(p: Project, catalog: Catalog, id: string, inverterId: string): Project {
  const inv = findInverter(catalog, inverterId);
  const configKey = inv?.mpptConfigs[0]?.key ?? '';
  const groups = inv ? mpptGroups(inv, configKey).map(() => emptyGroup(defaultSubArray(p))) : [];
  return patchBlock(p, id, (b) => ({ ...b, inverterId, configKey, groups }));
}

export function setInverterConfig(p: Project, catalog: Catalog, id: string, configKey: string): Project {
  return patchBlock(p, id, (b) => {
    const inv = findInverter(catalog, b.inverterId);
    const groups = inv ? mpptGroups(inv, configKey).map(() => emptyGroup(defaultSubArray(p))) : [];
    return { ...b, configKey, groups };
  });
}

export function setInverterCount(p: Project, id: string, count: number): Project {
  return patchBlock(p, id, (b) => ({ ...b, count }));
}

/** Patch one MPPT group; a groups list shorter than the index (old or damaged link) is padded instead of ignored. */
export function setGroup(p: Project, id: string, index: number, patch: Partial<GroupSel>): Project {
  if (!Number.isInteger(index) || index < 0 || index >= MAX_GROUPS) return p;
  return patchBlock(p, id, (b) => {
    const groups = [...b.groups];
    while (groups.length <= index) groups.push(emptyGroup(defaultSubArray(p)));
    groups[index] = { ...groups[index], ...patch };
    return { ...b, groups };
  });
}

const MAX_GROUPS = 64;
const selection = (n: number) => (Number.isInteger(n) && n >= 0 && n <= MAX_COUNT ? n : 0);

/**
 * Make a decoded or restored project consistent with the catalogue: unknown inverters are cleared, a configuration
 * the inverter does not offer falls back to its first one, the groups list matches the configuration, selections
 * point at existing sub-arrays and use whole numbers. A consistent project is returned unchanged (same values).
 */
export function normalizeProject(p: Project, catalog: Catalog): Project {
  const ids = new Set(p.subArrays.map((s) => s.id));
  const inverters = p.inverters.map((b): InverterBlock => {
    const inv = findInverter(catalog, b.inverterId);
    if (!inv) return { ...b, inverterId: '', configKey: '', groups: [] };
    const known = inv.mpptConfigs.some((c) => c.key === b.configKey);
    const configKey = known ? b.configKey : (inv.mpptConfigs[0]?.key ?? '');
    const groups = mpptGroups(inv, configKey).map((_, i): GroupSel => {
      const g = known ? b.groups[i] : undefined;
      if (!g) return emptyGroup(defaultSubArray(p));
      const subArrayId = ids.has(g.subArrayId) ? g.subArrayId : '';
      const series = selection(g.series);
      const strings = selection(g.strings);
      return subArrayId && series > 0 && strings > 0 ? { subArrayId, series, strings } : { subArrayId, series: 0, strings: 0 };
    });
    return { ...b, configKey, groups };
  });
  return { ...p, inverters };
}

export function setTemps(p: Project, temps: Partial<Temps>): Project {
  return { ...p, temps: { ...p.temps, ...temps } };
}

const validCount = (n: number) => Number.isInteger(n) && n >= 1 && n <= MAX_COUNT;

export type StepErrors = Record<string, string>;

/** Error codes per field; an empty object means the step is complete. */
export function projectErrors(p: Project): StepErrors {
  const e: StepErrors = {};
  if (!p.name.trim()) e.name = 'required';
  const range = (v: number) => Number.isFinite(v) && v >= -60 && v <= 110;
  if (!range(p.temps.tmin)) e.tmin = 'number';
  if (!range(p.temps.tnom)) e.tnom = 'number';
  if (!range(p.temps.tmax)) e.tmax = 'number';
  if (!e.tmin && !e.tnom && !e.tmax && !tempsValid(p.temps)) e.order = 'order';
  return e;
}

export function panelsErrors(p: Project, catalog: Catalog): StepErrors {
  const e: StepErrors = {};
  for (const s of p.subArrays) {
    if (!findPanel(p, catalog, s.panelId)) e[`${s.id}.model`] = 'required';
    if (!validCount(s.count)) e[`${s.id}.count`] = 'count';
  }
  return e;
}

export function inverterErrors(p: Project, catalog: Catalog): StepErrors {
  const e: StepErrors = {};
  const summary = summarize(p, catalog);
  for (const b of summary.blocks) {
    const id = b.block.id;
    if (!b.inv) e[`${id}.model`] = 'required';
    if (!validCount(b.block.count)) e[`${id}.count`] = 'count';
    if (b.inv && !b.valid) e[`${id}.strings`] = b.groups.some((g) => g.cell?.state === 'invalid') ? 'invalid' : 'strings';
  }
  for (const s of summary.subArrays) {
    if (s.used > s.subArray.count) e[`${s.subArray.id}.over`] = 'over';
  }
  return e;
}

export type StepNo = 1 | 2 | 3 | 4;

export function stepErrors(p: Project, catalog: Catalog, step: StepNo): StepErrors {
  if (step === 1) return projectErrors(p);
  if (step === 2) return panelsErrors(p, catalog);
  if (step === 3) return inverterErrors(p, catalog);
  return {};
}

/** Highest step the user may open: every earlier step must be complete. */
export function reachableStep(p: Project, catalog: Catalog): StepNo {
  for (const s of [1, 2, 3] as const) {
    if (Object.keys(stepErrors(p, catalog, s)).length) return s;
  }
  return 4;
}

/** Apply ?module= and ?inverter= deep links to the first sub-array and inverter block. */
export function applyDeepLinks(p: Project, catalog: Catalog, moduleId: string | null, inverterId: string | null): Project {
  let next = p;
  if (moduleId && catalog.panels.some((m) => m.id === moduleId)) {
    next = updateSubArray(next, next.subArrays[0].id, { panelId: moduleId });
  }
  if (inverterId && findInverter(catalog, inverterId)) {
    next = setInverterModel(next, catalog, next.inverters[0].id, inverterId);
  }
  return next;
}
