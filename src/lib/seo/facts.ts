/* The site FAQ, with every figure read from the content and the technical layer so the answers follow the catalog. */
import panelData from '../../data/designer/panels.json';
import programme from '../../data/technical/programme.json';
import { contact, phones } from '../../data/site.ts';
import { address, hoursParts } from '../../content/index.ts';
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

export const coefficients = {
  topcon: coefficient(panels.filter((p) => p.model.endsWith('MNDB'))),
  /** Mono and poly modules of the Revamping Line (SM… and SG…P). */
  mono: coefficient(panels.filter((p) => /^SM\d/.test(p.model))),
  poly: coefficient(panels.filter((p) => p.cellType === 'poly')),
};

const range = ([from, to]: number[]) => `${fmt(from)}–${fmt(to)}`;

/** Peimar hybrid families shown on the site for one phase, with their power span in kW. */
function hybridFamilies(phase: 'single_phase' | 'three_phase') {
  const list = families.hybrid.flatMap((f) =>
    f.brand === 'Peimar' && f.phase === phase && f.powerRange ? [{ name: f.name, power: f.powerRange }] : [],
  );
  const kw = list.length ? range([Math.min(...list.map((f) => f.power[0])) / 1000, Math.max(...list.map((f) => f.power[1])) / 1000]) : '';
  return { names: list.map((f) => f.name), kw };
}
export const hybrid = { single: hybridFamilies('single_phase'), three: hybridFamilies('three_phase') };

/** The smallest and largest Peimar storage shown on the site, by headline capacity; null when none states one. */
function storageFacts() {
  const sized = batteries.flatMap((b) => {
    const cap = b.brand === 'Peimar' && headlineCapacity(b);
    return cap ? [{ b, min: Number(cap[0]), max: Number(cap[1]) }] : [];
  });
  if (!sized.length) return null;
  const smallest = sized.reduce((a, x) => (x.min < a.min ? x : a));
  const largest = sized.reduce((a, x) => (x.max > a.max ? x : a));
  const modules = largest.b.capacity?.modules;
  return {
    min: fmt(smallest.min, 1),
    minName: smallest.b.name,
    max: fmt(largest.max, 1),
    maxName: largest.b.name,
    modules: String(Array.isArray(modules) ? modules[1] : ''),
  };
}
export const storage = storageFacts();

/* Worked examples use Baghdad. */
const baghdad = cityById('baghdad')!;
const example = sizing(baghdad, 1000);
const summerCell = baghdad.design.tnom;
const listed = ['erbil', 'sulaymaniyah', 'duhok', 'mosul', 'kirkuk', 'baghdad', 'karbala', 'najaf'];
/** Quotes go to the WhatsApp number, which also takes calls. */
const quotePhone = (phones.find((p) => p.whatsapp) ?? phones[0]).display;

/** The ten site-wide questions and answers for a locale, with localized links. */
export function siteFaq(locale: Locale): Qa[] {
  const name = (id: string) => cityName(cityById(id)!, locale);
  const office = address(locale);
  const qas = faq[locale].qas({
    founded: String(peimar.founded),
    brescia: String(peimar.bresciaSince),
    street: office.street,
    city: office.city,
    country: office.country,
    postal: contact.postalCode,
    hours: hoursParts(locale),
    phones: phones.map((p) => p.display),
    whatsapp: phones.filter((p) => p.whatsapp).map((p) => p.display),
    phone: quotePhone,
    email: contact.email,
    sProduct: String(warranty.modules['S Series'].product),
    sPower: String(warranty.modules['S Series'].power),
    orProduct: String(warranty.modules['OR Series'].product),
    orPower: String(warranty.modules['OR Series'].power),
    insurer: programme.insurance.provider,
    batteryYears: String(warranty.batteries.years),
    ctTopcon: fmt(coefficients.topcon, 2),
    ctMono: fmt(coefficients.mono, 2),
    ctPoly: fmt(coefficients.poly, 2),
    heatCity: name('baghdad'),
    heatT: String(summerCell),
    lossTopcon: fmt(heatLoss(summerCell, coefficients.topcon), 1),
    lossMono: fmt(heatLoss(summerCell, coefficients.mono), 1),
    lossPoly: fmt(heatLoss(summerCell, coefficients.poly), 1),
    single: hybrid.single.names,
    singleKw: hybrid.single.kw,
    three: hybrid.three.names,
    threeKw: hybrid.three.kw,
    storage,
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
