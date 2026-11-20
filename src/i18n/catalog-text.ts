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
    modules: 'ألواح عالية الكفاءة، متوفرة بتقنيات مختلفة تناسب كل أنواع التركيب.',
    hybrid: 'أنظمة لإدارة الطاقة المنتَجة وتخزينها، لاستخدامها بكفاءة أكبر.',
    onGrid: 'إنفرترات أحادية الطور وثلاثية الأطوار لإدارة الطاقة بكفاءة.',
    micro: 'مايكرو إنفرترات أحادية الطور بمدخلَي MPPT.',
    accessories: 'أجهزة ومكوّنات لإدارة النظام الكهروضوئي وتحسين أدائه وربط أجزائه.',
  },
  series: {
    's-series-sa': {
      tagline: 'لوح مصنوع في إيطاليا',
      description:
        'صُنع في إيطاليا في مصنع Peimar. زجاج مضاد للانعكاس، وإطار مدمج ومتين يمكن تثبيته من الجانب القصير أيضًا.',
      technology: ['أحادي البلورة M10', 'PERC أحادي الوجه', 'PERC ثنائي الوجه', 'TOPCon من النوع N'],
    },
    's-series-sf': {
      tagline: 'لوح مصنوع في إيطاليا',
      description:
        'صُنع في إيطاليا في مصنع Peimar. يتوفر أيضًا بزجاج ملوّن في نسختَي Green Line (FG) و Red Line (FR)، للمواقع الخاضعة لقيود حماية المشهد العام.',
      technology: ['PERC أحادي البلورة'],
    },
    'revamping-line': {
      tagline: 'Revamping Line · صُنع في إيطاليا',
      description:
        'ألواح مصنوعة في إيطاليا بصيغ 54 و60 و72 خلية، متعددة البلورات (SGxxxP) وأحادية البلورة (SGxxxM و SMxxxM).',
      technology: ['متعدد البلورات', 'أحادي البلورة'],
    },
    'or-series-or10e': {
      tagline: 'لوح بخلايا نصفية',
      description: 'مصنوع في مصنع Peimar. تقنية TOPCon ثنائية الوجه مع زجاج مزدوج مضاد للانعكاس، في إطار مدمج ومتين.',
      technology: ['أحادي البلورة M10 من النوع N', 'TOPCon ثنائي الوجه', 'زجاج مزدوج'],
    },
    'or-series-or10h': {
      tagline: 'لوح بخلايا نصفية',
      description:
        'مصنوع في مصنع Peimar. خلايا M10 نصفية، بنسخ PERC أحادية الوجه ونسخ TOPCon ثنائية الوجه بزجاج مزدوج (MNDB).',
      technology: ['أحادي البلورة M10 بخلايا نصفية', 'PERC أحادي الوجه', 'TOPCon ثنائي الوجه من النوع N', 'زجاج مزدوج'],
    },
    'or-series-or12h': {
      tagline: 'لوح بخلايا نصفية',
      description: 'مصنوع في مصنع Peimar. خلايا M12 نصفية من النوع N بتقنية TOPCon ثنائية الوجه وزجاج مزدوج مضاد للانعكاس.',
      technology: ['أحادي البلورة M12 بخلايا نصفية من النوع N', 'TOPCon ثنائي الوجه', 'زجاج مزدوج'],
    },
    'dr-series-dr10h': {
      tagline: 'لوح أحادي البلورة بخلايا نصفية',
      description: 'ألواح أحادية البلورة بخلايا نصفية، بصيغ 120 و132 و144 خلية.',
      technology: ['أحادي البلورة', 'خلايا نصفية'],
    },
  },
  familyNotes: {
    'psi-a1p': 'نظام متكامل (All-in-One) مع بطارية PSI-A-BT3.8S.',
    'psi-a3p': 'نظام متكامل (All-in-One) مع بطارية PSI-A-BT3.8S.',
    'psi-j-rf': 'إنفرتر Retrofit مع تخزين الطاقة، للأنظمة القائمة.',
  },
  storage: {
    'psi-x-5-8mst-v2': {
      family: 'PSI-X-BT Series · بطاريات تخزين عالية الجهد',
      role: 'الوحدة الرئيسية (Master)',
      description:
        'بطارية تخزين عالية الجهد، الوحدة الرئيسية في سلسلة PSI-X-BT. تركيب بسيط، مع مؤشرات LED للحالة والشحن المتبقي.',
    },
    'psi-x-5-8slv-v2': {
      family: 'PSI-X-BT Series · بطاريات تخزين عالية الجهد',
      role: 'الوحدة التابعة (Slave)',
      description:
        'بطارية تخزين عالية الجهد، الوحدة التابعة في سلسلة PSI-X-BT. متوافقة مع إنفرترات Peimar الهجينة PSI-X1P-HY أحادية الطور و PSI-X3S-HY ثلاثية الأطوار.',
    },
    'psi-x-hs-2-5': {
      family: 'PSI-X-HS · بطاريات تخزين عالية الجهد',
      role: 'نظام معياري: PSI-X-BMS-HS + PSI-X-2.5HS + PSI-X-SBOX-HS',
      description: 'بطاريات تخزين عالية الجهد تتكوّن من 2 إلى 13 وحدة PSI-X-2.5HS. مراقبة عن بُعد عبر Peimar X Portal.',
    },
    'psi-x-hs-3-6': {
      family: 'PSI-X-HS · بطاريات تخزين عالية الجهد',
      role: 'نظام معياري: PSI-X-BMS-HS + PSI-X-3.6HS + PSI-X-SBOX-HS',
      description: 'بطاريات تخزين عالية الجهد تتكوّن من 2 إلى 13 وحدة PSI-X-3.6HS. مراقبة عن بُعد عبر Peimar X Portal.',
    },
    'psi-a-bt3-8s': {
      family: 'PSI-A Series',
      role: 'وحدة بطارية لأنظمة PSI-A المتكاملة (All-in-One)',
      description:
        'وحدة بطارية لأنظمة PSI-A أحادية الطور وثلاثية الأطوار، للاستخدام السكني. من 1 إلى 6 وحدات موصولة على التوالي.',
      warrantyNote: 'يسري ضمان السنوات العشر فقط بعد تسجيل المنتج على البوابة وتفعيل خدمة المراقبة.',
    },
    'psi-x-prl-bms': {
      family: 'PSI-X-PRL Series',
      role: 'نظام BMS خارجي للتوصيل على التوازي',
      description: 'نظام إدارة بطاريات (BMS) خارجي للتوصيل على التوازي، لزيادة سعة التخزين.',
    },
    'psi-xcab-pcs100-b215': {
      family: 'PSI-XCAB · خزائن للقطاعين التجاري والصناعي',
      role: 'PSI-XCAB-PCS100 | PSI-X-14.3CAB',
      description: 'خزانة تخزين للمنشآت التجارية والصناعية (C&I).',
    },
    'psi-xcab-x3p50': {
      family: 'PSI-XCAB · خزائن للقطاعين التجاري والصناعي',
      role: 'PSI-XCAB-X3P50 | PSI-X-14.3CAB',
      description: 'خزانة تخزين للمنشآت التجارية والصناعية (C&I).',
    },
  },
  accessoryGroups: {
    'Adapter Box': 'صندوق المحوّل',
    Meter: 'العدادات',
    'Data hub': 'مجمّع البيانات',
    'Wi-Fi & LAN dongle': 'وحدات Wi-Fi و LAN',
    'Power optimizers': 'محسّنات القدرة',
    'External electrical panel': 'لوحات كهربائية خارجية',
    'EV Charger': 'شواحن السيارات الكهربائية',
    'EPS Box': 'صناديق EPS',
    'EMS – Energy Management System': 'EMS، نظام إدارة الطاقة',
  },
  accessories: {
    'psi-x-1pmeter-zi': 'عداد أحادي الطور لسلسلة PSI-X',
    'psi-x-3pmeter-hy': 'عداد ثلاثي الأطوار لسلسلة PSI-X',
    'psi-x-3pmeter-hy-ta': 'عداد ثلاثي الأطوار لسلسلة PSI-X، مع محوّل تيار (CT)',
    'psi-x-1smeter-ta': 'عداد أحادي الطور لسلسلة PSI-X، مع محوّل تيار (CT)',
    'psi-x-3smeter-no-ta-psi-x-3smeter-ta-100a': 'عداد ثلاثي الأطوار لسلسلة PSI-X، مع محوّل تيار (CT) أو بدونه',
    'psi-x-3smeter-tad': 'عداد ثلاثي الأطوار لسلسلة PSI-X، طراز DUAL',
    'psi-a-3pmeter-hy': 'عداد ثلاثي الأطوار لسلسلة PSI-A',
    'psi-a-3pmeter-hy-ta': 'عداد ثلاثي الأطوار لسلسلة PSI-A، مع محوّل تيار (CT)',
    'psi-x-dh1000': 'مجمّع بيانات لإنفرترات سلسلة PSI-X',
    'psi-x-h-wifi-3-0': 'وحدة Wi-Fi لإنفرترات سلسلة PSI-X',
    'psi-x-h-eth-3-0': 'وحدة LAN لإنفرترات سلسلة PSI-X',
    'psi-x-h-wifi-eth': 'وحدة Wi-Fi و LAN لإنفرترات سلسلة PSI-X',
    'psi-x1-mtb': 'لوحة أحادية الطور تجمع خطوط DC و AC وخط التغذية الاحتياطية الكاملة',
    'psi-x3-mtb': 'لوحة ثلاثية الأطوار تجمع خطوط DC و AC وخط التغذية الاحتياطية الكاملة',
    'psi-x1-bu-epsbox': 'صندوق EPS أحادي الطور لسلسلة PSI-X',
    'psi-x3-bu-epsbox': 'صندوق EPS ثلاثي الأطوار لسلسلة PSI-X',
  },
  insurance: {
    headline: 'منتجات Peimar مشمولة بتأمين QBE.',
    text: 'وثيقة تأمين شاملة مع مجموعة QBE للتأمين، إحدى أبرز شركات التأمين وإعادة التأمين في العالم، تحمي العملاء من الأضرار التي تلحق بالغير بسبب عيوب المنتجات.',
    coverages: [
      {
        name: 'المسؤولية تجاه الغير',
        text: 'تغطي الأضرار غير المقصودة التي يسببها المؤمَّن له للغير، بما فيها الأضرار المادية والإصابات الجسدية.',
      },
      {
        name: 'مسؤولية المنتج',
        text: 'تغطي الأضرار الناتجة عن عيوب في المنتجات التي يصنّعها المؤمَّن له أو يبيعها أو يوزّعها.',
      },
      {
        name: 'مسؤولية صاحب العمل',
        text: 'تغطي التعويض عن الإصابات التي يتعرّض لها الموظفون في بيئة العمل.',
      },
    ],
  },
  batteryWarranty: (years: number) =>
    `${years} سنوات وفق أوراق البيانات الفنية لـ\u00a0PSI-X-BT و PSI-X-HS و PSI-A-BT3.8S. أما PSI-A فيسري ضمانها فقط بعد تسجيل المنتج وتفعيل خدمة المراقبة.`,
  documents: {
    installationManual: 'دليل التركيب',
    installationManualAR: 'دليل التركيب',
    productsFlyer: 'نشرة تشكيلة المنتجات 2026',
    companyBrochure: 'كتيّب شركة Peimar',
    companyPresentation: 'العرض التعريفي لشركة Peimar',
  },
  warrantyDocs: {
    'PV modules warranty 2026': 'ضمان الألواح الكهروضوئية 2026',
    'PSI-X Series inverter warranty': 'ضمان إنفرترات سلسلة PSI-X',
    'PSI-X storage warranty 2026': 'ضمان بطاريات PSI-X 2026',
    'PSI-A Series warranty conditions': 'شروط ضمان سلسلة PSI-A',
    'Warranty registration': 'تسجيل الضمان',
  },
};

const ckb: CatalogText = {
  categories: {
    modules: 'پانێڵی کارایی بەرز، بە تەکنەلۆژیای جیاواز بۆ هەموو جۆرە دامەزراندنێک.',
    hybrid: 'سیستەم بۆ بەڕێوەبردن و هەڵگرتنی ئەو وزەیەی بەرهەم دێت، بۆ بەکارهێنانێکی کاراتر.',
    onGrid: 'ئینڤێرتەری تاک فاز و سێ فاز بۆ بەڕێوەبردنی وزە بە کارایی.',
    micro: 'مایکرۆ ئینڤێرتەری تاک فاز، هەریەکەیان بە دوو MPPT.',
    accessories: 'ئامێر و پێکهاتە بۆ بەڕێوەبردن، باشترکردن و پێکەوەبەستنی سیستەمی وزەی خۆر.',
  },
  series: {
    's-series-sa': {
      tagline: 'پانێڵی دروستکراوی ئیتاڵیا',
      description:
        'لە ئیتاڵیا و لە کارگەی Peimar دروستکراوە. شووشەی دژە ڕەنگدانەوە و چوارچێوەیەکی چڕ و بەهێز، کە دەتوانرێت لە لای کورتیشەوە جێگیر بکرێت.',
      technology: ['تاک کریستاڵ M10', 'PERC یەک ڕوو', 'PERC دوو ڕوو', 'TOPCon جۆری N'],
    },
    's-series-sf': {
      tagline: 'پانێڵی دروستکراوی ئیتاڵیا',
      description:
        'لە ئیتاڵیا و لە کارگەی Peimar دروستکراوە. بە شووشەی ڕەنگاوڕەنگیش هەیە لە وەشانەکانی Green Line (FG) و Red Line (FR)، بۆ ئەو شوێنانەی مەرجی پاراستنی دیمەنی گشتییان لەسەرە.',
      technology: ['تاک کریستاڵ PERC'],
    },
    'revamping-line': {
      tagline: 'Revamping Line · دروستکراوی ئیتاڵیا',
      description:
        'پانێڵی دروستکراوی ئیتاڵیا بە شێوازی 54، 60 و 72 خانە، فرە کریستاڵ (SGxxxP) و تاک کریستاڵ (SGxxxM، SMxxxM).',
      technology: ['فرە کریستاڵ', 'تاک کریستاڵ'],
    },
    'or-series-or10e': {
      tagline: 'پانێڵی خانەی نیوەبڕاو',
      description:
        'لە کارگەی Peimar دروستکراوە. تەکنەلۆژیای TOPCon ی دوو ڕوو لەگەڵ شووشەی دووانەی دژە ڕەنگدانەوە، لە چوارچێوەیەکی چڕ و بەهێزدا.',
      technology: ['تاک کریستاڵ M10 جۆری N', 'TOPCon دوو ڕوو', 'شووشەی دووانە'],
    },
    'or-series-or10h': {
      tagline: 'پانێڵی خانەی نیوەبڕاو',
      description:
        'لە کارگەی Peimar دروستکراوە. خانەی M10 ی نیوەبڕاو، بە وەشانی PERC ی یەک ڕوو و وەشانی TOPCon ی دوو ڕوو بە شووشەی دووانە (MNDB).',
      technology: ['تاک کریستاڵ M10 نیوەبڕاو', 'PERC یەک ڕوو', 'TOPCon دوو ڕوو جۆری N', 'شووشەی دووانە'],
    },
    'or-series-or12h': {
      tagline: 'پانێڵی خانەی نیوەبڕاو',
      description:
        'لە کارگەی Peimar دروستکراوە. خانەی M12 ی نیوەبڕاوی جۆری N بە تەکنەلۆژیای TOPCon ی دوو ڕوو و شووشەی دووانەی دژە ڕەنگدانەوە.',
      technology: ['تاک کریستاڵ M12 نیوەبڕاوی جۆری N', 'TOPCon دوو ڕوو', 'شووشەی دووانە'],
    },
    'dr-series-dr10h': {
      tagline: 'پانێڵی تاک کریستاڵی نیوەبڕاو',
      description: 'پانێڵی تاک کریستاڵ بە خانەی نیوەبڕاو، بە شێوازی 120، 132 و 144 خانە.',
      technology: ['تاک کریستاڵ', 'خانەی نیوەبڕاو'],
    },
  },
  familyNotes: {
    'psi-a1p': 'سیستەمی هەمووی-لە-یەک (All-in-One) لەگەڵ پاتریی PSI-A-BT3.8S.',
    'psi-a3p': 'سیستەمی هەمووی-لە-یەک (All-in-One) لەگەڵ پاتریی PSI-A-BT3.8S.',
    'psi-j-rf': 'ئینڤێرتەری Retrofit لەگەڵ هەڵگرتنی وزە، بۆ سیستەمە هەبووەکان.',
  },
  storage: {
    'psi-x-5-8mst-v2': {
      family: 'PSI-X-BT Series · پاتریی هەڵگرتنی ڤۆڵتی بەرز',
      role: 'یەکەی سەرەکی (Master)',
      description:
        'پاتریی هەڵگرتنی ڤۆڵتی بەرز، یەکەی سەرەکیی زنجیرەی PSI-X-BT. دامەزراندنی سادە، لەگەڵ گڵۆپی LED بۆ دۆخ و بارگەی ماوە.',
    },
    'psi-x-5-8slv-v2': {
      family: 'PSI-X-BT Series · پاتریی هەڵگرتنی ڤۆڵتی بەرز',
      role: 'یەکەی پاشکۆ (Slave)',
      description:
        'پاتریی هەڵگرتنی ڤۆڵتی بەرز، یەکەی پاشکۆی زنجیرەی PSI-X-BT. گونجاوە لەگەڵ ئینڤێرتەرە هایبریدەکانی Peimar: PSI-X1P-HY ی تاک فاز و PSI-X3S-HY ی سێ فاز.',
    },
    'psi-x-hs-2-5': {
      family: 'PSI-X-HS · پاتریی هەڵگرتنی ڤۆڵتی بەرز',
      role: 'مۆدیوڵار: PSI-X-BMS-HS + PSI-X-2.5HS + PSI-X-SBOX-HS',
      description: 'پاتریی هەڵگرتنی ڤۆڵتی بەرز، لە 2 تا 13 مۆدیوڵی PSI-X-2.5HS. چاودێریی لە دوورەوە لە ڕێگەی Peimar X Portal.',
    },
    'psi-x-hs-3-6': {
      family: 'PSI-X-HS · پاتریی هەڵگرتنی ڤۆڵتی بەرز',
      role: 'مۆدیوڵار: PSI-X-BMS-HS + PSI-X-3.6HS + PSI-X-SBOX-HS',
      description: 'پاتریی هەڵگرتنی ڤۆڵتی بەرز، لە 2 تا 13 مۆدیوڵی PSI-X-3.6HS. چاودێریی لە دوورەوە لە ڕێگەی Peimar X Portal.',
    },
    'psi-a-bt3-8s': {
      family: 'PSI-A Series',
      role: 'مۆدیوڵی پاتری بۆ سیستەمە هەمووی-لە-یەکەکانی PSI-A (All-in-One)',
      description:
        'مۆدیوڵی پاتری بۆ سیستەمەکانی PSI-A ی تاک فاز و سێ فاز، بۆ بەکارهێنانی ماڵان. لە 1 تا 6 مۆدیوڵ بە زنجیرە دەبەسترێن.',
      warrantyNote: 'گەرەنتیی 10 ساڵە تەنها دوای تۆمارکردنی بەرهەم لە پۆرتاڵەکە و چالاککردنی خزمەتگوزاریی چاودێری کار دەکات.',
    },
    'psi-x-prl-bms': {
      family: 'PSI-X-PRL Series',
      role: 'BMS ی دەرەکی بۆ بەستنی هاوتەریب',
      description: 'سیستەمی بەڕێوەبردنی پاتری (BMS) ی دەرەکی بۆ بەستنی هاوتەریب، بۆ زیادکردنی توانای هەڵگرتن.',
    },
    'psi-xcab-pcs100-b215': {
      family: 'PSI-XCAB · کابینە بۆ بواری بازرگانی و پیشەسازی',
      role: 'PSI-XCAB-PCS100 | PSI-X-14.3CAB',
      description: 'کابینەی هەڵگرتن بۆ دامەزراندنی بازرگانی و پیشەسازی (C&I).',
    },
    'psi-xcab-x3p50': {
      family: 'PSI-XCAB · کابینە بۆ بواری بازرگانی و پیشەسازی',
      role: 'PSI-XCAB-X3P50 | PSI-X-14.3CAB',
      description: 'کابینەی هەڵگرتن بۆ دامەزراندنی بازرگانی و پیشەسازی (C&I).',
    },
  },
  accessoryGroups: {
    'Adapter Box': 'سندوقی ئەداپتەر',
    Meter: 'پێوەری کارەبا',
    'Data hub': 'ناوەندی داتا',
    'Wi-Fi & LAN dongle': 'دۆنگڵی Wi-Fi و LAN',
    'Power optimizers': 'ئۆپتیمایزەری توانا',
    'External electrical panel': 'تابلۆی کارەبای دەرەکی',
    'EV Charger': 'بارگەکەری ئۆتۆمبێلی کارەبایی',
    'EPS Box': 'سندوقی EPS',
    'EMS – Energy Management System': 'EMS، سیستەمی بەڕێوەبردنی وزە',
  },
  accessories: {
    'psi-x-1pmeter-zi': 'پێوەری تاک فاز بۆ زنجیرەی PSI-X',
    'psi-x-3pmeter-hy': 'پێوەری سێ فاز بۆ زنجیرەی PSI-X',
    'psi-x-3pmeter-hy-ta': 'پێوەری سێ فاز بۆ زنجیرەی PSI-X، لەگەڵ گۆڕەری تەزوو (CT)',
    'psi-x-1smeter-ta': 'پێوەری تاک فاز بۆ زنجیرەی PSI-X، لەگەڵ گۆڕەری تەزوو (CT)',
    'psi-x-3smeter-no-ta-psi-x-3smeter-ta-100a': 'پێوەری سێ فاز بۆ زنجیرەی PSI-X، لەگەڵ گۆڕەری تەزوو (CT) یان بەبێ ئەو',
    'psi-x-3smeter-tad': 'پێوەری سێ فاز بۆ زنجیرەی PSI-X، مۆدێلی DUAL',
    'psi-a-3pmeter-hy': 'پێوەری سێ فاز بۆ زنجیرەی PSI-A',
    'psi-a-3pmeter-hy-ta': 'پێوەری سێ فاز بۆ زنجیرەی PSI-A، لەگەڵ گۆڕەری تەزوو (CT)',
    'psi-x-dh1000': 'ناوەندی داتا بۆ ئینڤێرتەرەکانی زنجیرەی PSI-X',
    'psi-x-h-wifi-3-0': 'دۆنگڵی Wi-Fi بۆ ئینڤێرتەرەکانی زنجیرەی PSI-X',
    'psi-x-h-eth-3-0': 'دۆنگڵی LAN بۆ ئینڤێرتەرەکانی زنجیرەی PSI-X',
    'psi-x-h-wifi-eth': 'دۆنگڵی Wi-Fi و LAN بۆ ئینڤێرتەرەکانی زنجیرەی PSI-X',
    'psi-x1-mtb': 'تابلۆی تاک فاز بۆ کۆکردنەوەی هێڵەکانی DC، AC و هێڵی پاڵپشتی تەواو',
    'psi-x3-mtb': 'تابلۆی سێ فاز بۆ کۆکردنەوەی هێڵەکانی DC، AC و هێڵی پاڵپشتی تەواو',
    'psi-x1-bu-epsbox': 'سندوقی EPS ی تاک فاز بۆ زنجیرەی PSI-X',
    'psi-x3-bu-epsbox': 'سندوقی EPS ی سێ فاز بۆ زنجیرەی PSI-X',
  },
  insurance: {
    headline: 'بەرهەمەکانی Peimar بە بیمەی QBE پارێزراون.',
    text: 'بیمەنامەیەکی گشتگیر لەگەڵ گرووپی بیمەی QBE، کە یەکێکە لە گەورەترین کۆمپانیاکانی بیمە و بیمەی دووبارە لە جیهاندا، کڕیاران لەو زیانانە دەپارێزێت کە بەهۆی کەموکوڕیی بەرهەمەوە بە لایەنی سێیەم دەگات.',
    coverages: [
      {
        name: 'بەرپرسیارێتی بەرامبەر لایەنی سێیەم',
        text: 'ئەو زیانە نەویستراوانە دەگرێتەوە کە بیمەکراو بە لایەنی سێیەمی دەگەیەنێت، لەوانە زیانی ماددی و برینداربوونی جەستەیی.',
      },
      {
        name: 'بەرپرسیارێتیی بەرهەم',
        text: 'ئەو زیانانە دەگرێتەوە کە لە کەموکوڕیی ئەو بەرهەمانەوە دێن کە بیمەکراو دروستیان دەکات، دەیانفرۆشێت یان دابەشیان دەکات.',
      },
      {
        name: 'بەرپرسیارێتیی خاوەنکار',
        text: 'قەرەبووی ئەو برینانە دەگرێتەوە کە کارمەندان لە ژینگەی کاردا تووشیان دەبن.',
      },
    ],
  },
  batteryWarranty: (years: number) =>
    `${years} ساڵ، بەپێی داتاشیتەکانی PSI-X-BT، PSI-X-HS و PSI-A-BT3.8S. بۆ PSI-A، گەرەنتی تەنها دوای تۆمارکردنی بەرهەم و چالاککردنی خزمەتگوزاریی چاودێری کار دەکات.`,
  documents: {
    installationManual: 'ڕێبەری دامەزراندن',
    installationManualAR: 'ڕێبەری دامەزراندن',
    productsFlyer: 'بڵاوکراوەی بەرهەمەکان 2026',
    companyBrochure: 'بڕۆشووری کۆمپانیای Peimar',
    companyPresentation: 'پێشکەشکردنی کۆمپانیای Peimar',
  },
  warrantyDocs: {
    'PV modules warranty 2026': 'گەرەنتیی پانێڵە خۆرییەکان 2026',
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
