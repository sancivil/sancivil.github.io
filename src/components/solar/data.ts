import solar from '../../data/iraq-solar.json';
import { modules, seriesPanels, type Panel } from '../products/data.ts';
import type { Locale } from '../../i18n/config.ts';

export interface SolarCity {
  id: string;
  name: string;
  nameAr: string;
  nameKu: string;
  governorate: string;
  lat: number;
  lon: number;
  elevation: number;
  optimalTilt: number;
  optimalAzimuth: number;
  yieldMonthly: number[];
  yieldAnnual: number;
  irradiationAnnual: number;
  lossTotalPct: number;
  tmyMinC: number;
  tmyMaxC: number;
  summerDayMeanC: number;
  design: { tmin: number; tnom: number; tmax: number };
}

/** North to south, the order the Designer uses. */
export const cities = [...(solar.cities as SolarCity[])].sort((a, b) => b.lat - a.lat);
export const cityById = (id: string) => cities.find((c) => c.id === id);
export const cityName = (c: SolarCity, locale: Locale) =>
  locale === 'ar' ? c.nameAr : locale === 'ckb' ? c.nameKu : c.name;

export const pvgis = { fetched: solar.fetched, loss: solar.assumptions.loss };

export const byYield = [...cities].sort((a, b) => b.yieldAnnual - a.yieldAnnual);
export const best = byYield[0];
export const lowest = byYield[byYield.length - 1];
export const tiltRange = [Math.min(...cities.map((c) => c.optimalTilt)), Math.max(...cities.map((c) => c.optimalTilt))];
export const azimuthRange = [
  Math.min(...cities.map((c) => c.optimalAzimuth)),
  Math.max(...cities.map((c) => c.optimalAzimuth)),
];
/** Northernmost city with the steepest optimal tilt, southernmost with the flattest. */
export const steepest = cities.find((c) => c.optimalTilt === tiltRange[1])!;
export const flattest = [...cities].reverse().find((c) => c.optimalTilt === tiltRange[0])!;
export const rank = (c: SolarCity) => byYield.indexOf(c) + 1;

export const perDay = (annual: number) => annual / 365;
export const peakMonth = (c: SolarCity) => c.yieldMonthly.indexOf(Math.max(...c.yieldMonthly));
export const lowMonth = (c: SolarCity) => c.yieldMonthly.indexOf(Math.min(...c.yieldMonthly));

/** Great-circle distance in km. */
function distance(a: SolarCity, b: SolarCity): number {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLon = (b.lon - a.lon) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

export const nearest = (c: SolarCity, n = 4) =>
  cities
    .filter((o) => o !== c)
    .map((o) => ({ city: o, km: distance(c, o) }))
    .sort((a, b) => a.km - b.km)
    .slice(0, n);

/* ---------- sizing module ---------- */

const or10h = modules.find((s) => s.slug === 'or-series-or10h')!;

/** The most powerful OR10H N-type TOPCon double-glass module with full figures in panels.json. */
export const flagship: Panel = seriesPanels(or10h)
  .filter((p) => p.model.endsWith('MNDB'))
  .reduce((a, b) => (b.power > a.power ? b : a));
export const flagshipSeries = or10h;
export const flagshipDatasheet = or10h.datasheets.find((d) => d.label === flagship.model) ?? null;
/** Module area in m², from the datasheet outline. */
const flagshipArea = (flagship.width * flagship.height) / 1e6;

export const MONTHLY_USE = [300, 600, 1000, 1500, 2000];

export function sizing(city: SolarCity, monthly: number) {
  const annual = monthly * 12;
  const kwp = annual / city.yieldAnnual;
  const panels = Math.ceil((kwp * 1000) / flagship.power - 1e-9);
  return { monthly, annual, kwp, panels, installed: (panels * flagship.power) / 1000, area: panels * flagshipArea };
}

/** Power below the STC rating at a cell temperature, from a %/°C coefficient (linear, as datasheets state it). */
export const heatLoss = (cellC: number, ctPmax: number) => (cellC - 25) * Math.abs(ctPmax);
