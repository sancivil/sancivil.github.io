import type { Catalog, GroupSel, Inverter, InverterBlock, Panel, Project, SubArray, Temps } from './types.ts';

/** Peimar Designer rule: X(T) = X_stc × (1 + coef/100 × (T − 25)). */
export function atTemp(stc: number, coefPct: number, t: number): number {
  return stc * (1 + (coefPct / 100) * (t - 25));
}

export type ModuleAt = {
  vocTmin: number;
  vocTnom: number;
  vocTmax: number;
  vmpTmin: number;
  vmpTnom: number;
  vmpTmax: number;
  impTmin: number;
  impTnom: number;
  impTmax: number;
};

/** Voc and Vmp follow ctVoc, Imp follows ctIsc (as in the Peimar Designer). */
export function moduleAt(p: Panel, t: Temps): ModuleAt {
  return {
    vocTmin: atTemp(p.voc, p.ctVoc, t.tmin),
    vocTnom: atTemp(p.voc, p.ctVoc, t.tnom),
    vocTmax: atTemp(p.voc, p.ctVoc, t.tmax),
    vmpTmin: atTemp(p.vmp, p.ctVoc, t.tmin),
    vmpTnom: atTemp(p.vmp, p.ctVoc, t.tnom),
    vmpTmax: atTemp(p.vmp, p.ctVoc, t.tmax),
    impTmin: atTemp(p.imp, p.ctIsc, t.tmin),
    impTnom: atTemp(p.imp, p.ctIsc, t.tnom),
    impTmax: atTemp(p.imp, p.ctIsc, t.tmax),
  };
}

export type MpptGroup = { mppts: number[]; imax: number };

/** "1,2" → two groups, "1-2,3" → MPPT 1+2 in parallel and MPPT 3, "ALL" → every MPPT in parallel. */
export function mpptGroups(inv: Inverter, configKey: string): MpptGroup[] {
  if (!configKey) return [];
  const parts =
    configKey === 'ALL'
      ? [Array.from({ length: inv.numMppt }, (_, i) => i + 1)]
      : configKey.split(',').map((part) => part.split('-').map(Number));
  return parts.map((mppts) => ({
    mppts,
    imax: mppts.reduce((sum, m) => sum + (inv.imaxPerMppt[m - 1] ?? 0), 0),
  }));
}

export type CheckId = 'vstart' | 'vmaxDc' | 'vdcModule' | 'vminMppt' | 'vmaxMppt' | 'imax' | 'panels';
export type CheckOp = '>' | '<' | '≤';
export type Check = { id: CheckId; value: number; limit: number; pass: boolean };

export const checkOp: Record<CheckId, CheckOp> = {
  vstart: '>',
  vmaxDc: '<',
  vdcModule: '<',
  vminMppt: '>',
  vmaxMppt: '<',
  imax: '≤',
  panels: '≤',
};

/** Which design temperature each check is evaluated at. */
export const checkTemp: Record<CheckId, 'tmin' | 'tmax' | null> = {
  vstart: 'tmax',
  vmaxDc: 'tmin',
  vdcModule: 'tmin',
  vminMppt: 'tmax',
  vmaxMppt: 'tmin',
  imax: 'tmax',
  panels: null,
};

function check(id: CheckId, value: number, limit: number): Check {
  const op = checkOp[id];
  const pass = op === '>' ? value > limit : op === '<' ? value < limit : value <= limit;
  return { id, value, limit, pass };
}

export function voltageChecks(m: ModuleAt, panel: Panel, inv: Inverter, series: number): Check[] {
  return [
    check('vstart', m.vocTmax * series, inv.vstart),
    check('vmaxDc', m.vocTmin * series, inv.vmaxDc),
    check('vdcModule', m.vocTmin * series, panel.vdcMax),
    check('vminMppt', m.vmpTmax * series, inv.vminMppt),
    check('vmaxMppt', m.vmpTmin * series, inv.vmaxMppt),
  ];
}

export function stringChecks(m: ModuleAt, panel: Panel, inv: Inverter, group: MpptGroup, series: number, strings: number): Check[] {
  return [...voltageChecks(m, panel, inv, series), check('imax', m.impTmax * strings, group.imax)];
}

/** Nominal power ratio: inverter DC rating ÷ PV power connected to it. */
export function powerRatio(inv: Inverter, pvW: number): number {
  return pvW > 0 ? inv.pnomDc / pvW : Infinity;
}

export type Tone = 'green' | 'amber';

export function ratioTone(inv: Inverter, ratio: number): Tone {
  return ratio > inv.percPminCc || ratio < inv.percPmaxCc ? 'amber' : 'green';
}

/** First series count whose voltages pass every inverter and module limit, or null. */
export function firstValidSeries(m: ModuleAt, panel: Panel, inv: Inverter, upTo = 200): number | null {
  for (let s = 1; s <= upTo; s++) {
    if (voltageChecks(m, panel, inv, s).every((c) => c.pass)) return s;
  }
  return null;
}

export function lastValidSeries(m: ModuleAt, panel: Panel, inv: Inverter, upTo = 200): number | null {
  let last: number | null = null;
  for (let s = 1; s <= upTo; s++) {
    if (voltageChecks(m, panel, inv, s).every((c) => c.pass)) last = s;
  }
  return last;
}

export function findPanel(project: Project, catalog: Catalog, id: string): Panel | null {
  if (!id) return null;
  return project.customPanels.find((p) => p.id === id) ?? catalog.panels.find((p) => p.id === id) ?? null;
}

export function findInverter(catalog: Catalog, id: string): Inverter | null {
  return id ? (catalog.inverters.find((i) => i.id === id) ?? null) : null;
}

export function tempsValid(t: Temps): boolean {
  const ok = (v: number) => Number.isFinite(v) && v >= -60 && v <= 110;
  return ok(t.tmin) && ok(t.tnom) && ok(t.tmax) && t.tmin < t.tnom && t.tnom < t.tmax;
}

const selected = (g: GroupSel) => g.series > 0 && g.strings > 0 && !!g.subArrayId;

/** Panels of a sub-array used by every inverter block (identical inverters repeat their strings). */
export function panelsUsed(project: Project, subArrayId: string): number {
  let used = 0;
  for (const block of project.inverters) {
    for (const g of block.groups) {
      if (selected(g) && g.subArrayId === subArrayId) used += block.count * g.series * g.strings;
    }
  }
  return used;
}

export type CellState = 'invalid' | Tone;

export type Cell = {
  series: number;
  strings: number;
  modules: number;
  power: number;
  ratio: number;
  checks: Check[];
  failed: Check[];
  state: CellState;
};

export type GroupContext = {
  inv: Inverter;
  group: MpptGroup;
  count: number;
  subArray: SubArray;
  panel: Panel;
  mod: ModuleAt;
  /** Panels of the sub-array still free for this group; its own current selection counts as free. */
  free: number;
  /** W already selected on the same inverter's other MPPT groups. */
  otherW: number;
};

function groupPowerW(project: Project, catalog: Catalog, g: GroupSel): number {
  if (!selected(g)) return 0;
  const sa = project.subArrays.find((s) => s.id === g.subArrayId);
  const panel = sa ? findPanel(project, catalog, sa.panelId) : null;
  return panel ? g.series * g.strings * panel.power : 0;
}

export function groupContext(project: Project, catalog: Catalog, block: InverterBlock, index: number): GroupContext | null {
  const inv = findInverter(catalog, block.inverterId);
  const sel = block.groups[index];
  if (!inv || !sel || !tempsValid(project.temps)) return null;
  const group = mpptGroups(inv, block.configKey)[index];
  const subArray = project.subArrays.find((s) => s.id === sel.subArrayId);
  const panel = subArray ? findPanel(project, catalog, subArray.panelId) : null;
  if (!group || !subArray || !panel || !(subArray.count > 0)) return null;
  const own = selected(sel) && sel.subArrayId === subArray.id ? block.count * sel.series * sel.strings : 0;
  const free = subArray.count - (panelsUsed(project, subArray.id) - own);
  const otherW = block.groups.reduce((sum, g, i) => (i === index ? sum : sum + groupPowerW(project, catalog, g)), 0);
  return { inv, group, count: Math.max(1, block.count), subArray, panel, mod: moduleAt(panel, project.temps), free, otherW };
}

export function evaluateCell(ctx: GroupContext, series: number, strings: number): Cell {
  const modules = series * strings;
  const power = modules * ctx.panel.power;
  const checks = [
    ...stringChecks(ctx.mod, ctx.panel, ctx.inv, ctx.group, series, strings),
    check('panels', ctx.count * modules, ctx.free),
  ];
  const failed = checks.filter((c) => !c.pass);
  const ratio = powerRatio(ctx.inv, power + ctx.otherW);
  return { series, strings, modules, power, ratio, checks, failed, state: failed.length ? 'invalid' : ratioTone(ctx.inv, ratio) };
}

export const MATRIX_ROWS = 5;
export const MATRIX_COLS = 5;

/** Column window start: the first valid series count, so the matrix opens on usable cells. */
export function matrixStart(ctx: GroupContext): number {
  return firstValidSeries(ctx.mod, ctx.panel, ctx.inv) ?? 1;
}

export function matrix(ctx: GroupContext, start: number): Cell[][] {
  return Array.from({ length: MATRIX_ROWS }, (_, r) =>
    Array.from({ length: MATRIX_COLS }, (_, c) => evaluateCell(ctx, start + c, r + 1)),
  );
}

export type GroupSummary = { index: number; mppts: number[]; sel: GroupSel; ctx: GroupContext | null; cell: Cell | null };

export type BlockSummary = {
  block: InverterBlock;
  inv: Inverter | null;
  groups: GroupSummary[];
  /** PV W connected to one inverter of the block. */
  pvW: number;
  ratio: number;
  tone: Tone | null;
  valid: boolean;
};

export type SubArraySummary = { subArray: SubArray; panel: Panel | null; used: number; installedW: number };

export type ProjectSummary = {
  subArrays: SubArraySummary[];
  blocks: BlockSummary[];
  panelsTotal: number;
  invertersTotal: number;
  installedW: number;
  connectedW: number;
  acW: number;
  dcNomW: number;
  ratio: number;
  stringsSelected: number;
  allValid: boolean;
};

export function summarize(project: Project, catalog: Catalog): ProjectSummary {
  const subArrays = project.subArrays.map((subArray) => {
    const panel = findPanel(project, catalog, subArray.panelId);
    const count = subArray.count > 0 ? subArray.count : 0;
    return { subArray, panel, used: panelsUsed(project, subArray.id), installedW: panel ? count * panel.power : 0 };
  });

  let stringsSelected = 0;
  const blocks = project.inverters.map((block): BlockSummary => {
    const inv = findInverter(catalog, block.inverterId);
    const groups = inv
      ? mpptGroups(inv, block.configKey).map((g, index): GroupSummary => {
          const sel = block.groups[index] ?? { subArrayId: '', series: 0, strings: 0 };
          const ctx = groupContext(project, catalog, block, index);
          const cell = ctx && selected(sel) ? evaluateCell(ctx, sel.series, sel.strings) : null;
          if (cell) stringsSelected += sel.strings * Math.max(1, block.count);
          return { index, mppts: g.mppts, sel, ctx, cell };
        })
      : [];
    const pvW = groups.reduce((sum, g) => sum + (g.cell ? g.cell.power : 0), 0);
    const ratio = inv ? powerRatio(inv, pvW) : Infinity;
    const hasSel = groups.some((g) => selected(g.sel));
    const valid = groups.every((g) => !selected(g.sel) || (g.cell !== null && g.cell.state !== 'invalid'));
    return { block, inv, groups, pvW, ratio, tone: inv && pvW > 0 ? ratioTone(inv, ratio) : null, valid: valid && hasSel };
  });

  const withInv = blocks.filter((b) => b.inv);
  const count = (b: BlockSummary) => Math.max(1, b.block.count);
  const connectedW = withInv.reduce((sum, b) => sum + count(b) * b.pvW, 0);
  const dcNomW = withInv.reduce((sum, b) => sum + (b.pvW > 0 ? count(b) * b.inv!.pnomDc : 0), 0);
  const overAssigned = subArrays.some((s) => s.used > s.subArray.count);

  return {
    subArrays,
    blocks,
    panelsTotal: subArrays.reduce((sum, s) => sum + (s.subArray.count > 0 ? s.subArray.count : 0), 0),
    invertersTotal: withInv.reduce((sum, b) => sum + count(b), 0),
    installedW: subArrays.reduce((sum, s) => sum + s.installedW, 0),
    connectedW,
    acW: withInv.reduce((sum, b) => sum + count(b) * b.inv!.pnomAc, 0),
    dcNomW,
    ratio: connectedW > 0 ? dcNomW / connectedW : Infinity,
    stringsSelected,
    allValid: blocks.length > 0 && blocks.every((b) => b.inv && b.valid) && !overAssigned,
  };
}

/** Monthly and annual energy from PVGIS yields per kWp. */
export function energyEstimate(kwp: number, yieldMonthly: number[], yieldAnnual: number) {
  return { monthly: yieldMonthly.map((y) => kwp * y), annual: kwp * yieldAnnual, specific: yieldAnnual };
}
