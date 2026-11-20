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
  },
};

export type ThreeStrings = typeof en;

const ar: ThreeStrings = {
  anatomy: {
    eyebrow: 'من الداخل',
    titlePre: 'سبع طبقات بسماكة ',
    titlePost: '.',
    intro: (f) => `ما يحتويه ${ltr(f.model)}، من الزجاج الأمامي إلى ${f.junctionBoxes > 1 ? 'علب التوصيل' : 'علبة التوصيل'}.`,
    certs: 'الشهادات',
    pidFree: 'خالٍ من PID',
    layers: (f) => {
      const topcon = `بتقنية ${ltr('TOPCon')} من النوع ${ltr('N')}`;
      const tech = {
        topcon: f.bifacial ? `${topcon}، ثنائية الوجه` : topcon,
        perc: f.bifacial ? `بتقنية ${ltr('PERC')}، ثنائية الوجه` : `بتقنية ${ltr('PERC')}`,
        poly: 'متعددة البلورات',
        mono: 'أحادية البلورة',
      }[f.tech];
      const colour = {
        black: 'الأسود',
        silver: 'الفضي',
        red: `الأحمر (${ltr('RAL 8015')})`,
        green: `الأخضر (${ltr('RAL 6007')})`,
      }[f.frame];
      const ip = f.protection ? ` بتصنيف حماية ${ltr(f.protection)}` : '';
      const few = f.cells % 100 >= 3 && f.cells % 100 <= 10;
      const cellWord = few ? (f.halfCut ? 'خلايا نصفية' : 'خلايا') : f.halfCut ? 'خلية نصفية' : 'خلية';
      return [
        {
          name: 'الزجاج الأمامي',
          body:
            f.tint === 'red'
              ? `${ltr('Red Line')}: زجاج مقسّى بلون أحمر (${ltr('RAL 8015')})، يُلوَّن بمعالجة بجسيمات نانوية ملوّنة.`
              : f.tint === 'green'
                ? `${ltr('Green Line')}: زجاج ملوّن بالأخضر (${ltr('RAL 6007')}).`
                : f.series === 'S'
                  ? `زجاج مقسّى منخفض الحديد بسماكة ${ltr('3.2 mm')}، بسطح مضاد للانعكاس.`
                  : f.doubleGlass
                    ? 'زجاج مقسّى مضاد للانعكاس، فاللوح مغطّى بالزجاج من الوجهين.'
                    : 'زجاج مقسّى يغطّي الخلايا ويحميها.',
        },
        { name: 'طبقة التغليف', body: 'غشاء شفاف يثبّت الخلايا بالزجاج الأمامي.' },
        {
          name: 'الخلايا وأشرطة التوصيل',
          body: `${ltr(f.cells)} ${cellWord}${f.format ? ` (${ltr(f.format)})` : ''} ${tech}. وتربطها أشرطة رفيعة في سلاسل.`,
        },
        { name: 'طبقة التغليف الخلفية', body: 'غشاء ثانٍ يغلّف الخلايا من الخلف.' },
        f.doubleGlass
          ? {
              name: 'الزجاج الخلفي',
              body: `زجاج مقسّى منخفض الحديد بسماكة ${ltr('2.0 mm')}، مُختبَر لمقاومة الغبار والرمل (${ltr('IEC 60068-2-68')}).`,
            }
          : f.clearBack
            ? { name: 'طبقة خلفية شفافة', body: `طبقة خلفية شفافة، تُستخدم في النسخة ثنائية الوجه بتقنية ${ltr('PERC')}.` }
            : {
                name: 'الطبقة الخلفية',
                body:
                  f.back === 'black'
                    ? 'طبقة خلفية سوداء، وتصنعها Peimar باللون الأبيض أيضًا.'
                    : 'طبقة خلفية بيضاء، وتصنعها Peimar باللون الأسود أيضًا.',
              },
        {
          name: 'الإطار',
          body: `ألمنيوم مؤكسد أنوديًا بسماكة ${ltr(`${f.depth} mm`)}، باللون ${colour}.${f.series === 'S' ? ' متين ومدمج، ويمكن تثبيته من الجانب القصير أيضًا.' : ''}`,
        },
        f.junctionBoxes > 1
          ? {
              name: 'علب التوصيل والكابلات',
              body: `ثلاث علب توصيل على خط المنتصف${ip}. كابلا خرج ينتهيان بموصّلات.`,
            }
          : {
              name: 'علبة التوصيل والكابلات',
              body: `علبة توصيل واحدة قرب الحافة العليا${ip}. كابلا خرج ينتهيان بموصّلات.`,
            },
      ];
    },
  },
  viewer: {
    label: (model) => `${ltr(model)}، نموذج ثلاثي الأبعاد`,
    controls: 'أدوات التحكم بالعرض',
    front: 'الأمام',
    back: 'الخلف',
    explode: 'تفكيك',
    dimensions: 'الأبعاد',
    reset: 'إعادة الضبط',
    zoomIn: 'تكبير',
    zoomOut: 'تصغير',
    hint: 'اسحب أفقيًا للتدوير',
    noWebgl: 'يحتاج العرض ثلاثي الأبعاد إلى WebGL، وهو غير متاح في هذا المتصفح.',
  },
};

const ckb: ThreeStrings = {
  anatomy: {
    eyebrow: 'لە ناوەوە',
    titlePre: 'حەوت چین بە ئەستووریی ',
    titlePost: '.',
    intro: (f) =>
      `پێکهاتەی ناوەوەی ${ltr(f.model)}، لە شووشەی پێشەوە تا ${f.junctionBoxes > 1 ? 'سندوقەکانی پەیوەندی' : 'سندوقی پەیوەندی'}.`,
    certs: 'بڕوانامەکان',
    pidFree: 'بێ PID',
    layers: (f) => {
      const topcon = `${ltr('TOPCon')} ی جۆری ${ltr('N')}`;
      const tech = {
        topcon: f.bifacial ? `${topcon}، دوو ڕوو` : topcon,
        perc: f.bifacial ? `تەکنەلۆژیای ${ltr('PERC')}، دوو ڕوو` : `تەکنەلۆژیای ${ltr('PERC')}`,
        poly: 'فرە کریستاڵی',
        mono: 'تاک کریستاڵی',
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
              ? `${ltr('Red Line')}: شووشەی بەهێزکراوی سوور (${ltr('RAL 8015')})، بە گەردیلەی نانۆی ڕەنگدار ڕەنگ کراوە.`
              : f.tint === 'green'
                ? `${ltr('Green Line')}: شووشەی ڕەنگکراوی سەوز (${ltr('RAL 6007')}).`
                : f.series === 'S'
                  ? `شووشەی بەهێزکراوی کەم ئاسن بە ئەستووریی ${ltr('3.2 mm')}، ڕووەکەی دژە ڕەنگدانەوەیە.`
                  : f.doubleGlass
                    ? 'شووشەی بەهێزکراوی دژە ڕەنگدانەوە؛ هەردوو ڕووی پانێڵەکە شووشەن.'
                    : 'شووشەی بەهێزکراو خانەکان دادەپۆشێت و دەیانپارێزێت.',
        },
        { name: 'چینی داپۆشەر', body: 'فیلمێکی ڕوون خانەکان بە شووشەی پێشەوە دەلکێنێت.' },
        {
          name: 'خانەکان و شریتەکان',
          body: `${ltr(f.cells)} ${f.halfCut ? 'خانەی نیوەبڕاو' : 'خانە'}${f.format ? ` (${ltr(f.format)})` : ''}، ${tech}. شریتی باریک دەیانکەنە زنجیرە.`,
        },
        { name: 'چینی داپۆشەری پشتەوە', body: 'فیلمێکی دووەم خانەکان لە پشتەوە دادەپۆشێت.' },
        f.doubleGlass
          ? {
              name: 'شووشەی پشتەوە',
              body: `شووشەی بەهێزکراوی کەم ئاسن بە ئەستووریی ${ltr('2.0 mm')}، بۆ تۆز و لم تاقیکراوەتەوە (${ltr('IEC 60068-2-68')}).`,
            }
          : f.clearBack
            ? { name: 'چینی پشتەوەی ڕوون', body: `چینی پشتەوەی ڕوون، بۆ وەشانی دوو ڕووی ${ltr('PERC')}.` }
            : {
                name: 'چینی پشتەوە',
                body:
                  f.back === 'black'
                    ? 'چینی پشتەوەی ڕەش. Peimar بە سپیش دروستی دەکات.'
                    : 'چینی پشتەوەی سپی. Peimar بە ڕەشیش دروستی دەکات.',
              },
        {
          name: 'چوارچێوە',
          body: `ئەلەمنیۆمی ئەنۆدایزکراو بە ئەستووریی ${ltr(`${f.depth} mm`)}، بە ڕەنگی ${colour}.${f.series === 'S' ? ' پتەو و کۆمپاکتە و لە لای کورتیشەوە دەبەسترێت.' : ''}`,
        },
        f.junctionBoxes > 1
          ? {
              name: 'سندوقەکانی پەیوەندی و کێبڵەکان',
              body: `سێ سندوقی پەیوەندی لەسەر هێڵی ناوەڕاست${ip}. دوو کێبڵی دەرچوون بە کۆنێکتەر کۆتایی دێن.`,
            }
          : {
              name: 'سندوقی پەیوەندی و کێبڵەکان',
              body: `یەک سندوقی پەیوەندی نزیک لێواری سەرەوە${ip}. دوو کێبڵی دەرچوون بە کۆنێکتەر کۆتایی دێن.`,
            },
      ];
    },
  },
  viewer: {
    label: (model) => `${ltr(model)}، مۆدێلی سێ ڕەهەندی`,
    controls: 'کۆنترۆڵەکانی پیشاندان',
    front: 'پێشەوە',
    back: 'پشتەوە',
    explode: 'جیاکردنەوە',
    dimensions: 'ئەندازەکان',
    reset: 'ڕێکخستنەوە',
    zoomIn: 'نزیککردنەوە',
    zoomOut: 'دوورخستنەوە',
    hint: 'بە ئاسۆیی ڕایبکێشە بۆ سووڕاندن',
    noWebgl: 'پیشاندانی سێ ڕەهەندی پێویستی بە WebGL هەیە، کە ئەم وێبگەڕە نییەتی.',
  },
};

export const three: Record<Locale, ThreeStrings> = { en, ar, ckb };
