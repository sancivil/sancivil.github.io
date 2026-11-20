export const contact = {
  company: 'Faraday Co.',
  phoneDisplay: '+964 773 698 9694',
  phoneHref: 'tel:+9647736989694',
  whatsappHref: 'https://wa.me/9647736989694',
  email: 'info@faradayiq.com',
  street: 'Qasmlu Street',
  city: 'Sulaymaniyah',
  country: 'Iraq',
  postalCode: '46001',
  mapsHref: 'https://www.google.com/maps/search/?api=1&query=46001%20Qasimlu%20Street%2C%20Sulaymaniyah%2C%20Iraq',
  founded: 2017,
};

export type NavKey = 'products' | 'designer' | 'projects' | 'about' | 'contact';
export type ProductNavKey = 'modules' | 'hybrid' | 'onGrid' | 'micro' | 'accessories';

/** Site-root paths; localize with localizePath() from src/i18n/config.ts. Labels live in src/i18n/common.ts. */
export const nav: { key: NavKey; href: string; accent?: boolean }[] = [
  { key: 'products', href: '/products/' },
  { key: 'designer', href: '/designer/', accent: true },
  { key: 'projects', href: '/projects/' },
  { key: 'about', href: '/about/' },
  { key: 'contact', href: '/contact/' },
];

export const productNav: { key: ProductNavKey; href: string }[] = [
  { key: 'modules', href: '/products/modules/' },
  { key: 'hybrid', href: '/products/hybrid/' },
  { key: 'onGrid', href: '/products/on-grid/' },
  { key: 'micro', href: '/products/micro/' },
  { key: 'accessories', href: '/products/accessories/' },
];

export function whatsappLink(message: string): string {
  return `${contact.whatsappHref}?text=${encodeURIComponent(message)}`;
}
