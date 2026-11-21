/*
  Catalog copy in three languages, keyed by the slugs and keys of src/data/catalog.json.
  The English adapts Peimar's wording (research/peimar-notes.md, catalog.json) so that Faraday,
  not Peimar, is the speaker; Peimar's "our production factory" becomes "Peimar's production factory".
  Model codes, brand names and units stay in Latin script in every language.
*/
import type { Locale } from './config.ts';

interface SeriesText {
  tagline: string;
  description: string;
  technology: string[];
}
interface StorageText {
  family: string;
  role: string;
  description: string;
  warrantyNote?: string;
}

const en = {
  categories: {
    modules: 'High-efficiency modules, available in different technologies for every type of installation.',
    hybrid: 'Systems for managing and storing generated energy, for more efficient use.',
    onGrid: 'Single-phase and three-phase inverters for efficient energy management.',
    micro: 'Single-phase microinverters with two MPPT inputs.',
    accessories: 'Devices and components for the management, optimization and integration of the photovoltaic system.',
  },
  series: {
    's-series-sa': {
      tagline: 'Made in Italy module',
      description:
        "Made in Italy, manufactured in Peimar's production factory. Anti-reflective glass and a compact, sturdy frame that can also be anchored on the short side.",
      technology: ['Monocrystalline M10', 'PERC monofacial', 'PERC bifacial', 'TOPCon N-type'],
    },
    's-series-sf': {
      tagline: 'Made in Italy module',
      description:
        "Made in Italy, manufactured in Peimar's production factory. Also available with coloured glass as Green Line (FG) and Red Line (FR), for sites with landscape constraints.",
      technology: ['Monocrystalline PERC'],
    },
    'revamping-line': {
      tagline: 'Revamping Line · Made in Italy',
      description:
        'Made in Italy modules in 54, 60 and 72-cell formats, polycrystalline (SGxxxP) and monocrystalline (SGxxxM, SMxxxM).',
      technology: ['Polycrystalline', 'Monocrystalline'],
    },
    'or-series-or10e': {
      tagline: 'Half-cell module',
      description:
        "Manufactured in Peimar's production factory. TOPCon bifacial technology with anti-reflective double glass, in a compact and sturdy frame.",
      technology: ['Monocrystalline M10 N-type', 'TOPCon bifacial', 'Double glass'],
    },
    'or-series-or10h': {
      tagline: 'Half-cell module',
      description:
        "Manufactured in Peimar's production factory. Half-cut M10 cells, in PERC monofacial versions and TOPCon bifacial versions with double glass (MNDB).",
      technology: ['Monocrystalline M10 half-cut', 'PERC monofacial', 'TOPCon bifacial N-type', 'Double glass'],
    },
    'or-series-or12h': {
      tagline: 'Half-cell module',
      description:
        "Manufactured in Peimar's production factory. Half-cut M12 N-type cells with TOPCon bifacial technology and anti-reflective double glass.",
      technology: ['Monocrystalline M12 half-cut N-type', 'TOPCon bifacial', 'Double glass'],
    },
    'dr-series-dr10h': {
      tagline: 'Half-cut monocrystalline module',
      description: 'Monocrystalline modules with half-cut cells, in 120, 132 and 144-cell formats.',
      technology: ['Monocrystalline', 'Half-cut cells'],
    },
  } satisfies Record<string, SeriesText>,
  familyNotes: {
    'psi-a1p': 'All-in-One system with the PSI-A-BT3.8S battery.',
    'psi-a3p': 'All-in-One system with the PSI-A-BT3.8S battery.',
    'psi-j-rf': 'Retrofit inverter with energy storage, for existing systems.',
  },
  storage: {
    'psi-x-5-8mst-v2': {
      family: 'PSI-X-BT Series · HV storage batteries',
      role: 'Master unit',
      description:
        'High-voltage storage battery, the master unit of the PSI-X-BT Series. Simple installation, with LEDs for status and remaining charge.',
    },
    'psi-x-5-8slv-v2': {
      family: 'PSI-X-BT Series · HV storage batteries',
      role: 'Slave unit',
      description:
        'High-voltage storage battery, the slave unit of the PSI-X-BT Series. Compatible with the Peimar PSI-X1P-HY single-phase and PSI-X3S-HY three-phase hybrid inverters.',
    },
    'psi-x-hs-2-5': {
      family: 'PSI-X-HS · HV storage batteries',
      role: 'Modular: PSI-X-BMS-HS + PSI-X-2.5HS + PSI-X-SBOX-HS',
      description:
        'High-voltage storage batteries built from 2 to 13 PSI-X-2.5HS modules. Remote monitoring through the Peimar X Portal.',
    },
    'psi-x-hs-3-6': {
      family: 'PSI-X-HS · HV storage batteries',
      role: 'Modular: PSI-X-BMS-HS + PSI-X-3.6HS + PSI-X-SBOX-HS',
      description:
        'High-voltage storage batteries built from 2 to 13 PSI-X-3.6HS modules. Remote monitoring through the Peimar X Portal.',
    },
    'psi-a-bt3-8s': {
      family: 'PSI-A Series',
      role: 'Battery module for PSI-A All-in-One systems',
      description:
        'Battery module for PSI-A single-phase and three-phase systems, for residential use. From 1 to 6 modules in series.',
      warrantyNote:
        'The 10-year warranty is valid only after the product is registered on the portal and the monitoring service is activated.',
    },
    'psi-x-prl-bms': {
      family: 'PSI-X-PRL Series',
      role: 'External parallel BMS',
      description: 'External parallel BMS for increased storage capacity.',
    },
    'psi-xcab-pcs100-b215': {
      family: 'PSI-XCAB · Cabinets for C&I',
      role: 'PSI-XCAB-PCS100 | PSI-X-14.3CAB',
      description: 'Storage cabinet for commercial and industrial (C&I) installations.',
    },
    'psi-xcab-x3p50': {
      family: 'PSI-XCAB · Cabinets for C&I',
      role: 'PSI-XCAB-X3P50 | PSI-X-14.3CAB',
      description: 'Storage cabinet for commercial and industrial (C&I) installations.',
    },
  } satisfies Record<string, StorageText>,
  accessoryGroups: {
    'Adapter Box': 'Adapter box',
    Meter: 'Meters',
    'Data hub': 'Data hub',
    'Wi-Fi & LAN dongle': 'Wi-Fi and LAN dongles',
    'Power optimizers': 'Power optimizers',
    'External electrical panel': 'External electrical panels',
    'EV Charger': 'EV chargers',
    'EPS Box': 'EPS boxes',
    'EMS – Energy Management System': 'EMS, energy management system',
  },
  accessories: {
    'psi-x-1pmeter-zi': 'Single-phase meter for the PSI-X Series',
    'psi-x-3pmeter-hy': 'Three-phase meter for the PSI-X Series',
    'psi-x-3pmeter-hy-ta': 'Three-phase meter for the PSI-X Series, with CT',
    'psi-x-1smeter-ta': 'Single-phase meter for the PSI-X Series, with CT',
    'psi-x-3smeter-no-ta-psi-x-3smeter-ta-100a': 'Three-phase meter for the PSI-X Series, with or without CT',
    'psi-x-3smeter-tad': 'Three-phase meter for the PSI-X Series, DUAL model',
    'psi-a-3pmeter-hy': 'Three-phase meter for the PSI-A Series',
    'psi-a-3pmeter-hy-ta': 'Three-phase meter for the PSI-A Series, with CT',
    'psi-x-dh1000': 'Data hub for PSI-X Series inverters',
    'psi-x-h-wifi-3-0': 'Wi-Fi dongle for PSI-X Series inverters',
    'psi-x-h-eth-3-0': 'LAN dongle for PSI-X Series inverters',
    'psi-x-h-wifi-eth': 'Wi-Fi and LAN dongle for PSI-X Series inverters',
    'psi-x1-mtb': 'Single-phase panel that centralises the DC, AC and Full Backup lines',
    'psi-x3-mtb': 'Three-phase panel that centralises the DC, AC and Full Backup lines',
    'psi-x1-bu-epsbox': 'Single-phase EPS box for the PSI-X Series',
    'psi-x3-bu-epsbox': 'Three-phase EPS box for the PSI-X Series',
  },
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
  categories: {
    modules: 'ألواح عالية الكفاءة بتقنيات مختلفة، تجد بينها ما يناسب أي نوع من التركيب.',
    hybrid: 'أنظمة تدير الكهرباء التي تنتجها الألواح وتخزّنها، لتستخدمها بكفاءة أكبر.',
    onGrid: 'إنفرترات أحادية الطور وثلاثية الأطوار تدير طاقة منظومتك بكفاءة.',
    micro: 'مايكرو إنفرترات أحادية الطور بمدخلَي MPPT.',
    accessories: 'أجهزة ومكوّنات لإدارة المنظومة الشمسية وتحسين أدائها وربط أجزائها ببعض.',
  },
  series: {
    's-series-sa': {
      tagline: 'صناعة إيطالية',
      description:
        'يُصنع في مصنع Peimar في إيطاليا. زجاجه مضاد للانعكاس، وإطاره مدمج ومتين ويمكن تثبيته من الجهة القصيرة أيضًا.',
      technology: ['أحادي البلورة M10', 'PERC أحادي الوجه', 'PERC ثنائي الوجه', 'TOPCon من النوع N'],
    },
    's-series-sf': {
      tagline: 'صناعة إيطالية',
      description:
        'يُصنع في مصنع Peimar في إيطاليا، ويتوفر أيضًا بزجاج ملوّن ضمن Green Line (FG) وRed Line (FR) للأماكن التي تشترط الحفاظ على المظهر العام.',
      technology: ['PERC أحادي البلورة'],
    },
    'revamping-line': {
      tagline: 'Revamping Line · صناعة إيطالية',
      description:
        'ألواح مصنوعة في إيطاليا بمقاسات 54 و60 و72 خلية، منها متعددة البلورات (SGxxxP) وأحادية البلورة (SGxxxM وSMxxxM).',
      technology: ['متعدد البلورات', 'أحادي البلورة'],
    },
    'or-series-or10e': {
      tagline: 'لوح بخلايا نصفية',
      description: 'يُصنع في مصنع Peimar بتقنية TOPCon ثنائية الوجه وزجاج مزدوج مضاد للانعكاس، داخل إطار مدمج ومتين.',
      technology: ['أحادي البلورة M10 من النوع N', 'TOPCon ثنائي الوجه', 'زجاج مزدوج'],
    },
    'or-series-or10h': {
      tagline: 'لوح بخلايا نصفية',
      description:
        'يُصنع في مصنع Peimar بخلايا M10 نصفية، ويتوفر بنسخة PERC أحادية الوجه ونسخة TOPCon ثنائية الوجه بزجاج مزدوج (MNDB).',
      technology: ['أحادي البلورة M10 بخلايا نصفية', 'PERC أحادي الوجه', 'TOPCon ثنائي الوجه من النوع N', 'زجاج مزدوج'],
    },
    'or-series-or12h': {
      tagline: 'لوح بخلايا نصفية',
      description: 'يُصنع في مصنع Peimar بخلايا M12 نصفية من النوع N، وتقنية TOPCon ثنائية الوجه، وزجاج مزدوج مضاد للانعكاس.',
      technology: ['أحادي البلورة M12 بخلايا نصفية من النوع N', 'TOPCon ثنائي الوجه', 'زجاج مزدوج'],
    },
    'dr-series-dr10h': {
      tagline: 'لوح أحادي البلورة بخلايا نصفية',
      description: 'ألواح أحادية البلورة بخلايا نصفية، بمقاسات 120 و132 و144 خلية.',
      technology: ['أحادي البلورة', 'خلايا نصفية'],
    },
  },
  familyNotes: {
    'psi-a1p': 'نظام All-in-One يعمل مع بطارية PSI-A-BT3.8S.',
    'psi-a3p': 'نظام All-in-One يعمل مع بطارية PSI-A-BT3.8S.',
    'psi-j-rf': 'إنفرتر Retrofit يضيف تخزين الطاقة إلى منظومة قائمة.',
  },
  storage: {
    'psi-x-5-8mst-v2': {
      family: 'سلسلة PSI-X-BT · بطاريات تخزين عالية الجهد',
      role: 'الوحدة الرئيسية (Master)',
      description:
        'بطارية تخزين عالية الجهد، وهي الوحدة الرئيسية في سلسلة PSI-X-BT. تركيبها سهل، وفيها مؤشرات LED تبيّن حالتها والشحن المتبقي.',
    },
    'psi-x-5-8slv-v2': {
      family: 'سلسلة PSI-X-BT · بطاريات تخزين عالية الجهد',
      role: 'الوحدة التابعة (Slave)',
      description:
        'بطارية تخزين عالية الجهد، وهي الوحدة التابعة في سلسلة PSI-X-BT. تعمل مع إنفرترات Peimar الهجينة PSI-X1P-HY أحادية الطور وPSI-X3S-HY ثلاثية الأطوار.',
    },
    'psi-x-hs-2-5': {
      family: 'PSI-X-HS · بطاريات تخزين عالية الجهد',
      role: 'تصميم معياري: PSI-X-BMS-HS + PSI-X-2.5HS + PSI-X-SBOX-HS',
      description: 'بطاريات تخزين عالية الجهد تُبنى من 2 إلى 13 وحدة PSI-X-2.5HS، ويمكن مراقبتها عن بُعد عبر Peimar X Portal.',
    },
    'psi-x-hs-3-6': {
      family: 'PSI-X-HS · بطاريات تخزين عالية الجهد',
      role: 'تصميم معياري: PSI-X-BMS-HS + PSI-X-3.6HS + PSI-X-SBOX-HS',
      description: 'بطاريات تخزين عالية الجهد تُبنى من 2 إلى 13 وحدة PSI-X-3.6HS، ويمكن مراقبتها عن بُعد عبر Peimar X Portal.',
    },
    'psi-a-bt3-8s': {
      family: 'سلسلة PSI-A',
      role: 'وحدة بطارية لأنظمة PSI-A من نوع All-in-One',
      description:
        'وحدة بطارية لأنظمة PSI-A أحادية الطور وثلاثية الأطوار، مخصصة للبيوت. تُربط منها من 1 إلى 6 وحدات على التوالي.',
      warrantyNote: 'لا يسري ضمان 10 سنوات إلا بعد تسجيل المنتج على البوابة وتفعيل خدمة المراقبة.',
    },
    'psi-x-prl-bms': {
      family: 'سلسلة PSI-X-PRL',
      role: 'BMS خارجي للربط على التوازي',
      description: 'نظام إدارة بطاريات (BMS) خارجي يربط البطاريات على التوازي لزيادة سعة التخزين.',
    },
    'psi-xcab-pcs100-b215': {
      family: 'PSI-XCAB · خزائن للمشاريع التجارية والصناعية',
      role: 'PSI-XCAB-PCS100 | PSI-X-14.3CAB',
      description: 'خزانة تخزين للمشاريع التجارية والصناعية (C&I).',
    },
    'psi-xcab-x3p50': {
      family: 'PSI-XCAB · خزائن للمشاريع التجارية والصناعية',
      role: 'PSI-XCAB-X3P50 | PSI-X-14.3CAB',
      description: 'خزانة تخزين للمشاريع التجارية والصناعية (C&I).',
    },
  },
  accessoryGroups: {
    'Adapter Box': 'صندوق المحوّل',
    Meter: 'العدادات',
    'Data hub': 'مجمّع البيانات',
    'Wi-Fi & LAN dongle': 'وحدات اتصال Wi-Fi وLAN',
    'Power optimizers': 'محسّنات القدرة',
    'External electrical panel': 'لوحات توزيع خارجية',
    'EV Charger': 'شواحن السيارات الكهربائية',
    'EPS Box': 'صناديق EPS',
    'EMS – Energy Management System': 'نظام إدارة الطاقة (EMS)',
  },
  accessories: {
    'psi-x-1pmeter-zi': 'عداد أحادي الطور لسلسلة PSI-X',
    'psi-x-3pmeter-hy': 'عداد ثلاثي الأطوار لسلسلة PSI-X',
    'psi-x-3pmeter-hy-ta': 'عداد ثلاثي الأطوار مع محوّل تيار (CT) لسلسلة PSI-X',
    'psi-x-1smeter-ta': 'عداد أحادي الطور مع محوّل تيار (CT) لسلسلة PSI-X',
    'psi-x-3smeter-no-ta-psi-x-3smeter-ta-100a': 'عداد ثلاثي الأطوار لسلسلة PSI-X، بمحوّل تيار (CT) أو من دونه',
    'psi-x-3smeter-tad': 'عداد ثلاثي الأطوار لسلسلة PSI-X، طراز DUAL',
    'psi-a-3pmeter-hy': 'عداد ثلاثي الأطوار لسلسلة PSI-A',
    'psi-a-3pmeter-hy-ta': 'عداد ثلاثي الأطوار مع محوّل تيار (CT) لسلسلة PSI-A',
    'psi-x-dh1000': 'مجمّع بيانات لإنفرترات سلسلة PSI-X',
    'psi-x-h-wifi-3-0': 'وحدة اتصال Wi-Fi لإنفرترات سلسلة PSI-X',
    'psi-x-h-eth-3-0': 'وحدة اتصال LAN لإنفرترات سلسلة PSI-X',
    'psi-x-h-wifi-eth': 'وحدة اتصال Wi-Fi وLAN لإنفرترات سلسلة PSI-X',
    'psi-x1-mtb': 'لوحة أحادية الطور تجمع خطوط DC وAC وخط الاحتياط الكامل (Full Backup)',
    'psi-x3-mtb': 'لوحة ثلاثية الأطوار تجمع خطوط DC وAC وخط الاحتياط الكامل (Full Backup)',
    'psi-x1-bu-epsbox': 'صندوق EPS أحادي الطور لسلسلة PSI-X',
    'psi-x3-bu-epsbox': 'صندوق EPS ثلاثي الأطوار لسلسلة PSI-X',
  },
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
    `${years} ${years >= 3 && years <= 10 ? 'سنوات' : 'سنة'} حسب أوراق البيانات الفنية لـ\u00a0PSI-X-BT وPSI-X-HS وPSI-A-BT3.8S. أما PSI-A فلا يسري ضمانها إلا بعد تسجيل المنتج وتفعيل خدمة المراقبة.`,
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
  categories: {
    modules: 'پانێڵی کارایی بەرز بە چەند تەکنەلۆژیایەکی جیاواز، بۆ هەر جۆرە دامەزراندنێک.',
    hybrid: 'سیستەمێک کە ئەو کارەبایەی پانێڵەکان بەرهەمی دەهێنن بەڕێوە دەبات و هەڵیدەگرێت، تا باشتر بەکاری بهێنیت.',
    onGrid: 'ئینڤێرتەری تاک فاز و سێ فاز کە وزەی سیستەمەکەت بە کارایی بەڕێوە دەبەن.',
    micro: 'مایکرۆ ئینڤێرتەری تاک فاز، هەریەکەیان بە دوو MPPT.',
    accessories: 'ئامێر و پارچە بۆ بەڕێوەبردنی سیستەمی وزەی خۆر، باشترکردنی کارەکەی و پێکەوەبەستنی بەشەکانی.',
  },
  series: {
    's-series-sa': {
      tagline: 'دروستکراوی ئیتاڵیا',
      description:
        'لە ئیتاڵیا، لە کارگەی Peimar دروست دەکرێت. شووشەکەی دژە ڕەنگدانەوەیە و چوارچێوەکەی تۆکمە و بەهێزە، لە لای کورتیشەوە دەکرێت جێگیر بکرێت.',
      technology: ['تاک کریستاڵ M10', 'PERC یەک ڕوو', 'PERC دوو ڕوو', 'TOPCon جۆری N'],
    },
    's-series-sf': {
      tagline: 'دروستکراوی ئیتاڵیا',
      description:
        'لە ئیتاڵیا، لە کارگەی Peimar دروست دەکرێت. بە شووشەی ڕەنگکراویش هەیە، بە ناوی Green Line (FG) و Red Line (FR)، بۆ ئەو شوێنانەی کە دەبێت دیمەنی گشتییان بپارێزرێت.',
      technology: ['تاک کریستاڵ PERC'],
    },
    'revamping-line': {
      tagline: 'Revamping Line · دروستکراوی ئیتاڵیا',
      description:
        'پانێڵی دروستکراوی ئیتاڵیا بە قەبارەی 54، 60 و 72 خانە، هەم فرە کریستاڵ (SGxxxP) هەم تاک کریستاڵ (SGxxxM و SMxxxM).',
      technology: ['فرە کریستاڵ', 'تاک کریستاڵ'],
    },
    'or-series-or10e': {
      tagline: 'پانێڵی خانە نیوەبڕاو',
      description:
        'لە کارگەی Peimar دروست دەکرێت. تەکنەلۆژیای TOPCon ی دوو ڕوو و شووشەی دووانەی دژە ڕەنگدانەوەی هەیە، لە چوارچێوەیەکی تۆکمە و بەهێزدا.',
      technology: ['تاک کریستاڵ M10 جۆری N', 'TOPCon دوو ڕوو', 'شووشەی دووانە'],
    },
    'or-series-or10h': {
      tagline: 'پانێڵی خانە نیوەبڕاو',
      description:
        'لە کارگەی Peimar دروست دەکرێت، بە خانەی M10 ی نیوەبڕاو. دوو جۆری هەیە: PERC ی یەک ڕوو و TOPCon ی دوو ڕوو بە شووشەی دووانە (MNDB).',
      technology: ['تاک کریستاڵ M10 نیوەبڕاو', 'PERC یەک ڕوو', 'TOPCon دوو ڕوو جۆری N', 'شووشەی دووانە'],
    },
    'or-series-or12h': {
      tagline: 'پانێڵی خانە نیوەبڕاو',
      description:
        'لە کارگەی Peimar دروست دەکرێت، بە خانەی M12 ی نیوەبڕاوی جۆری N، تەکنەلۆژیای TOPCon ی دوو ڕوو و شووشەی دووانەی دژە ڕەنگدانەوە.',
      technology: ['تاک کریستاڵ M12 نیوەبڕاوی جۆری N', 'TOPCon دوو ڕوو', 'شووشەی دووانە'],
    },
    'dr-series-dr10h': {
      tagline: 'پانێڵی تاک کریستاڵی خانە نیوەبڕاو',
      description: 'پانێڵی تاک کریستاڵ بە خانەی نیوەبڕاو، بە قەبارەی 120، 132 و 144 خانە.',
      technology: ['تاک کریستاڵ', 'خانەی نیوەبڕاو'],
    },
  },
  familyNotes: {
    'psi-a1p': 'سیستەمی All-in-One کە لەگەڵ پاتریی PSI-A-BT3.8S کار دەکات.',
    'psi-a3p': 'سیستەمی All-in-One کە لەگەڵ پاتریی PSI-A-BT3.8S کار دەکات.',
    'psi-j-rf': 'ئینڤێرتەری Retrofit کە هەڵگرتنی وزە بۆ سیستەمێکی پێشتر دامەزراو زیاد دەکات.',
  },
  storage: {
    'psi-x-5-8mst-v2': {
      family: 'زنجیرەی PSI-X-BT · پاتریی ڤۆڵتی بەرز',
      role: 'یەکەی سەرەکی (Master)',
      description:
        'پاتریی ڤۆڵتی بەرز و یەکەی سەرەکیی زنجیرەی PSI-X-BT. بە ئاسانی دادەمەزرێت و گڵۆپی LED ی هەیە کە دۆخی پاترییەکە و بارگەی ماوە پیشان دەدات.',
    },
    'psi-x-5-8slv-v2': {
      family: 'زنجیرەی PSI-X-BT · پاتریی ڤۆڵتی بەرز',
      role: 'یەکەی پاشکۆ (Slave)',
      description:
        'پاتریی ڤۆڵتی بەرز و یەکەی پاشکۆی زنجیرەی PSI-X-BT. لەگەڵ ئینڤێرتەرە هایبریدەکانی Peimar کار دەکات: PSI-X1P-HY ی تاک فاز و PSI-X3S-HY ی سێ فاز.',
    },
    'psi-x-hs-2-5': {
      family: 'PSI-X-HS · پاتریی ڤۆڵتی بەرز',
      role: 'مۆدیوڵار: PSI-X-BMS-HS + PSI-X-2.5HS + PSI-X-SBOX-HS',
      description: 'پاتریی ڤۆڵتی بەرز کە لە 2 تا 13 مۆدیوڵی PSI-X-2.5HS پێک دێت. لە ڕێگەی Peimar X Portal لە دوورەوە چاودێری دەکرێت.',
    },
    'psi-x-hs-3-6': {
      family: 'PSI-X-HS · پاتریی ڤۆڵتی بەرز',
      role: 'مۆدیوڵار: PSI-X-BMS-HS + PSI-X-3.6HS + PSI-X-SBOX-HS',
      description: 'پاتریی ڤۆڵتی بەرز کە لە 2 تا 13 مۆدیوڵی PSI-X-3.6HS پێک دێت. لە ڕێگەی Peimar X Portal لە دوورەوە چاودێری دەکرێت.',
    },
    'psi-a-bt3-8s': {
      family: 'زنجیرەی PSI-A',
      role: 'مۆدیوڵی پاتری بۆ سیستەمەکانی All-in-One ی PSI-A',
      description:
        'مۆدیوڵی پاتری بۆ سیستەمەکانی PSI-A ی تاک فاز و سێ فاز، بۆ ماڵان. لە 1 تا 6 مۆدیوڵ بە زنجیرە دەبەسترێن.',
      warrantyNote: 'گەرەنتیی 10 ساڵە تەنها کاتێک کار دەکات کە بەرهەمەکە لە پۆرتاڵەکەدا تۆمار بکرێت و خزمەتگوزاریی چاودێری چالاک بکرێت.',
    },
    'psi-x-prl-bms': {
      family: 'زنجیرەی PSI-X-PRL',
      role: 'BMS ی دەرەکی بۆ بەستنی هاوتەریب',
      description: 'سیستەمی بەڕێوەبردنی پاتری (BMS) ی دەرەکی کە پاترییەکان بە هاوتەریب دەبەستێت بۆ زیادکردنی توانای هەڵگرتن.',
    },
    'psi-xcab-pcs100-b215': {
      family: 'PSI-XCAB · کابینە بۆ پڕۆژەی بازرگانی و پیشەسازی',
      role: 'PSI-XCAB-PCS100 | PSI-X-14.3CAB',
      description: 'کابینەی هەڵگرتنی وزە بۆ پڕۆژە بازرگانی و پیشەسازییەکان (C&I).',
    },
    'psi-xcab-x3p50': {
      family: 'PSI-XCAB · کابینە بۆ پڕۆژەی بازرگانی و پیشەسازی',
      role: 'PSI-XCAB-X3P50 | PSI-X-14.3CAB',
      description: 'کابینەی هەڵگرتنی وزە بۆ پڕۆژە بازرگانی و پیشەسازییەکان (C&I).',
    },
  },
  accessoryGroups: {
    'Adapter Box': 'سندوقی ئەداپتەر',
    Meter: 'پێوەری کارەبا',
    'Data hub': 'ناوەندی داتا',
    'Wi-Fi & LAN dongle': 'دۆنگڵی Wi-Fi و LAN',
    'Power optimizers': 'ئۆپتیمایزەر',
    'External electrical panel': 'تابلۆی کارەبای دەرەکی',
    'EV Charger': 'بارگەکەری ئۆتۆمبێلی کارەبایی',
    'EPS Box': 'سندوقی EPS',
    'EMS – Energy Management System': 'سیستەمی بەڕێوەبردنی وزە (EMS)',
  },
  accessories: {
    'psi-x-1pmeter-zi': 'پێوەری تاک فاز بۆ زنجیرەی PSI-X',
    'psi-x-3pmeter-hy': 'پێوەری سێ فاز بۆ زنجیرەی PSI-X',
    'psi-x-3pmeter-hy-ta': 'پێوەری سێ فاز لەگەڵ گۆڕەری تەزوو (CT) بۆ زنجیرەی PSI-X',
    'psi-x-1smeter-ta': 'پێوەری تاک فاز لەگەڵ گۆڕەری تەزوو (CT) بۆ زنجیرەی PSI-X',
    'psi-x-3smeter-no-ta-psi-x-3smeter-ta-100a': 'پێوەری سێ فاز بۆ زنجیرەی PSI-X، بە گۆڕەری تەزوو (CT) یان بەبێ ئەو',
    'psi-x-3smeter-tad': 'پێوەری سێ فاز بۆ زنجیرەی PSI-X، مۆدێلی DUAL',
    'psi-a-3pmeter-hy': 'پێوەری سێ فاز بۆ زنجیرەی PSI-A',
    'psi-a-3pmeter-hy-ta': 'پێوەری سێ فاز لەگەڵ گۆڕەری تەزوو (CT) بۆ زنجیرەی PSI-A',
    'psi-x-dh1000': 'ناوەندی داتا بۆ ئینڤێرتەرەکانی زنجیرەی PSI-X',
    'psi-x-h-wifi-3-0': 'دۆنگڵی Wi-Fi بۆ ئینڤێرتەرەکانی زنجیرەی PSI-X',
    'psi-x-h-eth-3-0': 'دۆنگڵی LAN بۆ ئینڤێرتەرەکانی زنجیرەی PSI-X',
    'psi-x-h-wifi-eth': 'دۆنگڵی Wi-Fi و LAN بۆ ئینڤێرتەرەکانی زنجیرەی PSI-X',
    'psi-x1-mtb': 'تابلۆی تاک فاز کە هێڵەکانی DC و AC و هێڵی پاڵپشتی تەواو (Full Backup) لە یەک شوێندا کۆ دەکاتەوە',
    'psi-x3-mtb': 'تابلۆی سێ فاز کە هێڵەکانی DC و AC و هێڵی پاڵپشتی تەواو (Full Backup) لە یەک شوێندا کۆ دەکاتەوە',
    'psi-x1-bu-epsbox': 'سندوقی EPS ی تاک فاز بۆ زنجیرەی PSI-X',
    'psi-x3-bu-epsbox': 'سندوقی EPS ی سێ فاز بۆ زنجیرەی PSI-X',
  },
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

/* Lookups by data key. They return undefined for a catalog entry that has no copy yet. */
type Keyed<T> = Partial<Record<string, T>>;
export const seriesText = (locale: Locale, slug: string) => (catalogText[locale].series as Keyed<SeriesText>)[slug];
export const storageText = (locale: Locale, slug: string) => (catalogText[locale].storage as Keyed<StorageText>)[slug];
export const familyNote = (locale: Locale, slug: string) => (catalogText[locale].familyNotes as Keyed<string>)[slug];
export const accessoryText = (locale: Locale, slug: string) => (catalogText[locale].accessories as Keyed<string>)[slug];
export const accessoryGroup = (locale: Locale, group: string) =>
  (catalogText[locale].accessoryGroups as Keyed<string>)[group] ?? group;
export const warrantyDocLabel = (locale: Locale, label: string) =>
  (catalogText[locale].warrantyDocs as Keyed<string>)[label] ?? label;

const chemistry: Record<Locale, Record<string, string>> = {
  en: {},
  ar: { "Lithium-ion (LiFePO4)": "ليثيوم أيون (LiFePO4)", "Li-ion (LFP)": "ليثيوم أيون (LFP)" },
  ckb: { "Lithium-ion (LiFePO4)": "لیتیۆم ئایۆن (LiFePO4)", "Li-ion (LFP)": "لیتیۆم ئایۆن (LFP)" },
};
export const chemistryText = (locale: Locale, value: string) => chemistry[locale][value] ?? value;
