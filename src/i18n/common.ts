import type { Locale } from './config.ts';
import { ltr } from './text.ts';

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
      title: 'Design a Peimar system.',
      library: (modules: number, inverters: number) => `${modules} modules · ${inverters} inverters`,
    },
    call: 'Call',
    email: 'Email',
    office: 'Office',
    hours: 'Opening hours',
  },
  footer: {
    eyebrow: 'Exclusive Peimar agent in Iraq',
    claim: (year: number | null) =>
      year === null
        ? 'Solar systems designed and installed from Sulaymaniyah.'
        : `Solar systems designed and installed from Sulaymaniyah since ${year}.`,
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
  help: {
    label: 'Help',
    question: 'Need help?',
    action: 'Chat on WhatsApp',
    message: 'Hello Faraday, I need help choosing a solar system.',
  },
  units: { panels: 'panels', inverters: 'inverters', panelsCount: (n: number): string => (n === 1 ? 'panel' : 'panels') },
};

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
    modules: 'الألواح الشمسية',
    hybrid: 'إنفرترات هجينة وبطاريات',
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
  primaryNav: 'القائمة الرئيسية',
  mobileNav: 'قائمة التنقل',
  menu: {
    allProducts: 'كل المنتجات',
    lines: {
      hybrid: 'خزّن طاقة الشمس لليل ولساعات انقطاع الكهرباء.',
      modules: 'ألواح عالية الكفاءة بعدة تقنيات، تناسب أي نوع من التركيب.',
      onGrid: 'أحادية الطور وثلاثية الأطوار، للبيوت والمباني التجارية.',
      micro: 'مايكرو إنفرترات أحادية الطور بمدخلَي MPPT.',
      accessories: 'محسّنات قدرة وعدّادات وشواحن سيارات كهربائية وأنظمة لإدارة الطاقة.',
    },
    count: {
      series: arCount('سلسلة واحدة', 'سلسلتان', 'سلاسل', 'سلسلة'),
      products: arCount('منتج واحد', 'منتجان', 'منتجات', 'منتجًا'),
      models: arCount('طراز واحد', 'طرازان', 'طرازات', 'طرازًا'),
    },
    designer: {
      eyebrow: 'أداة التصميم من Faraday',
      title: 'صمّم منظومة Peimar مجانًا.',
      library: (modules: number, inverters: number) =>
        `${arCount('لوح واحد', 'لوحان', 'ألواح', 'لوحًا')(modules)} · ${arCount('إنفرتر واحد', 'إنفرتران', 'إنفرترات', 'إنفرترًا')(inverters)}`,
    },
    call: 'اتصل بنا',
    email: 'راسلنا',
    office: 'المكتب',
    hours: 'أوقات الدوام',
  },
  footer: {
    eyebrow: 'الوكيل الحصري لـ\u00a0Peimar في العراق',
    claim: (year: number | null) =>
      year === null
        ? 'نصمّم منظومات الطاقة الشمسية ونركّبها من السليمانية.'
        : `منذ عام ${year} ونحن نصمّم منظومات الطاقة الشمسية ونركّبها من السليمانية.`,
    openDesigner: 'افتح أداة التصميم',
    products: 'المنتجات',
    company: 'الشركة',
    contact: 'تواصل معنا',
    whatsapp: 'واتساب',
    faq: 'الأسئلة الشائعة',
    solar: 'الطاقة الشمسية في مدن العراق',
    rights: 'جميع الحقوق محفوظة.',
    trademark: `اسم Peimar وشعارها علامتان تجاريتان لشركة ${ltr('Peimar S.r.l.')}، يستخدمهما وكيلها الحصري في العراق.`,
  },
  help: {
    label: 'المساعدة',
    question: 'تحتاج مساعدة؟',
    action: 'راسلنا على واتساب',
    message: 'مرحبًا Faraday، أحتاج مساعدة في اختيار منظومة طاقة شمسية.',
  },
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
    about: 'دەربارەی ئێمە',
    contact: 'پەیوەندی',
  },
  productNav: {
    modules: 'پانێڵی خۆر',
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
  primaryNav: 'مێنیوی سەرەکی',
  mobileNav: 'مێنیوی مۆبایل',
  menu: {
    allProducts: 'هەموو بەرهەمەکان',
    lines: {
      hybrid: 'وزەی خۆر بۆ شەو و کاتی بڕانی کارەبا هەڵبگرە.',
      modules: 'پانێڵی کارایی بەرز بە چەند تەکنەلۆژیایەکی جیاواز، بۆ هەر جۆرە دامەزراندنێک.',
      onGrid: 'تاک فاز و سێ فاز، بۆ ماڵ و بینای بازرگانی.',
      micro: 'مایکرۆ ئینڤێرتەری تاک فاز بە دوو MPPT.',
      accessories: 'ئۆپتیمایزەر، پێوەری وزە، بارگاویکەری ئۆتۆمبێلی کارەبایی و بەڕێوەبردنی وزە.',
    },
    count: {
      series: (n: number) => `${n} زنجیرە`,
      products: (n: number) => `${n} بەرهەم`,
      models: (n: number) => `${n} مۆدێل`,
    },
    designer: {
      eyebrow: 'دیزاینەری Faraday',
      title: 'سیستەمێکی Peimar دیزاین بکە، بێبەرامبەر.',
      library: (modules: number, inverters: number) => `${modules} پانێڵ · ${inverters} ئینڤێرتەر`,
    },
    call: 'تەلەفۆن',
    email: 'ئیمەیڵ',
    office: 'نووسینگە',
    hours: 'کاتی دەوام',
  },
  footer: {
    eyebrow: 'بریکاری تایبەتی Peimar لە عێراق',
    claim: (year: number | null) =>
      year === null
        ? 'لە سلێمانی سیستەمی وزەی خۆر دیزاین دەکەین و دایدەمەزرێنین.'
        : `لە ساڵی ${year}ەوە لە سلێمانی سیستەمی وزەی خۆر دیزاین دەکەین و دایدەمەزرێنین.`,
    openDesigner: 'دیزاینەر بکەرەوە',
    products: 'بەرهەمەکان',
    company: 'کۆمپانیا',
    contact: 'پەیوەندی',
    whatsapp: 'واتسئاپ',
    faq: 'پرسیارە باوەکان',
    solar: 'داتای وزەی خۆری شارەکان',
    rights: 'هەموو مافەکان پارێزراون.',
    trademark: `ناو و لۆگۆی Peimar وەک نیشانەی بازرگانی دەگەڕێنەوە بۆ کۆمپانیای ${ltr('Peimar S.r.l.')}، و بریکارە تایبەتەکەی لە عێراق بەکاریان دەهێنێت.`,
  },
  help: {
    label: 'یارمەتی',
    question: 'یارمەتیت پێویستە؟',
    action: 'لە واتسئاپ پەیوەندیمان پێوە بکە',
    message: 'سڵاو Faraday، یارمەتیم پێویستە بۆ هەڵبژاردنی سیستەمێکی وزەی خۆر.',
  },
  units: { panels: 'پانێڵ', inverters: 'ئینڤێرتەر', panelsCount: () => 'پانێڵ' },
};

export const common: Record<Locale, CommonStrings> = { en, ar, ckb };

/** English name of each language, set small under its native name in the switchers. */
export const languageNames: Record<Locale, string> = { en: 'English', ar: 'Arabic', ckb: 'Kurdish · Sorani' };

/** First-visit bar on English pages when the browser prefers Arabic or Kurdish; written in that language. */
export const langHint: Record<'ar' | 'ckb', { text: string; action: string; dismiss: string }> = {
  ar: { text: 'هذه الصفحة متوفّرة بالعربية.', action: 'افتح النسخة العربية', dismiss: 'إغلاق' },
  ckb: { text: 'ئەم پەڕەیە بە کوردیش بەردەستە.', action: 'بە کوردی بیخوێنەوە', dismiss: 'داخستن' },
};
