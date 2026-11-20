import type { Locale } from './config.ts';

/** Keeps a figure and its Latin unit together and in reading order inside Arabic-script text. */
const ltr = (s: string) => `\u2066${s.replaceAll(' ', '\u00a0')}\u2069`;

/** Arabic counted noun: plural after 3 to 10 (also 103 to 110), singular accusative otherwise. */
const arCount = (n: number, plural: string, single: string) => (n % 100 >= 3 && n % 100 <= 10 ? plural : single);

const en = {
  meta: {
    title: 'Faraday · Exclusive Peimar agent in Iraq',
    description:
      'Peimar solar modules, hybrid inverters and storage in Iraq, supplied and installed by Faraday from Sulaymaniyah. Size your system in the Designer.',
  },
  hero: {
    eyebrow: 'Exclusive Peimar agent in Iraq',
    title: 'Italian photovoltaics, sized for Iraq’s sun.',
    lead: 'Peimar modules, hybrid inverters and storage, supplied and installed from Sulaymaniyah.',
    ctaDesigner: 'Design your system',
    ctaRange: 'Explore the range',
    scroll: 'Scroll',
    specsLabel: 'Key figures',
    specs: {
      efficiency: 'Peak module efficiency',
      warranty: 'Linear power warranty',
      capacity: 'Peimar production capacity',
      cells: 'TOPCon bifacial cells',
    },
  },
  ticker: {
    label: 'Peimar models in the range',
    pause: 'Pause the model list',
    play: 'Play the model list',
    kinds: { hybrid: 'hybrid', onGrid: 'on-grid', micro: 'micro', storage: 'storage' },
  },
  commitment: {
    eyebrow: 'What we do',
    title: 'The Peimar range, supplied, sized and installed by one team.',
    body: [
      'As Peimar’s exclusive agent in Iraq, we supply the full range: modules, on-grid and hybrid inverters, storage batteries and accessories.',
      'We size each system with the Designer, install it on site and stay your local contact for after-sales support in Sulaymaniyah.',
    ],
    link: 'About Faraday',
    statsLabel: 'Peimar in figures',
    stats: {
      capacity: 'Peimar production capacity',
      warranty: 'Linear power warranty on modules',
      founded: 'Peimar founded',
    },
  },
  range: {
    eyebrow: 'The range',
    title: 'Everything a solar system needs, from one brand.',
    intro:
      'Hybrid inverters with storage come first: they store solar energy and keep a home supplied when the grid is down.',
    items: {
      hybrid: 'Store the day’s solar energy and run the house through grid outages.',
      modules: 'From the Made in Italy S Series to N-type TOPCon double-glass OR modules.',
      onGrid: 'Single-phase and three-phase inverters for grid-connected systems.',
      micro: 'Module-level inverters for small single-phase arrays.',
      accessories: 'Meters, Wi-Fi dongles, power optimizers, EV chargers and EPS boxes.',
    },
    figures: { lines: 'Lines', power: 'Power', products: 'Products', efficiency: 'Efficiency' },
    hint: 'Swipe to browse',
  },
  map: {
    eyebrow: 'Solar across Iraq',
    title: (min: string, max: string) => `${min} to ${max} kWh a year from every kWp.`,
    text: (cities: number) =>
      `PVGIS satellite data for ${cities} Iraqi cities: the yearly energy from 1 kWp of modules at the best tilt. Open a city for its monthly yield and design temperatures.`,
    unit: 'kWh/kWp a year',
    tilt: (deg: number) => `${deg}° optimal tilt`,
    list: 'Cities by annual yield',
    office: 'Faraday office',
    low: 'Lower yield',
    high: 'Higher yield',
    source: 'Yield: PVGIS © European Union, 2001–2026. Boundaries: Natural Earth.',
    all: 'All cities',
  },
  designer: {
    eyebrow: 'Designer',
    title: 'Size strings like an installer. No login.',
    text: (cities: number) =>
      `It checks string voltage at your city’s temperature extremes, current per MPPT and the power ratio, with climate data for ${cities} Iraqi cities.`,
    cta: 'Open the Designer',
    matrix: {
      caption: 'MPPT 1, with MPPT 2 set to 1 × 6',
      series: 'Panels in series',
      strings: 'Strings',
      unit: 'W per MPPT',
      states: { ok: 'within limits', warn: 'power ratio warning', bad: 'over the MPPT current', selected: 'selected' },
      legend: { ok: 'Within limits', warn: 'Power ratio warning', bad: 'Over MPPT current', selected: 'Selected' },
      total: (panels: number, kwp: string) => `${panels} panels · ${kwp} kWp`,
      hint: 'Hover, tap or tab to a cell to see its checks.',
      readout: {
        config: 'Series × strings',
        array: 'Whole array',
        voc: (t: string) => `Voc at ${t} °C`,
        current: (t: string) => `Current at ${t} °C`,
        ratio: 'Power ratio',
        limit: 'limit',
        verdict: {
          ok: 'Every check passes.',
          warn: (max: number) => `Power ratio above ${max}%: the inverter is oversized for this array.`,
          bad: (amps: number) => `Parallel strings exceed the ${amps} A MPPT input current.`,
        },
        temps: (city: string) => `Checked at the design temperatures for ${city}.`,
      },
    },
  },
  projects: {
    eyebrow: 'Projects',
    title: (count: number, min: number, max: number) => `${count} systems, from ${min} to ${max} kWp.`,
    link: 'All projects',
  },
  warranty: {
    eyebrow: 'Warranty and insurance',
    title: (years: number) => `${years} years of linear power warranty on every Peimar module.`,
    sSeries: 'S Series',
    sSeriesNote: 'Made in Italy',
    orDrSeries: 'OR & DR Series',
    orDrNote: 'Half-cell modules',
    power: 'Linear power',
    product: 'Product',
    qbeTitle: 'Product liability insurance',
    qbeText: 'A QBE Insurance Group policy protects customers against third-party damage caused by product defects.',
  },
  contact: {
    eyebrow: 'Contact',
    title: 'Talk to us about your system.',
    place: 'Sulaymaniyah, Iraq',
  },
};

export type HomeStrings = typeof en;

const ar: HomeStrings = {
  meta: {
    title: 'Faraday · الوكيل الحصري لـ\u00a0Peimar في العراق',
    description:
      'ألواح Peimar الشمسية وإنفرتراتها الهجينة وبطاريات التخزين في العراق، تورّدها Faraday وتركّبها من السليمانية. احسب حجم نظامك بأداة التصميم.',
  },
  hero: {
    eyebrow: 'الوكيل الحصري لـ\u00a0Peimar في العراق',
    title: 'طاقة كهروضوئية إيطالية، محسوبة لشمس العراق.',
    lead: 'ألواح Peimar وإنفرتراتها الهجينة وبطاريات التخزين، نورّدها ونركّبها من السليمانية.',
    ctaDesigner: 'صمّم نظامك',
    ctaRange: 'تصفّح المنتجات',
    scroll: 'مرّر للأسفل',
    specsLabel: 'أرقام أساسية',
    specs: {
      efficiency: 'أعلى كفاءة للألواح',
      warranty: 'ضمان القدرة الخطي',
      capacity: 'القدرة الإنتاجية لـ\u00a0Peimar',
      cells: 'خلايا TOPCon ثنائية الوجه',
    },
  },
  ticker: {
    label: 'طرازات Peimar في المجموعة',
    pause: 'أوقف شريط الطرازات',
    play: 'شغّل شريط الطرازات',
    kinds: { hybrid: 'هجين', onGrid: 'مرتبط بالشبكة', micro: 'مايكرو', storage: 'تخزين' },
  },
  commitment: {
    eyebrow: 'ماذا نقدّم',
    title: 'مجموعة Peimar كاملة: توريد وتصميم وتركيب بفريق واحد.',
    body: [
      'بصفتنا الوكيل الحصري لـ\u00a0Peimar في العراق، نوفّر المجموعة كاملة: الألواح، والإنفرترات المرتبطة بالشبكة والهجينة، وبطاريات التخزين والملحقات.',
      'نحدّد حجم كل نظام بأداة التصميم، ونركّبه في الموقع، ونبقى جهة التواصل المحلية لخدمة ما بعد البيع في السليمانية.',
    ],
    link: 'عن Faraday',
    statsLabel: 'Peimar بالأرقام',
    stats: {
      capacity: 'القدرة الإنتاجية لـ\u00a0Peimar',
      warranty: 'ضمان القدرة الخطي للألواح',
      founded: 'تأسيس Peimar',
    },
  },
  range: {
    eyebrow: 'المنتجات',
    title: 'كل ما يحتاجه النظام الشمسي، من علامة واحدة.',
    intro:
      'نبدأ بالإنفرترات الهجينة مع التخزين: فهي تخزّن الطاقة الشمسية وتُبقي الكهرباء في المنزل عند انقطاع الشبكة.',
    items: {
      hybrid: 'خزّن طاقة الشمس نهارًا وشغّل المنزل أثناء انقطاع الكهرباء.',
      modules: 'من S Series المصنوعة في إيطاليا إلى ألواح OR بتقنية TOPCon من النوع N وزجاج مزدوج.',
      onGrid: 'إنفرترات أحادية الطور وثلاثية الأطوار للأنظمة المرتبطة بالشبكة.',
      micro: 'إنفرترات على مستوى اللوح للأنظمة الصغيرة أحادية الطور.',
      accessories: 'عدّادات، ووحدات Wi-Fi، ومحسّنات قدرة، وشواحن للسيارات الكهربائية، وصناديق EPS.',
    },
    figures: { lines: 'الفئات', power: 'القدرة', products: 'المنتجات', efficiency: 'الكفاءة' },
    hint: 'اسحب للتصفّح',
  },
  map: {
    eyebrow: 'الطاقة الشمسية في العراق',
    title: (min: string, max: string) => `من ${ltr(min)} إلى ${ltr(`${max} kWh`)} سنويًا من كل ${ltr('kWp')}.`,
    text: (cities: number) =>
      `بيانات PVGIS الفضائية لـ\u00a0${cities} مدينة عراقية: الطاقة السنوية من ${ltr('1 kWp')} من الألواح بأفضل زاوية ميل. افتح صفحة المدينة لترى إنتاجها الشهري ودرجات حرارة التصميم.`,
    unit: 'kWh/kWp سنويًا',
    tilt: (deg: number) => `زاوية الميل المثلى ${ltr(`${deg}°`)}`,
    list: 'المدن حسب الإنتاج السنوي',
    office: 'مكتب Faraday',
    low: 'إنتاج أقل',
    high: 'إنتاج أعلى',
    source: 'الإنتاج: PVGIS © European Union, 2001–2026. الحدود: Natural Earth.',
    all: 'كل المدن',
  },
  designer: {
    eyebrow: 'أداة التصميم',
    title: 'احسب السلاسل بدقة المركّبين، دون تسجيل دخول.',
    text: (cities: number) =>
      `تتحقق من جهد السلسلة في أدنى وأعلى درجات حرارة مدينتك، ومن تيار كل MPPT ونسبة القدرة، ببيانات مناخ ${cities} مدينة عراقية.`,
    cta: 'افتح أداة التصميم',
    matrix: {
      caption: `MPPT 1، مع ضبط MPPT 2 على ${ltr('1 × 6')}`,
      series: 'ألواح على التوالي',
      strings: 'السلاسل',
      unit: 'W لكل MPPT',
      states: { ok: 'ضمن الحدود', warn: 'تنبيه نسبة القدرة', bad: 'تيار أعلى من حد MPPT', selected: 'الاختيار الحالي' },
      legend: { ok: 'ضمن الحدود', warn: 'تنبيه نسبة القدرة', bad: 'تيار أعلى من حد MPPT', selected: 'الاختيار' },
      total: (panels: number, kwp: string) => `${panels} لوحًا · ${ltr(`${kwp} kWp`)}`,
      hint: 'مرّر المؤشر فوق خلية أو المسها أو انتقل إليها بلوحة المفاتيح لترى فحوصاتها.',
      readout: {
        config: 'ألواح على التوالي × السلاسل',
        array: 'النظام كاملًا',
        voc: (t: string) => `Voc عند ${ltr(`${t} °C`)}`,
        current: (t: string) => `التيار عند ${ltr(`${t} °C`)}`,
        ratio: 'نسبة القدرة الاسمية',
        limit: 'الحد',
        verdict: {
          ok: 'كل الفحوصات ناجحة.',
          warn: (max: number) => `نسبة القدرة أعلى من ${ltr(`${max}%`)}: الإنفرتر أكبر من حاجة هذه الألواح.`,
          bad: (amps: number) => `السلاسل المتوازية تتجاوز تيار إدخال MPPT البالغ ${ltr(`${amps} A`)}.`,
        },
        temps: (city: string) => `محسوبة بدرجات حرارة التصميم في ${city}.`,
      },
    },
  },
  projects: {
    eyebrow: 'المشاريع',
    title: (count: number, min: number, max: number) =>
      `${count} ${arCount(count, 'أنظمة', 'نظامًا')}، من ${min} إلى ${ltr(`${max} kWp`)}.`,
    link: 'كل المشاريع',
  },
  warranty: {
    eyebrow: 'الضمان والتأمين',
    title: (years: number) => `ضمان قدرة خطي لمدة ${years} ${arCount(years, 'أعوام', 'عامًا')} على كل ألواح Peimar.`,
    sSeries: 'S Series',
    sSeriesNote: 'صُنع في إيطاليا',
    orDrSeries: 'OR و DR Series',
    orDrNote: 'ألواح بخلايا نصفية',
    power: 'القدرة الخطية',
    product: 'المنتج',
    qbeTitle: 'تأمين مسؤولية المنتج',
    qbeText: 'تحمي وثيقة تأمين لدى QBE Insurance Group العملاءَ من أضرار الغير الناتجة عن عيوب المنتج.',
  },
  contact: {
    eyebrow: 'التواصل',
    title: 'تحدّث معنا عن نظامك.',
    place: 'السليمانية، العراق',
  },
};

const ckb: HomeStrings = {
  meta: {
    title: 'Faraday · بریکاری تایبەتی Peimar لە عێراق',
    description:
      'پانێڵی خۆری Peimar، ئینڤێرتەری هایبرید و پاتری لە عێراق، کە Faraday لە سلێمانییەوە دابینیان دەکات و دایاندەمەزرێنێت. قەبارەی سیستەمەکەت بە دیزاینەر دیاری بکە.',
  },
  hero: {
    eyebrow: 'بریکاری تایبەتی Peimar لە عێراق',
    title: 'سیستەمی خۆری ئیتاڵی، بە پێوەری خۆری عێراق.',
    lead: 'پانێڵی Peimar، ئینڤێرتەری هایبرید و پاتری، لە سلێمانییەوە دابینیان دەکەین و دایاندەمەزرێنین.',
    ctaDesigner: 'سیستەمەکەت دیزاین بکە',
    ctaRange: 'بەرهەمەکان ببینە',
    scroll: 'بڕۆ خوارەوە',
    specsLabel: 'ژمارە سەرەکییەکان',
    specs: {
      efficiency: 'بەرزترین کارایی پانێڵ',
      warranty: 'گەرەنتی هێڵیی توانا',
      capacity: 'توانای بەرهەمهێنانی Peimar',
      cells: 'خانەی TOPCon ی دوو\u00a0ڕوو',
    },
  },
  ticker: {
    label: 'مۆدێلەکانی Peimar',
    pause: 'لیستی مۆدێلەکان ڕابگرە',
    play: 'لیستی مۆدێلەکان لێبدە',
    kinds: { hybrid: 'هایبرید', onGrid: 'سەر بە تۆڕ', micro: 'مایکرۆ', storage: 'هەڵگرتنی وزە' },
  },
  commitment: {
    eyebrow: 'چی دەکەین',
    title: 'هەموو بەرهەمەکانی Peimar: دابینکردن، دیزاین و دامەزراندن لەلایەن یەک تیمەوە.',
    body: [
      'وەک بریکاری تایبەتی Peimar لە عێراق، هەموو بەرهەمەکانی دابین دەکەین: پانێڵ، ئینڤێرتەری سەر بە تۆڕ و هایبرید، پاتری و کەرەستە تەواوکەرەکان.',
      'قەبارەی هەر سیستەمێک بە دیزاینەر دیاری دەکەین، لە شوێنی خۆی دایدەمەزرێنین و لە سلێمانی بۆ خزمەتگوزاریی دوای فرۆشتن لەگەڵتان دەمێنینەوە.',
    ],
    link: 'دەربارەی Faraday',
    statsLabel: 'Peimar بە ژمارە',
    stats: {
      capacity: 'توانای بەرهەمهێنانی Peimar',
      warranty: 'گەرەنتی هێڵیی توانای پانێڵەکان',
      founded: 'دامەزرانی Peimar',
    },
  },
  range: {
    eyebrow: 'بەرهەمەکان',
    title: 'هەموو ئەوەی سیستەمێکی خۆر پێویستییەتی، لە یەک براندەوە.',
    intro:
      'ئینڤێرتەری هایبرید و پاتری لە پێشەوەن: وزەی خۆر هەڵدەگرن و کاتێک کارەبای تۆڕ دەبڕێت ماڵەکە بە کارەبا دەهێڵنەوە.',
    items: {
      hybrid: 'وزەی خۆری ڕۆژ هەڵبگرە و لە کاتی بڕانی کارەبادا ماڵەکەت پێ بەڕێوە ببە.',
      modules: 'لە S Series ی دروستکراوی ئیتاڵیاوە تا پانێڵەکانی OR بە TOPCon ی جۆری N و شووشەی دووانە.',
      onGrid: 'ئینڤێرتەری تاک فاز و سێ فاز بۆ سیستەمی سەر بە تۆڕ.',
      micro: 'ئینڤێرتەر لەسەر ئاستی پانێڵ بۆ سیستەمی بچووکی تاک فاز.',
      accessories: 'میتەر، دۆنگڵی Wi-Fi، باشکەری توانا، بارگاوکەری ئۆتۆمبێلی کارەبایی و سندوقی EPS.',
    },
    figures: { lines: 'جۆرەکان', power: 'توانا', products: 'بەرهەمەکان', efficiency: 'کارایی' },
    hint: 'ڕایبکێشە بۆ بینین',
  },
  map: {
    eyebrow: 'وزەی خۆر لە سەرانسەری عێراق',
    title: (min: string, max: string) => `لە ${ltr(min)} تا ${ltr(`${max} kWh`)} لە ساڵێکدا لە هەر ${ltr('kWp')} ێک.`,
    text: (cities: number) =>
      `داتای مانگی دەستکردی PVGIS بۆ ${cities} شاری عێراق: وزەی ساڵانەی ${ltr('1 kWp')} پانێڵ بە باشترین لاری. شارێک بکەرەوە بۆ بەرهەمی مانگانە و پلەکانی گەرمیی دیزاین.`,
    unit: 'kWh/kWp لە ساڵێکدا',
    tilt: (deg: number) => `باشترین لاری ${ltr(`${deg}°`)}`,
    list: 'شارەکان بەپێی بەرهەمی ساڵانە',
    office: 'نووسینگەی Faraday',
    low: 'بەرهەمی کەمتر',
    high: 'بەرهەمی زیاتر',
    source: 'بەرهەم: PVGIS © European Union, 2001–2026. سنوورەکان: Natural Earth.',
    all: 'هەموو شارەکان',
  },
  designer: {
    eyebrow: 'دیزاینەر',
    title: 'زنجیرەکان وەک دامەزرێنەرێک بژمێرە. بێ چوونەژوورەوە.',
    text: (cities: number) =>
      `ڤۆڵتی زنجیرە لە نزمترین و بەرزترین پلەی گەرمیی شارەکەت، تەزووی هەر MPPT و ڕێژەی توانا دەپشکنێت، بە داتای کەشوهەوای ${cities} شاری عێراق.`,
    cta: 'دیزاینەر بکەرەوە',
    matrix: {
      caption: `MPPT 1، کاتێک MPPT 2 لەسەر ${ltr('1 × 6')} ە`,
      series: 'پانێڵ بە زنجیرە',
      strings: 'زنجیرەکان',
      unit: 'W بۆ هەر MPPT',
      states: { ok: 'لە سنووردایە', warn: 'ئاگاداری ڕێژەی توانا', bad: 'تەزوو لە سنووری MPPT زیاترە', selected: 'هەڵبژێردراو' },
      legend: { ok: 'لە سنووردایە', warn: 'ئاگاداری ڕێژەی توانا', bad: 'تەزووی زیاد لە MPPT', selected: 'هەڵبژێردراو' },
      total: (panels: number, kwp: string) => `${panels} پانێڵ · ${ltr(`${kwp} kWp`)}`,
      hint: 'نیشاندەر ببە سەر خانەیەک، دەستی لێ بدە یان بە کیبۆرد بڕۆ سەری بۆ بینینی پشکنینەکانی.',
      readout: {
        config: 'پانێڵ بە زنجیرە × زنجیرەکان',
        array: 'هەموو سیستەمەکە',
        voc: (t: string) => `Voc لە ${ltr(`${t} °C`)}`,
        current: (t: string) => `تەزوو لە ${ltr(`${t} °C`)}`,
        ratio: 'ڕێژەی توانای ناوەکی',
        limit: 'سنوور',
        verdict: {
          ok: 'هەموو پشکنینەکان سەرکەوتوون.',
          warn: (max: number) => `ڕێژەی توانا لە ${ltr(`${max}%`)} زیاترە: ئینڤێرتەرەکە بۆ ئەم پانێڵانە گەورەترە.`,
          bad: (amps: number) => `زنجیرە تەریبەکان لە تەزووی ${ltr(`${amps} A`)} ی MPPT زیاترن.`,
        },
        temps: (city: string) => `بە پلەکانی گەرمیی دیزاینی ${city} پشکنراوە.`,
      },
    },
  },
  projects: {
    eyebrow: 'پڕۆژەکان',
    title: (count: number, min: number, max: number) => `${count} سیستەم، لە ${min} تا ${ltr(`${max} kWp`)}.`,
    link: 'هەموو پڕۆژەکان',
  },
  warranty: {
    eyebrow: 'گەرەنتی و بیمە',
    title: (years: number) => `${years} ساڵ گەرەنتی هێڵیی توانا بۆ هەموو پانێڵێکی Peimar.`,
    sSeries: 'S Series',
    sSeriesNote: 'دروستکراوی ئیتاڵیا',
    orDrSeries: 'OR و DR Series',
    orDrNote: 'پانێڵی خانەی نیوەبڕاو',
    power: 'توانای هێڵی',
    product: 'بەرهەم',
    qbeTitle: 'بیمەی بەرپرسیارێتیی بەرهەم',
    qbeText: 'بیمەنامەیەکی QBE Insurance Group کڕیاران لە زیانی لایەنی سێیەم دەپارێزێت کە بەهۆی کەموکوڕیی بەرهەمەوە دروست دەبێت.',
  },
  contact: {
    eyebrow: 'پەیوەندی',
    title: 'دەربارەی سیستەمەکەت قسەمان لەگەڵ بکە.',
    place: 'سلێمانی، عێراق',
  },
};

export const home: Record<Locale, HomeStrings> = { en, ar, ckb };
