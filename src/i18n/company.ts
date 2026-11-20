import type { Locale } from './config.ts';

/** Keeps a figure and its Latin unit together and in reading order inside Arabic-script text. */
const ltr = (s: string) => `\u2066${s.replaceAll(' ', '\u00a0')}\u2069`;

const en = {
  years: 'years',
  tagline: 'Renewable energy for everyone.',
  categories: {
    public: 'Public',
    residential: 'Residential',
    advertising: 'Advertising',
    commercial: 'Commercial',
    agriculture: 'Agriculture',
  },
  projects: {
    '50-kwp-for-agriculture-land': {
      title: 'Agricultural land',
      line: 'Solar power for agricultural land.',
      alt: '',
    },
    '30-kwp-for-a-big-company': {
      title: 'A large company',
      line: 'Rows of modules across a large metal roof.',
      alt: 'Rows of solar modules across a large metal roof, with the city and hills behind',
    },
    '12kwp-for-apartments': {
      title: 'Apartments',
      line: 'A long tilted array on a gravel rooftop.',
      alt: 'A long tilted solar array on steel frames over a gravel rooftop',
    },
    '3-6-kwp-for-a-house': {
      title: 'A house',
      line: 'A tilted array on a flat house roof.',
      alt: 'A tilted solar array on a flat house roof, with high-rise towers and hills behind',
    },
    '3-kwp-for-emergency-power-water-station': {
      title: 'Emergency power for a water station',
      line: 'Ground-mounted modules that supply emergency power.',
      alt: 'Ground-mounted solar modules beside the buildings of a water station',
    },
    '1-8-kwp-for-advertising-board': {
      title: 'Advertising board',
      line: 'Four modules that power an advertising board.',
      alt: 'Four solar modules on a rooftop frame against the city skyline',
    },
  },
  methods: {
    phone: 'Phone',
    email: 'Email',
    whatsapp: 'WhatsApp',
    whatsappCta: 'Message us on WhatsApp',
    whatsappText: 'Hello Faraday, I would like to ask about a solar system.',
    office: 'Office',
    maps: 'Open in Google Maps',
    hours: 'Hours',
    days: 'Saturday–Thursday',
    friday: 'Friday',
    closed: 'Closed',
  },
  peimar: {
    timeline: {
      '2007': { title: 'The beginnings', text: 'Marco Casale founds Peimar on an entrepreneurial idea in photovoltaics.' },
      '2011': { title: 'First step abroad', text: 'The first subsidiary opens in the United States.' },
      '2017': { title: 'Italian production', text: 'The Brescia factory opens with an initial capacity of 150 MW.' },
      '2021': { title: 'Global expansion', text: 'Capacity reaches 500 MW, with 8 subsidiaries worldwide.' },
      '2025': { title: 'Gigawatt scale', text: 'A 1 GW production line in China and a Chinese subsidiary.' },
      '2026': { title: 'Production upgrade', text: 'The Italian production line is renewed.' },
    },
    sites: {
      brescia: {
        place: 'Brescia, Italy',
        text: 'The Made in Italy production hub, with automated lines for residential and industrial modules.',
      },
      zhejiang: {
        place: 'Zhejiang, China',
        text: 'In the Ningbo area, with modern PERC and TOPCon lines for projects on an international scale.',
      },
      dubai: {
        place: 'Dubai, UAE',
        text: 'Built on strategic partnerships that secure supply and meet local regulations.',
      },
    },
    certifications: {
      'IEC 61215 · IEC 61730': 'Module design and safety qualification (Kiwa for the S Series, TÜV for the OR Series)',
      'IEC TS 62804-1': 'PID free',
      'IEC 62716': 'Ammonia resistance',
      'IEC 61701': 'Salt mist resistance',
      'IEC 60068-2-68': 'Dust and sand resistance (OR double glass)',
      'UL 61730': 'CSA certification',
      ADQCC: 'Abu Dhabi certificate of conformity',
      'ISO 9001 · 14001 · 45001': 'Quality, environmental and safety management at the Italian site',
    },
  },
  about: {
    meta: {
      title: 'About',
      description:
        'Faraday Co. is the exclusive agent of Peimar in Iraq. From Sulaymaniyah we supply Peimar modules, inverters and storage and install complete solar systems.',
    },
    eyebrow: 'About Faraday',
    title: 'The exclusive Peimar agent in Iraq, based in Sulaymaniyah.',
    lead: 'We bring Peimar’s Italian modules, inverters and storage to Iraq and install them as complete solar systems.',
    services: {
      eyebrow: 'Services',
      title: 'From the first calculation to after-sales.',
      items: [
        {
          title: 'Supply',
          text: 'The full Peimar range: modules, on-grid and hybrid inverters, storage batteries and accessories.',
        },
        {
          title: 'System design',
          text: 'We size strings and inverters in the Designer, with the climate data of your city.',
        },
        { title: 'Installation', text: 'Our team installs the system on roofs and on the ground.' },
        { title: 'After-sales', text: 'A local contact in Sulaymaniyah once the system is running.' },
      ],
    },
    mission: {
      eyebrow: 'Our mission',
      text: 'To promote solar energy with new technology: meet our energy needs from clean sources, support a sustainable future and leave a livable nature to future generations.',
      by: 'Faraday Co.',
    },
    peimar: {
      eyebrow: 'Why Peimar',
      title: (year: number) => `An Italian photovoltaic brand since ${year}.`,
      text: (founded: number, brescia: number, gw: number) =>
        `Marco Casale founded Peimar in ${founded}. Its modules have been made in Brescia, Italy, since ${brescia}, and production capacity now exceeds ${gw} GW.`,
      statsLabel: 'Peimar in figures',
      stats: { founded: 'Founded', brescia: 'Made in Brescia since', capacity: 'Production capacity' },
      sites: 'Production sites',
      certifications: 'Certifications',
      certificationsNote: 'Listed on peimar.com for Peimar modules and its Italian production site.',
    },
    timeline: {
      eyebrow: 'Peimar timeline',
      title: 'Twenty years of growth.',
    },
    cta: {
      title: 'Planning a system?',
      designer: 'Open the Designer',
      contact: 'Contact us',
    },
  },
  projectsPage: {
    meta: {
      title: 'Projects',
      description:
        'Six Peimar solar systems installed by Faraday, from a 1.8 kWp advertising board to 50 kWp for agricultural land.',
    },
    eyebrow: 'Projects',
    title: (min: number, max: number) => `Systems we installed, from ${min} to ${max} kWp.`,
    lead: 'Homes, apartments, a company, a water station, an advertising board and agricultural land.',
    listLabel: 'Installed systems',
    cta: {
      title: 'Planning a system of your own?',
      designer: 'Size it in the Designer',
      contact: 'Ask for a quote',
    },
  },
  contactPage: {
    meta: {
      title: 'Contact',
      description:
        'Call, message on WhatsApp or visit Faraday on Qasmlu Street, Sulaymaniyah. Saturday to Thursday, 08:00–17:00.',
    },
    eyebrow: 'Contact',
    title: 'Tell us what you want to power.',
    lead: 'Call, send a WhatsApp message or visit our office in Sulaymaniyah.',
    form: {
      eyebrow: 'Enquiry',
      title: 'Send an enquiry',
      intro: 'The form opens WhatsApp or your email app with your message ready to send.',
      name: 'Name',
      phone: 'Phone',
      city: 'City',
      cityPlaceholder: 'Choose a city',
      cityOther: 'Other',
      interest: 'Interested in',
      interestPlaceholder: 'Choose one',
      interests: {
        hybrid: 'Hybrid system with storage',
        onGrid: 'On-grid system',
        modules: 'Modules',
        inverters: 'Inverters',
        storage: 'Batteries',
        accessories: 'Accessories',
        other: 'Something else',
      },
      message: 'Message',
      messageHint: 'For example: what you want to run during outages, and the roof or land you have.',
      required: 'required',
      errors: {
        name: 'Enter your name.',
        phone: 'Enter a phone number with at least 7 digits.',
        message: 'Write a short message.',
      },
      sendWhatsapp: 'Send via WhatsApp',
      sendEmail: 'Send by email',
      done: {
        whatsapp: 'WhatsApp opened with your message. Press send there to reach us.',
        email: 'Your email app opened with your message. Press send there to reach us.',
      },
      greeting: 'Hello Faraday,',
      subject: 'Enquiry from faradayiq.com',
    },
  },
  notFound: {
    title: 'Page not found',
    line: 'This page does not exist, or it has moved.',
    home: 'Home',
  },
};

export type CompanyStrings = typeof en;
export type ProjectSlug = keyof CompanyStrings['projects'];

const ar: CompanyStrings = {
  years: 'سنة',
  tagline: 'طاقة متجددة للجميع.',
  categories: {
    public: 'عام',
    residential: 'سكني',
    advertising: 'إعلانات',
    commercial: 'تجاري',
    agriculture: 'زراعي',
  },
  projects: {
    '50-kwp-for-agriculture-land': {
      title: 'أرض زراعية',
      line: 'طاقة شمسية لأرض زراعية.',
      alt: '',
    },
    '30-kwp-for-a-big-company': {
      title: 'شركة كبيرة',
      line: 'صفوف من الألواح على سقف معدني واسع.',
      alt: 'صفوف من الألواح الشمسية على سقف معدني واسع، وخلفها المدينة والتلال',
    },
    '12kwp-for-apartments': {
      title: 'مبنى شقق',
      line: 'صف طويل من الألواح المائلة على سطح مفروش بالحصى.',
      alt: 'صف طويل من الألواح الشمسية المائلة على هياكل فولاذية فوق سطح مفروش بالحصى',
    },
    '3-6-kwp-for-a-house': {
      title: 'منزل',
      line: 'ألواح مائلة على سطح منزل مستوٍ.',
      alt: 'ألواح شمسية مائلة على سطح منزل مستوٍ، وخلفها أبراج سكنية وتلال',
    },
    '3-kwp-for-emergency-power-water-station': {
      title: 'طاقة طوارئ لمحطة مياه',
      line: 'ألواح مثبّتة على الأرض توفّر طاقة الطوارئ.',
      alt: 'ألواح شمسية مثبّتة على الأرض بجانب مباني محطة مياه',
    },
    '1-8-kwp-for-advertising-board': {
      title: 'لوحة إعلانية',
      line: 'أربعة ألواح تشغّل لوحة إعلانية.',
      alt: 'أربعة ألواح شمسية على هيكل فوق سطح، وخلفها أفق المدينة',
    },
  },
  methods: {
    phone: 'الهاتف',
    email: 'البريد الإلكتروني',
    whatsapp: 'واتساب',
    whatsappCta: 'راسلنا على واتساب',
    whatsappText: 'مرحبًا Faraday، أودّ الاستفسار عن نظام طاقة شمسية.',
    office: 'المكتب',
    maps: 'افتح في خرائط Google',
    hours: 'أوقات العمل',
    days: 'السبت–الخميس',
    friday: 'الجمعة',
    closed: 'عطلة',
  },
  peimar: {
    timeline: {
      '2007': { title: 'البداية', text: 'أسّس Marco Casale شركة Peimar انطلاقًا من فكرة ريادية في قطاع الطاقة الكهروضوئية.' },
      '2011': { title: 'أول خطوة خارجية', text: 'افتتاح أول شركة تابعة في الولايات المتحدة.' },
      '2017': { title: 'الإنتاج الإيطالي', text: `افتتاح مصنع بريشيا بقدرة أولية تبلغ ${ltr('150 MW')}.` },
      '2021': { title: 'توسّع عالمي', text: `ارتفاع القدرة الإنتاجية إلى ${ltr('500 MW')}، مع 8 شركات تابعة حول العالم.` },
      '2025': { title: 'مرحلة الغيغاواط', text: `خط إنتاج بقدرة ${ltr('1 GW')} في الصين، وشركة تابعة هناك.` },
      '2026': { title: 'تحديث الإنتاج', text: 'تجديد خط الإنتاج الإيطالي.' },
    },
    sites: {
      brescia: {
        place: 'بريشيا، إيطاليا',
        text: 'مركز الإنتاج الإيطالي، بخطوط مؤتمتة لألواح المنازل والمنشآت الصناعية.',
      },
      zhejiang: {
        place: 'تشجيانغ، الصين',
        text: 'في منطقة نينغبو، بخطوط حديثة لألواح PERC وTOPCon لمشاريع على نطاق دولي.',
      },
      dubai: {
        place: 'دبي، الإمارات',
        text: 'قائم على شراكات استراتيجية تضمن استمرارية التوريد والالتزام باللوائح المحلية.',
      },
    },
    certifications: {
      'IEC 61215 · IEC 61730': 'تأهيل تصميم الألواح وسلامتها (Kiwa لـ\u00a0S Series، وTÜV لـ\u00a0OR Series)',
      'IEC TS 62804-1': 'خالٍ من PID',
      'IEC 62716': 'مقاومة الأمونيا',
      'IEC 61701': 'مقاومة رذاذ الملح',
      'IEC 60068-2-68': 'مقاومة الغبار والرمال (OR بزجاج مزدوج)',
      'UL 61730': 'شهادة CSA',
      ADQCC: 'شهادة مطابقة من أبوظبي',
      'ISO 9001 · 14001 · 45001': 'أنظمة إدارة الجودة والبيئة والسلامة في الموقع الإيطالي',
    },
  },
  about: {
    meta: {
      title: 'من نحن',
      description:
        'شركة Faraday هي الوكيل الحصري لـ\u00a0Peimar في العراق. من السليمانية نوفّر ألواح Peimar وإنفرتراتها وبطاريات التخزين، ونركّب أنظمة شمسية متكاملة.',
    },
    eyebrow: 'عن Faraday',
    title: 'الوكيل الحصري لـ\u00a0Peimar في العراق، ومقرّنا السليمانية.',
    lead: 'نوفّر ألواح Peimar الإيطالية وإنفرتراتها وبطاريات التخزين في العراق، ونركّبها أنظمةً شمسية متكاملة.',
    services: {
      eyebrow: 'خدماتنا',
      title: 'من الحساب الأول حتى خدمة ما بعد البيع.',
      items: [
        {
          title: 'التوريد',
          text: 'مجموعة Peimar الكاملة: الألواح، والإنفرترات المرتبطة بالشبكة والهجينة، وبطاريات التخزين والملحقات.',
        },
        {
          title: 'تصميم النظام',
          text: 'نحسب السلاسل والإنفرترات بأداة التصميم، اعتمادًا على بيانات مناخ مدينتك.',
        },
        { title: 'التركيب', text: 'يركّب فريقنا النظام على الأسطح وعلى الأرض.' },
        { title: 'ما بعد البيع', text: 'جهة تواصل محلية في السليمانية بعد تشغيل النظام.' },
      ],
    },
    mission: {
      eyebrow: 'رسالتنا',
      text: 'نشر استخدام الطاقة الشمسية بتقنيات جديدة: تلبية احتياجاتنا من الطاقة بمصادر نظيفة، ودعم مستقبل مستدام، وترك بيئة صالحة للحياة للأجيال القادمة.',
      by: 'Faraday Co.',
    },
    peimar: {
      eyebrow: 'لماذا Peimar',
      title: (year: number) => `علامة إيطالية في الطاقة الكهروضوئية منذ ${year}.`,
      text: (founded: number, brescia: number, gw: number) =>
        `أسّس Marco Casale شركة Peimar عام ${founded}. تُصنع ألواحها في بريشيا بإيطاليا منذ ${brescia}، وتتجاوز قدرتها الإنتاجية اليوم ${ltr(`${gw} GW`)}.`,
      statsLabel: 'Peimar بالأرقام',
      stats: { founded: 'سنة التأسيس', brescia: 'بدء الإنتاج في بريشيا', capacity: 'القدرة الإنتاجية' },
      sites: 'مواقع الإنتاج',
      certifications: 'الشهادات',
      certificationsNote: 'مذكورة على موقع peimar.com لألواح Peimar وموقع إنتاجها الإيطالي.',
    },
    timeline: {
      eyebrow: 'مسيرة Peimar',
      title: 'عشرون عامًا من النمو.',
    },
    cta: {
      title: 'تخطّط لنظام شمسي؟',
      designer: 'افتح أداة التصميم',
      contact: 'تواصل معنا',
    },
  },
  projectsPage: {
    meta: {
      title: 'المشاريع',
      description: 'ستة أنظمة شمسية من Peimar ركّبتها Faraday، من لوحة إعلانية بقدرة 1.8 kWp إلى 50 kWp لأرض زراعية.',
    },
    eyebrow: 'المشاريع',
    title: (min: number, max: number) => `أنظمة ركّبناها، من ${min} إلى ${ltr(`${max} kWp`)}.`,
    lead: 'منازل وشقق وشركة ومحطة مياه ولوحة إعلانية وأرض زراعية.',
    listLabel: 'الأنظمة المركّبة',
    cta: {
      title: 'تخطّط لنظامك الخاص؟',
      designer: 'احسبه بأداة التصميم',
      contact: 'اطلب عرض سعر',
    },
  },
  contactPage: {
    meta: {
      title: 'اتصل بنا',
      description:
        'اتصل بنا أو راسلنا على واتساب أو زر مكتب Faraday في شارع قاسملو بالسليمانية. من السبت إلى الخميس، 08:00–17:00.',
    },
    eyebrow: 'التواصل',
    title: 'أخبرنا بما تريد تشغيله.',
    lead: 'اتصل بنا، أو أرسل رسالة على واتساب، أو زر مكتبنا في السليمانية.',
    form: {
      eyebrow: 'استفسار',
      title: 'أرسل استفسارًا',
      intro: 'يفتح النموذج واتساب أو تطبيق البريد لديك، ورسالتك جاهزة للإرسال.',
      name: 'الاسم',
      phone: 'الهاتف',
      city: 'المدينة',
      cityPlaceholder: 'اختر مدينة',
      cityOther: 'أخرى',
      interest: 'مجال الاهتمام',
      interestPlaceholder: 'اختر',
      interests: {
        hybrid: 'نظام هجين مع تخزين',
        onGrid: 'نظام مرتبط بالشبكة',
        modules: 'ألواح',
        inverters: 'إنفرترات',
        storage: 'بطاريات',
        accessories: 'ملحقات',
        other: 'شيء آخر',
      },
      message: 'الرسالة',
      messageHint: 'مثلًا: ما الذي تريد تشغيله أثناء انقطاع الكهرباء، والسطح أو الأرض المتاحة لديك.',
      required: 'مطلوب',
      errors: {
        name: 'أدخل اسمك.',
        phone: 'أدخل رقم هاتف من 7 أرقام على الأقل.',
        message: 'اكتب رسالة قصيرة.',
      },
      sendWhatsapp: 'أرسل عبر واتساب',
      sendEmail: 'أرسل بالبريد الإلكتروني',
      done: {
        whatsapp: 'فُتح واتساب ورسالتك جاهزة. اضغط إرسال هناك لتصلنا.',
        email: 'فُتح تطبيق البريد ورسالتك جاهزة. اضغط إرسال هناك لتصلنا.',
      },
      greeting: 'مرحبًا Faraday،',
      subject: 'استفسار من faradayiq.com',
    },
  },
  notFound: {
    title: 'الصفحة غير موجودة',
    line: 'هذه الصفحة غير موجودة، أو نُقلت إلى مكان آخر.',
    home: 'الرئيسية',
  },
};

const ckb: CompanyStrings = {
  years: 'ساڵ',
  tagline: 'وزەی نوێبووەوە بۆ هەمووان.',
  categories: {
    public: 'گشتی',
    residential: 'نیشتەجێبوون',
    advertising: 'ڕیکلام',
    commercial: 'بازرگانی',
    agriculture: 'کشتوکاڵ',
  },
  projects: {
    '50-kwp-for-agriculture-land': {
      title: 'زەویی کشتوکاڵی',
      line: 'وزەی خۆر بۆ زەوییەکی کشتوکاڵی.',
      alt: '',
    },
    '30-kwp-for-a-big-company': {
      title: 'کۆمپانیایەکی گەورە',
      line: 'ڕیزی پانێڵ لەسەر بانێکی کانزایی فراوان.',
      alt: 'ڕیزی پانێڵی خۆر لەسەر بانێکی کانزایی فراوان، شار و گردەکان لە دواوەن',
    },
    '12kwp-for-apartments': {
      title: 'شوقەکان',
      line: 'ڕیزێکی درێژی پانێڵی لار لەسەر بانێکی چەوڕێژکراو.',
      alt: 'ڕیزێکی درێژی پانێڵی خۆری لار لەسەر چوارچێوەی پۆڵا، لەسەر بانێکی چەوڕێژکراو',
    },
    '3-6-kwp-for-a-house': {
      title: 'خانوو',
      line: 'پانێڵی لار لەسەر بانی تەختی خانوویەک.',
      alt: 'پانێڵی خۆری لار لەسەر بانی تەختی خانوویەک، تاوەرە بەرزەکان و گردەکان لە دواوەن',
    },
    '3-kwp-for-emergency-power-water-station': {
      title: 'کارەبای یەدەگ بۆ وێستگەی ئاو',
      line: 'پانێڵی سەر زەوی کە کارەبای یەدەگ دابین دەکەن.',
      alt: 'پانێڵی خۆری سەر زەوی لە تەنیشت بیناکانی وێستگەیەکی ئاو',
    },
    '1-8-kwp-for-advertising-board': {
      title: 'تابلۆی ڕیکلام',
      line: 'چوار پانێڵ کە کارەبای تابلۆیەکی ڕیکلام دابین دەکەن.',
      alt: 'چوار پانێڵی خۆر لەسەر چوارچێوەیەک لە سەربانێک، ئاسۆی شار لە دواوە',
    },
  },
  methods: {
    phone: 'تەلەفۆن',
    email: 'ئیمەیڵ',
    whatsapp: 'واتسئاپ',
    whatsappCta: 'لە واتسئاپ نامەمان بۆ بنێرە',
    whatsappText: 'سڵاو Faraday، دەمەوێت پرسیار دەربارەی سیستەمێکی خۆر بکەم.',
    office: 'نووسینگە',
    maps: 'لە Google Maps بیکەرەوە',
    hours: 'کاتی کار',
    days: 'شەممە–پێنجشەممە',
    friday: 'هەینی',
    closed: 'داخراوە',
  },
  peimar: {
    timeline: {
      '2007': { title: 'سەرەتا', text: 'Marco Casale بە بیرۆکەیەکی بازرگانی لە بواری وزەی خۆردا Peimar دادەمەزرێنێت.' },
      '2011': { title: 'یەکەم هەنگاو بۆ دەرەوە', text: 'یەکەم لقی کۆمپانیا لە ئەمریکا دەکرێتەوە.' },
      '2017': { title: 'بەرهەمهێنانی ئیتاڵی', text: `کارگەی بریشیا بە توانای سەرەتایی ${ltr('150 MW')} دەکرێتەوە.` },
      '2021': { title: 'فراوانبوونی جیهانی', text: `توانای بەرهەمهێنان دەگاتە ${ltr('500 MW')}، لەگەڵ 8 لق لە جیهاندا.` },
      '2025': { title: 'ئاستی گیگاوات', text: `هێڵێکی بەرهەمهێنانی ${ltr('1 GW')} لە چین، لەگەڵ لقێکی کۆمپانیا لەوێ.` },
      '2026': { title: 'نوێکردنەوەی بەرهەمهێنان', text: 'هێڵی بەرهەمهێنانی ئیتاڵی نوێ دەکرێتەوە.' },
    },
    sites: {
      brescia: {
        place: 'بریشیا، ئیتاڵیا',
        text: 'ناوەندی بەرهەمهێنانی ئیتاڵی، بە هێڵی ئۆتۆماتیکی بۆ پانێڵی ماڵ و پیشەسازی.',
      },
      zhejiang: {
        place: 'ژێجیانگ، چین',
        text: 'لە ناوچەی نینگبۆ، بە هێڵی نوێی PERC و TOPCon بۆ پڕۆژەی نێودەوڵەتی.',
      },
      dubai: {
        place: 'دوبەی، ئیمارات',
        text: 'لەسەر هاوبەشیی ستراتیژی دامەزراوە بۆ بەردەوامیی دابینکردن و گونجان لەگەڵ یاسا ناوخۆییەکان.',
      },
    },
    certifications: {
      'IEC 61215 · IEC 61730': 'پشتڕاستکردنەوەی دیزاین و سەلامەتیی پانێڵ (Kiwa بۆ S Series و TÜV بۆ OR Series)',
      'IEC TS 62804-1': 'بێ PID',
      'IEC 62716': 'بەرگری لە ئەمۆنیا',
      'IEC 61701': 'بەرگری لە تەمی خوێ',
      'IEC 60068-2-68': 'بەرگری لە تۆز و لم (OR بە شووشەی دووانە)',
      'UL 61730': 'بڕوانامەی CSA',
      ADQCC: 'بڕوانامەی گونجان لە ئەبوزەبی',
      'ISO 9001 · 14001 · 45001': 'بەڕێوەبردنی جۆرایەتی، ژینگە و سەلامەتی لە کارگەی ئیتاڵیا',
    },
  },
  about: {
    meta: {
      title: 'دەربارە',
      description:
        'کۆمپانیای Faraday بریکاری تایبەتی Peimar ە لە عێراق. لە سلێمانییەوە پانێڵ، ئینڤێرتەر و پاتریی Peimar دابین دەکەین و سیستەمی خۆری تەواو دادەمەزرێنین.',
    },
    eyebrow: 'دەربارەی Faraday',
    title: 'بریکاری تایبەتی Peimar لە عێراق، بنکەکەمان لە سلێمانییە.',
    lead: 'پانێڵ، ئینڤێرتەر و پاتریی ئیتاڵیی Peimar دەهێنینە عێراق و وەک سیستەمی خۆری تەواو دایاندەمەزرێنین.',
    services: {
      eyebrow: 'خزمەتگوزارییەکان',
      title: 'لە ژماردنی سەرەتاوە تا خزمەتی دوای فرۆشتن.',
      items: [
        {
          title: 'دابینکردن',
          text: 'هەموو کۆمەڵەی Peimar: پانێڵ، ئینڤێرتەری سەر بە تۆڕ و هایبرید، پاتری و کەرەستە تەواوکەرەکان.',
        },
        {
          title: 'دیزاینی سیستەم',
          text: 'زنجیرە و ئینڤێرتەرەکان بە دیزاینەر دەژمێرین، بە داتای کەشوهەوای شارەکەت.',
        },
        { title: 'دامەزراندن', text: 'تیمەکەمان سیستەمەکە لەسەر بان و لەسەر زەوی دادەمەزرێنێت.' },
        { title: 'دوای فرۆشتن', text: 'پەیوەندییەکی ناوخۆیی لە سلێمانی، دوای ئەوەی سیستەمەکە کار دەکات.' },
      ],
    },
    mission: {
      eyebrow: 'ئامانجمان',
      text: 'بڵاوکردنەوەی وزەی خۆر بە تەکنەلۆژیای نوێ: دابینکردنی پێویستییەکانی وزەمان لە سەرچاوەی پاکەوە، پشتگیری لە داهاتوویەکی بەردەوام، و جێهێشتنی سروشتێکی شیاوی ژیان بۆ نەوەکانی داهاتوو.',
      by: 'Faraday Co.',
    },
    peimar: {
      eyebrow: 'بۆچی Peimar',
      title: (year: number) => `براندێکی ئیتاڵیی وزەی خۆر لە ساڵی ${year}ەوە.`,
      text: (founded: number, brescia: number, gw: number) =>
        `Marco Casale لە ساڵی ${founded} Peimar ی دامەزراند. پانێڵەکانی لە ساڵی ${brescia}ەوە لە بریشیای ئیتاڵیا دروست دەکرێن و ئێستا توانای بەرهەمهێنانی لە ${ltr(`${gw} GW`)} زیاترە.`,
      statsLabel: 'Peimar بە ژمارە',
      stats: { founded: 'ساڵی دامەزران', brescia: 'سەرەتای بەرهەمهێنان لە بریشیا', capacity: 'توانای بەرهەمهێنان' },
      sites: 'شوێنەکانی بەرهەمهێنان',
      certifications: 'بڕوانامەکان',
      certificationsNote: 'لە peimar.com بۆ پانێڵەکانی Peimar و کارگە ئیتاڵییەکەی تۆمار کراون.',
    },
    timeline: {
      eyebrow: 'مێژووی Peimar',
      title: 'بیست ساڵ گەشەکردن.',
    },
    cta: {
      title: 'بیر لە سیستەمێکی خۆر دەکەیتەوە؟',
      designer: 'دیزاینەر بکەرەوە',
      contact: 'پەیوەندیمان پێوە بکە',
    },
  },
  projectsPage: {
    meta: {
      title: 'پڕۆژەکان',
      description:
        'شەش سیستەمی خۆری Peimar کە Faraday دایمەزراندوون، لە تابلۆیەکی ڕیکلامی 1.8 kWp ەوە تا 50 kWp بۆ زەویی کشتوکاڵی.',
    },
    eyebrow: 'پڕۆژەکان',
    title: (min: number, max: number) => `ئەو سیستەمانەی دامانمەزراندوون، لە ${min} تا ${ltr(`${max} kWp`)}.`,
    lead: 'خانوو، شوقە، کۆمپانیا، وێستگەی ئاو، تابلۆی ڕیکلام و زەویی کشتوکاڵی.',
    listLabel: 'سیستەمە دامەزراوەکان',
    cta: {
      title: 'بیر لە سیستەمی خۆت دەکەیتەوە؟',
      designer: 'بە دیزاینەر بیژمێرە',
      contact: 'داوای نرخ بکە',
    },
  },
  contactPage: {
    meta: {
      title: 'پەیوەندی',
      description:
        'پەیوەندیمان پێوە بکە، لە واتسئاپ نامە بنێرە یان سەردانی نووسینگەی Faraday بکە لە شەقامی قاسملۆ، سلێمانی. شەممە تا پێنجشەممە، 08:00–17:00.',
    },
    eyebrow: 'پەیوەندی',
    title: 'پێمان بڵێ دەتەوێت کارەبای چی دابین بکەیت.',
    lead: 'پەیوەندیمان پێوە بکە، لە واتسئاپ نامە بنێرە، یان سەردانی نووسینگەکەمان لە سلێمانی بکە.',
    form: {
      eyebrow: 'پرسیار',
      title: 'پرسیارێک بنێرە',
      intro: 'فۆرمەکە واتسئاپ یان ئیمەیڵەکەت دەکاتەوە و نامەکەت ئامادەی ناردن دەبێت.',
      name: 'ناو',
      phone: 'تەلەفۆن',
      city: 'شار',
      cityPlaceholder: 'شارێک هەڵبژێرە',
      cityOther: 'شاری تر',
      interest: 'مەبەستت',
      interestPlaceholder: 'یەکێک هەڵبژێرە',
      interests: {
        hybrid: 'سیستەمی هایبرید لەگەڵ پاتری',
        onGrid: 'سیستەمی سەر بە تۆڕ',
        modules: 'پانێڵ',
        inverters: 'ئینڤێرتەر',
        storage: 'پاتری',
        accessories: 'کەرەستەی تەواوکەر',
        other: 'شتێکی تر',
      },
      message: 'نامە',
      messageHint: 'بۆ نموونە: لە کاتی بڕانی کارەبادا دەتەوێت چی کار بکات، و بان یان زەوییەکەت چەندە.',
      required: 'پێویستە',
      errors: {
        name: 'ناوت بنووسە.',
        phone: 'ژمارەی تەلەفۆنێک بنووسە کە لانیکەم 7 ژمارەی هەبێت.',
        message: 'نامەیەکی کورت بنووسە.',
      },
      sendWhatsapp: 'لە ڕێگەی واتسئاپەوە بینێرە',
      sendEmail: 'بە ئیمەیڵ بینێرە',
      done: {
        whatsapp: 'واتسئاپ کرایەوە و نامەکەت ئامادەیە. لەوێ دوگمەی ناردن دابگرە.',
        email: 'ئیمەیڵەکەت کرایەوە و نامەکەت ئامادەیە. لەوێ دوگمەی ناردن دابگرە.',
      },
      greeting: 'سڵاو Faraday،',
      subject: 'پرسیار لە faradayiq.com',
    },
  },
  notFound: {
    title: 'پەڕەکە نەدۆزرایەوە',
    line: 'ئەم پەڕەیە بوونی نییە، یان گوازراوەتەوە.',
    home: 'پەڕەی سەرەکی',
  },
};

export const company: Record<Locale, CompanyStrings> = { en, ar, ckb };
