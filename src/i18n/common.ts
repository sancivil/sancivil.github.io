import type { Locale } from './config.ts';

/** Keeps a time range on one line: word joiners (U+2060) around the dash stop a line break there. */
const keep = (s: string) => s.replaceAll('–', '\u2060–\u2060');

const en = {
  nav: {
    products: 'Products',
    designer: 'Designer',
    projects: 'Projects',
    about: 'About',
    contact: 'Contact',
  },
  productNav: {
    modules: 'Photovoltaic modules',
    hybrid: 'Hybrid inverters & storage',
    onGrid: 'On-grid inverters',
    micro: 'Microinverters',
    accessories: 'Accessories',
  },
  skip: 'Skip to content',
  home: 'Faraday, home',
  getQuote: 'Get a quote',
  menuOpen: 'Open menu',
  menuClose: 'Close menu',
  language: 'Language',
  primaryNav: 'Primary',
  mobileNav: 'Mobile',
  footer: {
    eyebrow: 'Exclusive Peimar agent in Iraq',
    claim: (year: number) => `Italian photovoltaics, specified and installed from Sulaymaniyah since ${year}.`,
    openDesigner: 'Open the Designer',
    products: 'Products',
    company: 'Company',
    contact: 'Contact',
    whatsapp: 'WhatsApp',
    faq: 'Questions & answers',
    solar: 'Solar data by city',
    rights: 'All rights reserved.',
    trademark: 'Peimar and the Peimar logo are trademarks of Peimar S.r.l., used by its exclusive agent in Iraq.',
  },
  address: { street: 'Qasmlu Street', city: 'Sulaymaniyah', country: 'Iraq', place: 'Sulaymaniyah, Iraq' },
  hours: `Saturday–Thursday ${keep('08:00–17:00')} · Friday closed`,
  units: { panels: 'panels', inverters: 'inverters' },
};

/** Keeps a time range or figure in left-to-right order inside Arabic/Kurdish text (U+2066 … U+2069). */
const ltr = (s: string) => `\u2066${keep(s)}\u2069`;

export type CommonStrings = typeof en;

const ar: CommonStrings = {
  nav: {
    products: 'المنتجات',
    designer: 'أداة التصميم',
    projects: 'المشاريع',
    about: 'من نحن',
    contact: 'اتصل بنا',
  },
  productNav: {
    modules: 'الألواح الكهروضوئية',
    hybrid: 'إنفرترات هجينة وتخزين الطاقة',
    onGrid: 'إنفرترات مرتبطة بالشبكة',
    micro: 'مايكرو إنفرتر',
    accessories: 'الملحقات',
  },
  skip: 'انتقل إلى المحتوى',
  home: 'Faraday، الصفحة الرئيسية',
  getQuote: 'اطلب عرض سعر',
  menuOpen: 'فتح القائمة',
  menuClose: 'إغلاق القائمة',
  language: 'اللغة',
  primaryNav: 'التنقل الرئيسي',
  mobileNav: 'قائمة الجوال',
  footer: {
    eyebrow: 'الوكيل الحصري لـ Peimar في العراق',
    claim: (year: number) => `أنظمة كهروضوئية إيطالية، نصمّمها ونركّبها من السليمانية منذ ${year}.`,
    openDesigner: 'افتح أداة التصميم',
    products: 'المنتجات',
    company: 'الشركة',
    contact: 'التواصل',
    whatsapp: 'واتساب',
    faq: 'الأسئلة الشائعة',
    solar: 'بيانات الطاقة الشمسية حسب المدينة',
    rights: 'جميع الحقوق محفوظة.',
    trademark: 'Peimar وشعار Peimar علامتان تجاريتان لشركة Peimar S.r.l.، يستخدمهما وكيلها الحصري في العراق.',
  },
  address: { street: 'شارع قاسملو', city: 'السليمانية', country: 'العراق', place: 'السليمانية، العراق' },
  hours: `من السبت إلى الخميس ${ltr('08:00–17:00')} · الجمعة عطلة`,
  units: { panels: 'لوح', inverters: 'إنفرتر' },
};

const ckb: CommonStrings = {
  nav: {
    products: 'بەرهەمەکان',
    designer: 'دیزاینەر',
    projects: 'پڕۆژەکان',
    about: 'دەربارە',
    contact: 'پەیوەندی',
  },
  productNav: {
    modules: 'پانێڵە خۆرییەکان',
    hybrid: 'ئینڤێرتەری هایبرید و پاتری',
    onGrid: 'ئینڤێرتەری سەر بە تۆڕ',
    micro: 'مایکرۆ ئینڤێرتەر',
    accessories: 'کەرەستە تەواوکەرەکان',
  },
  skip: 'بڕۆ بۆ ناوەڕۆک',
  home: 'Faraday، پەڕەی سەرەکی',
  getQuote: 'داوای نرخ بکە',
  menuOpen: 'کردنەوەی مێنیو',
  menuClose: 'داخستنی مێنیو',
  language: 'زمان',
  primaryNav: 'ڕێنیشاندەری سەرەکی',
  mobileNav: 'مێنیوی مۆبایل',
  footer: {
    eyebrow: 'بریکاری تایبەتی Peimar لە عێراق',
    claim: (year: number) => `سیستەمی وزەی خۆری ئیتاڵی، لە سلێمانییەوە دیزاین و دامەزراندنی دەکەین لە ساڵی ${year}ەوە.`,
    openDesigner: 'دیزاینەر بکەرەوە',
    products: 'بەرهەمەکان',
    company: 'کۆمپانیا',
    contact: 'پەیوەندی',
    whatsapp: 'واتسئاپ',
    faq: 'پرسیارە باوەکان',
    solar: 'داتای خۆر بەپێی شار',
    rights: 'هەموو مافەکان پارێزراون.',
    trademark: 'Peimar و لۆگۆی Peimar نیشانەی بازرگانیی کۆمپانیای Peimar S.r.l.ن و بریکارە تایبەتەکەی لە عێراق بەکاریان دەهێنێت.',
  },
  address: { street: 'شەقامی قاسملۆ', city: 'سلێمانی', country: 'عێراق', place: 'سلێمانی، عێراق' },
  hours: `شەممە تا پێنجشەممە ${ltr('08:00–17:00')} · هەینی داخراوە`,
  units: { panels: 'پانێڵ', inverters: 'ئینڤێرتەر' },
};

export const common: Record<Locale, CommonStrings> = { en, ar, ckb };
