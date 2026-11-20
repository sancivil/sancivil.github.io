import type { Locale } from './config.ts';
import type { Qa } from './solar.ts';

/** Keeps a figure and its Latin unit together and in reading order inside Arabic-script text. */
const ltr = (s: string | number) => `\u2066${String(s).replaceAll(' ', '\u00a0')}\u2069`;

/** Pre-formatted figures for the site FAQ (Western digits, grouped with commas). */
export interface SiteFacts {
  founded: string;
  brescia: string;
  street: string;
  city: string;
  postal: string;
  open: string;
  close: string;
  phone: string;
  email: string;
  sProduct: string;
  sPower: string;
  orProduct: string;
  orPower: string;
  insurer: string;
  batteryYears: string;
  ctTopcon: string;
  ctMono: string;
  ctPoly: string;
  heatCity: string;
  heatT: string;
  lossTopcon: string;
  lossMono: string;
  lossPoly: string;
  single: string[];
  singleKw: string;
  three: string[];
  threeKw: string;
  storeMin: string;
  storeMinName: string;
  storeMax: string;
  storeMaxName: string;
  storeModules: string;
  sizeCity: string;
  sizeCityId: string;
  sizeY: string;
  sizeKwp: string;
  sizePanels: string;
  model: string;
  watts: string;
  installed: string;
  area: string;
  useMin: string;
  useMax: string;
  cityCount: string;
  north: string;
  south: string;
  cityList: string[];
  low: string;
  lowY: string;
  high: string;
  highY: string;
}

const en = {
  meta: {
    title: 'FAQ: Peimar solar systems in Iraq',
    description:
      'Answers from Faraday Co., the exclusive Peimar agent in Iraq: warranty, modules for the heat, batteries for power cuts, panel counts, the free Designer and how to get a quote.',
  },
  crumb: 'FAQ',
  eyebrow: 'Questions and answers',
  title: 'Questions about Peimar solar in Iraq',
  lead: 'Short answers from Faraday Co., the exclusive Peimar agent in Iraq. Figures come from Peimar datasheets and PVGIS.',
  aside: { title: 'Ask Faraday directly', phone: 'Phone and WhatsApp', email: 'Email', hours: 'Hours' },
  heading: 'Common questions',
  intro: 'Can’t find your question? Send it to us on WhatsApp.',
  whatsapp: 'Message us on WhatsApp',
  whatsappText: 'Hello Faraday, I have a question about a solar system.',
  cta: { title: 'Plan your system, then talk to us.', designer: 'Open the Designer', contact: 'Get a quote' },
  qas: (f: SiteFacts): Qa[] => {
    const and = (xs: string[]) => `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`;
    return [
      {
        q: 'Who is the official Peimar agent in Iraq?',
        a: `Faraday Co. is the exclusive agent of Peimar in Iraq. Peimar is an Italian photovoltaic brand founded in ${f.founded}, with modules made in Brescia, Italy, since ${f.brescia}. Faraday supplies Peimar modules, inverters and storage from its office in Sulaymaniyah.`,
        link: { label: 'About Faraday', href: '/about/' },
      },
      {
        q: 'Where is Faraday and when is it open?',
        a: `Faraday’s office is on ${f.street}, ${f.city} ${f.postal}, Iraq. It is open Saturday to Thursday from ${f.open} to ${f.close} and closed on Friday. Phone and WhatsApp: ${f.phone}.`,
        link: { label: 'Contact', href: '/contact/' },
      },
      {
        q: 'What does Faraday do?',
        a: 'Faraday supplies the full Peimar range: modules, on-grid and hybrid inverters, storage batteries and accessories. We design each system with the climate data of your city, install it on roofs or on the ground, and remain your local contact in Sulaymaniyah once it is running.',
        link: { label: 'Projects', href: '/projects/' },
      },
      {
        q: 'What warranty do Peimar solar panels have?',
        a: `S Series modules, made in Italy, have a ${f.sProduct}-year product warranty and a ${f.sPower}-year linear power warranty. OR Series and DR Series modules have a ${f.orProduct}-year product warranty and a ${f.orPower}-year linear power warranty. Peimar products are covered by a ${f.insurer} policy against third-party damage caused by product defects, and Peimar storage batteries carry a ${f.batteryYears}-year warranty.`,
        link: { label: 'Photovoltaic modules', href: '/products/modules/' },
      },
      {
        q: 'Which Peimar panels suit the summer heat in Iraq?',
        a: `Heat lowers the output of every module; the power temperature coefficient gives the loss for each °C above 25 °C. Peimar’s OR…MNDB modules (N-type TOPCon, double glass) list ${f.ctTopcon} %/°C, against ${f.ctMono} %/°C for mono and ${f.ctPoly} %/°C for poly modules of the Revamping Line. At a typical summer cell temperature of ${f.heatT} °C, as in ${f.heatCity}, that is about ${f.lossTopcon}% below rated power instead of ${f.lossMono}% and ${f.lossPoly}%. The OR double-glass modules are also certified for dust and sand resistance (IEC 60068-2-68).`,
        link: { label: 'Photovoltaic modules', href: '/products/modules/' },
      },
      {
        q: 'Can a Peimar system keep my home running during power cuts?',
        a: `Yes, with a hybrid inverter and batteries. Peimar’s hybrid families are ${and(f.single)} for single-phase homes (${f.singleKw} kW) and ${and(f.three)} for three-phase supplies (${f.threeKw} kW). Peimar LFP storage starts at ${f.storeMin} kWh (one ${f.storeMinName} module) and reaches ${f.storeMax} kWh (${f.storeModules} ${f.storeMaxName} modules), with a ${f.batteryYears}-year warranty. Faraday sizes the battery to the outage hours you want to cover.`,
        link: { label: 'Hybrid inverters & storage', href: '/products/hybrid/' },
      },
      {
        q: 'How many solar panels does a home in Iraq need?',
        a: `Divide your yearly consumption by your city’s yield per kWp, then by the module power. In ${f.sizeCity}, 1,000 kWh a month is 12,000 kWh a year; at ${f.sizeY} kWh per kWp that needs ${f.sizeKwp} kWp, or ${f.sizePanels} Peimar ${f.model} modules of ${f.watts} W (${f.installed} kWp, about ${f.area} m² of module area). Every city page runs this calculation for ${f.useMin} to ${f.useMax} kWh a month.`,
        link: { label: `Solar power in ${f.sizeCity}`, href: `/solar/${f.sizeCityId}/` },
      },
      {
        q: 'Is the Faraday Designer free, and do I need an account?',
        a: `It is free and needs no login. The Designer checks string voltages at your city’s design temperatures, the current per MPPT and the power ratio with the rules of Peimar’s installer tool, and estimates yearly energy with PVGIS data for ${f.cityCount} Iraqi cities.`,
        link: { label: 'Open the Designer', href: '/designer/' },
      },
      {
        q: 'Which Iraqi cities have solar yield data?',
        a: `${f.cityCount} cities from ${f.north} to ${f.south}, including ${and(f.cityList)}. Each city page shows the PVGIS yield per kWp, monthly production, the optimal tilt and design temperatures. Yields range from ${f.lowY} kWh per kWp a year in ${f.low} to ${f.highY} in ${f.high}.`,
        link: { label: 'Solar data for Iraqi cities', href: '/solar/' },
      },
      {
        q: 'How do I get a quote?',
        a: `Send your monthly consumption, your city and the outage hours you want to cover on WhatsApp or by phone to ${f.phone}, or email ${f.email}. You can also design the system in the Designer first and send its summary to us on WhatsApp.`,
        link: { label: 'Contact', href: '/contact/' },
      },
    ];
  },
};

export type FaqStrings = typeof en;

const ar: FaqStrings = {
  meta: {
    title: 'الأسئلة الشائعة: أنظمة Peimar الشمسية في العراق',
    description:
      'إجابات من شركة Faraday، الوكيل الحصري لـ Peimar في العراق: الضمان، والألواح المناسبة للحرارة، والبطاريات لانقطاع الكهرباء، وعدد الألواح، وأداة التصميم المجانية، وطلب عرض السعر.',
  },
  crumb: 'الأسئلة الشائعة',
  eyebrow: 'أسئلة وأجوبة',
  title: 'أسئلة عن أنظمة Peimar الشمسية في العراق',
  lead: 'إجابات قصيرة من شركة Faraday، الوكيل الحصري لـ Peimar في العراق. الأرقام مأخوذة من أوراق بيانات Peimar ومن PVGIS.',
  aside: { title: 'اسأل Faraday مباشرة', phone: 'الهاتف وواتساب', email: 'البريد الإلكتروني', hours: 'ساعات العمل' },
  heading: 'أسئلة شائعة',
  intro: 'لم تجد سؤالك؟ أرسله إلينا على واتساب.',
  whatsapp: 'راسلنا على واتساب',
  whatsappText: 'مرحبًا Faraday، لديّ سؤال عن منظومة شمسية.',
  cta: { title: 'خطّط لمنظومتك، ثم تحدّث معنا.', designer: 'افتح أداة التصميم', contact: 'اطلب عرض سعر' },
  qas: (f: SiteFacts): Qa[] => {
    const and = (xs: string[]) => xs.map(ltr).join(' و');
    return [
      {
        q: 'من هو الوكيل الرسمي لـ Peimar في العراق؟',
        a: `شركة Faraday هي الوكيل الحصري لـ Peimar في العراق. أما Peimar فعلامة إيطالية للطاقة الكهروضوئية تأسست عام ${ltr(f.founded)}، وتُصنع ألواحها في بريشيا بإيطاليا منذ ${ltr(f.brescia)}. وتوفّر Faraday ألواح Peimar وإنفرتراتها وبطاريات التخزين من مكتبها في السليمانية.`,
        link: { label: 'من نحن', href: '/about/' },
      },
      {
        q: 'أين تقع Faraday وما ساعات العمل؟',
        a: `يقع مكتب Faraday في ${f.street}، ${f.city} ${ltr(f.postal)}، العراق. نعمل من السبت إلى الخميس من ${ltr(f.open)} إلى ${ltr(f.close)}، والجمعة عطلة. الهاتف وواتساب: ${ltr(f.phone)}.`,
        link: { label: 'اتصل بنا', href: '/contact/' },
      },
      {
        q: 'ماذا تقدّم Faraday؟',
        a: 'توفّر Faraday مجموعة Peimar الكاملة: الألواح، والإنفرترات المرتبطة بالشبكة والهجينة، وبطاريات التخزين والملحقات. نصمّم كل منظومة اعتمادًا على بيانات مناخ مدينتك، ونركّبها على الأسطح أو على الأرض، ونبقى جهة التواصل المحلية في السليمانية بعد تشغيلها.',
        link: { label: 'المشاريع', href: '/projects/' },
      },
      {
        q: 'ما ضمان ألواح Peimar الشمسية؟',
        a: `لألواح S Series المصنوعة في إيطاليا ضمان منتج ${ltr(f.sProduct)} عامًا وضمان قدرة خطي ${ltr(f.sPower)} عامًا. ولألواح OR Series و DR Series ضمان منتج ${ltr(f.orProduct)} عامًا وضمان قدرة خطي ${ltr(f.orPower)} عامًا. وتغطي منتجات Peimar وثيقة تأمين لدى ${ltr(f.insurer)} ضد أضرار الغير الناتجة عن عيوب المنتج، ولبطاريات التخزين من Peimar ضمان ${ltr(f.batteryYears)} سنوات.`,
        link: { label: 'الألواح الكهروضوئية', href: '/products/modules/' },
      },
      {
        q: 'أي ألواح Peimar تناسب حرارة الصيف في العراق؟',
        a: `الحرارة تخفض إنتاج كل لوح، ويبيّن معامل الحرارة للقدرة مقدار الانخفاض لكل درجة فوق ${ltr('25 °C')}. معامل ألواح OR…MNDB من Peimar (N-type TOPCon بزجاج مزدوج) هو ${ltr(`${f.ctTopcon} %/°C`)}، مقابل ${ltr(`${f.ctMono} %/°C`)} للألواح أحادية البلورة و${ltr(`${f.ctPoly} %/°C`)} للألواح متعددة البلورات في خط Revamping Line. وعند حرارة خلية صيفية نموذجية تبلغ ${ltr(`${f.heatT} °C`)} كما في ${f.heatCity}، يعني ذلك إنتاجًا أقل من القدرة الاسمية بنحو ${ltr(`${f.lossTopcon}%`)} بدل ${ltr(`${f.lossMono}%`)} و${ltr(`${f.lossPoly}%`)}. كما أن ألواح OR بالزجاج المزدوج حاصلة على شهادة مقاومة الغبار والرمال (${ltr('IEC 60068-2-68')}).`,
        link: { label: 'الألواح الكهروضوئية', href: '/products/modules/' },
      },
      {
        q: 'هل تُبقي منظومة Peimar بيتي يعمل أثناء انقطاع الكهرباء؟',
        a: `نعم، مع إنفرتر هجين وبطاريات. عائلات Peimar الهجينة هي ${and(f.single)} للبيوت أحادية الطور (${ltr(`${f.singleKw} kW`)})، و${and(f.three)} للتغذية ثلاثية الأطوار (${ltr(`${f.threeKw} kW`)}). يبدأ تخزين Peimar بتقنية LFP من ${ltr(`${f.storeMin} kWh`)} (وحدة ${ltr(f.storeMinName)} واحدة) ويصل إلى ${ltr(`${f.storeMax} kWh`)} (${ltr(f.storeModules)} وحدة ${ltr(f.storeMaxName)})، بضمان ${ltr(f.batteryYears)} سنوات. وتحدّد Faraday حجم البطارية حسب ساعات الانقطاع التي تريد تغطيتها.`,
        link: { label: 'الإنفرترات الهجينة وتخزين الطاقة', href: '/products/hybrid/' },
      },
      {
        q: 'كم لوحًا شمسيًا يحتاج البيت في العراق؟',
        a: `اقسم استهلاكك السنوي على إنتاج مدينتك لكل ${ltr('kWp')}، ثم على قدرة اللوح. في ${f.sizeCity}، استهلاك ${ltr('1,000 kWh')} شهريًا يساوي ${ltr('12,000 kWh')} سنويًا؛ وبإنتاج ${ltr(`${f.sizeY} kWh`)} لكل ${ltr('kWp')} يلزم ${ltr(`${f.sizeKwp} kWp`)}، أي ${ltr(f.sizePanels)} لوحًا من ${ltr(f.model)} بقدرة ${ltr(`${f.watts} W`)} (${ltr(`${f.installed} kWp`)}، ونحو ${ltr(`${f.area} m²`)} من مساحة الألواح). وفي صفحة كل مدينة هذا الحساب لاستهلاك من ${ltr(f.useMin)} إلى ${ltr(`${f.useMax} kWh`)} شهريًا.`,
        link: { label: `الطاقة الشمسية في ${f.sizeCity}`, href: `/solar/${f.sizeCityId}/` },
      },
      {
        q: 'هل أداة التصميم من Faraday مجانية، وهل تحتاج إلى حساب؟',
        a: `مجانية ولا تحتاج إلى تسجيل دخول. تفحص أداة التصميم جهود السلاسل عند درجات حرارة التصميم لمدينتك، والتيار لكل MPPT ونسبة القدرة، وفق قواعد أداة Peimar للمركّبين، وتقدّر الإنتاج السنوي ببيانات PVGIS لـ ${ltr(f.cityCount)} مدينة عراقية.`,
        link: { label: 'افتح أداة التصميم', href: '/designer/' },
      },
      {
        q: 'ما المدن العراقية التي تتوفر لها بيانات إنتاج الطاقة الشمسية؟',
        a: `${ltr(f.cityCount)} مدينة من ${f.north} إلى ${f.south}، منها ${f.cityList.join(' و')}. تعرض صفحة كل مدينة الإنتاج لكل ${ltr('kWp')} حسب PVGIS، والإنتاج الشهري، وزاوية الميل المثلى، ودرجات حرارة التصميم. ويتراوح الإنتاج بين ${ltr(`${f.lowY} kWh`)} لكل ${ltr('kWp')} سنويًا في ${f.low} و${ltr(f.highY)} في ${f.high}.`,
        link: { label: 'بيانات الطاقة الشمسية للمدن العراقية', href: '/solar/' },
      },
      {
        q: 'كيف أطلب عرض سعر؟',
        a: `أرسل استهلاكك الشهري ومدينتك وساعات الانقطاع التي تريد تغطيتها عبر واتساب أو الهاتف على ${ltr(f.phone)}، أو بالبريد الإلكتروني إلى ${ltr(f.email)}. ويمكنك أيضًا تصميم المنظومة في أداة التصميم أولًا ثم إرسال ملخّصها إلينا عبر واتساب.`,
        link: { label: 'اتصل بنا', href: '/contact/' },
      },
    ];
  },
};

const ckb: FaqStrings = {
  meta: {
    title: 'پرسیارە باوەکان: سیستەمی خۆری Peimar لە عێراق',
    description:
      'وەڵامەکانی کۆمپانیای Faraday، بریکاری تایبەتی Peimar لە عێراق: گەرەنتی، پانێڵی گونجاو بۆ گەرما، پاتری بۆ بڕانی کارەبا، ژمارەی پانێڵ، دیزاینەری بێبەرامبەر و داوای نرخ.',
  },
  crumb: 'پرسیارە باوەکان',
  eyebrow: 'پرسیار و وەڵام',
  title: 'پرسیار دەربارەی سیستەمی خۆری Peimar لە عێراق',
  lead: 'وەڵامی کورت لە کۆمپانیای Faraday، بریکاری تایبەتی Peimar لە عێراق. ژمارەکان لە داتاشیتەکانی Peimar و PVGIS وەرگیراون.',
  aside: { title: 'ڕاستەوخۆ لە Faraday بپرسە', phone: 'تەلەفۆن و واتسئاپ', email: 'ئیمەیڵ', hours: 'کاتەکانی کار' },
  heading: 'پرسیارە باوەکان',
  intro: 'پرسیارەکەت نەدۆزییەوە؟ لە واتسئاپ بۆمانی بنێرە.',
  whatsapp: 'لە واتسئاپ نامەمان بۆ بنێرە',
  whatsappText: 'سڵاو Faraday، پرسیارێکم دەربارەی سیستەمێکی خۆر هەیە.',
  cta: { title: 'سیستەمەکەت پلان بکە، پاشان قسەمان لەگەڵ بکە.', designer: 'دیزاینەر بکەرەوە', contact: 'داوای نرخ بکە' },
  qas: (f: SiteFacts): Qa[] => {
    const and = (xs: string[]) => {
      const items = xs.map(ltr);
      return `${items.slice(0, -1).join('، ')} و ${items[items.length - 1]}`;
    };
    return [
      {
        q: 'بریکاری فەرمیی Peimar لە عێراق کێیە؟',
        a: `کۆمپانیای Faraday بریکاری تایبەتی Peimar ە لە عێراق. Peimar براندێکی ئیتاڵیی وزەی خۆرە کە لە ساڵی ${ltr(f.founded)} دامەزراوە، و لە ساڵی ${ltr(f.brescia)}ەوە پانێڵەکانی لە بریشیا لە ئیتاڵیا دروست دەکرێن. Faraday پانێڵ، ئینڤێرتەر و پاتریی Peimar لە نووسینگەکەی لە سلێمانییەوە دابین دەکات.`,
        link: { label: 'دەربارەی Faraday', href: '/about/' },
      },
      {
        q: 'Faraday لە کوێیە و کاتەکانی کاری چییە؟',
        a: `نووسینگەی Faraday لە ${f.street}، ${f.city} ${ltr(f.postal)}، عێراقە. لە شەممە تا پێنجشەممە لە ${ltr(f.open)} تا ${ltr(f.close)} کراوەیە و هەینی داخراوە. تەلەفۆن و واتسئاپ: ${ltr(f.phone)}.`,
        link: { label: 'پەیوەندی', href: '/contact/' },
      },
      {
        q: 'Faraday چی دەکات؟',
        a: 'Faraday هەموو کۆمەڵەی Peimar دابین دەکات: پانێڵ، ئینڤێرتەری سەر بە تۆڕ و هایبرید، پاتری و کەرەستە تەواوکەرەکان. هەر سیستەمێک بە داتای کەشوهەوای شارەکەت دیزاین دەکەین، لەسەر بان یان لەسەر زەوی دایدەمەزرێنین، و دوای کارپێکردنی پەیوەندیی ناوخۆییت دەبین لە سلێمانی.',
        link: { label: 'پڕۆژەکان', href: '/projects/' },
      },
      {
        q: 'گەرەنتیی پانێڵە خۆرییەکانی Peimar چەندە؟',
        a: `پانێڵەکانی S Series کە لە ئیتاڵیا دروست دەکرێن ${ltr(f.sProduct)} ساڵ گەرەنتیی بەرهەم و ${ltr(f.sPower)} ساڵ گەرەنتیی هێڵیی توانایان هەیە. پانێڵەکانی OR Series و DR Series ${ltr(f.orProduct)} ساڵ گەرەنتیی بەرهەم و ${ltr(f.orPower)} ساڵ گەرەنتیی هێڵیی توانایان هەیە. بەرهەمەکانی Peimar بە بیمەی ${ltr(f.insurer)} پارێزراون دژی زیانی لایەنی سێیەم بەهۆی کەموکوڕیی بەرهەم، و پاترییەکانی Peimar ${ltr(f.batteryYears)} ساڵ گەرەنتییان هەیە.`,
        link: { label: 'پانێڵە خۆرییەکان', href: '/products/modules/' },
      },
      {
        q: 'کام پانێڵی Peimar بۆ گەرمای هاوینی عێراق گونجاوە؟',
        a: `گەرما بەرهەمی هەموو پانێڵێک کەم دەکاتەوە، و هاوکۆڵکەی پلەی گەرمیی توانا دەڵێت بۆ هەر پلەیەک لە سەرووی ${ltr('25 °C')} چەند کەم دەبێتەوە. پانێڵەکانی OR…MNDB ی Peimar (N-type TOPCon بە شووشەی دووانە) ${ltr(`${f.ctTopcon} %/°C`)} یان هەیە، بەرامبەر ${ltr(`${f.ctMono} %/°C`)} بۆ پانێڵی مۆنۆ و ${ltr(`${f.ctPoly} %/°C`)} بۆ پانێڵی پۆلی لە Revamping Line. لە پلەی خانەی ئاسایی هاوینی ${ltr(`${f.heatT} °C`)} وەک ${f.heatCity}، ئەمە دەکاتە نزیکەی ${ltr(`${f.lossTopcon}%`)} کەمتر لە توانای ناوەکی، لە جیاتی ${ltr(`${f.lossMono}%`)} و ${ltr(`${f.lossPoly}%`)}. هەروەها پانێڵەکانی OR بە شووشەی دووانە بڕوانامەی بەرگری لە تۆز و لمیان هەیە (${ltr('IEC 60068-2-68')}).`,
        link: { label: 'پانێڵە خۆرییەکان', href: '/products/modules/' },
      },
      {
        q: 'ئایا سیستەمی Peimar لە کاتی بڕانی کارەبادا ماڵەکەم بە کارەبا دەهێڵێتەوە؟',
        a: `بەڵێ، بە ئینڤێرتەرێکی هایبرید و پاتری. خێزانە هایبریدەکانی Peimar بریتین لە ${and(f.single)} بۆ ماڵی تاک فاز (${ltr(`${f.singleKw} kW`)}) و ${and(f.three)} بۆ کارەبای سێ فاز (${ltr(`${f.threeKw} kW`)}). هەڵگرتنی وزەی LFP ی Peimar لە ${ltr(`${f.storeMin} kWh`)} (یەک یەکەی ${ltr(f.storeMinName)}) دەست پێ دەکات و دەگاتە ${ltr(`${f.storeMax} kWh`)} (${ltr(f.storeModules)} یەکەی ${ltr(f.storeMaxName)})، بە ${ltr(f.batteryYears)} ساڵ گەرەنتی. Faraday قەبارەی پاترییەکە بەپێی ئەو کاتژمێرانەی بڕانی کارەبا دیاری دەکات کە دەتەوێت دایپۆشیت.`,
        link: { label: 'ئینڤێرتەری هایبرید و پاتری', href: '/products/hybrid/' },
      },
      {
        q: 'ماڵێک لە عێراق چەند پانێڵی خۆری پێویستە؟',
        a: `بەکارهێنانی ساڵانەت دابەش بکە بەسەر بەرهەمی شارەکەت بۆ هەر ${ltr('kWp')}، پاشان بەسەر توانای پانێڵەکە. لە ${f.sizeCity}، ${ltr('1,000 kWh')} لە مانگێکدا دەکاتە ${ltr('12,000 kWh')} لە ساڵێکدا؛ بە ${ltr(`${f.sizeY} kWh`)} بۆ هەر ${ltr('kWp')} پێویستی بە ${ltr(`${f.sizeKwp} kWp`)} هەیە، واتە ${ltr(f.sizePanels)} پانێڵی ${ltr(f.model)} ی ${ltr(`${f.watts} W`)} (${ltr(`${f.installed} kWp`)}، نزیکەی ${ltr(`${f.area} m²`)} ڕووبەری پانێڵ). لە پەڕەی هەر شارێکدا ئەم ژماردنە بۆ ${ltr(f.useMin)} تا ${ltr(`${f.useMax} kWh`)} لە مانگێکدا هەیە.`,
        link: { label: `وزەی خۆر لە ${f.sizeCity}`, href: `/solar/${f.sizeCityId}/` },
      },
      {
        q: 'ئایا دیزاینەری Faraday بێبەرامبەرە و پێویستی بە هەژمار هەیە؟',
        a: `بێبەرامبەرە و پێویستی بە چوونەژوورەوە نییە. دیزاینەر ڤۆڵتی زنجیرەکان لە پلەکانی گەرمیی دیزاینی شارەکەت، تەزوو بۆ هەر MPPT و ڕێژەی توانا دەپشکنێت بەپێی یاساکانی ئامرازی دامەزرێنەرانی Peimar، و بەرهەمی ساڵانە بە داتای PVGIS بۆ ${ltr(f.cityCount)} شاری عێراق دەخەمڵێنێت.`,
        link: { label: 'دیزاینەر بکەرەوە', href: '/designer/' },
      },
      {
        q: 'کام شارەکانی عێراق داتای بەرهەمی وزەی خۆریان هەیە؟',
        a: `${ltr(f.cityCount)} شار لە ${f.north} تا ${f.south}، لەوانە ${f.cityList.slice(0, -1).join('، ')} و ${f.cityList[f.cityList.length - 1]}. پەڕەی هەر شارێک بەرهەمی PVGIS بۆ هەر ${ltr('kWp')}، بەرهەمی مانگانە، باشترین لاری و پلەکانی گەرمیی دیزاین پیشان دەدات. بەرهەم لە ${ltr(`${f.lowY} kWh`)} بۆ هەر ${ltr('kWp')} لە ساڵێکدا لە ${f.low} تا ${ltr(f.highY)} لە ${f.high} دەگۆڕێت.`,
        link: { label: 'داتای وزەی خۆر بۆ شارەکانی عێراق', href: '/solar/' },
      },
      {
        q: 'چۆن داوای نرخ بکەم؟',
        a: `بەکارهێنانی مانگانە، شارەکەت و ئەو کاتژمێرانەی بڕانی کارەبا کە دەتەوێت دایپۆشیت لە واتسئاپ یان بە تەلەفۆن بۆ ${ltr(f.phone)} بنێرە، یان ئیمەیڵ بۆ ${ltr(f.email)} بنێرە. هەروەها دەتوانیت سەرەتا سیستەمەکە لە دیزاینەر دیزاین بکەیت و پوختەکەی لەوێوە بە واتسئاپ بۆمان بنێریت.`,
        link: { label: 'پەیوەندی', href: '/contact/' },
      },
    ];
  },
};

export const faq: Record<Locale, FaqStrings> = { en, ar, ckb };
