/*
  /llms.txt: the site summed up for AI assistants, from the owner content and the technical layer. Preview builds
  (SITE_PREVIEW=1) point to the live file instead, so drafts never reach AI crawlers.
*/
import type { APIRoute } from 'astro';
import solarData from '../data/iraq-solar.json';
import programme from '../data/technical/programme.json';
import { contact, phones } from '../data/site.ts';
import { address, figures, hoursParts, items, milestones, projects } from '../content/index.ts';
import { peimar } from '../components/company/facts.ts';
import {
  accessories,
  families,
  groupInverters,
  groupPower,
  kw,
  modulePower,
  moduleEfficiency,
  modules,
  pct,
} from '../components/products/data.ts';
import { cities, flagship } from '../components/solar/data.ts';
import { coefficients, storage } from '../lib/seo/facts.ts';
import { PVGIS } from '../lib/seo/schema.ts';
import { fmt } from '../lib/designer/format.ts';
import { common } from '../i18n/common.ts';
import { solar } from '../i18n/solar.ts';

const SITE = 'https://faradayiq.com';
const and = (xs: string[]) => (xs.length > 1 ? `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}` : xs.join(''));
const nav = common.en.productNav;

/* Developer wording for the day-one milestones, by key; any other milestone reads as its title. */
const HISTORY: Partial<Record<string, string>> = {
  founded: 'Faraday Co. is founded in Sulaymaniyah.',
  peimar: 'Peimar appoints Faraday as its agent for all of Iraq.',
  renewal: 'Peimar renews the agency agreement for ten years.',
  capacity: 'Faraday reaches 100 MW of solar capacity supplied and installed.',
};

function intro(): string {
  const office = address('en');
  const facts = [
    figures.peimarAgentSince !== null &&
      `has held Peimar's agency for all of Iraq since ${figures.peimarAgentSince} (renewed in 2025 for ten years)`,
    figures.installedMw !== null &&
      `has supplied and installed ${figures.installedMw} MW of solar capacity${
        figures.iraqSharePct !== null ? `, more than ${figures.iraqSharePct}% of Iraq’s total solar power` : ''
      }`,
  ].filter(Boolean);
  const founded = facts.length
    ? `Founded in Sulaymaniyah in ${contact.founded}, Faraday ${facts.join(' and ')}.`
    : `Faraday was founded in Sulaymaniyah in ${contact.founded}.`;
  const agent = `Faraday is the main Peimar agent${figures.distributors !== null ? ` and works with ${figures.distributors} distributors across Iraq` : ''}.`;
  const hours = hoursParts('en');
  const open = hours.open.map((g) => `${g.days} ${g.open}–${g.close}`).join(', ');
  const whatsapp = phones.filter((p) => p.whatsapp).map((p) => p.display);
  const calls =
    whatsapp.length === phones.length
      ? `Phone and WhatsApp ${phones.map((p) => p.display).join(', ')}`
      : `Phone ${phones.map((p) => p.display).join(', ')}, WhatsApp ${whatsapp.join(', ')}`;
  return [
    `${contact.company} is the exclusive agent of Peimar, the Italian photovoltaic brand founded in ${peimar.founded}, in Iraq.`,
    founded,
    agent,
    `From its office on ${office.street}, ${office.city}${contact.postalCode ? ` ${contact.postalCode}` : ''}, ${office.country}, Faraday supplies Peimar solar modules, on-grid and hybrid inverters, storage batteries and accessories, designs systems with the climate data of each city and installs them on roofs and on the ground.`,
    ...(open ? [`Open ${open}${hours.closed ? `, closed ${hours.closed}` : ''}.`] : []),
    `${calls}, email ${contact.email}.`,
    `The site is published in English (${SITE}/), Arabic (${SITE}/ar/) and Kurdish Sorani (${SITE}/ku/).`,
  ].join(' ');
}

const range = (power: [number, number]) => `from ${kw(power[0])} to ${kw(power[1])} kW`;
const phases = (list: { phase: string }[]) => {
  const single = list.some((f) => f.phase === 'single_phase');
  const three = list.some((f) => f.phase === 'three_phase');
  return single && three ? 'single- and three-phase' : single ? 'single-phase' : 'three-phase';
};
const familyCount = (n: number, kind: string) => `${n} ${kind} ${n === 1 ? 'family' : 'families'}`;

/** One line per product line that shows something, then the generic product pages. */
function productLines(): string[] {
  const link = (label: string, path: string) => `- [${label}](${SITE}${path})`;
  const lines = [`${link('Products', '/products/')}: the full Peimar range Faraday supplies in Iraq, with datasheets.`];
  const seriesFamilies = [...new Set(modules.map((s) => s.series.replace(' Series', '')))];
  lines.push(
    `${link(nav.modules, '/products/modules/')}: ${modules.length} Peimar module series (${and(seriesFamilies)}), ${modulePower[0]}–${modulePower[1]} W, up to ${pct(moduleEfficiency)}% efficiency.`,
  );
  const hybridPower = groupPower('hybrid');
  const hybrid = [
    families.hybrid.length > 0 &&
      `${familyCount(families.hybrid.length, 'hybrid inverter')}${hybridPower ? ` ${range(hybridPower)}` : ''}, ${phases(families.hybrid)}`,
    storage && `Peimar LFP batteries from ${storage.min} to ${storage.max} kWh`,
  ].filter(Boolean);
  if (hybrid.length) lines.push(`${link(nav.hybrid, '/products/hybrid/')}: ${hybrid.join(', with ')}.`);
  if (families.onGrid.length) {
    const power = groupPower('onGrid');
    lines.push(
      `${link(nav.onGrid, '/products/on-grid/')}: ${familyCount(families.onGrid.length, `${phases(families.onGrid)} inverter`)}${power ? ` ${range(power)}` : ''}.`,
    );
  }
  if (families.micro.length) {
    const watts = [...new Set(groupInverters('micro').map((m) => String(m.pnomAc)))];
    lines.push(
      `${link(nav.micro, '/products/micro/')}: ${and(families.micro.map((f) => f.name))} microinverters${watts.length ? `, ${and(watts)} W` : ''}.`,
    );
  }
  if (accessories.length) {
    lines.push(
      `${link(nav.accessories, '/products/accessories/')}: meters, Wi-Fi and LAN dongles, a data hub, power optimizers, EV chargers, EPS boxes and electrical panels.`,
    );
  }
  for (const item of items) {
    lines.push(`${link(item.name, `/products/items/${item.slug}/`)}: ${item.text.en?.summary ?? `${item.brand} · ${nav[item.line]}`}`);
  }
  return lines;
}

function projectsLine(): string {
  const sorted = [...projects].sort((a, b) => a.sizeKwp - b.sizeKwp);
  const [smallest, largest] = [sorted[0], sorted[sorted.length - 1]];
  const span =
    smallest?.slug === '1-8-kwp-for-advertising-board' && largest?.slug === '50-kwp-for-agriculture-land'
      ? `, from a ${smallest.sizeKwp} kWp advertising board to ${largest.sizeKwp} kWp for agricultural land`
      : smallest && largest
        ? `, from ${smallest.sizeKwp} to ${largest.sizeKwp} kWp`
        : '';
  return `- [Projects](${SITE}/projects/): a selection of Faraday installations in Iraq${span}.`;
}

function llms(): string {
  const s = solar.en;
  const { modules: moduleWarranty, batteries } = programme.warranty;
  const sSeries = moduleWarranty['S Series'];
  const orSeries = moduleWarranty['OR Series'];
  const { assumptions } = solarData;
  return [
    `# ${contact.company} — exclusive Peimar agent in Iraq`,
    '',
    `> ${intro()}`,
    '',
    'Key facts:',
    '',
    `- Peimar module warranty: S Series (made in Italy) ${sSeries.product}-year product and ${sSeries.power}-year linear power warranty; OR Series and DR Series ${orSeries.product}-year product and ${orSeries.power}-year linear power warranty. Peimar products are covered by a ${programme.insurance.provider} policy against third-party damage caused by product defects. Peimar storage batteries carry a ${batteries.years}-year warranty.`,
    `- Peimar OR…MNDB modules (N-type TOPCon, bifacial, double glass) list a power temperature coefficient of ${fmt(coefficients.topcon, 2)} %/°C; the mono and poly modules of the Revamping Line list ${fmt(coefficients.mono, 2)} and ${fmt(coefficients.poly, 2)} %/°C.`,
    `- Solar yield figures come from PVGIS v5.3 (${PVGIS.creditText}): 1 kWp of ${assumptions.technology} modules, ${assumptions.mounting}, at the optimal tilt and azimuth, ${assumptions.loss}% system losses, ${solarData.database} radiation and ${solarData.meteoDatabase} temperatures, retrieved ${solarData.fetched}.`,
    `- Peimar sizing module used on the city pages: ${flagship.model}, ${flagship.power} W, ${flagship.height} × ${flagship.width} × ${flagship.depth} mm, ${pct(flagship.efficiency ?? 0)}% efficiency.`,
    '',
    '## Products',
    '',
    ...productLines(),
    '',
    '## Tools',
    '',
    `- [Faraday Designer](${SITE}/designer/): free PV string designer, no login. Checks string voltages at the city's design temperatures, current per MPPT and the power ratio with the rules of Peimar's installer tool, and estimates yearly energy with PVGIS data for ${cities.length} Iraqi cities.`,
    '',
    '## Solar data for Iraqi cities',
    '',
    `- [Solar yield across Iraq](${SITE}/solar/): annual yield per kWp, in-plane irradiation, optimal tilt and azimuth and string design temperatures (coldest / typical summer / hottest cell, °C) for ${cities.length} cities, north to south.`,
    ...cities.map(
      (c) =>
        `- [${c.name}](${SITE}/solar/${c.id}/): ${fmt(c.yieldAnnual, 1)} kWh/kWp a year, optimal tilt ${c.optimalTilt}°, design temperatures ${fmt(c.design.tmin)} / ${fmt(c.design.tnom)} / ${fmt(c.design.tmax)} °C (${s.governorate(s.governorates[c.governorate as keyof typeof s.governorates])}).`,
    ),
    ...(milestones.length
      ? ['', '## Company history', '', ...milestones.map((m) => `- ${m.year}: ${HISTORY[m.key] ?? `${m.text.en.title}.`}`)]
      : []),
    '',
    '## Company',
    '',
    `- [About Faraday](${SITE}/about/): the exclusive Peimar agent in Iraq, based in Sulaymaniyah: supply, system design, installation and after-sales.`,
    projectsLine(),
    `- [Contact](${SITE}/contact/): phone, WhatsApp, email, office address in ${address('en').city} and opening hours.`,
    `- [FAQ](${SITE}/faq/): short answers on the Peimar agent in Iraq, warranty, modules for the heat, batteries for power cuts, panel counts, the Designer and quotes.`,
    '',
    '## Languages',
    '',
    `- [العربية — Arabic](${SITE}/ar/): the full site in Arabic, for example ${SITE}/ar/solar/ and ${SITE}/ar/faq/.`,
    `- [کوردی — Kurdish Sorani](${SITE}/ku/): the full site in Kurdish Sorani, for example ${SITE}/ku/solar/ and ${SITE}/ku/faq/.`,
    '',
  ].join('\n');
}

export const GET: APIRoute = () =>
  new Response(
    import.meta.env.SITE_PREVIEW === '1' ? `Preview build, not for AI assistants: read ${SITE}/llms.txt instead.\n` : llms(),
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
