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
  country: string;
  postal: string | null;
  /** The open days with their times, and the closed days as one list ('' when open every day). */
  hours: { open: { days: string; open: string; close: string }[]; closed: string };
  /** Every phone number, and the WhatsApp numbers among them. */
  phones: string[];
  whatsapp: string[];
  /** The number for quotes: the first WhatsApp number. */
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
  /** The smallest and largest Peimar storage on the site; null when none states a capacity. */
  storage: { min: string; minName: string; max: string; maxName: string; modules: string } | null;
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

/** Whether every number takes WhatsApp, so one label covers them all. */
const allWhatsapp = (f: SiteFacts) => f.whatsapp.length === f.phones.length;

const en = {
  meta: {
    title: 'FAQ: Peimar solar systems in Iraq',
    description:
      'Answers from Faraday, the exclusive Peimar agent in Iraq: warranty, modules for the heat, batteries for power cuts, panel counts, the free Designer and quotes.',
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
    const and = (xs: string[]) => (xs.length > 1 ? `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}` : xs.join(''));
    const open = f.hours.open.map((g) => `${g.days} from ${g.open} to ${g.close}`).join(', ');
    const hours = open && ` It is open ${open}${f.hours.closed && ` and closed on ${f.hours.closed}`}.`;
    const calls = allWhatsapp(f)
      ? `Phone and WhatsApp: ${f.phones.join(', ')}.`
      : `Phone: ${f.phones.join(', ')}. WhatsApp: ${f.whatsapp.join(', ')}.`;
    const hybrid = [
      f.single.length > 0 && `${and(f.single)} for single-phase homes (${f.singleKw} kW)`,
      f.three.length > 0 && `${and(f.three)} for three-phase supplies (${f.threeKw} kW)`,
    ].filter(Boolean);
    return [
      {
        q: 'Who is the official Peimar agent in Iraq?',
        a: `Faraday Co. is the exclusive agent of Peimar in Iraq. Peimar is an Italian photovoltaic brand founded in ${f.founded}, with modules made in Brescia, Italy, since ${f.brescia}. Faraday supplies Peimar modules, inverters and storage from its office in Sulaymaniyah.`,
        link: { label: 'About Faraday', href: '/about/' },
      },
      {
        q: 'Where is Faraday and when is it open?',
        a: `Faraday’s office is on ${f.street}, ${f.city}${f.postal ? ` ${f.postal}` : ''}, ${f.country}.${hours} ${calls}`,
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
        a: `Yes, with a hybrid inverter and batteries.${hybrid.length ? ` Peimar’s hybrid families are ${hybrid.join(' and ')}.` : ''}${f.storage ? ` Peimar LFP storage starts at ${f.storage.min} kWh (one ${f.storage.minName} module) and reaches ${f.storage.max} kWh (${f.storage.modules} ${f.storage.maxName} modules), with a ${f.batteryYears}-year warranty.` : ''} Faraday sizes the battery to the outage hours you want to cover.`,
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

/** Arabic counted noun after a figure: plural for 3 to 10, singular accusative from 11 on. */
const arNoun = (n: string, few: string, many: string) => {
  const r = Number(n.replaceAll(',', '')) % 100;
  return r >= 3 && r <= 10 ? few : many;
};

const ar: FaqStrings = {
  meta: {
    title: 'أسئلة شائعة عن منظومات Peimar الشمسية في العراق',
    description:
      'إجابات من Faraday، الوكيل الحصري لـ Peimar في العراق: الضمان، وألواح تتحمّل الحر، وبطاريات لانقطاع الكهرباء، وعدد الألواح، وأداة التصميم المجانية، وعرض السعر.',
  },
  crumb: 'الأسئلة الشائعة',
  eyebrow: 'أسئلة وأجوبة',
  title: 'أسئلتكم عن منظومات Peimar الشمسية في العراق',
  lead: 'إجابات مختصرة من Faraday، الوكيل الحصري لـ\u00a0Peimar في العراق. الأرقام من أوراق البيانات الفنية لـ\u00a0Peimar ومن بيانات PVGIS.',
  aside: { title: 'اسألنا مباشرة', phone: 'الهاتف وواتساب', email: 'البريد الإلكتروني', hours: 'أوقات الدوام' },
  heading: 'أسئلة شائعة',
  intro: 'لم تجد سؤالك؟ أرسله لنا على واتساب.',
  whatsapp: 'راسلنا على واتساب',
  whatsappText: 'مرحبًا Faraday، عندي سؤال عن منظومة طاقة شمسية.',
  cta: { title: 'صمّم منظومتك أولًا، ثم كلّمنا.', designer: 'افتح أداة التصميم', contact: 'اطلب عرض سعر' },
  qas: (f: SiteFacts): Qa[] => {
    const and = (xs: string[]) => xs.map(ltr).join(' و');
    const years = (n: string) => `${ltr(n)} ${arNoun(n, 'سنوات', 'سنة')}`;
    const open = f.hours.open.map((g) => `${g.days}، من ${ltr(g.open)} إلى ${ltr(g.close)}`).join('، و');
    const hours = open && ` الدوام ${open}${f.hours.closed && `، و${f.hours.closed} عطلة`}.`;
    const list = (xs: string[]) => xs.map(ltr).join('، ');
    const calls = allWhatsapp(f)
      ? `الهاتف وواتساب: ${list(f.phones)}.`
      : `الهاتف: ${list(f.phones)}. واتساب: ${list(f.whatsapp)}.`;
    const hybrid = [
      f.single.length > 0 && `${and(f.single)} للبيوت أحادية الطور (${ltr(`${f.singleKw} kW`)})`,
      f.three.length > 0 && `${and(f.three)} للتغذية ثلاثية الأطوار (${ltr(`${f.threeKw} kW`)})`,
    ].filter(Boolean);
    return [
      {
        q: 'من هو الوكيل الرسمي لـ\u00a0Peimar في العراق؟',
        a: `شركة Faraday هي الوكيل الحصري لـ\u00a0Peimar في العراق، وتجهّز ألواح Peimar وإنفرتراتها وبطاريات التخزين من مكتبها في السليمانية. أما Peimar فعلامة إيطالية في الطاقة الشمسية تأسست عام ${ltr(f.founded)}، وتُصنع ألواحها في بريشيا بإيطاليا منذ عام ${ltr(f.brescia)}.`,
        link: { label: 'من نحن', href: '/about/' },
      },
      {
        q: 'أين مكتب Faraday، وما أوقات الدوام؟',
        a: `مكتبنا في ${f.street}، ${f.city}${f.postal ? ` ${ltr(f.postal)}` : ''}، ${f.country}.${hours} ${calls}`,
        link: { label: 'اتصل بنا', href: '/contact/' },
      },
      {
        q: 'ماذا تقدّم Faraday؟',
        a: 'نجهّز منتجات Peimar كلها: الألواح، والإنفرترات المرتبطة بالشبكة والهجينة، وبطاريات التخزين والملحقات. نصمّم كل منظومة حسب مناخ مدينتك، ونركّبها على السطح أو على الأرض، ونتابعها بعد التشغيل من مكتبنا في السليمانية.',
        link: { label: 'المشاريع', href: '/projects/' },
      },
      {
        q: 'ما الضمان على ألواح Peimar الشمسية؟',
        a: `لألواح S Series المصنوعة في إيطاليا ضمان ${years(f.sProduct)} على المنتج و${years(f.sPower)} على القدرة الخطية. ولألواح OR Series و DR Series ضمان ${years(f.orProduct)} على المنتج و${years(f.orPower)} على القدرة الخطية. ومنتجات Peimar مشمولة بوثيقة تأمين من ${ltr(f.insurer)} تغطي أي ضرر يسبّبه عيب في المنتج للغير، أما بطاريات التخزين من Peimar فضمانها ${years(f.batteryYears)}.`,
        link: { label: 'الألواح الشمسية', href: '/products/modules/' },
      },
      {
        q: 'أي ألواح Peimar تناسب حرارة صيف العراق؟',
        a: `الحرارة تخفض إنتاج كل لوح، ومعامل الحرارة للقدرة يبيّن مقدار الانخفاض مع كل درجة فوق ${ltr('25 °C')}. في ألواح OR…MNDB من Peimar (\u200fTOPCon من النوع N بزجاج مزدوج) يبلغ هذا المعامل ${ltr(`${f.ctTopcon} %/°C`)}، مقابل ${ltr(`${f.ctMono} %/°C`)} للألواح أحادية البلورة و${ltr(`${f.ctPoly} %/°C`)} للألواح متعددة البلورات في Revamping Line. وعند حرارة خلية صيفية معتادة تبلغ ${ltr(`${f.heatT} °C`)}، كما في ${f.heatCity}، يقلّ الإنتاج عن القدرة الاسمية بنحو ${ltr(`${f.lossTopcon}%`)} بدل ${ltr(`${f.lossMono}%`)} و${ltr(`${f.lossPoly}%`)}. كما أن ألواح OR بالزجاج المزدوج حاصلة على شهادة مقاومة الغبار والرمال (${ltr('IEC 60068-2-68')}).`,
        link: { label: 'الألواح الشمسية', href: '/products/modules/' },
      },
      {
        q: 'هل يبقى بيتي مضاءً مع منظومة Peimar حين تنقطع الكهرباء؟',
        a: `نعم، إذا ضمّت المنظومة إنفرترًا هجينًا وبطاريات.${hybrid.length ? ` لدى Peimar إنفرترات ${hybrid.join('، و')}.` : ''}${f.storage ? ` وتبدأ بطاريات Peimar من نوع LFP بسعة ${ltr(`${f.storage.min} kWh`)} (وحدة ${ltr(f.storage.minName)} واحدة) وتصل إلى ${ltr(`${f.storage.max} kWh`)} (${ltr(f.storage.modules)} ${arNoun(f.storage.modules, 'وحدات', 'وحدة')} ${ltr(f.storage.maxName)})، بضمان ${years(f.batteryYears)}.` : ''} ونحسب في Faraday حجم البطارية على عدد ساعات الانقطاع التي تريد تغطيتها.`,
        link: { label: 'الإنفرترات الهجينة والبطاريات', href: '/products/hybrid/' },
      },
      {
        q: 'كم لوحًا شمسيًا يحتاج البيت في العراق؟',
        a: `اقسم استهلاكك السنوي على ما ينتجه كل ${ltr('kWp')} في مدينتك، ثم على قدرة اللوح الواحد. مثال من ${f.sizeCity}: استهلاك ${ltr('1,000 kWh')} في الشهر يعني ${ltr('12,000 kWh')} في السنة، وكل ${ltr('kWp')} هناك ينتج ${ltr(`${f.sizeY} kWh`)}، فتحتاج إلى ${ltr(`${f.sizeKwp} kWp`)}، أي ${ltr(f.sizePanels)} ${arNoun(f.sizePanels, 'ألواح', 'لوحًا')} من طراز ${ltr(f.model)} بقدرة ${ltr(`${f.watts} W`)} (${ltr(`${f.installed} kWp`)}، بمساحة نحو ${ltr(`${f.area} m²`)}). وفي صفحة كل مدينة تجد هذا الحساب جاهزًا لاستهلاك من ${ltr(f.useMin)} إلى ${ltr(`${f.useMax} kWh`)} في الشهر.`,
        link: { label: `الطاقة الشمسية في ${f.sizeCity}`, href: `/solar/${f.sizeCityId}/` },
      },
      {
        q: 'هل أداة التصميم مجانية؟ وهل أحتاج إلى حساب؟',
        a: `نعم، الأداة مجانية ولا تحتاج إلى أي تسجيل. تفحص جهد السلاسل على درجات حرارة التصميم في مدينتك، وتيار كل MPPT ونسبة القدرة، بالقواعد نفسها التي تعتمدها أداة Peimar للفنيين، ثم تقدّر الإنتاج السنوي من بيانات PVGIS لـ\u00a0${ltr(f.cityCount)} مدينة عراقية.`,
        link: { label: 'افتح أداة التصميم', href: '/designer/' },
      },
      {
        q: 'ما المدن العراقية التي تتوفر عنها بيانات الطاقة الشمسية؟',
        a: `${ltr(f.cityCount)} مدينة، من ${f.north} شمالًا إلى ${f.south} جنوبًا، منها ${f.cityList.join(' و')}. في صفحة كل مدينة تجد إنتاج كل ${ltr('kWp')} حسب PVGIS، والإنتاج شهرًا بشهر، وزاوية الميل المثلى، ودرجات حرارة التصميم. ويتراوح الإنتاج السنوي بين ${ltr(`${f.lowY} kWh`)} لكل ${ltr('kWp')} في ${f.low} و${ltr(f.highY)} في ${f.high}.`,
        link: { label: 'الطاقة الشمسية في مدن العراق', href: '/solar/' },
      },
      {
        q: 'كيف أطلب عرض سعر؟',
        a: `أرسل لنا استهلاكك الشهري واسم مدينتك وعدد ساعات الانقطاع التي تريد تغطيتها، على واتساب أو بالهاتف على ${ltr(f.phone)}، أو بالبريد الإلكتروني إلى ${ltr(f.email)}. ويمكنك أيضًا أن تصمّم منظومتك في أداة التصميم أولًا، ثم ترسل لنا ملخّصها على واتساب.`,
        link: { label: 'اتصل بنا', href: '/contact/' },
      },
    ];
  },
};

const ckb: FaqStrings = {
  meta: {
    title: 'پرسیارە باوەکان دەربارەی سیستەمی خۆری Peimar لە عێراق',
    description:
      'وەڵامەکانی Faraday، بریکاری تایبەتی Peimar لە عێراق: گەرەنتی، پانێڵی گونجاو بۆ گەرما، پاتری بۆ بڕانی کارەبا، ژمارەی پانێڵ، دیزاینەری بێبەرامبەر و داوای نرخ.',
  },
  crumb: 'پرسیارە باوەکان',
  eyebrow: 'پرسیار و وەڵام',
  title: 'پرسیارەکانتان دەربارەی سیستەمی خۆری Peimar لە عێراق',
  lead: 'Faraday، بریکاری تایبەتی Peimar لە عێراق، بە کورتی وەڵام دەداتەوە. ژمارەکان لە داتاشیتەکانی Peimar و داتای PVGIS وەرگیراون.',
  aside: { title: 'ڕاستەوخۆ لە ئێمە بپرسە', phone: 'تەلەفۆن و واتسئاپ', email: 'ئیمەیڵ', hours: 'کاتی دەوام' },
  heading: 'پرسیارە باوەکان',
  intro: 'پرسیارەکەت نەدۆزییەوە؟ لە واتسئاپ بۆمانی بنێرە.',
  whatsapp: 'لە واتسئاپ نامەمان بۆ بنێرە',
  whatsappText: 'سڵاو Faraday، پرسیارێکم دەربارەی سیستەمێکی خۆر هەیە.',
  cta: { title: 'سەرەتا سیستەمەکەت دیزاین بکە، پاشان قسەمان لەگەڵ بکە.', designer: 'دیزاینەر بکەرەوە', contact: 'داوای نرخ بکە' },
  qas: (f: SiteFacts): Qa[] => {
    const and = (xs: string[]) => {
      const items = xs.map(ltr);
      return items.length > 1 ? `${items.slice(0, -1).join('، ')} و ${items[items.length - 1]}` : items.join('');
    };
    const open = f.hours.open.map((g) => `${g.days} لە ${ltr(g.open)} تا ${ltr(g.close)}`).join(' و ');
    const hours = open && ` ${open} کراوەین${f.hours.closed && ` و ${f.hours.closed} پشووە`}.`;
    const list = (xs: string[]) => xs.map(ltr).join('، ');
    const calls = allWhatsapp(f)
      ? `تەلەفۆن و واتسئاپ: ${list(f.phones)}.`
      : `تەلەفۆن: ${list(f.phones)}. واتسئاپ: ${list(f.whatsapp)}.`;
    const single = f.single.length > 0 && `بۆ ماڵی تاک فاز بریتین لە ${and(f.single)} (${ltr(`${f.singleKw} kW`)})`;
    const three =
      f.three.length > 0 && `بۆ کارەبای سێ فاز ${single ? '' : 'بریتین لە '}${and(f.three)} (${ltr(`${f.threeKw} kW`)})`;
    const hybrid = [single, three].filter(Boolean);
    return [
      {
        q: 'بریکاری فەرمیی Peimar لە عێراق کێیە؟',
        a: `کۆمپانیای Faraday لە عێراق بریکاری تایبەتی Peimar ە، و لە نووسینگەکەی لە سلێمانی پانێڵ، ئینڤێرتەر و پاتریی Peimar دابین دەکات. Peimar براندێکی ئیتاڵییە لە بواری وزەی خۆردا، لە ساڵی ${ltr(f.founded)} دامەزراوە و لە ساڵی ${ltr(f.brescia)}ەوە پانێڵەکانی لە شاری بریشیای ئیتاڵیا دروست دەکرێن.`,
        link: { label: 'دەربارەی Faraday', href: '/about/' },
      },
      {
        q: 'نووسینگەی Faraday لە کوێیە و کەی کراوەیە؟',
        a: `نووسینگەکەمان دەکەوێتە ${f.street}، ${f.city}${f.postal ? ` ${ltr(f.postal)}` : ''}، ${f.country}.${hours} ${calls}`,
        link: { label: 'پەیوەندی', href: '/contact/' },
      },
      {
        q: 'Faraday چی دەکات؟',
        a: 'هەموو بەرهەمەکانی Peimar دابین دەکەین: پانێڵ، ئینڤێرتەری سەر بە تۆڕ و هایبرید، پاتری و کەرەستە تەواوکەرەکان. هەر سیستەمێک بەپێی کەشوهەوای شارەکەت دیزاین دەکەین، لەسەر بان یان لەسەر زەوی دایدەمەزرێنین، و دوای کارپێکردنیش لە سلێمانییەوە بەدواداچوونی بۆ دەکەین.',
        link: { label: 'پڕۆژەکان', href: '/projects/' },
      },
      {
        q: 'گەرەنتیی پانێڵە خۆرییەکانی Peimar چەندە؟',
        a: `پانێڵەکانی S Series کە لە ئیتاڵیا دروست دەکرێن ${ltr(f.sProduct)} ساڵ گەرەنتیی بەرهەم و ${ltr(f.sPower)} ساڵ گەرەنتیی هێڵیی توانایان هەیە. پانێڵەکانی OR Series و DR Series ${ltr(f.orProduct)} ساڵ گەرەنتیی بەرهەم و ${ltr(f.orPower)} ساڵ گەرەنتیی هێڵیی توانایان هەیە. هەروەها بەرهەمەکانی Peimar بە بیمەنامەیەکی ${ltr(f.insurer)} پارێزراون، کە ئەو زیانانە دەگرێتەوە کە کەموکوڕیی بەرهەم بە کەسانی تر دەگەیەنێت، و پاترییەکانی Peimar ${ltr(f.batteryYears)} ساڵ گەرەنتییان هەیە.`,
        link: { label: 'پانێڵی خۆر', href: '/products/modules/' },
      },
      {
        q: 'کام پانێڵی Peimar بۆ گەرمای هاوینی عێراق گونجاوە؟',
        a: `گەرما بەرهەمی هەموو پانێڵێک کەم دەکاتەوە، و هاوکۆڵکەی پلەی گەرمیی توانا پیشان دەدات بۆ هەر پلەیەک سەرووی ${ltr('25 °C')} چەندی لێ کەم دەبێتەوە. ئەم هاوکۆڵکەیە بۆ پانێڵەکانی OR…MNDB ی Peimar (\u200fTOPCon ی جۆری N، بە شووشەی دووانە) ${ltr(`${f.ctTopcon} %/°C`)} ە، بەرامبەر ${ltr(`${f.ctMono} %/°C`)} بۆ پانێڵی تاک کریستاڵ و ${ltr(`${f.ctPoly} %/°C`)} بۆ پانێڵی فرە کریستاڵی Revamping Line. لە پلەی گەرمیی ئاسایی خانە لە هاویندا (${ltr(`${f.heatT} °C`)}، وەک لە ${f.heatCity})، بەرهەم نزیکەی ${ltr(`${f.lossTopcon}%`)} لە توانای ناوەکی کەمتر دەبێت، لە جیاتی ${ltr(`${f.lossMono}%`)} و ${ltr(`${f.lossPoly}%`)}. هەروەها پانێڵەکانی OR ی شووشەی دووانە بڕوانامەی بەرگری لە تۆز و لمیان هەیە (${ltr('IEC 60068-2-68')}).`,
        link: { label: 'پانێڵی خۆر', href: '/products/modules/' },
      },
      {
        q: 'کە کارەبا دەبڕێت، سیستەمی Peimar ماڵەکەم بە کارەبا دەهێڵێتەوە؟',
        a: `بەڵێ، ئەگەر سیستەمەکە ئینڤێرتەری هایبرید و پاتریی تێدا بێت.${hybrid.length ? ` ئینڤێرتەرە هایبریدەکانی Peimar ${hybrid.join('، و ')}.` : ''}${f.storage ? ` پاترییەکانی LFP ی Peimar لە ${ltr(`${f.storage.min} kWh`)} (یەک یەکەی ${ltr(f.storage.minName)}) دەست پێ دەکەن و دەگەنە ${ltr(`${f.storage.max} kWh`)} (${ltr(f.storage.modules)} یەکەی ${ltr(f.storage.maxName)})، بە ${ltr(f.batteryYears)} ساڵ گەرەنتی.` : ''} قەبارەی پاترییەکە بەپێی ئەو کاتژمێرانە دیاری دەکەین کە دەتەوێت لە کاتی بڕانی کارەبادا کارەبات هەبێت.`,
        link: { label: 'ئینڤێرتەری هایبرید و پاتری', href: '/products/hybrid/' },
      },
      {
        q: 'ماڵێک لە عێراق چەند پانێڵی خۆری پێویستە؟',
        a: `بەکاربردنی ساڵانەی کارەباکەت دابەش بکە بەسەر بەرهەمی ساڵانەی هەر ${ltr('kWp')} لە شارەکەت، پاشان بەسەر توانای یەک پانێڵ. بۆ نموونە لە ${f.sizeCity}: ${ltr('1,000 kWh')} لە مانگێکدا دەکاتە ${ltr('12,000 kWh')} لە ساڵێکدا؛ هەر ${ltr('kWp')} لەوێ ${ltr(`${f.sizeY} kWh`)} بەرهەم دەهێنێت، کەواتە ${ltr(`${f.sizeKwp} kWp`)} پێویستە، واتە ${ltr(f.sizePanels)} پانێڵی ${ltr(f.model)} ی ${ltr(`${f.watts} W`)} (${ltr(`${f.installed} kWp`)}، نزیکەی ${ltr(`${f.area} m²`)} ڕووبەر). لە پەڕەی هەر شارێکدا ئەم هەژمارە بۆ بەکاربردنی ${ltr(f.useMin)} تا ${ltr(`${f.useMax} kWh`)} لە مانگێکدا ئامادەیە.`,
        link: { label: `وزەی خۆر لە ${f.sizeCity}`, href: `/solar/${f.sizeCityId}/` },
      },
      {
        q: 'دیزاینەری Faraday بێبەرامبەرە؟ پێویستم بە هەژمار هەیە؟',
        a: `بەڵێ، بێبەرامبەرە و پێویست بە خۆتۆمارکردن ناکات. دیزاینەر ڤۆڵتی زنجیرەکان بە پلەکانی گەرمیی دیزاینی شارەکەت دەپشکنێت، لەگەڵ تەزووی هەر MPPT و ڕێژەی توانا، بە هەمان ئەو ڕێسایانەی ئامرازی Peimar بۆ دامەزرێنەران. پاشان بە داتای PVGIS بۆ ${ltr(f.cityCount)} شاری عێراق بەرهەمی ساڵانە دەخەمڵێنێت.`,
        link: { label: 'دیزاینەر بکەرەوە', href: '/designer/' },
      },
      {
        q: 'بۆ کام شارەکانی عێراق داتای بەرهەمی وزەی خۆر هەیە؟',
        a: `${ltr(f.cityCount)} شار، لە ${f.north} لە باکوور تا ${f.south} لە باشوور، لەوانە ${f.cityList.slice(0, -1).join('، ')} و ${f.cityList[f.cityList.length - 1]}. پەڕەی هەر شارێک بەرهەمی هەر ${ltr('kWp')} بەپێی PVGIS، بەرهەمی مانگانە، باشترین لاری و پلەکانی گەرمیی دیزاین پیشان دەدات. بەرهەمی ساڵانە لە ${ltr(`${f.lowY} kWh`)} بۆ هەر ${ltr('kWp')} لە ${f.low} تا ${ltr(f.highY)} لە ${f.high} دەگۆڕێت.`,
        link: { label: 'وزەی خۆر لە شارەکانی عێراق', href: '/solar/' },
      },
      {
        q: 'چۆن داوای نرخ بکەم؟',
        a: `بەکاربردنی مانگانەت، ناوی شارەکەت و ئەو کاتژمێرانەی دەتەوێت لە کاتی بڕانی کارەبادا کارەبات هەبێت، لە واتسئاپ یان بە تەلەفۆن بۆ ${ltr(f.phone)} بنێرە، یان ئیمەیڵ بکە بۆ ${ltr(f.email)}. دەشتوانیت سەرەتا سیستەمەکەت لە دیزاینەر دیزاین بکەیت و پوختەکەی بە واتسئاپ بۆمان بنێریت.`,
        link: { label: 'پەیوەندی', href: '/contact/' },
      },
    ];
  },
};

export const faq: Record<Locale, FaqStrings> = { en, ar, ckb };
