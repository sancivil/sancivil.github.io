import type { Locale } from './config.ts';

/** Keeps a time range on one line: word joiners (U+2060) around the dash stop a line break there. */
const keep = (s: string) => s.replaceAll('–', '\u2060–\u2060');

const enCount = (one: string, many: string) => (n: number) => `${n} ${n === 1 ? one : many}`;

/** Arabic counted nouns: 1 and 2 have their own forms, 3–10 take the plural, 11–99 the singular. */
const arCount = (one: string, two: string, few: string, many: string) => (n: number) => {
  if (n === 1) return one;
  if (n === 2) return two;
  return `${n} ${n % 100 >= 3 && n % 100 <= 10 ? few : many}`;
};

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
  menu: {
    allProducts: 'All products',
    lines: {
      hybrid: 'Store solar energy for the evening and for grid outages.',
      modules: 'High-efficiency modules in several technologies, for every installation.',
      onGrid: 'Single-phase and three-phase, from homes to commercial buildings.',
      micro: 'Single-phase microinverters with two MPPT inputs.',
      accessories: 'Optimizers, meters, EV chargers and energy management.',
    },
    count: {
      series: enCount('series', 'series'),
      products: enCount('product', 'products'),
      models: enCount('model', 'models'),
    },
    designer: {
      eyebrow: 'Faraday Designer',
      title: 'Design a Peimar system. No login.',
      library: (modules: number, inverters: number) => `${modules} modules · ${inverters} inverters`,
    },
    call: 'Call',
    email: 'Email',
    office: 'Office',
    hours: 'Opening hours',
  },
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
  units: { panels: 'panels', inverters: 'inverters', panelsCount: (n: number): string => (n === 1 ? 'panel' : 'panels') },
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
    micro: 'مايكرو إنفرترات',
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
  menu: {
    allProducts: 'كل المنتجات',
    lines: {
      hybrid: 'خزّن الطاقة الشمسية للمساء ولأوقات انقطاع الكهرباء.',
      modules: 'ألواح عالية الكفاءة بتقنيات متعددة، تناسب كل أنواع التركيب.',
      onGrid: 'أحادية الطور وثلاثية الأطوار، من المنازل إلى المباني التجارية.',
      micro: 'مايكرو إنفرترات أحادية الطور بمدخلَي MPPT.',
      accessories: 'محسّنات وعدادات وشواحن للسيارات الكهربائية وإدارة الطاقة.',
    },
    count: {
      series: arCount('سلسلة واحدة', 'سلسلتان', 'سلاسل', 'سلسلة'),
      products: arCount('منتج واحد', 'منتجان', 'منتجات', 'منتجًا'),
      models: arCount('طراز واحد', 'طرازان', 'طرازات', 'طرازًا'),
    },
    designer: {
      eyebrow: 'أداة التصميم من Faraday',
      title: 'صمّم نظام Peimar. بلا تسجيل دخول.',
      library: (modules: number, inverters: number) =>
        `${arCount('لوح واحد', 'لوحان', 'ألواح', 'لوحًا')(modules)} · ${arCount('إنفرتر واحد', 'إنفرتران', 'إنفرترات', 'إنفرترًا')(inverters)}`,
    },
    call: 'اتصل بنا',
    email: 'راسلنا',
    office: 'المكتب',
    hours: 'أوقات العمل',
  },
  footer: {
    eyebrow: 'الوكيل الحصري لـ\u00a0Peimar في العراق',
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
  units: {
    panels: 'لوح',
    inverters: 'إنفرتر',
    panelsCount: (n: number) => {
      const r = n % 100;
      if (n === 2) return 'لوحان';
      if (r >= 3 && r <= 10) return 'ألواح';
      if (r >= 11 && r <= 99) return 'لوحًا';
      return 'لوح';
    },
  },
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
  menu: {
    allProducts: 'هەموو بەرهەمەکان',
    lines: {
      hybrid: 'وزەی خۆر بۆ ئێواران و کاتی بڕانی کارەبا هەڵبگرە.',
      modules: 'پانێڵی کارایی بەرز بە چەند تەکنەلۆژیایەک، بۆ هەموو جۆرە دامەزراندنێک.',
      onGrid: 'تاک فاز و سێ فاز، لە ماڵەوە تا بینای بازرگانی.',
      micro: 'مایکرۆ ئینڤێرتەری تاک فاز بە دوو MPPT.',
      accessories: 'ئۆپتیمایزەر، مێتەر، بارگاویکەری ئۆتۆمبێلی کارەبایی و بەڕێوەبردنی وزە.',
    },
    count: {
      series: (n: number) => `${n} زنجیرە`,
      products: (n: number) => `${n} بەرهەم`,
      models: (n: number) => `${n} مۆدێل`,
    },
    designer: {
      eyebrow: 'دیزاینەری Faraday',
      title: 'سیستەمێکی Peimar دیزاین بکە. بێ چوونەژوورەوە.',
      library: (modules: number, inverters: number) => `${modules} پانێڵ · ${inverters} ئینڤێرتەر`,
    },
    call: 'تەلەفۆن',
    email: 'ئیمەیڵ',
    office: 'نووسینگە',
    hours: 'کاتی کار',
  },
  footer: {
    eyebrow: 'بریکاری تایبەتی Peimar لە عێراق',
    claim: (year: number) => `سیستەمی وزەی خۆری ئیتاڵی، کە لە ساڵی ${year}ەوە لە سلێمانییەوە دیزاینی دەکەین و دایدەمەزرێنین.`,
    openDesigner: 'دیزاینەر بکەرەوە',
    products: 'بەرهەمەکان',
    company: 'کۆمپانیا',
    contact: 'پەیوەندی',
    whatsapp: 'واتسئاپ',
    faq: 'پرسیارە باوەکان',
    solar: 'داتای وزەی خۆر بەپێی شار',
    rights: 'هەموو مافەکان پارێزراون.',
    trademark: 'Peimar و لۆگۆی Peimar، وەک نیشانەی بازرگانیی Peimar S.r.l.، لەلایەن بریکارە تایبەتەکەیەوە لە عێراق بەکاردەهێنرێن.',
  },
  address: { street: 'شەقامی قاسملۆ', city: 'سلێمانی', country: 'عێراق', place: 'سلێمانی، عێراق' },
  hours: `شەممە تا پێنجشەممە ${ltr('08:00–17:00')} · هەینی داخراوە`,
  units: { panels: 'پانێڵ', inverters: 'ئینڤێرتەر', panelsCount: () => 'پانێڵ' },
};

export const common: Record<Locale, CommonStrings> = { en, ar, ckb };

/** English name of each language, set small under its native name in the switchers. */
export const languageNames: Record<Locale, string> = { en: 'English', ar: 'Arabic', ckb: 'Kurdish · Sorani' };

/** First-visit bar on English pages when the browser prefers Arabic or Kurdish; written in that language. */
export const langHint: Record<'ar' | 'ckb', { text: string; action: string; dismiss: string }> = {
  ar: { text: 'هذه الصفحة متوفرة بالعربية.', action: 'اقرأها بالعربية', dismiss: 'إغلاق' },
  ckb: { text: 'ئەم پەڕەیە بە کوردیش بەردەستە.', action: 'بە کوردی بیخوێنەوە', dismiss: 'داخستن' },
};
