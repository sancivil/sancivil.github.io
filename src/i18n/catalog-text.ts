/*
  Peimar's programme in three languages (insurance, warranties, documents, chemistries), and the lookups of the
  owner's catalog copy from src/content. The English adapts Peimar's wording (research/peimar-notes.md) so that
  Faraday, not Peimar, is the speaker. Model codes, brand names and units stay in Latin script in every language.
*/
import { accessories, batteries, families, items, modules } from '../content/index.ts';
import type { Locale } from './config.ts';
import { products } from './products.ts';

const en = {
  insurance: {
    headline: 'Peimar products are covered by QBE Insurance.',
    text: "A comprehensive policy with QBE Insurance Group, one of the world's leading insurers and reinsurers, protects customers against third-party damage caused by product defects.",
    coverages: [
      {
        name: 'Third-party liability',
        text: 'Covers unintentional damage to third parties caused by the insured, including property damage and bodily injury.',
      },
      {
        name: 'Product liability',
        text: 'Covers damage caused by defects in products manufactured, sold or distributed by the insured.',
      },
      {
        name: "Employer's liability",
        text: 'Covers compensation for injuries suffered by employees in the work environment.',
      },
    ],
  },
  batteryWarranty: (years: number) =>
    `${years} years, per the PSI-X-BT, PSI-X-HS and PSI-A-BT3.8S datasheets. For PSI-A, the warranty applies only after product registration and activation of the monitoring service.`,
  documents: {
    installationManual: 'Installation manual',
    installationManualAR: 'Installation manual',
    productsFlyer: 'Product range flyer 2026',
    companyBrochure: 'Peimar company brochure',
    companyPresentation: 'Peimar company presentation',
  },
  warrantyDocs: {
    'PV modules warranty 2026': 'PV module warranty 2026',
    'PSI-X Series inverter warranty': 'PSI-X Series inverter warranty',
    'PSI-X storage warranty 2026': 'PSI-X storage warranty 2026',
    'PSI-A Series warranty conditions': 'PSI-A Series warranty conditions',
    'Warranty registration': 'Warranty registration',
  },
};

export type CatalogText = typeof en;

const ar: CatalogText = {
  insurance: {
    headline: 'منتجات Peimar مؤمَّنة لدى QBE.',
    text: 'لدى Peimar وثيقة تأمين شاملة مع مجموعة QBE، وهي من كبرى شركات التأمين وإعادة التأمين في العالم. تحمي هذه الوثيقة العملاء إذا تسبّب عيب في المنتج بضرر لطرف ثالث.',
    coverages: [
      {
        name: 'المسؤولية تجاه الغير',
        text: 'تغطي ما يسببه المؤمَّن له للغير من أضرار غير مقصودة، ومنها الأضرار المادية والإصابات الجسدية.',
      },
      {
        name: 'المسؤولية عن المنتجات',
        text: 'تغطي الأضرار الناتجة عن عيوب في المنتجات التي يصنّعها المؤمَّن له أو يبيعها أو يوزّعها.',
      },
      {
        name: 'مسؤولية صاحب العمل',
        text: 'تغطي تعويض العاملين عن الإصابات التي يتعرّضون لها أثناء العمل.',
      },
    ],
  },
  batteryWarranty: (years: number) =>
    `${years} ${products.ar.years(years)} حسب أوراق البيانات الفنية لـ\u00a0PSI-X-BT وPSI-X-HS وPSI-A-BT3.8S. أما PSI-A فلا يسري ضمانها إلا بعد تسجيل المنتج وتفعيل خدمة المراقبة.`,
  documents: {
    installationManual: 'دليل التركيب',
    installationManualAR: 'دليل التركيب',
    productsFlyer: 'نشرة المنتجات 2026',
    companyBrochure: 'كتيّب تعريفي بشركة Peimar',
    companyPresentation: 'العرض التعريفي لشركة Peimar',
  },
  warrantyDocs: {
    'PV modules warranty 2026': 'ضمان الألواح الشمسية 2026',
    'PSI-X Series inverter warranty': 'ضمان إنفرترات سلسلة PSI-X',
    'PSI-X storage warranty 2026': 'ضمان بطاريات PSI-X 2026',
    'PSI-A Series warranty conditions': 'شروط ضمان سلسلة PSI-A',
    'Warranty registration': 'تسجيل الضمان',
  },
};

const ckb: CatalogText = {
  insurance: {
    headline: 'بەرهەمەکانی Peimar لای QBE بیمە کراون.',
    text: 'Peimar بیمەنامەیەکی گشتگیری لەگەڵ گرووپی QBE هەیە، کە یەکێکە لە گەورەترین کۆمپانیاکانی بیمە و بیمەی دووبارە لە جیهاندا. ئەم بیمەنامەیە کڕیاران دەپارێزێت ئەگەر کەموکوڕییەکی بەرهەم زیان بە لایەنی سێیەم بگەیەنێت.',
    coverages: [
      {
        name: 'بەرپرسیارێتی بەرامبەر لایەنی سێیەم',
        text: 'ئەو زیانانە دەگرێتەوە کە بیمەکراو بێ مەبەست بە لایەنی سێیەمی دەگەیەنێت، وەک زیان بە موڵک و برینداربوونی کەسەکان.',
      },
      {
        name: 'بەرپرسیارێتیی بەرهەم',
        text: 'ئەو زیانانە دەگرێتەوە کە لە کەموکوڕیی ئەو بەرهەمانەوە دروست دەبن کە بیمەکراو دروستیان دەکات، دەیانفرۆشێت یان دابەشیان دەکات.',
      },
      {
        name: 'بەرپرسیارێتیی خاوەنکار',
        text: 'قەرەبووی کارمەندان دەکاتەوە بۆ ئەو برینانەی لە کاتی کارکردندا تووشیان دەبێت.',
      },
    ],
  },
  batteryWarranty: (years: number) =>
    `${years} ساڵ، بەپێی داتاشیتەکانی PSI-X-BT، PSI-X-HS و PSI-A-BT3.8S. بۆ PSI-A، گەرەنتییەکە تەنها دوای تۆمارکردنی بەرهەم و چالاککردنی خزمەتگوزاریی چاودێری دەست پێ دەکات.`,
  documents: {
    installationManual: 'ڕێبەری دامەزراندن',
    installationManualAR: 'ڕێبەری دامەزراندن',
    productsFlyer: 'بڵاوکراوەی بەرهەمەکان 2026',
    companyBrochure: 'بڕۆشووری کۆمپانیای Peimar',
    companyPresentation: 'ناساندنی کۆمپانیای Peimar',
  },
  warrantyDocs: {
    'PV modules warranty 2026': 'گەرەنتیی پانێڵی خۆر 2026',
    'PSI-X Series inverter warranty': 'گەرەنتیی ئینڤێرتەرەکانی زنجیرەی PSI-X',
    'PSI-X storage warranty 2026': 'گەرەنتیی پاترییەکانی PSI-X 2026',
    'PSI-A Series warranty conditions': 'مەرجەکانی گەرەنتیی زنجیرەی PSI-A',
    'Warranty registration': 'تۆمارکردنی گەرەنتی',
  },
};

export const catalogText: Record<Locale, CatalogText> = { en, ar, ckb };

/*
  The owner's copy of a catalog entry in one language, from src/content. A language the owner left out is
  undefined, and so is a field: pages leave that text out instead of showing another language.
*/
const bySlug = <T extends { slug: string }>(list: T[], slug: string) => list.find((entry) => entry.slug === slug);
export const seriesText = (locale: Locale, slug: string) => bySlug(modules, slug)?.text[locale];
export const storageText = (locale: Locale, slug: string) => bySlug(batteries, slug)?.text[locale];
export const familyNote = (locale: Locale, slug: string) =>
  bySlug(Object.values(families).flat(), slug)?.text[locale]?.note;
export const accessoryText = (locale: Locale, slug: string) => bySlug(accessories, slug)?.text[locale]?.line;
export const itemText = (locale: Locale, slug: string) => bySlug(items, slug)?.text[locale];
export const warrantyDocLabel = (locale: Locale, label: string) =>
  (catalogText[locale].warrantyDocs as Partial<Record<string, string>>)[label] ?? label;

const chemistry: Record<Locale, Record<string, string>> = {
  en: {},
  ar: { "Lithium-ion (LiFePO4)": "ليثيوم أيون (LiFePO4)", "Li-ion (LFP)": "ليثيوم أيون (LFP)" },
  ckb: { "Lithium-ion (LiFePO4)": "لیتیۆم ئایۆن (LiFePO4)", "Li-ion (LFP)": "لیتیۆم ئایۆن (LFP)" },
};
export const chemistryText = (locale: Locale, value: string) => chemistry[locale][value] ?? value;
