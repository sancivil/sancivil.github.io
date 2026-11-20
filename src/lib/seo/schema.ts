/*
  schema.org JSON-LD builders. Every top-level node carries its own @context so each
  <script type="application/ld+json"> block stands alone. Nodes refer to the LocalBusiness
  emitted by src/layouts/Base.astro through BUSINESS_ID.
*/
import { localeMeta, localizePath, type Locale } from '../../i18n/config.ts';

export type JsonLdNode = Record<string, unknown>;

const SITE = 'https://faradayiq.com';
export const BUSINESS_ID = `${SITE}/#business`;

const CONTEXT = 'https://schema.org';
const business = { '@id': BUSINESS_ID };

/** Absolute URL for a site-root path: absolute('/ar/solar/') -> 'https://faradayiq.com/ar/solar/'. */
export const absolute = (path: string) => new URL(path, SITE).toString();

/** Bidi isolates and no-break spaces help on screen; structured data gets plain text. */
const plain = (s: string) => s.replace(/[\u2066-\u2069\u200e\u200f]/g, '').replace(/\u00a0/g, ' ');

const websiteId = (locale: Locale) => `${absolute(localizePath('/', locale))}#website`;

export function website(locale: Locale): JsonLdNode {
  return {
    '@context': CONTEXT,
    '@type': 'WebSite',
    '@id': websiteId(locale),
    url: absolute(localizePath('/', locale)),
    name: 'Faraday',
    alternateName: 'Faraday Co.',
    inLanguage: localeMeta[locale].lang,
    publisher: business,
  };
}

export function webPage(page: {
  url: string;
  name: string;
  description: string;
  locale: Locale;
  breadcrumb?: JsonLdNode;
  about?: JsonLdNode;
  type?: 'WebPage' | 'CollectionPage';
}): JsonLdNode {
  return {
    '@context': CONTEXT,
    '@type': page.type ?? 'WebPage',
    '@id': `${page.url}#webpage`,
    url: page.url,
    name: plain(page.name),
    description: plain(page.description),
    inLanguage: localeMeta[page.locale].lang,
    isPartOf: { '@id': websiteId(page.locale) },
    publisher: business,
    ...(page.breadcrumb && { breadcrumb: { '@id': page.breadcrumb['@id'] } }),
    ...(page.about && { about: page.about }),
  };
}

/** Items from the site root to the current page, with absolute URLs. */
export function breadcrumbList(items: { name: string; url: string }[]): JsonLdNode {
  return {
    '@context': CONTEXT,
    '@type': 'BreadcrumbList',
    '@id': `${items[items.length - 1].url}#breadcrumb`,
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: plain(item.name),
      item: item.url,
    })),
  };
}

export function faqPage(qas: { q: string; a: string }[], page?: { url: string; locale: Locale }): JsonLdNode {
  return {
    '@context': CONTEXT,
    '@type': 'FAQPage',
    ...(page && { '@id': `${page.url}#faq`, url: page.url, inLanguage: localeMeta[page.locale].lang }),
    publisher: business,
    mainEntity: qas.map(({ q, a }) => ({
      '@type': 'Question',
      name: plain(q),
      acceptedAnswer: { '@type': 'Answer', text: plain(a) },
    })),
  };
}

export interface ProductProperty {
  name: string;
  value: number | string;
  /** UN/CEFACT code: WTT (W), KWT (kW), MMT (mm), KGM (kg), P1 (%), CEL (°C), VLT (V), AMP (A). */
  unitCode?: string;
  unitText?: string;
}

/** A Peimar product as Faraday lists it. No offers: the site publishes no prices. */
export function product(p: {
  name: string;
  model: string;
  description: string;
  image: string;
  url: string;
  category?: string;
  additionalProperty?: ProductProperty[];
}): JsonLdNode {
  return {
    '@context': CONTEXT,
    '@type': 'Product',
    '@id': `${p.url}#${p.model.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    name: plain(p.name),
    model: p.model,
    mpn: p.model,
    description: plain(p.description),
    image: absolute(p.image),
    url: p.url,
    brand: { '@type': 'Brand', name: 'Peimar' },
    manufacturer: { '@type': 'Organization', name: 'Peimar S.r.l.', url: 'https://peimar.com/' },
    ...(p.category && { category: plain(p.category) }),
    ...(p.additionalProperty?.length && {
      additionalProperty: p.additionalProperty.map((prop) => ({ '@type': 'PropertyValue', ...prop })),
    }),
  };
}

/** Source facts for the PVGIS figures (research/iraq-solar.md). Spread into dataset(). */
export const PVGIS = {
  creator: {
    '@type': 'Organization',
    name: 'European Commission, Joint Research Centre (JRC)',
    url: 'https://joint-research-centre.ec.europa.eu/',
  },
  isBasedOn: 'https://re.jrc.ec.europa.eu/pvg_tools/en/',
  creditText: 'PVGIS © European Union, 2001–2026',
  citation:
    'PVGIS © European Union, 2001–2026. Photovoltaic Geographical Information System (PVGIS), European Commission Joint Research Centre, https://re.jrc.ec.europa.eu/pvg_tools/en/',
  measurementTechnique:
    'PVGIS API v5.3 PVcalc (1 kWp crystalline silicon, 14% system losses, free-standing, optimal tilt and azimuth; PVGIS-SARAH3 radiation) and TMY (ERA5 temperatures)',
  temporalCoverage: '2005/2023',
};

export function dataset(d: {
  name: string;
  description: string;
  url: string;
  locale: Locale;
  creator: JsonLdNode;
  isBasedOn: string;
  creditText: string;
  citation: string;
  measurementTechnique: string;
  temporalCoverage: string;
  spatialCoverage: JsonLdNode | JsonLdNode[];
  variableMeasured: { name: string; unitText: string }[];
  dateModified: string;
  keywords?: string[];
}): JsonLdNode {
  return {
    '@context': CONTEXT,
    '@type': 'Dataset',
    '@id': `${d.url}#dataset`,
    name: plain(d.name),
    description: plain(d.description),
    url: d.url,
    inLanguage: localeMeta[d.locale].lang,
    creator: d.creator,
    publisher: business,
    isBasedOn: d.isBasedOn,
    creditText: d.creditText,
    copyrightNotice: d.creditText,
    citation: d.citation,
    measurementTechnique: d.measurementTechnique,
    temporalCoverage: d.temporalCoverage,
    spatialCoverage: d.spatialCoverage,
    variableMeasured: d.variableMeasured.map((v) => ({ '@type': 'PropertyValue', name: plain(v.name), unitText: v.unitText })),
    dateModified: d.dateModified,
    isAccessibleForFree: true,
    ...(d.keywords && { keywords: d.keywords.map(plain) }),
  };
}

/** A city as a schema.org Place with coordinates (nested node, no @context). */
export function place(city: { name: string; lat: number; lon: number; elevation?: number; region?: string }): JsonLdNode {
  return {
    '@type': 'Place',
    name: plain(city.name),
    geo: {
      '@type': 'GeoCoordinates',
      latitude: city.lat,
      longitude: city.lon,
      ...(city.elevation !== undefined && { elevation: city.elevation }),
    },
    address: {
      '@type': 'PostalAddress',
      addressLocality: plain(city.name),
      ...(city.region && { addressRegion: plain(city.region) }),
      addressCountry: 'IQ',
    },
  };
}
