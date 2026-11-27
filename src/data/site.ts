/* Contact details from the owner content (src/content/generated/contact.json): small and safe for client scripts. */
import contactData from '../content/generated/contact.json';
import type { Company, Phone } from '../content/contract.ts';
import type { Locale } from '../i18n/config.ts';

const data = contactData as Pick<Company, 'name' | 'phones' | 'email' | 'address' | 'foundedYear'>;
const waHref = (phone: Phone) => `https://wa.me/${phone.e164.slice(1)}`;

/** Every phone in the owner's order, with its call link and, for WhatsApp numbers, its chat link. */
export const phones = data.phones.map((phone) => ({
  ...phone,
  href: `tel:${phone.e164}`,
  whatsappHref: phone.whatsapp ? waHref(phone) : null,
}));
const primary = phones.find((phone) => phone.primary) ?? phones[0];
const whatsapp = phones.find((phone) => phone.whatsapp) ?? primary;

export const contact = {
  company: data.name,
  /** The primary number's call link. */
  phoneHref: primary.href,
  /** The first WhatsApp number. */
  whatsappHref: waHref(whatsapp),
  email: data.email,
  street: data.address.text.en.street,
  city: data.address.text.en.city,
  country: data.address.text.en.country,
  postalCode: data.address.postalCode,
  mapsHref: data.address.mapsUrl,
  founded: data.foundedYear,
};

/** The office address in one language, for client scripts (pages use address() from src/content). */
export const localAddress = (locale: Locale) => data.address.text[locale];

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
