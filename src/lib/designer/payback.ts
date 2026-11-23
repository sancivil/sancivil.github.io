import { fmt, fmtMax } from './format.ts';
import type { Currency, Panel } from './types.ts';

export const CURRENCIES: Currency[] = ['IQD', 'USD'];
export const PAYBACK_YEARS = 25;

export type Ageing = { firstYear: number; perYear: number };

/** Output loss limits of Peimar's 2026 PV module warranty: the loss in the first year, then the loss each year after. */
export const AGEING = {
  topcon: { firstYear: 0.01, perYear: 0.003 },
  perc: { firstYear: 0.03, perYear: 0.0041 },
  poly: { firstYear: 0.02, perYear: 0.0041 },
} satisfies Record<string, Ageing>;

export type Tech = keyof typeof AGEING;

/**
 * Peimar model codes name the cells: MN is N-type TOPCon (OR10H610MNDB, SA480MN), a final P polycrystalline (SG250P),
 * M mono PERC. Custom panels count as PERC, the steepest warranty line.
 */
export function moduleTech(panel: Panel): Tech {
  if (panel.custom) return 'perc';
  if (/\dMN/.test(panel.model)) return 'topcon';
  return /\dP$/.test(panel.model) ? 'poly' : 'perc';
}

/** The steepest ageing line among the design's modules, so a mixed design is never estimated too high. */
export function designTech(panels: Panel[]): Tech {
  const techs = panels.map(moduleTech);
  return (['perc', 'poly', 'topcon'] as const).find((t) => techs.includes(t)) ?? 'perc';
}

/** Output in year n as a share of the PVGIS estimate: full in year 1, then on the warranty line. */
export function outputFactor(year: number, a: Ageing): number {
  return year <= 1 ? 1 : Math.max(0, 1 - a.firstYear - (year - 2) * a.perYear);
}

export type PaybackInput = {
  cost: number;
  pricePerKwh: number;
  /** First-year production: kWp × PVGIS yield. */
  annualKwh: number;
  /** Yearly consumption when known: energy above it saves nothing. */
  useKwh?: number;
  ageing: Ageing;
};

export type Payback = {
  /** Savings in the first year. */
  yearly: number;
  monthly: number;
  /** Whole months until the savings repay the cost, rounded up; null when it takes longer than PAYBACK_YEARS. */
  months: number | null;
  /** Year of operation in which the savings pass the cost. */
  breakEvenYear: number | null;
  /** Years to the crossing, with fractions. */
  crossing: number | null;
  /** Savings so far at the end of each year; index 0 is the start. */
  cumulative: number[];
  total: number;
};

const positive = (v: number | undefined): v is number => typeof v === 'number' && Number.isFinite(v) && v > 0;

/** Savings at a constant price per kWh. Null unless cost, price and production are positive numbers. */
export function payback({ cost, pricePerKwh, annualKwh, useKwh, ageing }: PaybackInput): Payback | null {
  if (!positive(cost) || !positive(pricePerKwh) || !positive(annualKwh)) return null;
  const cap = positive(useKwh) ? useKwh : Infinity;
  const cumulative = [0];
  let crossing: number | null = null;
  for (let year = 1; year <= PAYBACK_YEARS; year++) {
    const saved = Math.min(annualKwh * outputFactor(year, ageing), cap) * pricePerKwh;
    const before = cumulative[year - 1];
    cumulative.push(before + saved);
    if (crossing === null && before + saved >= cost) crossing = year - 1 + (cost - before) / saved;
  }
  const total = cumulative[PAYBACK_YEARS];
  if (!Number.isFinite(total)) return null;
  return {
    yearly: cumulative[1],
    monthly: cumulative[1] / 12,
    months: crossing === null ? null : Math.max(1, Math.ceil(crossing * 12 - 1e-9)),
    breakEvenYear: crossing === null ? null : Math.max(1, Math.ceil(crossing - 1e-9)),
    crossing,
    cumulative,
    total,
  };
}

/** Monthly bill ÷ monthly consumption, or NaN until both are positive. */
export function priceFromBill(bill: number, monthlyKwh: number): number {
  return positive(bill) && positive(monthlyKwh) ? bill / monthlyKwh : NaN;
}

export const yearsMonths = (months: number) => ({ years: Math.floor(months / 12), months: months % 12 });

/** Thousands separators; USD below 1,000 keeps cents, dinars never do. */
export const amount = (v: number, c: Currency) => fmt(v, c === 'USD' && Math.abs(v) < 1000 ? 2 : 0);
export const money = (v: number, c: Currency) => `${amount(v, c)} ${c}`;

/** Price per kWh: 150, 136.4, 0.085. */
export const rate = (v: number) => fmtMax(v, v < 10 ? 3 : 1);
export const perKwh = (v: number, c: Currency) => `${rate(v)} ${c}/kWh`;
