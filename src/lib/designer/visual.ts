import type { Cell, CheckId } from './calc.ts';
import type { Panel } from './types.ts';

export type StringRun = { lead: number; hidden: number; trail: number };

/** Modules drawn for one string: all of them when they fit in `slots`, else a lead run, one ellipsis slot and the last module. */
export function stringRun(series: number, slots: number): StringRun {
  if (series <= slots) return { lead: series, hidden: 0, trail: 0 };
  const lead = Math.max(1, slots - 2);
  return { lead, hidden: series - lead - 1, trail: 1 };
}

export type Mark = { value: number; pass: boolean };

export type Ruler = {
  /** Scale end: the higher of the inverter and module DC limits, stretched when the string's Voc goes past both. */
  max: number;
  vstart: number;
  vmaxDc: number;
  vdcModule: number;
  window: [number, number];
  /** String Vmp at the hot and the cold design temperature. */
  vmp: [Mark, Mark];
  /** String Voc at the hot and the cold design temperature; the cold one passes only below both DC limits. */
  voc: [Mark, Mark];
  current: Mark & { limit: number };
};

/** Every figure of the voltage ruler, read from the engine's checks for a cell. */
export function voltageRuler(cell: Cell): Ruler {
  const get = (id: CheckId) => cell.checks.find((c) => c.id === id)!;
  const mark = (id: CheckId): Mark => ({ value: get(id).value, pass: get(id).pass });
  const vmaxDc = get('vmaxDc');
  const module = get('vdcModule');
  const imax = get('imax');
  const limit = Math.max(vmaxDc.limit, module.limit);
  return {
    max: vmaxDc.value > limit ? vmaxDc.value * 1.05 : limit,
    vstart: get('vstart').limit,
    vmaxDc: vmaxDc.limit,
    vdcModule: module.limit,
    window: [get('vminMppt').limit, get('vmaxMppt').limit],
    vmp: [mark('vminMppt'), mark('vmaxMppt')],
    voc: [mark('vstart'), { value: vmaxDc.value, pass: vmaxDc.pass && module.pass }],
    current: { value: imax.value, pass: imax.pass, limit: imax.limit },
  };
}

/** Share of a scale, clamped to 0–1. */
export const along = (v: number, max: number) => (max > 0 ? Math.min(1, Math.max(0, v / max)) : 0);

/**
 * Rows for labels centred on positions `xs` (0–1) so that labels closer than `gap` never share a row:
 * each label takes the first row whose previous label is at least `gap` away.
 */
export function labelRows(xs: number[], gap: number): number[] {
  const rows: number[] = new Array(xs.length).fill(0);
  const ends: number[] = [];
  const order = xs.map((_, i) => i).sort((a, b) => xs[a] - xs[b]);
  for (const i of order) {
    let r = ends.findIndex((end) => xs[i] - end >= gap);
    if (r === -1) {
      r = ends.length;
      ends.push(xs[i]);
    } else ends[r] = xs[i];
    rows[i] = r;
  }
  return rows;
}

export const GAUGE_MIN = 0.4;
export const GAUGE_MAX = 1.6;

/** Position of a power ratio on the dashboard gauge, 0 (40 %) to 1 (160 %). */
export const gaugeAt = (ratio: number) => (Number.isFinite(ratio) ? Math.min(1, Math.max(0, (ratio - GAUGE_MIN) / (GAUGE_MAX - GAUGE_MIN))) : 0);

type ModuleSeries = { slug: string; designerModels: string[] };

/**
 * Studio render of a panel's series: by the catalog's model list first, then by series code for models the
 * catalog page does not list. Custom panels and series without a render get null.
 */
export function seriesRenders(series: ModuleSeries[], panels: Panel[]): (p: Panel) => string | null {
  const byId = new Map<string, string>();
  const byCode = new Map<string, string>();
  for (const s of series) {
    for (const id of s.designerModels) {
      byId.set(id, s.slug);
      const code = panels.find((p) => p.id === id)?.series;
      if (code && !byCode.has(code)) byCode.set(code, s.slug);
    }
  }
  return (p) => {
    if (p.custom) return null;
    const slug = byId.get(p.id) ?? byCode.get(p.series);
    return slug ? `/images/products/modules/${slug}.webp` : null;
  };
}
