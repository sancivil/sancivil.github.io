import { moduleAt, mpptGroups, powerRatio, ratioTone, stringChecks, voltageChecks } from './calc.ts';
import { createProject } from './project.ts';
import type { Battery, City, Inverter, Panel, Phase, Project, Temps } from './types.ts';

/**
 * Recommended module for the homeowner path: OR10H610MNDB, a current OR10H TOPCon bifacial double-glass
 * module (610 W, 23.61 %, −0.29 %/°C). Its 13.67 A Imp fits the 16 A inputs of Peimar's
 * PSI-X1P and PSI-X3S hybrid inverters.
 */
export const RECOMMENDED_PANEL_ID = 'or10h610mndb';
export const BATTERY_USABLE = 0.9;
const MAX_INVERTERS = 6;

export type Needs = {
  cityId: string;
  monthlyKwh: number;
  gridHours: number;
  backupKw: number;
  backupHours: number;
  phase: Phase;
};

export type LayoutGroup = { series: number; strings: number };

export type Layout = { configKey: string; groups: LayoutGroup[]; panels: number; ratio: number };

type Option = LayoutGroup & { panels: number; comfortable: boolean };

/**
 * Best green string layout for one inverter with at least `target` panels: fewest extra panels, comfortable
 * voltages (25 % above the start and MPPT minimum), as many MPPTs as possible, even strings.
 */
export function autoLayout(panel: Panel, inv: Inverter, temps: Temps, target: number, slack = Math.max(1, Math.round(target * 0.15))): Layout | null {
  const configKey = inv.mpptConfigs.find((c) => c.key !== 'ALL')?.key ?? inv.mpptConfigs[0]?.key;
  if (!configKey || target < 1) return null;
  const groups = mpptGroups(inv, configKey);
  if (groups.length > 4) return null;
  const m = moduleAt(panel, temps);
  const maxPanels = target + slack;

  const options = groups.map((g) => {
    const list: Option[] = [{ series: 0, strings: 0, panels: 0, comfortable: true }];
    for (let s = 1; s <= maxPanels; s++) {
      if (!voltageChecks(m, panel, inv, s).every((c) => c.pass)) continue;
      const comfortable = m.vocTmax * s >= inv.vstart * 1.25 && m.vmpTmax * s >= inv.vminMppt * 1.25;
      for (let p = 1; p * s <= maxPanels; p++) {
        if (!stringChecks(m, panel, inv, g, s, p).every((c) => c.pass)) break;
        list.push({ series: s, strings: p, panels: s * p, comfortable });
      }
    }
    return list;
  });

  const found: { layout: Option[] | null; score: number[] } = { layout: null, score: [] };
  const walk = (i: number, picked: Option[], total: number) => {
    if (total > maxPanels) return;
    if (i < options.length) {
      for (const o of options[i]) walk(i + 1, [...picked, o], total + o.panels);
      return;
    }
    if (total < target || ratioTone(inv, powerRatio(inv, total * panel.power)) !== 'green') return;
    const used = picked.filter((o) => o.panels > 0);
    const loads = used.map((o) => o.panels);
    const score = [
      total - target,
      used.every((o) => o.comfortable) ? 0 : 1,
      groups.length - used.length,
      Math.max(...loads) - Math.min(...loads),
      used.reduce((n, o) => n + o.strings, 0),
      picked.reduce((n, o, k) => n + (o.panels > 0 ? k : 0), 0),
    ];
    if (!found.layout || lexLess(score, found.score)) {
      found.layout = picked;
      found.score = score;
    }
  };
  walk(0, [], 0);
  if (!found.layout) return null;
  const panels = found.layout.reduce((n, o) => n + o.panels, 0);
  return {
    configKey,
    groups: found.layout.map((o) => ({ series: o.series, strings: o.strings })),
    panels,
    ratio: powerRatio(inv, panels * panel.power),
  };
}

function lexLess(a: number[], b: number[]): boolean {
  for (let k = 0; k < a.length; k++) if (a[k] !== b[k]) return a[k] < b[k];
  return false;
}

export type BatteryItem = { name: string; qty: number; kwh: number };
export type BatteryPlan = { neededKwh: number; items: BatteryItem[]; totalKwh: number; overMax: boolean };

const capacityOf = (b: Battery | undefined): number => {
  const c = b?.capacity;
  if (!c) return 0;
  if (typeof c.moduleKwh === 'number') return c.moduleKwh;
  if (typeof c.totalKwh === 'number') return c.totalKwh;
  return c.ratedKwh ?? 0;
};

/**
 * Pairings stated by Peimar: PSI-X-BT (PSI-X-5.8MST-V2 master plus PSI-X-5.8SLV-V2 slaves) for PSI-X1P-HY and
 * PSI-X3S-HY; PSI-A-BT3.8S modules (1 to 6) for the PSI-A All-in-One systems.
 */
export function batteryFamily(inv: Inverter): 'x-bt' | 'a-bt' | null {
  if (inv.type !== 'hybrid') return null;
  if (/^PSI-X1P\d+-HY$|^PSI-X3S\d+-HY$/.test(inv.model)) return 'x-bt';
  if (/^PSI-A1P/.test(inv.model)) return 'a-bt';
  return null;
}

/** Each hybrid inverter gets its own battery stack sized for its share of the backup energy. */
export function batteryPlan(inv: Inverter, inverterCount: number, backupKw: number, backupHours: number, batteries: Battery[]): BatteryPlan | null {
  if (!(backupKw > 0) || !(backupHours > 0)) return null;
  const neededKwh = (backupKw * backupHours) / BATTERY_USABLE;
  const n = Math.max(1, inverterCount);
  const perInverter = neededKwh / n;
  const plan = (items: BatteryItem[], overMax = false): BatteryPlan => ({
    neededKwh,
    items,
    totalKwh: items.reduce((sum, i) => sum + i.qty * i.kwh, 0),
    overMax,
  });
  const family = batteryFamily(inv);
  if (family === 'x-bt') {
    const master = batteries.find((x) => x.slug === 'psi-x-5-8mst-v2');
    const slave = batteries.find((x) => x.slug === 'psi-x-5-8slv-v2');
    const unit = capacityOf(master);
    if (master && slave && unit > 0) {
      const units = Math.max(1, Math.ceil(perInverter / unit - 1e-9));
      const items = [{ name: master.name, qty: n, kwh: unit }];
      if (units > 1) items.push({ name: slave.name, qty: n * (units - 1), kwh: capacityOf(slave) });
      return plan(items);
    }
  }
  if (family === 'a-bt') {
    const mod = batteries.find((x) => x.slug === 'psi-a-bt3-8s');
    const unit = capacityOf(mod);
    const maxModules = mod?.capacity?.modules?.[1] ?? 6;
    if (mod && unit > 0) {
      const need = Math.max(1, Math.ceil(perInverter / unit - 1e-9));
      return plan([{ name: mod.name, qty: n * Math.min(need, maxModules), kwh: unit }], need > maxModules);
    }
  }
  return plan([]);
}

export type Sizing = {
  city: City;
  annualKwh: number;
  targetKwp: number;
  targetPanels: number;
  panel: Panel;
  inverter: Inverter;
  inverterCount: number;
  layout: Layout;
  panelCount: number;
  kwp: number;
  ratio: number;
  productionKwh: number;
  areaM2: number;
  outageHours: number | null;
  battery: BatteryPlan | null;
};

export type SizingData = { panels: Panel[]; inverters: Inverter[]; cities: City[]; batteries: Battery[] };

/**
 * Why nothing fits (reason 'noFit'): 'backup' = the energy need fits, but no inverter set that carries the backup load
 * stays green; 'small' = below the smallest green hybrid of this phase (minKwp); 'large' = above six of the largest
 * (maxKwp).
 */
export type NoFitLimit = 'backup' | 'small' | 'large';

export type SizingOutcome =
  | { ok: true; sizing: Sizing }
  | { ok: false; reason: 'input' | 'noFit'; targetKwp?: number; limit?: NoFitLimit; minKwp?: number; maxKwp?: number };

export function needsValid(n: Needs): boolean {
  const hours = (v: number) => Number.isNaN(v) || (v >= 0 && v <= 24);
  const kw = (v: number) => Number.isNaN(v) || (v >= 0 && v <= 500);
  return !!n.cityId && n.monthlyKwh > 0 && n.monthlyKwh <= 200000 && hours(n.gridHours) && hours(n.backupHours) && kw(n.backupKw);
}

/** kWp = annual kWh ÷ city yield; then the smallest balanced, green Peimar hybrid inverter set. */
export function sizeFromNeeds(needs: Needs, data: SizingData): SizingOutcome {
  const city = data.cities.find((c) => c.id === needs.cityId);
  const panel = data.panels.find((p) => p.id === RECOMMENDED_PANEL_ID);
  if (!city || !panel || !needsValid(needs)) return { ok: false, reason: 'input' };

  const annualKwh = needs.monthlyKwh * 12;
  const targetKwp = annualKwh / city.yieldAnnual;
  const targetPanels = Math.max(1, Math.ceil((targetKwp * 1000) / panel.power - 1e-9));
  const loadW = needs.backupKw > 0 ? needs.backupKw * 1000 : 0;
  const wantsBattery = needs.backupKw > 0 && needs.backupHours > 0;

  const hybrids = data.inverters.filter((i) => i.type === 'hybrid' && i.phase === needs.phase);
  const paired = hybrids.filter((i) => batteryFamily(i));
  const pools = wantsBattery ? [paired, hybrids] : [hybrids];

  type Best = { inv: Inverter; n: number; layout: Layout; score: number };
  const search = (pool: Inverter[], load: number): Best | null => {
    let best: Best | null = null;
    for (let n = 1; n <= MAX_INVERTERS; n++) {
      const perInverter = Math.ceil(targetPanels / n);
      for (const inv of pool) {
        if (inv.pnomAc * n < load) continue;
        const layout = autoLayout(panel, inv, city.design, perInverter);
        if (!layout) continue;
        const score = (2 * (layout.panels * n - targetPanels)) / targetPanels + Math.abs(layout.ratio - 1) + 0.1 * (n - 1);
        if (!best || score < best.score - 1e-9 || (Math.abs(score - best.score) < 1e-9 && inv.pnomAc < best.inv.pnomAc)) {
          best = { inv, n, layout, score };
        }
      }
    }
    return best;
  };

  for (const pool of pools) {
    const best = search(pool, loadW);
    if (best) {
      const panelCount = best.layout.panels * best.n;
      const kwp = (panelCount * panel.power) / 1000;
      const area = panel.width && panel.height ? (panelCount * panel.width * panel.height) / 1e6 : 0;
      return {
        ok: true,
        sizing: {
          city,
          annualKwh,
          targetKwp,
          targetPanels,
          panel,
          inverter: best.inv,
          inverterCount: best.n,
          layout: best.layout,
          panelCount,
          kwp,
          ratio: best.layout.ratio,
          productionKwh: kwp * city.yieldAnnual,
          areaM2: area,
          outageHours: Number.isFinite(needs.gridHours) ? Math.max(0, 24 - needs.gridHours) : null,
          battery: batteryPlan(best.inv, best.n, needs.backupKw, needs.backupHours, data.batteries),
        },
      };
    }
  }
  if (loadW > 0 && search(hybrids, 0)) return { ok: false, reason: 'noFit', targetKwp, limit: 'backup' };
  const greenW = (inv: Inverter, ratio: number) => inv.pnomDc / ratio;
  const minKwp = hybrids.length ? Math.min(...hybrids.map((i) => greenW(i, i.percPminCc))) / 1000 : undefined;
  const maxKwp = hybrids.length ? (MAX_INVERTERS * Math.max(...hybrids.map((i) => greenW(i, i.percPmaxCc)))) / 1000 : undefined;
  const limit: NoFitLimit | undefined =
    minKwp !== undefined && targetKwp < minKwp ? 'small' : maxKwp !== undefined && targetKwp > maxKwp ? 'large' : undefined;
  return { ok: false, reason: 'noFit', targetKwp, limit, minKwp, maxKwp };
}

/** Designer project pre-filled from a sizing: site, one sub-array, one inverter block with the chosen strings. */
export function projectFromSizing(s: Sizing, name: string): Project {
  const base = createProject();
  return {
    ...base,
    name,
    cityId: s.city.id,
    temps: { ...s.city.design },
    subArrays: [{ id: 'a1', name: '', panelId: s.panel.id, count: s.panelCount }],
    inverters: [
      {
        id: 'i1',
        inverterId: s.inverter.id,
        count: s.inverterCount,
        configKey: s.layout.configKey,
        groups: s.layout.groups.map((g) => ({ subArrayId: 'a1', series: g.series, strings: g.strings })),
      },
    ],
  };
}
