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
  methods: {
    phone: 'Phone',
    email: 'Email',
    whatsapp: 'WhatsApp',
    whatsappCta: 'Message us on WhatsApp',
    whatsappText: 'Hello Faraday, I would like to ask about a solar system.',
    office: 'Office',
    maps: 'Open in Google Maps',
    hours: 'Hours',
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
    history: {
      eyebrow: 'Our story',
      title: (year: number) => `From ${year} to today.`,
    },
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
      lead: 'The Italian manufacturer we represent in Iraq.',
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
    },
    eyebrow: 'Projects',
    title: (min: number, max: number) => `Some of the systems we installed, from ${min} to ${max} kWp.`,
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
      description: (street: string, city: string, hours: string) =>
        `Call, message on WhatsApp or visit Faraday on ${street}, ${city}.${hours && ` ${hours}.`}`,
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

const ar: CompanyStrings = {
  years: 'سنة',
  tagline: 'طاقة متجددة للجميع.',
  categories: {
    public: 'خدمي',
    residential: 'سكني',
    advertising: 'إعلاني',
    commercial: 'تجاري',
    agriculture: 'زراعي',
  },
  methods: {
    phone: 'الهاتف',
    email: 'البريد الإلكتروني',
    whatsapp: 'واتساب',
    whatsappCta: 'راسلنا على واتساب',
    whatsappText: 'مرحبًا، أودّ الاستفسار عن منظومة طاقة شمسية.',
    office: 'المكتب',
    maps: 'افتح الموقع في خرائط Google',
    hours: 'أوقات الدوام',
    closed: 'عطلة',
  },
  peimar: {
    timeline: {
      '2007': { title: 'البداية', text: 'أسّس Marco Casale شركة Peimar ودخل بها مجال الطاقة الشمسية.' },
      '2011': { title: 'أول فرع خارج إيطاليا', text: 'افتتحت الشركة أول فرع لها في الولايات المتحدة.' },
      '2017': { title: 'مصنع في إيطاليا', text: `افتتحت مصنعها في بريشيا بطاقة إنتاجية أولية تبلغ ${ltr('150 MW')}.` },
      '2021': { title: 'توسّع حول العالم', text: `وصلت طاقتها الإنتاجية إلى ${ltr('500 MW')}، وصار لها 8 فروع في العالم.` },
      '2025': { title: 'خط إنتاج في الصين', text: `خط إنتاج بطاقة ${ltr('1 GW')} في الصين، وفرع جديد هناك.` },
      '2026': { title: 'تحديث الإنتاج', text: 'جدّدت الشركة خط الإنتاج في إيطاليا.' },
    },
    sites: {
      brescia: {
        place: 'بريشيا، إيطاليا',
        text: 'مركز الإنتاج في إيطاليا، وفيه خطوط آلية تصنع ألواح المنازل والمشاريع الصناعية.',
      },
      zhejiang: {
        place: 'تشجيانغ، الصين',
        text: 'قرب مدينة نينغبو، بخطوط حديثة لألواح PERC وTOPCon تخدم المشاريع الكبيرة حول العالم.',
      },
      dubai: {
        place: 'دبي، الإمارات',
        text: 'شراكات استراتيجية تضمن استمرار التوريد ومطابقة الأنظمة المحلية.',
      },
    },
    certifications: {
      'IEC 61215 · IEC 61730': 'اعتماد تصميم الألواح وسلامتها (من Kiwa لـ\u00a0S Series، ومن TÜV لـ\u00a0OR Series)',
      'IEC TS 62804-1': 'مقاومة ظاهرة PID',
      'IEC 62716': 'مقاومة الأمونيا',
      'IEC 61701': 'مقاومة رذاذ الملح',
      'IEC 60068-2-68': 'مقاومة الغبار والرمال (ألواح OR بزجاج مزدوج)',
      'UL 61730': 'شهادة CSA',
      ADQCC: 'شهادة مطابقة من أبوظبي',
      'ISO 9001 · 14001 · 45001': 'إدارة الجودة والبيئة والسلامة في مصنع إيطاليا',
    },
  },
  about: {
    meta: {
      title: 'من نحن',
      description:
        'شركة Faraday الوكيل الحصري لـ\u00a0Peimar في العراق، ومقرها السليمانية. نجهّز ألواح Peimar الشمسية وإنفرتراتها وبطارياتها، ونصمّم المنظومة ونركّبها.',
    },
    eyebrow: 'عن Faraday',
    title: 'الوكيل الحصري لـ\u00a0Peimar في العراق، ومقرّنا السليمانية.',
    lead: 'نجلب ألواح Peimar الإيطالية وإنفرتراتها وبطارياتها إلى العراق، ونركّب المنظومة كاملة.',
    history: {
      eyebrow: 'مسيرتنا',
      title: (year: number) => `من ${year} حتى اليوم.`,
    },
    services: {
      eyebrow: 'خدماتنا',
      title: 'من أول حساب حتى ما بعد البيع.',
      items: [
        {
          title: 'التجهيز',
          text: 'كل منتجات Peimar، من الألواح والإنفرترات الهجينة والمرتبطة بالشبكة إلى بطاريات التخزين والملحقات.',
        },
        {
          title: 'تصميم المنظومة',
          text: 'نحسب السلاسل ونختار الإنفرتر بأداة التصميم، حسب مناخ مدينتك.',
        },
        { title: 'التركيب', text: 'يركّب فريقنا المنظومة على السطح أو على الأرض.' },
        { title: 'خدمة ما بعد البيع', text: 'بعد التشغيل يبقى فريقنا في السليمانية على تواصل معك.' },
      ],
    },
    mission: {
      eyebrow: 'رسالتنا',
      text: 'نسعى إلى نشر الطاقة الشمسية بأحدث التقنيات، لنلبّي حاجتنا من الطاقة من مصادر نظيفة، ونترك للأجيال القادمة بيئة صالحة للحياة.',
      by: 'Faraday Co.',
    },
    peimar: {
      eyebrow: 'لماذا Peimar',
      title: (year: number) => `علامة إيطالية للطاقة الشمسية منذ ${year}.`,
      text: (founded: number, brescia: number, gw: number) =>
        `أسّس Marco Casale شركة Peimar عام ${founded}، وتُصنع ألواحها في بريشيا الإيطالية منذ ${brescia}، وتتجاوز طاقتها الإنتاجية اليوم ${ltr(`${gw} GW`)}.`,
      statsLabel: 'Peimar بالأرقام',
      stats: { founded: 'سنة التأسيس', brescia: 'بدء الإنتاج في بريشيا', capacity: 'الطاقة الإنتاجية' },
      sites: 'مواقع الإنتاج',
      certifications: 'الشهادات',
      certificationsNote: 'كما تنشرها Peimar على موقع peimar.com، لألواحها ولمصنعها في إيطاليا.',
    },
    timeline: {
      eyebrow: 'تاريخ Peimar',
      title: 'عشرون عامًا وPeimar تتوسّع.',
      lead: 'الشركة الإيطالية التي نمثّلها في العراق.',
    },
    cta: {
      title: 'تفكّر في منظومة طاقة شمسية؟',
      designer: 'صمّم منظومتك',
      contact: 'تواصل معنا',
    },
  },
  projectsPage: {
    meta: {
      title: 'مشاريعنا',
    },
    eyebrow: 'مشاريعنا',
    title: (min: number, max: number) => `بعض المنظومات التي ركّبناها، من ${min} إلى ${ltr(`${max} kWp`)}.`,
    listLabel: 'المنظومات التي ركّبناها',
    cta: {
      title: 'تريد منظومة مثلها؟',
      designer: 'احسبها بأداة التصميم',
      contact: 'اطلب عرض سعر',
    },
  },
  contactPage: {
    meta: {
      title: 'اتصل بنا',
      description: (street: string, city: string, hours: string) =>
        `اتصل بنا أو راسلنا على واتساب، أو زر مكتب Faraday في ${street} ب${city}.${hours && ` الدوام ${hours}.`}`,
    },
    eyebrow: 'تواصل معنا',
    title: 'ماذا تريد أن تشغّل بالطاقة الشمسية؟',
    lead: 'اتصل بنا أو راسلنا على واتساب، أو زرنا في مكتبنا بالسليمانية.',
    form: {
      eyebrow: 'استفسار',
      title: 'أرسل لنا استفسارك',
      intro: 'املأ النموذج، فيفتح لك واتساب أو البريد الإلكتروني ورسالتك جاهزة للإرسال.',
      name: 'الاسم',
      phone: 'رقم الهاتف',
      city: 'المدينة',
      cityPlaceholder: 'اختر مدينتك',
      cityOther: 'مدينة أخرى',
      interest: 'الاستفسار عن',
      interestPlaceholder: 'اختر من القائمة',
      interests: {
        hybrid: 'منظومة هجينة مع بطاريات',
        onGrid: 'منظومة مرتبطة بالكهرباء الوطنية',
        modules: 'ألواح شمسية',
        inverters: 'إنفرترات',
        storage: 'بطاريات',
        accessories: 'ملحقات',
        other: 'غير ذلك',
      },
      message: 'رسالتك',
      messageHint: 'مثلًا: الأجهزة التي تريد تشغيلها وقت انقطاع الكهرباء، والمساحة المتوفرة لديك على السطح أو الأرض.',
      required: 'مطلوب',
      errors: {
        name: 'اكتب اسمك.',
        phone: 'اكتب رقم هاتف صحيحًا، 7 أرقام على الأقل.',
        message: 'اكتب رسالة قصيرة.',
      },
      sendWhatsapp: 'أرسل على واتساب',
      sendEmail: 'أرسل بالبريد الإلكتروني',
      done: {
        whatsapp: 'فتحنا لك واتساب ورسالتك جاهزة. اضغط «إرسال» هناك لتصلنا.',
        email: 'فتحنا لك تطبيق البريد ورسالتك جاهزة. اضغط «إرسال» هناك لتصلنا.',
      },
      greeting: 'مرحبًا،',
      subject: 'استفسار من موقع faradayiq.com',
    },
  },
  notFound: {
    title: 'الصفحة غير موجودة',
    line: 'لم نجد هذه الصفحة. ربما حُذفت أو تغيّر رابطها.',
    home: 'الصفحة الرئيسية',
  },
};

const ckb: CompanyStrings = {
  years: 'ساڵ',
  tagline: 'وزەی نوێبووەوە بۆ هەمووان.',
  categories: {
    public: 'خزمەتگوزاری',
    residential: 'نیشتەجێبوون',
    advertising: 'ڕیکلام',
    commercial: 'بازرگانی',
    agriculture: 'کشتوکاڵ',
  },
  methods: {
    phone: 'تەلەفۆن',
    email: 'ئیمەیڵ',
    whatsapp: 'واتسئاپ',
    whatsappCta: 'لە واتسئاپ نامەمان بۆ بنێرە',
    whatsappText: 'سڵاو، دەمەوێت دەربارەی سیستەمی وزەی خۆر پرسیار بکەم.',
    office: 'نووسینگە',
    maps: 'شوێنەکە لە Google Maps ببینە',
    hours: 'کاتی دەوام',
    closed: 'پشوو',
  },
  peimar: {
    timeline: {
      '2007': { title: 'سەرەتا', text: 'Marco Casale کۆمپانیای Peimar ی لە بواری وزەی خۆردا دامەزراند.' },
      '2011': { title: 'یەکەم لق لە دەرەوە', text: 'یەکەم لقی کۆمپانیاکە لە ئەمریکا کرایەوە.' },
      '2017': { title: 'کارگەی ئیتاڵیا', text: `کارگەی بریشیا بە توانای سەرەتایی ${ltr('150 MW')} کرایەوە.` },
      '2021': { title: 'فراوانبوون لە جیهاندا', text: `توانای بەرهەمهێنان گەیشتە ${ltr('500 MW')} و ژمارەی لقەکان بوو بە 8.` },
      '2025': { title: 'بەرهەمهێنان لە چین', text: `هێڵێکی بەرهەمهێنانی ${ltr('1 GW')} لە چین دانرا و لقێکی نوێش لەوێ کرایەوە.` },
      '2026': { title: 'نوێکردنەوەی بەرهەمهێنان', text: 'هێڵی بەرهەمهێنان لە ئیتاڵیا نوێ کرایەوە.' },
    },
    sites: {
      brescia: {
        place: 'بریشیا، ئیتاڵیا',
        text: 'ناوەندی بەرهەمهێنان لە ئیتاڵیا، هێڵە ئۆتۆماتیکییەکانی پانێڵی ماڵ و پیشەسازی دروست دەکەن.',
      },
      zhejiang: {
        place: 'ژێجیانگ، چین',
        text: 'لە ناوچەی نینگبۆ، هێڵی نوێی PERC و TOPCon بۆ پڕۆژە گەورەکانی جیهان.',
      },
      dubai: {
        place: 'دوبەی، ئیمارات',
        text: 'هاوبەشیی ستراتیژی کە کاڵا بە بەردەوامی دابین دەکات و لەگەڵ یاسا ناوخۆییەکان دەگونجێت.',
      },
    },
    certifications: {
      'IEC 61215 · IEC 61730': 'پەسەندکردنی دیزاین و سەلامەتیی پانێڵ (Kiwa بۆ S Series و TÜV بۆ OR Series)',
      'IEC TS 62804-1': 'بەرگری لە دیاردەی PID',
      'IEC 62716': 'بەرگری لە ئەمۆنیا',
      'IEC 61701': 'بەرگری لە تەمی خوێ',
      'IEC 60068-2-68': 'بەرگری لە تۆز و لم (پانێڵی OR بە شووشەی دووانە)',
      'UL 61730': 'بڕوانامەی CSA',
      ADQCC: 'بڕوانامەی گونجان لە ئەبوزەبی',
      'ISO 9001 · 14001 · 45001': 'بەڕێوەبردنی جۆرایەتی، ژینگە و سەلامەتی لە کارگەی ئیتاڵیا',
    },
  },
  about: {
    meta: {
      title: 'دەربارەی ئێمە',
      description:
        'Faraday بریکاری تایبەتی Peimar ە لە عێراق و بنکەکەی لە سلێمانییە. پانێڵی خۆر، ئینڤێرتەر و پاتریی Peimar دابین دەکەین، سیستەمەکە دیزاین دەکەین و دایدەمەزرێنین.',
    },
    eyebrow: 'دەربارەی Faraday',
    title: 'بریکاری تایبەتی Peimar لە عێراق، بنکەکەمان لە سلێمانییە.',
    lead: 'پانێڵ و ئینڤێرتەر و پاتریی ئیتاڵیی Peimar دەهێنینە عێراق، و خۆمان سیستەمەکە بە تەواوی دادەمەزرێنین.',
    history: {
      eyebrow: 'چیرۆکی ئێمە',
      title: (year: number) => `لە ${year}ەوە تا ئەمڕۆ.`,
    },
    services: {
      eyebrow: 'خزمەتگوزارییەکانمان',
      title: 'لە یەکەم هەژمارەوە تا دوای فرۆشتن.',
      items: [
        {
          title: 'دابینکردن',
          text: 'هەموو بەرهەمەکانی Peimar: پانێڵ، ئینڤێرتەری سەر بە تۆڕ و هایبرید، پاتری و کەرەستە تەواوکەرەکان.',
        },
        {
          title: 'دیزاینی سیستەم',
          text: 'بە دیزاینەر زنجیرەکان و ئینڤێرتەری گونجاو دیاری دەکەین، بەپێی کەشوهەوای شارەکەت.',
        },
        { title: 'دامەزراندن', text: 'تیمەکەمان سیستەمەکە لەسەر بان یان لەسەر زەوی دادەمەزرێنێت.' },
        { title: 'خزمەتی دوای فرۆشتن', text: 'دوای ئەوەی سیستەمەکە کەوتە کار، تیمەکەمان لە سلێمانی هەر لە خزمەتتدایە.' },
      ],
    },
    mission: {
      eyebrow: 'ئامانجمان',
      text: 'دەمانەوێت بە تەکنەلۆژیای نوێ وزەی خۆر بڵاو بکەینەوە، تا پێداویستیی وزەمان لە سەرچاوەی پاک دابین بکەین و سروشتێکی شیاوی ژیان بۆ نەوەکانی داهاتوو بەجێ بهێڵین.',
      by: 'Faraday Co.',
    },
    peimar: {
      eyebrow: 'بۆچی Peimar',
      title: (year: number) => `براندێکی ئیتاڵیی وزەی خۆر لە ساڵی ${year}ەوە.`,
      text: (founded: number, brescia: number, gw: number) =>
        `Marco Casale لە ساڵی ${founded}دا Peimar ی دامەزراند. لە ${brescia}ەوە پانێڵەکانی لە بریشیای ئیتاڵیا دروست دەکرێن و ئەمڕۆ توانای بەرهەمهێنانی لە ${ltr(`${gw} GW`)} تێدەپەڕێت.`,
      statsLabel: 'Peimar بە ژمارە',
      stats: { founded: 'ساڵی دامەزران', brescia: 'سەرەتای بەرهەمهێنان لە بریشیا', capacity: 'توانای بەرهەمهێنان' },
      sites: 'شوێنەکانی بەرهەمهێنان',
      certifications: 'بڕوانامەکان',
      certificationsNote: 'ئەم بڕوانامانە لە peimar.com بۆ پانێڵەکانی Peimar و کارگەکەی ئیتاڵیا بڵاو کراونەتەوە.',
    },
    timeline: {
      eyebrow: 'مێژووی Peimar',
      title: 'بیست ساڵە Peimar گەشە دەکات.',
      lead: 'ئەو کۆمپانیا ئیتاڵییەی لە عێراق نوێنەرایەتیی دەکەین.',
    },
    cta: {
      title: 'بیر لە سیستەمێکی وزەی خۆر دەکەیتەوە؟',
      designer: 'سیستەمەکەت دیزاین بکە',
      contact: 'پەیوەندیمان پێوە بکە',
    },
  },
  projectsPage: {
    meta: {
      title: 'پڕۆژەکان',
    },
    eyebrow: 'پڕۆژەکان',
    title: (min: number, max: number) => `هەندێک لەو سیستەمانەی دامانمەزراندوون، لە ${min} تا ${ltr(`${max} kWp`)}.`,
    listLabel: 'ئەو سیستەمانەی دامانمەزراندوون',
    cta: {
      title: 'سیستەمێکی وەک ئەمانەت دەوێت؟',
      designer: 'بە دیزاینەر هەژماری بکە',
      contact: 'داوای نرخ بکە',
    },
  },
  contactPage: {
    meta: {
      title: 'پەیوەندی',
      description: (street: string, city: string, hours: string) =>
        `تەلەفۆنمان بۆ بکە، لە واتسئاپ نامە بنێرە یان سەردانی نووسینگەی Faraday بکە لە ${street} لە ${city}.${hours && ` دەوام ${hours}.`}`,
    },
    eyebrow: 'پەیوەندی',
    title: 'دەتەوێت چی بە وزەی خۆر کار پێ بکەیت؟',
    lead: 'تەلەفۆنمان بۆ بکە، لە واتسئاپ نامەمان بۆ بنێرە، یان سەردانی نووسینگەکەمان لە سلێمانی بکە.',
    form: {
      eyebrow: 'پرسیار',
      title: 'پرسیارەکەت بنێرە',
      intro: 'کە فۆرمەکە دەنێریت، واتسئاپ یان ئیمەیڵەکەت دەکرێتەوە و نامەکەت ئامادەیە.',
      name: 'ناو',
      phone: 'ژمارەی تەلەفۆن',
      city: 'شار',
      cityPlaceholder: 'شارەکەت هەڵبژێرە',
      cityOther: 'شارێکی تر',
      interest: 'بابەتی پرسیار',
      interestPlaceholder: 'یەکێک هەڵبژێرە',
      interests: {
        hybrid: 'سیستەمی هایبرید لەگەڵ پاتری',
        onGrid: 'سیستەمی بەستراو بە کارەبای نیشتمانی',
        modules: 'پانێڵی خۆر',
        inverters: 'ئینڤێرتەر',
        storage: 'پاتری',
        accessories: 'کەرەستەی تەواوکەر',
        other: 'شتێکی تر',
      },
      message: 'نامەکەت',
      messageHint: 'بۆ نموونە: لە کاتی بڕانی کارەبادا دەتەوێت چ ئامێرێک کار بکات، و بانت هەیە یان زەوی.',
      required: 'پێویستە',
      errors: {
        name: 'ناوت بنووسە.',
        phone: 'ژمارەی تەلەفۆنێکی دروست بنووسە، لانیکەم 7 ژمارە.',
        message: 'نامەیەکی کورت بنووسە.',
      },
      sendWhatsapp: 'بە واتسئاپ بینێرە',
      sendEmail: 'بە ئیمەیڵ بینێرە',
      done: {
        whatsapp: 'واتسئاپ کرایەوە و نامەکەت ئامادەیە. لەوێ دوگمەی ناردن دابگرە.',
        email: 'ئیمەیڵەکەت کرایەوە و نامەکەت ئامادەیە. لەوێ دوگمەی ناردن دابگرە.',
      },
      greeting: 'سڵاو،',
      subject: 'پرسیار لە ماڵپەڕی faradayiq.com',
    },
  },
  notFound: {
    title: 'پەڕەکە نەدۆزرایەوە',
    line: 'ئەم پەڕەیە نییە، یان شوێنەکەی گۆڕاوە.',
    home: 'پەڕەی سەرەکی',
  },
};

export const company: Record<Locale, CompanyStrings> = { en, ar, ckb };
