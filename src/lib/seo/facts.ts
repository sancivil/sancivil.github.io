/* The site FAQ, with every figure read from src/data so the answers follow the catalog. */
import company from '../../data/company.json';
import panelData from '../../data/designer/panels.json';
import { insurance } from '../../data/catalog.json';
import { contact } from '../../data/site.ts';
import { batteries, families, headlineCapacity, warranty, type Panel } from '../../components/products/data.ts';
import { peimar } from '../../components/company/facts.ts';
import {
  MONTHLY_USE,
  best,
  cities,
  cityById,
  cityName,
  flagship,
  heatLoss,
  lowest,
  sizing,
} from '../../components/solar/data.ts';
import { fmt } from '../designer/format.ts';
import { common } from '../../i18n/common.ts';
import { faq } from '../../i18n/faq.ts';
import { localizePath, type Locale } from '../../i18n/config.ts';
import type { Qa } from '../../i18n/solar.ts';

const panels = panelData as Panel[];

/** One coefficient for a group of datasheets, or an error if Peimar's figures disagree within it. */
function coefficient(group: Panel[]): number {
  const values = new Set(group.map((p) => p.ctPmax));
  if (values.size !== 1) throw new Error(`Expected one ctPmax, got: ${[...values].join(', ') || 'none'}`);
  return [...values][0];
}

const coefficients = {
  topcon: coefficient(panels.filter((p) => p.model.endsWith('MNDB'))),
  /** Mono and poly modules of the Revamping Line (SM… and SG…P). */
  mono: coefficient(panels.filter((p) => /^SM\d/.test(p.model))),
  poly: coefficient(panels.filter((p) => p.cellType === 'poly')),
};

function hybridFamilies(phase: 'single_phase' | 'three_phase') {
  const list = families.hybrid.filter((f) => f.phase === phase && f.powerRange);
  return {
    names: list.map((f) => f.name),
    kw: [Math.min(...list.map((f) => f.powerRange![0])) / 1000, Math.max(...list.map((f) => f.powerRange![1])) / 1000],
  };
}
const hybrid = { single: hybridFamilies('single_phase'), three: hybridFamilies('three_phase') };

const sized = batteries.flatMap((b) => {
  const cap = headlineCapacity(b);
  return cap ? [{ b, min: Number(cap[0]), max: Number(cap[1]) }] : [];
});
const smallest = sized.reduce((a, x) => (x.min < a.min ? x : a));
const largest = sized.reduce((a, x) => (x.max > a.max ? x : a));
const largestModules = largest.b.capacity?.modules;
const batteryYears = Math.min(...sized.map((x) => x.b.warrantyYears ?? Infinity));

const workday = company.hours.find((h) => h.open)!;

/* Worked examples use Baghdad. */
const baghdad = cityById('baghdad')!;
const example = sizing(baghdad, 1000);
const summerCell = baghdad.design.tnom;
const listed = ['erbil', 'sulaymaniyah', 'duhok', 'mosul', 'kirkuk', 'baghdad', 'karbala', 'najaf'];
const range = ([from, to]: number[]) => `${fmt(from)}–${fmt(to)}`;

/** The ten site-wide questions and answers for a locale, with localized links. */
export function siteFaq(locale: Locale): Qa[] {
  const name = (id: string) => cityName(cityById(id)!, locale);
  const address = common[locale].address;
  const qas = faq[locale].qas({
    founded: String(peimar.founded),
    brescia: String(peimar.bresciaSince),
    street: address.street,
    city: address.city,
    postal: contact.postalCode,
    open: workday.open!,
    close: workday.close!,
    phone: contact.phoneDisplay,
    email: contact.email,
    sProduct: String(warranty.modules['S Series'].product),
    sPower: String(warranty.modules['S Series'].power),
    orProduct: String(warranty.modules['OR Series'].product),
    orPower: String(warranty.modules['OR Series'].power),
    insurer: insurance.provider,
    batteryYears: String(batteryYears),
    ctTopcon: fmt(coefficients.topcon, 2),
    ctMono: fmt(coefficients.mono, 2),
    ctPoly: fmt(coefficients.poly, 2),
    heatCity: name('baghdad'),
    heatT: String(summerCell),
    lossTopcon: fmt(heatLoss(summerCell, coefficients.topcon), 1),
    lossMono: fmt(heatLoss(summerCell, coefficients.mono), 1),
    lossPoly: fmt(heatLoss(summerCell, coefficients.poly), 1),
    single: hybrid.single.names,
    singleKw: range(hybrid.single.kw),
    three: hybrid.three.names,
    threeKw: range(hybrid.three.kw),
    storeMin: fmt(smallest.min, 1),
    storeMinName: smallest.b.name,
    storeMax: fmt(largest.max, 1),
    storeMaxName: largest.b.name,
    storeModules: String(Array.isArray(largestModules) ? largestModules[1] : ''),
    sizeCity: name('baghdad'),
    sizeCityId: baghdad.id,
    sizeY: fmt(baghdad.yieldAnnual, 1),
    sizeKwp: fmt(example.kwp, 2),
    sizePanels: String(example.panels),
    model: flagship.model,
    watts: String(flagship.power),
    installed: fmt(example.installed, 2),
    area: fmt(example.area, 1),
    useMin: fmt(MONTHLY_USE[0]),
    useMax: fmt(MONTHLY_USE[MONTHLY_USE.length - 1]),
    cityCount: String(cities.length),
    north: cityName(cities[0], locale),
    south: cityName(cities[cities.length - 1], locale),
    cityList: listed.map(name),
    low: cityName(lowest, locale),
    lowY: fmt(lowest.yieldAnnual, 1),
    high: cityName(best, locale),
    highY: fmt(best.yieldAnnual, 1),
  });
  return qas.map((qa) => ({ ...qa, link: qa.link && { ...qa.link, href: localizePath(qa.link.href, locale) } }));
}
