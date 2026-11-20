export const locales = ['en', 'ar', 'ckb'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

export interface LocaleMeta {
  /** Name of the language in that language, for the switcher. */
  label: string;
  /** BCP 47 tag for <html lang>. ckb = Central Kurdish (Sorani). */
  lang: string;
  /** Value for <link rel="alternate" hreflang>. */
  hreflang: string;
  ogLocale: string;
  dir: 'ltr' | 'rtl';
  /** URL segment; undefined = site root (English). */
  segment: string | undefined;
}

export const localeMeta: Record<Locale, LocaleMeta> = {
  en: { label: 'English', lang: 'en', hreflang: 'en', ogLocale: 'en_US', dir: 'ltr', segment: undefined },
  ar: { label: 'العربية', lang: 'ar', hreflang: 'ar', ogLocale: 'ar_IQ', dir: 'rtl', segment: 'ar' },
  ckb: { label: 'کوردی', lang: 'ckb', hreflang: 'ku', ogLocale: 'ckb_IQ', dir: 'rtl', segment: 'ku' },
};

const bySegment = new Map(locales.map((l) => [localeMeta[l].segment, l]));

/** Use as `export const getStaticPaths = () => localeParams();` in src/pages/[...locale]/*.astro */
export function localeParams() {
  return locales.map((locale) => ({ params: { locale: localeMeta[locale].segment } }));
}

/** Multiply dynamic-route paths by every locale: withLocales([{ params: { slug }, props }]). */
export function withLocales<T extends { params: Record<string, string | undefined> }>(paths: T[]) {
  return locales.flatMap((locale) =>
    paths.map((p) => ({ ...p, params: { ...p.params, locale: localeMeta[locale].segment } })),
  );
}

export function localeFromParam(segment: string | undefined): Locale {
  return bySegment.get(segment) ?? defaultLocale;
}

export function localeFromPath(pathname: string): Locale {
  return localeFromParam(pathname.split('/')[1] || undefined);
}

/** '/ar/products/' -> '/products/' */
export function stripLocale(pathname: string): string {
  const first = pathname.split('/')[1];
  const loc = bySegment.get(first);
  if (!first || !loc || loc === defaultLocale) return pathname;
  return pathname.slice(first.length + 1) || '/';
}

/** '/products/' + 'ar' -> '/ar/products/'. Pass site-root paths (starting with '/'), hashes and queries are kept. */
export function localizePath(path: string, locale: Locale): string {
  const segment = localeMeta[locale].segment;
  if (!segment || !path.startsWith('/')) return path;
  return `/${segment}${path}`;
}

export function isRtl(locale: Locale): boolean {
  return localeMeta[locale].dir === 'rtl';
}
