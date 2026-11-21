import type { Locale } from './config.ts';
import type { ModuleFacts } from '../lib/three/facts.ts';

/** Isolates a left-to-right run (codes, figures with units) inside Arabic or Kurdish text. */
const ltr = (s: string | number) => `\u2066${s}\u2069`;

export interface Caption {
  name: string;
  body: string;
}

/*
  Captions use only sourced facts (research/peimar-notes.md, src/data): 3.2 mm low-iron tempered
  anti-reflective glass on the S Series, 2.0 mm low-iron tempered rear glass and the dust and sand
  test (IEC 60068-2-68) on OR double glass, cell counts and technology labels from the datasheets,
  anodized aluminium frames (black, silver, red RAL 8015), black or white backsheets, Red Line and
  Green Line glass, junction box protection class from panels.json.
*/

const en = {
  anatomy: {
    eyebrow: 'Anatomy',
    titlePre: 'Seven layers in ',
    titlePost: '.',
    intro: (f: ModuleFacts) =>
      `What sits inside the ${f.model}, from the front glass to the junction ${f.junctionBoxes > 1 ? 'boxes' : 'box'}.`,
    certs: 'Certified',
    pidFree: 'PID free',
    layers: (f: ModuleFacts): Caption[] => {
      const tech = {
        topcon: f.bifacial ? 'N-type TOPCon, bifacial' : 'N-type TOPCon',
        perc: f.bifacial ? 'PERC, bifacial' : 'PERC',
        poly: 'polycrystalline',
        mono: 'monocrystalline',
      }[f.tech];
      const colour = { black: 'black', silver: 'silver', red: 'red (RAL 8015)', green: 'green (RAL 6007)' }[f.frame];
      const ip = f.protection ? `, rated ${f.protection}` : '';
      return [
        {
          name: 'Front glass',
          body:
            f.tint === 'red'
              ? 'Red Line: tempered glass coloured red (RAL 8015) by a treatment of pigmented nanoparticles.'
              : f.tint === 'green'
                ? 'Green Line: coloured glass in green (RAL 6007).'
                : f.series === 'S'
                  ? '3.2 mm low-iron tempered glass with an anti-reflective surface.'
                  : f.doubleGlass
                    ? 'Anti-reflective tempered glass. The module has glass on both faces.'
                    : 'Tempered glass covers and protects the cells.',
        },
        { name: 'Encapsulant', body: 'A clear film bonds the cells to the front glass.' },
        {
          name: 'Cells and ribbons',
          body: `${f.cells} ${f.halfCut ? 'half-cut cells' : 'cells'}${f.format ? ` (${f.format})` : ''}, ${tech}. Thin ribbons join them into strings.`,
        },
        { name: 'Rear encapsulant', body: 'A second film seals the cells from behind.' },
        f.doubleGlass
          ? { name: 'Rear glass', body: '2.0 mm low-iron tempered glass, tested for dust and sand (IEC 60068-2-68).' }
          : f.clearBack
            ? { name: 'Transparent backsheet', body: 'A clear backsheet, used on the PERC bifacial version.' }
            : {
                name: 'Backsheet',
                body:
                  f.back === 'black'
                    ? 'Black backsheet. Peimar also builds it with a white one.'
                    : 'White backsheet. Peimar also builds it with a black one.',
              },
        {
          name: 'Frame',
          body: `Anodized aluminium, ${f.depth} mm deep, in ${colour}.${f.series === 'S' ? ' Compact and sturdy, anchorable also on the short side.' : ''}`,
        },
        f.junctionBoxes > 1
          ? {
              name: 'Junction boxes and cables',
              body: `Three junction boxes on the centre line${ip}. Two output cables end in plug connectors.`,
            }
          : {
              name: 'Junction box and cables',
              body: `One junction box near the top edge${ip}. Two output cables end in plug connectors.`,
            },
      ];
    },
  },
  viewer: {
    label: (model: string) => `${model}, 3D model`,
    controls: 'Viewer controls',
    front: 'Front',
    back: 'Back',
    explode: 'Explode',
    dimensions: 'Dimensions',
    reset: 'Reset',
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',
    hint: 'Drag sideways to turn',
    noWebgl: 'The 3D view needs WebGL, which this browser does not provide.',
    details: 'Details',
    spots: 'Details on the model',
    spot: (n: number, name: string) => `${n}. ${name}`,
    close: 'Close',
    plate: { name: 'Rating label', body: 'Electrical ratings at standard test conditions, as printed on the datasheet.' },
    rows: {
      power: 'Power',
      protection: 'Protection class',
      vdcMax: 'Max system voltage',
      voc: 'Open-circuit voltage',
      isc: 'Short-circuit current',
      fuse: 'Max series fuse',
    },
  },
  sun: {
    title: 'Sun over Sulaymaniyah',
    group: 'Sunlight on the module',
    scrub: 'Time of day',
    night: 'Night',
    hint: 'Drag to see the day',
    live: 'Live',
    value: (time: string, elevation: number | null) =>
      elevation === null ? `${time}, sun below the horizon` : `${time}, sun ${elevation}° above the horizon`,
  },
};

export type ThreeStrings = typeof en;

const ar: ThreeStrings = {
  anatomy: {
    eyebrow: 'مكوّنات اللوح',
    titlePre: 'سبع طبقات في لوح سماكته ',
    titlePost: '.',
    intro: (f) => `ما بداخل لوح ${ltr(f.model)}، من الزجاج الأمامي حتى ${f.junctionBoxes > 1 ? 'علب التوصيل' : 'علبة التوصيل'}.`,
    certs: 'الشهادات',
    pidFree: 'لا يتأثر بـ\u00a0PID',
    layers: (f) => {
      const tech = {
        topcon: `بتقنية ${ltr('N-type TOPCon')}${f.bifacial ? ' ثنائية الوجه' : ''}`,
        perc: `بتقنية ${ltr('PERC')}${f.bifacial ? ' ثنائية الوجه' : ''}`,
        poly: 'متعددة البلورات',
        mono: 'أحادية البلورة',
      }[f.tech];
      const colour = {
        black: 'الأسود',
        silver: 'الفضي',
        red: `الأحمر (${ltr('RAL 8015')})`,
        green: `الأخضر (${ltr('RAL 6007')})`,
      }[f.frame];
      const ip = f.protection ? `، درجة حمايتها ${ltr(f.protection)}` : '';
      const few = f.cells % 100 >= 3 && f.cells % 100 <= 10;
      const cellWord = few ? (f.halfCut ? 'خلايا نصفية' : 'خلايا') : f.halfCut ? 'خلية نصفية' : 'خلية';
      return [
        {
          name: 'الزجاج الأمامي',
          body:
            f.tint === 'red'
              ? `زجاج مقسّى أحمر (${ltr('RAL 8015')}) خاص بسلسلة ${ltr('Red Line')}، يكتسب لونه من معالجة بجسيمات نانوية ملوّنة.`
              : f.tint === 'green'
                ? `زجاج ملوّن بالأخضر (${ltr('RAL 6007')}) خاص بسلسلة ${ltr('Green Line')}.`
                : f.series === 'S'
                  ? `زجاج مقسّى منخفض الحديد بسماكة ${ltr('3.2 mm')}، وسطحه مضاد للانعكاس.`
                  : f.doubleGlass
                    ? 'زجاج مقسّى مضاد للانعكاس، واللوح مغطّى بالزجاج من الوجهين.'
                    : 'زجاج مقسّى يغطّي الخلايا ويحميها.',
        },
        { name: 'طبقة التغليف', body: 'غشاء شفاف يلصق الخلايا بالزجاج الأمامي.' },
        {
          name: 'الخلايا وأشرطة التوصيل',
          body: `${ltr(f.cells)} ${cellWord}${f.format ? ` (${ltr(f.format)})` : ''} ${tech}، تربطها أشرطة رفيعة على شكل سلاسل.`,
        },
        { name: 'طبقة التغليف الخلفية', body: 'غشاء ثانٍ يُحكم إغلاق الخلايا من الخلف.' },
        f.doubleGlass
          ? {
              name: 'الزجاج الخلفي',
              body: `زجاج مقسّى منخفض الحديد بسماكة ${ltr('2.0 mm')}، مُختبَر لمقاومة الغبار والرمل وفق ${ltr('IEC 60068-2-68')}.`,
            }
          : f.clearBack
            ? { name: 'الطبقة الخلفية الشفافة', body: `تُستخدم في نسخة ${ltr('PERC')} ثنائية الوجه.` }
            : {
                name: 'الطبقة الخلفية',
                body:
                  f.back === 'black'
                    ? 'طبقة سوداء، وتصنع Peimar اللوح نفسه بطبقة بيضاء أيضًا.'
                    : 'طبقة بيضاء، وتصنع Peimar اللوح نفسه بطبقة سوداء أيضًا.',
              },
        {
          name: 'الإطار',
          body: `إطار من الألمنيوم المؤكسد أنوديًا بعمق ${ltr(`${f.depth} mm`)}، باللون ${colour}.${f.series === 'S' ? ' وهو متين ومدمج، ويمكن تثبيته من الجانب القصير أيضًا.' : ''}`,
        },
        f.junctionBoxes > 1
          ? {
              name: 'علب التوصيل والكابلات',
              body: `ثلاث علب توصيل في منتصف اللوح${ip}. يخرج منها كابلان ينتهيان بموصّلات.`,
            }
          : {
              name: 'علبة التوصيل والكابلات',
              body: `علبة توصيل واحدة قرب الحافة العليا${ip}. يخرج منها كابلان ينتهيان بموصّلات.`,
            },
      ];
    },
  },
  viewer: {
    label: (model) => `نموذج ثلاثي الأبعاد للوح ${ltr(model)}`,
    controls: 'أزرار التحكم',
    front: 'الأمام',
    back: 'الخلف',
    explode: 'فصل الطبقات',
    dimensions: 'الأبعاد',
    reset: 'إعادة الضبط',
    zoomIn: 'تكبير',
    zoomOut: 'تصغير',
    hint: 'اسحب يمينًا أو يسارًا لتدوير اللوح',
    noWebgl: 'لا يدعم هذا المتصفح تقنية WebGL اللازمة للعرض ثلاثي الأبعاد.',
    details: 'التفاصيل',
    spots: 'نقاط التفاصيل',
    spot: (n, name) => `${ltr(n)}. ${name}`,
    close: 'إغلاق',
    plate: { name: 'ملصق المواصفات', body: 'القيم الكهربائية عند ظروف الاختبار القياسية، كما وردت في ورقة البيانات الفنية.' },
    rows: {
      power: 'القدرة',
      protection: 'درجة الحماية',
      vdcMax: 'أقصى جهد للمنظومة',
      voc: 'جهد الدائرة المفتوحة',
      isc: 'تيار الدائرة القصيرة',
      fuse: 'أقصى فيوز للسلسلة',
    },
  },
  sun: {
    title: 'شمس السليمانية',
    group: 'ضوء الشمس على اللوح',
    scrub: 'ساعات النهار',
    night: 'ليل',
    hint: 'اسحب لتغيير الوقت',
    live: 'الآن',
    value: (time, elevation) =>
      elevation === null
        ? `الساعة ${ltr(time)}، والشمس تحت الأفق`
        : `الساعة ${ltr(time)}، والشمس على ارتفاع ${ltr(`${elevation}°`)} فوق الأفق`,
  },
};

const ckb: ThreeStrings = {
  anatomy: {
    eyebrow: 'پێکهاتەی پانێڵ',
    titlePre: 'حەوت چین لە پانێڵێکدا کە ',
    titlePost: ' ئەستوورە.',
    intro: (f) =>
      `سەیری ناوەوەی پانێڵی ${ltr(f.model)} بکە، لە شووشەی پێشەوە تا ${f.junctionBoxes > 1 ? 'سندوقەکانی پەیوەندی' : 'سندوقی پەیوەندی'}.`,
    certs: 'بڕوانامەکان',
    pidFree: 'PID کاری تێ ناکات',
    layers: (f) => {
      const tech = {
        topcon: `بە تەکنەلۆژیای ${ltr('N-type TOPCon')}${f.bifacial ? ' و دوو ڕوو' : ''}`,
        perc: `بە تەکنەلۆژیای ${ltr('PERC')}${f.bifacial ? ' و دوو ڕوو' : ''}`,
        poly: 'لە جۆری فرە کریستاڵ',
        mono: 'لە جۆری تاک کریستاڵ',
      }[f.tech];
      const colour = {
        black: 'ڕەش',
        silver: 'زیوی',
        red: `سوور (${ltr('RAL 8015')})`,
        green: `سەوز (${ltr('RAL 6007')})`,
      }[f.frame];
      const ip = f.protection ? `، بە پلەی پاراستنی ${ltr(f.protection)}` : '';
      return [
        {
          name: 'شووشەی پێشەوە',
          body:
            f.tint === 'red'
              ? `شووشەی بەهێزکراوی سوور (${ltr('RAL 8015')})، تایبەت بە ${ltr('Red Line')}. بە تەنۆلکەی نانۆی ڕەنگدار ڕەنگ دەکرێت.`
              : f.tint === 'green'
                ? `شووشەی ڕەنگکراوی سەوز (${ltr('RAL 6007')})، تایبەت بە ${ltr('Green Line')}.`
                : f.series === 'S'
                  ? `شووشەی بەهێزکراوی کەم ئاسن بە ئەستووریی ${ltr('3.2 mm')}. ڕووەکەی ڕەنگدانەوەی تیشک کەم دەکاتەوە.`
                  : f.doubleGlass
                    ? 'شووشەی بەهێزکراوی دژە ڕەنگدانەوە. پانێڵەکە لە هەردوو ڕووەوە شووشەی هەیە.'
                    : 'شووشەی بەهێزکراو خانەکان دادەپۆشێت و دەیانپارێزێت.',
        },
        { name: 'چینی داپۆشەر', body: 'توێژاڵێکی ڕوون خانەکان بە شووشەی پێشەوە دەلکێنێت.' },
        {
          name: 'خانەکان و شریتەکان',
          body: `${ltr(f.cells)} ${f.halfCut ? 'خانەی نیوەبڕاو' : 'خانە'}${f.format ? ` (${ltr(f.format)})` : ''} ${tech}، کە شریتە باریکەکان بە زنجیرە پێکەوەیان دەبەستن.`,
        },
        { name: 'چینی داپۆشەری پشتەوە', body: 'توێژاڵێکی دووەم خانەکان لە پشتەوە بە تەواوی دادەپۆشێت.' },
        f.doubleGlass
          ? {
              name: 'شووشەی پشتەوە',
              body: `شووشەی بەهێزکراوی کەم ئاسن بە ئەستووریی ${ltr('2.0 mm')}. بە پێی ستانداردی ${ltr('IEC 60068-2-68')} بۆ تۆز و لم تاقیکراوەتەوە.`,
            }
          : f.clearBack
            ? { name: 'چینی پشتەوەی ڕوون', body: `لە وەشانی دوو ڕووی ${ltr('PERC')} بەکاردێت.` }
            : {
                name: 'چینی پشتەوە',
                body:
                  f.back === 'black'
                    ? 'ڕەنگی ڕەشە و Peimar هەمان پانێڵ بە چینی سپیش دروست دەکات.'
                    : 'ڕەنگی سپییە و Peimar هەمان پانێڵ بە چینی ڕەشیش دروست دەکات.',
              },
        {
          name: 'چوارچێوە',
          body: `لە ئەلەمنیۆمی ئەنۆدایزکراو دروست کراوە، بە ئەستووریی ${ltr(`${f.depth} mm`)} و ڕەنگی ${colour}.${f.series === 'S' ? ' پتەو و کۆمپاکتە و دەکرێت لە لای کورتیشەوە جێگیر بکرێت.' : ''}`,
        },
        f.junctionBoxes > 1
          ? {
              name: 'سندوقەکانی پەیوەندی و کێبڵەکان',
              body: `سێ سندوقی پەیوەندی لە ناوەڕاستی پانێڵەکە هەیە${ip}. دوو کێبڵی دەرچوون لە کۆتاییدا کۆنێکتەریان پێوەیە.`,
            }
          : {
              name: 'سندوقی پەیوەندی و کێبڵەکان',
              body: `یەک سندوقی پەیوەندی لە نزیک لێواری سەرەوە هەیە${ip}. دوو کێبڵی دەرچوون لە کۆتاییدا کۆنێکتەریان پێوەیە.`,
            },
      ];
    },
  },
  viewer: {
    label: (model) => `مۆدێلی سێ ڕەهەندیی ${ltr(model)}`,
    controls: 'دوگمەکانی کۆنترۆڵ',
    front: 'پێشەوە',
    back: 'پشتەوە',
    explode: 'چینەکان',
    dimensions: 'پێوانەکان',
    reset: 'ڕێکخستنەوە',
    zoomIn: 'نزیککردنەوە',
    zoomOut: 'دوورخستنەوە',
    hint: 'بۆ سووڕاندن، بە لای چەپ یان ڕاستدا ڕایبکێشە',
    noWebgl: 'ئەم وێبگەڕە پشتگیری WebGL ناکات، بۆیە مۆدێلی سێ ڕەهەندی پیشان نادرێت.',
    details: 'وردەکاری',
    spots: 'خاڵەکانی وردەکاری',
    spot: (n, name) => `${ltr(n)}. ${name}`,
    close: 'داخستن',
    plate: {
      name: 'لەیبڵی تایبەتمەندی',
      body: 'نرخە کارەباییەکان لە بارودۆخی تاقیکردنەوەی ستانداردا پێوراون و هەمان نرخەکانی داتاشیتن.',
    },
    rows: {
      power: 'توانا',
      protection: 'پلەی پاراستن',
      vdcMax: 'زۆرترین ڤۆڵتی سیستەم',
      voc: 'ڤۆڵتی بازنەی کراوە',
      isc: 'تەزووی بازنەی کورت',
      fuse: 'زۆرترین فیوزی زنجیرە',
    },
  },
  sun: {
    title: 'خۆری سلێمانی',
    group: 'تیشکی خۆر لەسەر پانێڵەکە',
    scrub: 'کاتژمێرەکانی ڕۆژ',
    night: 'شەو',
    hint: 'ڕایبکێشە بۆ گۆڕینی کات',
    live: 'ئێستا',
    value: (time, elevation) =>
      elevation === null
        ? `کاتژمێر ${ltr(time)}، خۆر لە ژێر ئاسۆیە`
        : `کاتژمێر ${ltr(time)}، خۆر ${ltr(`${elevation}°`)} لە سەرووی ئاسۆیە`,
  },
};

export const three: Record<Locale, ThreeStrings> = { en, ar, ckb };
