import type { Locale } from './config.ts';

/** Keeps a figure and its Latin unit together and in reading order inside Arabic-script text. */
const ltr = (s: string | number) => `\u2066${String(s).replaceAll(' ', '\u00a0').replaceAll('/', '/\u2060')}\u2069`;

/** Arabic counted noun for years: 3–10 take the plural, everything else the singular. */
const years = (n: number) => (n % 100 >= 3 && n % 100 <= 10 ? 'سنوات' : 'سنة');

/** Pre-formatted figures for one city (Western digits, grouped with commas). */
export interface CityFacts {
  city: string;
  yieldYear: string;
  perDay: string;
  tilt: string;
  loss: string;
  peakMonth: string;
  peak: string;
  lowMonth: string;
  low: string;
  panels: string;
  model: string;
  watts: string;
  installed: string;
  kwp: string;
  area: string;
  facing: string;
  coords: string;
  tmin: string;
  tnom: string;
  tmax: string;
  tmyMin: string;
  tmyMax: string;
}

/** Pre-formatted figures across all cities. */
export interface IraqFacts {
  count: string;
  best: string;
  bestY: string;
  bestDay: string;
  second: string;
  secondY: string;
  third: string;
  thirdY: string;
  lowest: string;
  lowY: string;
  lowDay: string;
  diff: string;
  loss: string;
  tiltMin: string;
  tiltMax: string;
  azMax: string;
  flattest: string;
  steepest: string;
}

export interface Qa {
  q: string;
  a: string;
  link?: { label: string; href: string };
}

const en = {
  crumb: 'Solar data',
  months: [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ],
  monthsShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  governorate: (name: string) => `${name} Governorate`,
  governorates: {
    Duhok: 'Duhok',
    Nineveh: 'Nineveh',
    Erbil: 'Erbil',
    Sulaymaniyah: 'Sulaymaniyah',
    Kirkuk: 'Kirkuk',
    Halabja: 'Halabja',
    Saladin: 'Saladin',
    Diyala: 'Diyala',
    Anbar: 'Anbar',
    Baghdad: 'Baghdad',
    Karbala: 'Karbala',
    Wasit: 'Wasit',
    Babil: 'Babil',
    Najaf: 'Najaf',
    'Al-Qadisiyyah': 'Al-Qadisiyyah',
    Maysan: 'Maysan',
    Muthanna: 'Muthanna',
    'Dhi Qar': 'Dhi Qar',
    Basra: 'Basra',
  },
  coords: (lat: string, lon: string) => `${lat}° N · ${lon}° E`,
  elevation: (m: string) => `${m} m above sea level`,
  facing: (az: number) => (az === 0 ? 'facing due south' : `facing ${az}° west of due south`),
  azimuthWord: (az: number): string => (az === 0 ? 'due south' : 'west of south'),
  credit: 'PVGIS © European Union, 2001–2026',
  index: {
    meta: {
      title: (n: string) => `Solar yield in Iraq by city: PVGIS data for ${n} cities`,
      description: (f: IraqFacts) =>
        `How much 1 kWp of solar panels produces in a year in ${f.count} Iraqi cities, from ${f.lowY} kWh in ${f.lowest} to ${f.bestY} kWh in ${f.best}. PVGIS data with optimal tilt and design temperatures.`,
    },
    dataset: {
      name: (n: string) => `PVGIS solar yield for ${n} Iraqi cities`,
      description: (n: string) =>
        `Annual and monthly PV energy yield of 1 kWp, in-plane irradiation, optimal angles and string design temperatures for ${n} Iraqi cities, from PVGIS v5.3.`,
    },
    eyebrow: (n: string) => `PVGIS solar data · ${n} cities`,
    title: 'Solar yield across Iraq',
    lead: (f: IraqFacts) =>
      `How much electricity 1 kWp of solar modules produces in a year in ${f.count} Iraqi cities: from ${f.lowY} kWh in ${f.lowest} to ${f.bestY} kWh in ${f.best}. PVGIS figures for free-standing modules at the optimal tilt, with ${f.loss}% system losses.`,
    stats: {
      best: (city: string) => `Highest yield · ${city}`,
      lowest: (city: string) => `Lowest yield · ${city}`,
      tilt: 'Optimal tilt',
    },
    table: {
      eyebrow: 'All cities',
      title: 'Yield, sunlight and design temperatures by city',
      lead: 'Annual yield is the electricity 1 kWp of modules delivers in a year. Irradiation is the sunlight that reaches the tilted modules. Design temperatures are the cell temperatures used to check string voltages.',
      sort: { label: 'Order', north: 'North to south', yield: 'Highest yield first' },
      col: {
        rank: 'Rank',
        city: 'City',
        yield: 'Annual yield',
        irradiation: 'Irradiation',
        tilt: 'Tilt',
        azimuth: 'Azimuth',
        temps: 'Design temperatures',
        tmin: 'Min',
        tnom: 'Typical',
        tmax: 'Max',
      },
      caption: (n: string) =>
        `PVGIS annual yield, in-plane irradiation, optimal angles and design temperatures for ${n} Iraqi cities`,
      swipe: 'Swipe for more columns',
    },
    method: {
      eyebrow: 'Method',
      title: 'How these figures are made',
      rows: (loss: string, date: string) => [
        {
          label: 'Source',
          text: 'PVGIS v5.3 by the European Commission Joint Research Centre (PVcalc and TMY tools)',
        },
        { label: 'Sunlight', text: 'PVGIS-SARAH3 satellite radiation data' },
        { label: 'Temperatures', text: 'ERA5 reanalysis, 2005–2023, as a typical meteorological year' },
        {
          label: 'System',
          text: '1 kWp of crystalline silicon modules, free-standing, at the optimal tilt and azimuth',
        },
        { label: 'Losses', text: `${loss}% system losses; PVGIS adds temperature, angle and spectral losses` },
        { label: 'Location', text: 'City-centre coordinates' },
        {
          label: 'Design temperatures',
          text: 'Coldest: lowest typical-year air temperature minus 3 °C. Typical: summer daytime mean plus 20 °C. Hottest: highest air temperature plus 30 °C.',
        },
        { label: 'Retrieved', text: date },
      ],
      note: 'Roof orientation, shade and dust change real output. Bifacial rear-side gain is not included.',
    },
    faq: {
      heading: 'Questions about solar yield in Iraq',
      qas: (f: IraqFacts): Qa[] => [
        {
          q: 'Which city in Iraq gets the most solar energy?',
          a: `Of the ${f.count} cities on this page, ${f.best} has the highest PVGIS yield: ${f.bestY} kWh per kWp a year. ${f.second} (${f.secondY}) and ${f.third} (${f.thirdY}) follow. ${f.lowest} has the lowest, ${f.lowY} kWh per kWp, ${f.diff}% less than ${f.best}.`,
        },
        {
          q: 'How much electricity does 1 kWp of solar panels produce in Iraq?',
          a: `Between ${f.lowY} kWh a year in ${f.lowest} and ${f.bestY} kWh in ${f.best}, or ${f.lowDay} to ${f.bestDay} kWh a day on average. These PVGIS figures assume free-standing modules at the optimal tilt and ${f.loss}% system losses.`,
        },
        {
          q: 'What tilt angle is best for solar panels in Iraq?',
          a: `Between ${f.tiltMin}° and ${f.tiltMax}° from horizontal, facing south or up to ${f.azMax}° west of south. The optimum is flatter in the south: PVGIS gives ${f.tiltMin}° for ${f.flattest} and ${f.tiltMax}° for ${f.steepest}.`,
        },
      ],
    },
    cta: { title: 'Size a system for your city.', designer: 'Open the Designer', contact: 'Talk to Faraday' },
  },
  city: {
    meta: {
      title: (city: string) => `Solar panels in ${city} — yield, sizing and Peimar systems`,
      description: (city: string, y: string, tilt: string) =>
        `1 kWp of solar panels in ${city} produces about ${y} kWh a year (PVGIS). Monthly output, the best tilt (${tilt}°), Peimar panel counts and string design temperatures.`,
    },
    dataset: {
      name: (city: string) => `PVGIS solar yield and design temperatures for ${city}, Iraq`,
      description: (city: string, y: string, irr: string, tilt: string) =>
        `Monthly and annual PV energy yield of 1 kWp (${y} kWh a year), in-plane irradiation (${irr} kWh/m²), optimal tilt (${tilt}°) and string design temperatures for ${city}, from PVGIS v5.3.`,
    },
    eyebrow: (gov: string) => `Solar data · ${gov}`,
    title: (city: string) => `Solar power in ${city}`,
    lead: (city: string, y: string, day: string, tilt: string) =>
      `In ${city}, each kWp of solar modules produces about ${y} kWh a year, ${day} kWh a day on average, at the optimal ${tilt}° tilt.`,
    stats: {
      yield: 'Yield per kWp, per year',
      irradiation: 'Sunlight on the modules, per year',
      tilt: 'Optimal tilt',
      azimuth: 'Optimal azimuth',
    },
    monthly: {
      eyebrow: 'Monthly production',
      title: (city: string) => `What 1 kWp produces in ${city}, month by month`,
      text: (peakMonth: string, peak: string, lowMonth: string, low: string) =>
        `The best month is ${peakMonth} with ${peak} kWh, the weakest is ${lowMonth} with ${low} kWh.`,
      total: (t: string) => `Yearly total ${t} kWh`,
      chartLabel: (city: string) => `Monthly production of 1 kWp in ${city}, in kWh`,
      average: 'Average',
      axis: 'kWh',
    },
    sizing: {
      eyebrow: 'System size',
      title: (city: string) => `Peimar panels for your consumption in ${city}`,
      text: (y: string, model: string, w: string) =>
        `Required power = yearly consumption ÷ ${y} kWh per kWp. Panels = required power ÷ ${w} W, rounded up to whole ${model} modules.`,
      col: { use: 'Monthly consumption', kwp: 'Required power', panels: 'Panels', area: 'Module area' },
      perMonth: 'kWh/month',
      perYear: (kwh: string) => `${kwh} kWh a year`,
      installed: (kwp: string) => `${kwp} kWp installed`,
      caption: (city: string, model: string) => `Peimar ${model} panels needed in ${city} for each monthly consumption`,
      note: 'Module area counts the modules only, not the spacing between rows or roof edges. Shade, dust and orientation change real output.',
      module: {
        eyebrow: 'Sizing module',
        tech: 'N-type TOPCon · bifacial · double glass',
        power: 'Power',
        efficiency: 'Efficiency',
        size: 'Dimensions',
        weight: 'Weight',
        cells: 'Cells',
        cellsText: 'half-cut',
        coefficient: 'Power temperature coefficient',
        warranty: 'Warranty',
        warrantyText: (product: number, power: number) => `${product}-year product, ${power}-year linear power`,
        link: 'OR Series OR10H modules',
        datasheet: 'Datasheet (PDF)',
        drawing: (model: string, w: string, h: string) => `${model} outline, ${w} × ${h} mm`,
      },
    },
    temps: {
      eyebrow: 'String design',
      title: (city: string) => `Design temperatures for ${city}`,
      text: 'String voltages change with cell temperature. These three values, derived from PVGIS weather data for the city, are the ones the Designer checks strings against.',
      min: {
        label: 'Coldest cell',
        text: 'Sets the highest open-circuit voltage (Voc), which must stay below the inverter’s maximum DC voltage.',
      },
      nom: { label: 'Typical summer cell', text: 'A typical operating temperature on a summer day, for expected voltage and power.' },
      max: {
        label: 'Hottest cell',
        text: 'Sets the lowest MPP voltage, which must stay inside the inverter’s MPPT range.',
      },
      source: (tmyMin: string, tmyMax: string, summer: string) =>
        `From the PVGIS typical year: lowest air temperature ${tmyMin} °C (minus a 3 °C margin), highest ${tmyMax} °C (plus 30 °C for a module in full sun), summer daytime mean ${summer} °C (plus 20 °C).`,
      heat: (t: string, model: string, ct: string, loss: string) =>
        `At ${t} °C, the ${model} (${ct} %/\u2060°C) delivers about ${loss}% less than its rated power.`,
      scale: (min: string, nom: string, max: string) => `Design cell temperatures: ${min} °C, ${nom} °C and ${max} °C`,
      air: 'Air, typical year',
      designer: (city: string) => `Check strings for ${city} in the Designer`,
    },
    faq: {
      heading: (city: string) => `Solar questions for ${city}`,
      qas: (f: CityFacts): Qa[] => [
        {
          q: `How much electricity does a 1 kWp solar system produce in ${f.city}?`,
          a: `About ${f.yieldYear} kWh a year, or ${f.perDay} kWh a day on average, according to PVGIS for free-standing modules at the optimal ${f.tilt}° tilt with ${f.loss}% system losses. Monthly output ranges from ${f.low} kWh in ${f.lowMonth} to ${f.peak} kWh in ${f.peakMonth}.`,
        },
        {
          q: `How many Peimar panels do I need for 1,000 kWh a month in ${f.city}?`,
          a: `About ${f.panels} Peimar ${f.model} modules of ${f.watts} W, ${f.installed} kWp in total. The calculation: 12,000 kWh a year ÷ ${f.yieldYear} kWh per kWp = ${f.kwp} kWp, rounded up to whole modules. The modules cover about ${f.area} m², not counting the gaps between rows.`,
        },
        {
          q: `What tilt is best for solar panels in ${f.city}?`,
          a: `${f.tilt}° from horizontal, ${f.facing}. PVGIS finds these angles give the highest yearly output at ${f.city}’s coordinates (${f.coords}).`,
        },
        {
          q: `Which temperatures should string sizing use in ${f.city}?`,
          a: `${f.tmin} °C as the coldest cell temperature, for the highest string voltage, and ${f.tmax} °C as the hottest, for the lowest MPP voltage; ${f.tnom} °C is a typical summer operating temperature. They come from the PVGIS typical year for ${f.city}, where air temperatures range from ${f.tmyMin} °C to ${f.tmyMax} °C.`,
        },
      ],
    },
    nearby: {
      eyebrow: 'Nearby cities',
      title: 'Compare with nearby cities',
      yield: 'Annual yield',
      distance: 'Distance',
      diff: (city: string) => `Compared with ${city}`,
      all: (n: string) => `All ${n} cities`,
    },
    source: {
      eyebrow: 'Source',
      text: (loss: string, date: string) =>
        `Figures from PVGIS v5.3 (PVGIS-SARAH3 sunlight, ERA5 temperatures), retrieved ${date}: 1 kWp of crystalline silicon modules, free-standing, at the optimal tilt and azimuth, with ${loss}% system losses. Bifacial rear-side gain is not included.`,
      method: 'How these figures are made',
    },
    cta: {
      title: (city: string) => `Plan a solar system for ${city}.`,
      designer: (city: string) => `Design a system for ${city}`,
      contact: 'Talk to Faraday',
    },
  },
};

export type SolarStrings = typeof en;

const ar: SolarStrings = {
  crumb: 'بيانات الطاقة الشمسية',
  months: [
    'كانون الثاني',
    'شباط',
    'آذار',
    'نيسان',
    'أيار',
    'حزيران',
    'تموز',
    'آب',
    'أيلول',
    'تشرين الأول',
    'تشرين الثاني',
    'كانون الأول',
  ],
  monthsShort: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
  governorate: (name: string) => `محافظة ${name}`,
  governorates: {
    Duhok: 'دهوك',
    Nineveh: 'نينوى',
    Erbil: 'أربيل',
    Sulaymaniyah: 'السليمانية',
    Kirkuk: 'كركوك',
    Halabja: 'حلبجة',
    Saladin: 'صلاح الدين',
    Diyala: 'ديالى',
    Anbar: 'الأنبار',
    Baghdad: 'بغداد',
    Karbala: 'كربلاء',
    Wasit: 'واسط',
    Babil: 'بابل',
    Najaf: 'النجف',
    'Al-Qadisiyyah': 'القادسية',
    Maysan: 'ميسان',
    Muthanna: 'المثنى',
    'Dhi Qar': 'ذي قار',
    Basra: 'البصرة',
  },
  coords: (lat: string, lon: string) => `${ltr(`${lat}°`)} شمالاً · ${ltr(`${lon}°`)} شرقاً`,
  elevation: (m: string) => `على ارتفاع ${ltr(`${m} m`)} عن سطح البحر`,
  facing: (az: number) =>
    az === 0
      ? 'والألواح متجهة نحو الجنوب تماماً'
      : `والألواح متجهة نحو الجنوب مع انحراف ${ltr(`${az}°`)} إلى الغرب`,
  azimuthWord: (az: number) => (az === 0 ? 'نحو الجنوب تماماً' : 'عن الجنوب باتجاه الغرب'),
  credit: 'PVGIS © European Union, 2001–2026',
  index: {
    meta: {
      title: (n: string) => `إنتاج الألواح الشمسية في ${n} مدينة عراقية حسب بيانات PVGIS`,
      description: (f: IraqFacts) =>
        `ينتج كل ${ltr('1 kWp')} من الألواح الشمسية في العراق ما بين ${ltr(`${f.lowY} kWh`)} سنوياً في ${f.lowest} و${ltr(`${f.bestY} kWh`)} في ${f.best}. بيانات PVGIS لـ\u00a0${f.count} مدينة عراقية، مع أفضل زاوية ميل ودرجات الحرارة المعتمدة في التصميم.`,
    },
    dataset: {
      name: (n: string) => `إنتاج الطاقة الشمسية في ${n} مدينة عراقية من بيانات PVGIS`,
      description: (n: string) =>
        `الإنتاج السنوي والشهري لكل ${ltr('1 kWp')}، والإشعاع الشمسي الساقط على الألواح، وأفضل زوايا التركيب، ودرجات حرارة التصميم للسلاسل في ${n} مدينة عراقية، من PVGIS v5.3.`,
    },
    eyebrow: (n: string) => `بيانات PVGIS · ${n} مدينة`,
    title: 'الطاقة الشمسية في العراق مدينةً مدينة',
    lead: (f: IraqFacts) =>
      `ينتج كل ${ltr('1 kWp')} من الألواح الشمسية ما بين ${ltr(`${f.lowY} kWh`)} في السنة في ${f.lowest} و${ltr(`${f.bestY} kWh`)} في ${f.best}. جمعنا أرقام PVGIS لـ\u00a0${f.count} مدينة عراقية، لألواح مركّبة على هياكل مفتوحة بأفضل زاوية ميل، مع خسائر في المنظومة بنسبة ${ltr(`${f.loss}%`)}.`,
    stats: {
      best: (city: string) => `أعلى إنتاج · ${city}`,
      lowest: (city: string) => `أدنى إنتاج · ${city}`,
      tilt: 'أفضل زاوية ميل',
    },
    table: {
      eyebrow: 'كل المدن',
      title: 'أرقام كل مدينة في جدول واحد',
      lead: `الإنتاج السنوي هو ما يولّده ${ltr('1 kWp')} من الألواح من كهرباء خلال سنة كاملة. والإشعاع هو كمية ضوء الشمس الساقطة على الألواح المائلة. أما درجات حرارة التصميم فهي حرارة الخلايا المعتمدة عند فحص جهد السلاسل.`,
      sort: { label: 'الترتيب', north: 'من الشمال إلى الجنوب', yield: 'الأعلى إنتاجاً' },
      col: {
        rank: 'المرتبة',
        city: 'المدينة',
        yield: 'الإنتاج السنوي',
        irradiation: 'الإشعاع الشمسي',
        tilt: 'زاوية الميل',
        azimuth: 'الاتجاه',
        temps: 'درجات حرارة التصميم',
        tmin: 'الدنيا',
        tnom: 'المعتادة',
        tmax: 'القصوى',
      },
      caption: (n: string) =>
        `الإنتاج السنوي والإشعاع الشمسي وأفضل زوايا التركيب ودرجات حرارة التصميم لـ\u00a0${n} مدينة عراقية، من PVGIS`,
      swipe: 'اسحب لرؤية بقية الأعمدة',
    },
    method: {
      eyebrow: 'طريقة الحساب',
      title: 'كيف حسبنا هذه الأرقام',
      rows: (loss: string, date: string) => [
        {
          label: 'المصدر',
          text: 'PVGIS v5.3 من مركز البحوث المشترك التابع للمفوضية الأوروبية، باستخدام أداتي PVcalc وTMY',
        },
        { label: 'الإشعاع الشمسي', text: 'بيانات الأقمار الصناعية من PVGIS-SARAH3' },
        { label: 'درجات الحرارة', text: `بيانات ERA5 للأعوام ${ltr('2005–2023')}، مجمّعة في سنة مناخية نموذجية` },
        {
          label: 'المنظومة',
          text: `${ltr('1 kWp')} من ألواح السيليكون البلوري على هياكل مفتوحة، بأفضل زاوية ميل واتجاه`,
        },
        {
          label: 'الخسائر',
          text: `خسائر المنظومة ${ltr(`${loss}%`)}، ويضيف إليها PVGIS خسائر الحرارة وزاوية سقوط الضوء والطيف الشمسي`,
        },
        { label: 'الموقع', text: 'إحداثيات مركز المدينة' },
        {
          label: 'درجات حرارة التصميم',
          text: `الدنيا هي أبرد حرارة للهواء في السنة النموذجية مطروحاً منها ${ltr('3 °C')}. والمعتادة هي متوسط حرارة نهار الصيف مضافاً إليه ${ltr('20 °C')}. والقصوى هي أعلى حرارة للهواء مضافاً إليها ${ltr('30 °C')}.`,
        },
        { label: 'تاريخ جلب البيانات', text: ltr(date) },
      ],
      note: 'يتغيّر الإنتاج الفعلي حسب اتجاه السطح والظل والغبار. ولا تحسب هذه الأرقام الكهرباء الإضافية التي يولّدها الوجه الخلفي في الألواح ثنائية الوجه.',
    },
    faq: {
      heading: 'أسئلة شائعة عن الطاقة الشمسية في العراق',
      qas: (f: IraqFacts): Qa[] => [
        {
          q: 'ما المدينة العراقية الأعلى في إنتاج الطاقة الشمسية؟',
          a: `من بين ${f.count} مدينة في هذه الصفحة، تتصدّر ${f.best} بإنتاج ${ltr(`${f.bestY} kWh`)} لكل ${ltr('kWp')} في السنة حسب PVGIS، تليها ${f.second} (${ltr(f.secondY)}) ثم ${f.third} (${ltr(f.thirdY)}). أما ${f.lowest} فهي الأدنى بـ\u00a0${ltr(`${f.lowY} kWh`)} لكل ${ltr('kWp')}، أي أقل من ${f.best} بنسبة ${ltr(`${f.diff}%`)}.`,
        },
        {
          q: `كم تنتج منظومة شمسية بقدرة ${ltr('1 kWp')} في العراق؟`,
          a: `تنتج ما بين ${ltr(`${f.lowY} kWh`)} في السنة في ${f.lowest} و${ltr(`${f.bestY} kWh`)} في ${f.best}، أي ما بين ${ltr(f.lowDay)} و${ltr(`${f.bestDay} kWh`)} يومياً في المتوسط. وتفترض أرقام PVGIS ألواحاً على هياكل مفتوحة بأفضل زاوية ميل، مع خسائر في المنظومة بنسبة ${ltr(`${f.loss}%`)}.`,
        },
        {
          q: 'ما أفضل زاوية ميل للألواح الشمسية في العراق؟',
          a: `بين ${ltr(`${f.tiltMin}°`)} و${ltr(`${f.tiltMax}°`)} عن الأفق، مع توجيه الألواح نحو الجنوب أو بانحراف لا يتجاوز ${ltr(`${f.azMax}°`)} نحو الغرب. وكلما اتجهنا جنوباً قلّت الزاوية المثلى، فهي ${ltr(`${f.tiltMin}°`)} في ${f.flattest} و${ltr(`${f.tiltMax}°`)} في ${f.steepest} حسب PVGIS.`,
        },
      ],
    },
    cta: { title: 'صمّم منظومتك بناءً على أرقام مدينتك.', designer: 'افتح أداة التصميم', contact: 'تواصل معنا' },
  },
  city: {
    meta: {
      title: (city: string) => `إنتاج الألواح الشمسية في ${city} وعدد ألواح Peimar المطلوبة`,
      description: (city: string, y: string, tilt: string) =>
        `ينتج كل ${ltr('1 kWp')} من الألواح الشمسية في ${city} نحو ${ltr(`${y} kWh`)} في السنة حسب PVGIS. هنا الإنتاج الشهري وأفضل زاوية ميل (${ltr(`${tilt}°`)}) وعدد ألواح Peimar ودرجات الحرارة المعتمدة لتصميم السلاسل.`,
    },
    dataset: {
      name: (city: string) => `إنتاج الطاقة الشمسية ودرجات حرارة التصميم في ${city}، العراق، من بيانات PVGIS`,
      description: (city: string, y: string, irr: string, tilt: string) =>
        `الإنتاج الشهري والسنوي لكل ${ltr('1 kWp')} (${ltr(`${y} kWh`)} في السنة)، والإشعاع الشمسي الساقط على الألواح (${ltr(`${irr} kWh/m²`)})، وأفضل زاوية ميل (${ltr(`${tilt}°`)})، ودرجات حرارة التصميم للسلاسل في ${city}، من PVGIS v5.3.`,
    },
    eyebrow: (gov: string) => `بيانات الطاقة الشمسية · ${gov}`,
    title: (city: string) => `الطاقة الشمسية في ${city}`,
    lead: (city: string, y: string, day: string, tilt: string) =>
      `ينتج كل ${ltr('kWp')} من الألواح الشمسية في ${city} نحو ${ltr(`${y} kWh`)} في السنة بأفضل زاوية ميل (${ltr(`${tilt}°`)})، أي ${ltr(`${day} kWh`)} يومياً في المتوسط.`,
    stats: {
      yield: 'إنتاج كل kWp في السنة',
      irradiation: 'الإشعاع الشمسي على الألواح في السنة',
      tilt: 'أفضل زاوية ميل',
      azimuth: 'أفضل اتجاه',
    },
    monthly: {
      eyebrow: 'الإنتاج الشهري',
      title: (city: string) => `إنتاج ${ltr('1 kWp')} في ${city} شهراً بعد شهر`,
      text: (peakMonth: string, peak: string, lowMonth: string, low: string) =>
        `يبلغ الإنتاج ذروته في ${peakMonth} بـ\u00a0${ltr(`${peak} kWh`)}، وأدنى مستوياته في ${lowMonth} بـ\u00a0${ltr(`${low} kWh`)}.`,
      total: (t: string) => `المجموع السنوي ${ltr(`${t} kWh`)}`,
      chartLabel: (city: string) => `الإنتاج الشهري لـ\u00a0${ltr('1 kWp')} في ${city}، بوحدة ${ltr('kWh')}`,
      average: 'المعدّل',
      axis: 'kWh',
    },
    sizing: {
      eyebrow: 'حجم المنظومة',
      title: (city: string) => `كم لوحاً من Peimar تحتاج في ${city}؟`,
      text: (y: string, model: string, w: string) =>
        `نقسم استهلاكك السنوي على ${ltr(`${y} kWh`)} لكل ${ltr('kWp')} فنحصل على القدرة المطلوبة، ثم نقسمها على ${ltr(`${w} W`)} ونقرّب الناتج إلى الأعلى لعدد كامل من ألواح ${ltr(model)}.`,
      col: { use: 'الاستهلاك الشهري', kwp: 'القدرة المطلوبة', panels: 'عدد الألواح', area: 'مساحة الألواح' },
      perMonth: 'kWh شهرياً',
      perYear: (kwh: string) => `${ltr(`${kwh} kWh`)} في السنة`,
      installed: (kwp: string) => `القدرة الإجمالية ${ltr(`${kwp} kWp`)}`,
      caption: (city: string, model: string) =>
        `عدد ألواح Peimar ${ltr(model)} اللازمة في ${city} حسب الاستهلاك الشهري`,
      note: 'المساحة المذكورة للألواح وحدها، من دون المسافات بين الصفوف أو عند حواف السطح. والإنتاج الفعلي يتغيّر مع الظل والغبار واتجاه التركيب.',
      module: {
        eyebrow: 'اللوح المعتمد في الحساب',
        tech: `${ltr('N-type TOPCon')} · ثنائي الوجه · زجاج مزدوج`,
        power: 'القدرة',
        efficiency: 'الكفاءة',
        size: 'الأبعاد',
        weight: 'الوزن',
        cells: 'الخلايا',
        cellsText: 'خلية نصفية',
        coefficient: 'معامل الحرارة للقدرة',
        warranty: 'الضمان',
        warrantyText: (product: number, power: number) =>
          `${ltr(product)} ${years(product)} للمنتج، و${ltr(power)} ${years(power)} ضمان خطي للقدرة`,
        link: `ألواح ${ltr('OR Series OR10H')}`,
        datasheet: 'ورقة البيانات الفنية (PDF)',
        drawing: (model: string, w: string, h: string) => `مخطط اللوح ${ltr(model)}، ${ltr(`${w} × ${h} mm`)}`,
      },
    },
    temps: {
      eyebrow: 'تصميم السلاسل',
      title: (city: string) => `درجات حرارة التصميم في ${city}`,
      text: 'يتغيّر جهد السلسلة مع حرارة الخلايا، لذلك تفحص أداة التصميم كل سلسلة عند هذه الدرجات الثلاث المستخرجة من بيانات PVGIS المناخية للمدينة.',
      min: {
        label: 'أدنى حرارة للخلايا',
        text: 'عندها يبلغ جهد الدائرة المفتوحة (Voc) أعلى قيمة له، ويجب أن يبقى أقل من أقصى جهد DC يتحمّله الإنفرتر.',
      },
      nom: {
        label: 'حرارة الخلايا في يوم صيفي',
        text: 'حرارة التشغيل المعتادة في الصيف، ومنها نعرف الجهد والقدرة المتوقعين.',
      },
      max: {
        label: 'أعلى حرارة للخلايا',
        text: 'عندها ينخفض جهد نقطة القدرة القصوى (MPP) إلى أدنى قيمة، ويجب أن يبقى داخل نطاق MPPT في الإنفرتر.',
      },
      source: (tmyMin: string, tmyMax: string, summer: string) =>
        `في السنة النموذجية من PVGIS تنخفض حرارة الهواء إلى ${ltr(`${tmyMin} °C`)} ونطرح منها ${ltr('3 °C')} احتياطاً، وترتفع إلى ${ltr(`${tmyMax} °C`)} ونضيف إليها ${ltr('30 °C')} لأن اللوح يكون تحت الشمس المباشرة، ويبلغ متوسط نهار الصيف ${ltr(`${summer} °C`)} ونضيف إليه ${ltr('20 °C')}.`,
      heat: (t: string, model: string, ct: string, loss: string) =>
        `عند ${ltr(`${t} °C`)} ينخفض إنتاج لوح ${ltr(model)} (${ltr(`${ct} %/°C`)}) بنحو ${ltr(`${loss}%`)} عن قدرته الاسمية.`,
      scale: (min: string, nom: string, max: string) =>
        `درجات حرارة التصميم للخلايا ${ltr(`${min} °C`)} و${ltr(`${nom} °C`)} و${ltr(`${max} °C`)}`,
      air: 'حرارة الهواء في السنة النموذجية',
      designer: (city: string) => `افحص سلاسل منظومتك في ${city} بأداة التصميم`,
    },
    faq: {
      heading: (city: string) => `أسئلة شائعة عن الطاقة الشمسية في ${city}`,
      qas: (f: CityFacts): Qa[] => [
        {
          q: `كم تنتج منظومة شمسية بقدرة ${ltr('1 kWp')} في ${f.city}؟`,
          a: `نحو ${ltr(`${f.yieldYear} kWh`)} في السنة، أي ${ltr(`${f.perDay} kWh`)} يومياً في المتوسط. هذا ما يعطيه PVGIS لألواح على هياكل مفتوحة بزاوية ${ltr(`${f.tilt}°`)} مع خسائر في المنظومة بنسبة ${ltr(`${f.loss}%`)}. ويتراوح الإنتاج الشهري بين ${ltr(`${f.low} kWh`)} في ${f.lowMonth} و${ltr(`${f.peak} kWh`)} في ${f.peakMonth}.`,
        },
        {
          q: `كم لوحاً من Peimar أحتاج في ${f.city} إذا كان استهلاكي ${ltr('1,000 kWh')} في الشهر؟`,
          a: `تحتاج نحو ${ltr(f.panels)} ${Number(f.panels) <= 10 ? 'ألواح' : 'لوحاً'} من طراز ${ltr(f.model)} بقدرة ${ltr(`${f.watts} W`)} للوح الواحد، أي ${ltr(`${f.installed} kWp`)} في المجموع. والحساب كما يلي: ${ltr('12,000 kWh')} في السنة ÷ ${ltr(`${f.yieldYear} kWh`)} لكل ${ltr('kWp')} = ${ltr(`${f.kwp} kWp`)}، ثم نقرّب الناتج إلى عدد كامل من الألواح. وتشغل الألواح نحو ${ltr(`${f.area} m²`)} من دون المسافات بين الصفوف.`,
        },
        {
          q: `ما أفضل زاوية ميل للألواح الشمسية في ${f.city}؟`,
          a: `أفضل زاوية هي ${ltr(`${f.tilt}°`)} عن الأفق، ${f.facing}. بهذه الزاوية وهذا الاتجاه يعطي موقع ${f.city} (${f.coords}) أعلى إنتاج سنوي حسب PVGIS.`,
        },
        {
          q: `ما درجات الحرارة المعتمدة لحساب السلاسل في ${f.city}؟`,
          a: `أدنى حرارة للخلايا ${ltr(`${f.tmin} °C`)}، وعندها يبلغ جهد السلسلة أعلى قيمة. وأعلى حرارة ${ltr(`${f.tmax} °C`)}، وعندها يصل جهد MPP إلى أدنى قيمة. أما حرارة التشغيل المعتادة في الصيف فهي ${ltr(`${f.tnom} °C`)}. وكلها مأخوذة من السنة النموذجية في PVGIS لمدينة ${f.city}، حيث تتراوح حرارة الهواء بين ${ltr(`${f.tmyMin} °C`)} و${ltr(`${f.tmyMax} °C`)}.`,
        },
      ],
    },
    nearby: {
      eyebrow: 'مدن قريبة',
      title: 'قارنها بالمدن القريبة',
      yield: 'الإنتاج السنوي',
      distance: 'المسافة',
      diff: (city: string) => `الفرق عن ${city}`,
      all: (n: string) => `كل المدن الـ${n}`,
    },
    source: {
      eyebrow: 'المصدر',
      text: (loss: string, date: string) =>
        `الأرقام من PVGIS v5.3 (الإشعاع من PVGIS-SARAH3 والحرارة من ERA5)، وقد جلبناها في ${ltr(date)}. الحساب لـ\u00a0${ltr('1 kWp')} من ألواح السيليكون البلوري على هياكل مفتوحة بأفضل زاوية ميل واتجاه، مع خسائر في المنظومة بنسبة ${ltr(`${loss}%`)}. ولا يشمل الكهرباء الإضافية من الوجه الخلفي للألواح ثنائية الوجه.`,
      method: 'كيف حسبنا هذه الأرقام',
    },
    cta: {
      title: (city: string) => `خطّط لمنظومتك الشمسية في ${city}.`,
      designer: (city: string) => `صمّم منظومتك في ${city}`,
      contact: 'تواصل معنا',
    },
  },
};

const ckb: SolarStrings = {
  crumb: 'داتای وزەی خۆر',
  months: [
    'کانوونی دووەم',
    'شوبات',
    'ئازار',
    'نیسان',
    'ئایار',
    'حوزەیران',
    'تەممووز',
    'ئاب',
    'ئەیلوول',
    'تشرینی یەکەم',
    'تشرینی دووەم',
    'کانوونی یەکەم',
  ],
  monthsShort: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
  governorate: (name: string) => `پارێزگای ${name}`,
  governorates: {
    Duhok: 'دهۆک',
    Nineveh: 'نەینەوا',
    Erbil: 'هەولێر',
    Sulaymaniyah: 'سلێمانی',
    Kirkuk: 'کەرکووک',
    Halabja: 'هەڵەبجە',
    Saladin: 'سەڵاحەدین',
    Diyala: 'دیالە',
    Anbar: 'ئەنبار',
    Baghdad: 'بەغدا',
    Karbala: 'کەربەلا',
    Wasit: 'واسیت',
    Babil: 'بابل',
    Najaf: 'نەجەف',
    'Al-Qadisiyyah': 'قادسییە',
    Maysan: 'مەیسان',
    Muthanna: 'موسەننا',
    'Dhi Qar': 'زیقار',
    Basra: 'بەسرە',
  },
  coords: (lat: string, lon: string) => `${ltr(`${lat}°`)} باکوور · ${ltr(`${lon}°`)} ڕۆژهەڵات`,
  elevation: (m: string) => `بەرزی ${ltr(`${m} m`)} لە ئاستی دەریاوە`,
  facing: (az: number) =>
    az === 0 ? 'ڕووەو باشووری ڕێک' : `ڕووەو باشوور و ${ltr(`${az}°`)} بەلای ڕۆژئاوادا`,
  azimuthWord: (az: number) => (az === 0 ? 'ڕێک بەرەو باشوور' : 'لە باشوورەوە بەرەو ڕۆژئاوا'),
  credit: 'PVGIS © European Union, 2001–2026',
  index: {
    meta: {
      title: (n: string) => `بەرهەمی پانێڵی خۆر لە ${n} شاری عێراق بەپێی PVGIS`,
      description: (f: IraqFacts) =>
        `هەر ${ltr('1 kWp')} پانێڵی خۆر لە عێراق ساڵانە لە ${ltr(`${f.lowY} kWh`)} لە ${f.lowest} تا ${ltr(`${f.bestY} kWh`)} لە ${f.best} کارەبا بەرهەم دەهێنێت. ژمارەکانی PVGIS بۆ ${f.count} شار، لەگەڵ باشترین لاری و پلەکانی گەرمی بۆ دیزاین.`,
    },
    dataset: {
      name: (n: string) => `بەرهەمی وزەی خۆر لە ${n} شاری عێراق بەپێی PVGIS`,
      description: (n: string) =>
        `بەرهەمی ساڵانە و مانگانەی ${ltr('1 kWp')}، ئەو تیشکەی دەکەوێتە سەر پانێڵ، باشترین گۆشەکان و پلەکانی گەرمی بۆ دیزاینی زنجیرە لە ${n} شاری عێراق، لە PVGIS v5.3.`,
    },
    eyebrow: (n: string) => `داتای PVGIS · ${n} شار`,
    title: 'وزەی خۆر لە عێراق، شار بە شار',
    lead: (f: IraqFacts) =>
      `هەر ${ltr('1 kWp')} پانێڵی خۆر لە عێراق ساڵانە لە ${ltr(`${f.lowY} kWh`)} لە ${f.lowest} تا ${ltr(`${f.bestY} kWh`)} لە ${f.best} کارەبا بەرهەم دەهێنێت. ژمارەکانمان لە PVGIS بۆ ${f.count} شار وەرگرتووە، بۆ پانێڵی سەر هەیکەلی کراوە بە باشترین لاری و ${ltr(`${f.loss}%`)} لەدەستچوونی سیستەم.`,
    stats: {
      best: (city: string) => `بەرزترین بەرهەم · ${city}`,
      lowest: (city: string) => `نزمترین بەرهەم · ${city}`,
      tilt: 'باشترین لاری',
    },
    table: {
      eyebrow: 'هەموو شارەکان',
      title: 'ژمارەکانی هەموو شارێک لە یەک خشتەدا',
      lead: `بەرهەمی ساڵانە ئەو کارەبایەیە کە ${ltr('1 kWp')} پانێڵ لە ماوەی ساڵێکدا دەیدات. تیشک بڕی ئەو ڕووناکیی خۆرەیە کە دەکەوێتە سەر پانێڵە لارەکان. پلەکانی گەرمیی دیزاینیش گەرمیی خانەکانە کاتێک ڤۆڵتی زنجیرەکان دەپشکنین.`,
      sort: { label: 'ڕیزکردن', north: 'لە باکوورەوە بۆ باشوور', yield: 'بەپێی بەرهەم' },
      col: {
        rank: 'ڕیزبەندی',
        city: 'شار',
        yield: 'بەرهەمی ساڵانە',
        irradiation: 'تیشکی خۆر',
        tilt: 'لاری',
        azimuth: 'ئاراستە',
        temps: 'پلەکانی گەرمیی دیزاین',
        tmin: 'کەمترین',
        tnom: 'ئاسایی',
        tmax: 'زۆرترین',
      },
      caption: (n: string) =>
        `بەرهەمی ساڵانە، تیشکی خۆر، باشترین گۆشەکان و پلەکانی گەرمیی دیزاین بۆ ${n} شاری عێراق، لە PVGIS`,
      swipe: 'بۆ بینینی ستوونەکانی تر ڕایبکێشە',
    },
    method: {
      eyebrow: 'شێوازی ژماردن',
      title: 'ئەم ژمارانەمان چۆن دەرهێنا',
      rows: (loss: string, date: string) => [
        {
          label: 'سەرچاوە',
          text: 'PVGIS v5.3، ئامرازی ناوەندی توێژینەوەی هاوبەشی کۆمیسیۆنی ئەورووپا (PVcalc و TMY)',
        },
        { label: 'تیشکی خۆر', text: 'داتای مانگی دەستکردی PVGIS-SARAH3' },
        { label: 'پلەی گەرمی', text: `داتای ERA5 بۆ ساڵانی ${ltr('2005–2023')}، لە شێوەی ساڵێکی نموونەیی کەشوهەوادا` },
        {
          label: 'سیستەم',
          text: `${ltr('1 kWp')} پانێڵی سیلیکۆنی کریستاڵی لەسەر هەیکەلی کراوە، بە باشترین لاری و ئاراستە`,
        },
        {
          label: 'لەدەستچوون',
          text: `${ltr(`${loss}%`)} لەدەستچوونی سیستەم، و PVGIS لەدەستچوونی گەرما و گۆشەی تیشک و سپێکترۆمیشی دەخاتە سەر`,
        },
        { label: 'شوێن', text: 'ناوەڕاستی هەر شارێک' },
        {
          label: 'پلەکانی گەرمیی دیزاین',
          text: `کەمترین پلە ساردترین هەوای ساڵی نموونەییە بە کەمکردنەوەی ${ltr('3 °C')}. پلەی ئاسایی تێکڕای گەرمیی ڕۆژانی هاوینە بە زیادکردنی ${ltr('20 °C')}. زۆرترین پلە گەرمترین هەوایە بە زیادکردنی ${ltr('30 °C')}.`,
        },
        { label: 'بەرواری وەرگرتن', text: ltr(date) },
      ],
      note: 'ئاراستەی بان و سێبەر و تۆز کار دەکەنە سەر بەرهەمی ڕاستەقینە. ئەو کارەبا زیادەیەش کە ڕووی پشتەوەی پانێڵی دوو ڕوو دەیدات لەم ژمارانەدا هەژمار نەکراوە.',
    },
    faq: {
      heading: 'پرسیارە باوەکان دەربارەی وزەی خۆر لە عێراق',
      qas: (f: IraqFacts): Qa[] => [
        {
          q: 'کام شاری عێراق زۆرترین وزەی خۆر وەردەگرێت؟',
          a: `لەو ${f.count} شارەی لەم پەڕەیەدان، ${f.best} لە پێشەوەیە بە ${ltr(`${f.bestY} kWh`)} بۆ هەر ${ltr('kWp')} لە ساڵێکدا بەپێی PVGIS. دوای ئەو ${f.second} (${ltr(f.secondY)}) و ${f.third} (${ltr(f.thirdY)}) دێن. ${f.lowest} لە کۆتاییدایە بە ${ltr(`${f.lowY} kWh`)} بۆ هەر ${ltr('kWp')}، واتە ${ltr(`${f.diff}%`)} کەمتر لە ${f.best}.`,
        },
        {
          q: `سیستەمێکی خۆری ${ltr('1 kWp')} لە عێراق چەند کارەبا بەرهەم دەهێنێت؟`,
          a: `ساڵانە لە ${ltr(`${f.lowY} kWh`)} لە ${f.lowest} تا ${ltr(`${f.bestY} kWh`)} لە ${f.best}، واتە ڕۆژانە بە تێکڕا ${ltr(f.lowDay)} تا ${ltr(`${f.bestDay} kWh`)}. ئەم ژمارانەی PVGIS بۆ پانێڵی سەر هەیکەلی کراوەن بە باشترین لاری و ${ltr(`${f.loss}%`)} لەدەستچوونی سیستەم.`,
        },
        {
          q: 'باشترین لاری بۆ پانێڵی خۆر لە عێراق چەندە؟',
          a: `لە نێوان ${ltr(`${f.tiltMin}°`)} و ${ltr(`${f.tiltMax}°`)} لە ئاسۆوە، ڕووەو باشوور یان تا ${ltr(`${f.azMax}°`)} بەلای ڕۆژئاوادا. تا بەرەو باشوور بچیت لارییەکە کەمتر دەبێت: PVGIS بۆ ${f.steepest} گۆشەی ${ltr(`${f.tiltMax}°`)} و بۆ ${f.flattest} گۆشەی ${ltr(`${f.tiltMin}°`)} پێشنیار دەکات.`,
        },
      ],
    },
    cta: {
      title: 'سیستەمەکەت بەپێی ژمارەکانی شارەکەت دیزاین بکە.',
      designer: 'دیزاینەر بکەرەوە',
      contact: 'پەیوەندیمان پێوە بکە',
    },
  },
  city: {
    meta: {
      title: (city: string) => `بەرهەمی پانێڵی خۆر لە ${city} و چەند پانێڵی Peimar پێویستە`,
      description: (city: string, y: string, tilt: string) =>
        `لە ${city} هەر ${ltr('1 kWp')} پانێڵی خۆر ساڵانە نزیکەی ${ltr(`${y} kWh`)} بەرهەم دەهێنێت (PVGIS). لێرە بەرهەمی مانگانە، باشترین لاری (${ltr(`${tilt}°`)})، ژمارەی پانێڵی Peimar و پلەکانی گەرمی بۆ دیزاینی زنجیرە دەبینیت.`,
    },
    dataset: {
      name: (city: string) => `بەرهەمی وزەی خۆر و پلەکانی گەرمیی دیزاین لە ${city}، عێراق، بەپێی PVGIS`,
      description: (city: string, y: string, irr: string, tilt: string) =>
        `بەرهەمی مانگانە و ساڵانەی ${ltr('1 kWp')} (${ltr(`${y} kWh`)} لە ساڵێکدا)، ئەو تیشکەی دەکەوێتە سەر پانێڵ (${ltr(`${irr} kWh/m²`)})، باشترین لاری (${ltr(`${tilt}°`)}) و پلەکانی گەرمی بۆ دیزاینی زنجیرە لە ${city}، لە PVGIS v5.3.`,
    },
    eyebrow: (gov: string) => `داتای وزەی خۆر · ${gov}`,
    title: (city: string) => `وزەی خۆر لە ${city}`,
    lead: (city: string, y: string, day: string, tilt: string) =>
      `لە ${city} هەر ${ltr('kWp')} پانێڵی خۆر بە باشترین لاری (${ltr(`${tilt}°`)}) ساڵانە نزیکەی ${ltr(`${y} kWh`)} بەرهەم دەهێنێت، واتە ڕۆژانە بە تێکڕا ${ltr(`${day} kWh`)}.`,
    stats: {
      yield: 'بەرهەمی ساڵانەی هەر kWp',
      irradiation: 'تیشکی ساڵانە لەسەر پانێڵ',
      tilt: 'باشترین لاری',
      azimuth: 'باشترین ئاراستە',
    },
    monthly: {
      eyebrow: 'بەرهەمی مانگانە',
      title: (city: string) => `بەرهەمی ${ltr('1 kWp')} لە ${city}، مانگ بە مانگ`,
      text: (peakMonth: string, peak: string, lowMonth: string, low: string) =>
        `بەرهەم لە ${peakMonth} دەگاتە لووتکە بە ${ltr(`${peak} kWh`)}، و لە ${lowMonth} کەمترینە بە ${ltr(`${low} kWh`)}.`,
      total: (t: string) => `کۆی ساڵانە ${ltr(`${t} kWh`)}`,
      chartLabel: (city: string) => `بەرهەمی مانگانەی ${ltr('1 kWp')} لە ${city}، بە ${ltr('kWh')}`,
      average: 'تێکڕا',
      axis: 'kWh',
    },
    sizing: {
      eyebrow: 'قەبارەی سیستەم',
      title: (city: string) => `لە ${city} پێویستت بە چەند پانێڵی Peimar هەیە؟`,
      text: (y: string, model: string, w: string) =>
        `بەکارهێنانی ساڵانەت دابەش دەکەین بەسەر ${ltr(`${y} kWh`)} بۆ هەر ${ltr('kWp')}، ئەوە توانای پێویستە. پاشان دابەشی دەکەین بەسەر ${ltr(`${w} W`)} و ئەنجامەکە بەرەو سەرەوە خڕ دەکەینەوە بۆ ژمارەیەکی تەواو لە پانێڵی ${ltr(model)}.`,
      col: { use: 'بەکارهێنانی مانگانە', kwp: 'توانای پێویست', panels: 'ژمارەی پانێڵ', area: 'ڕووبەری پانێڵەکان' },
      perMonth: 'kWh لە مانگێکدا',
      perYear: (kwh: string) => `ساڵانە ${ltr(`${kwh} kWh`)}`,
      installed: (kwp: string) => `کۆی توانا ${ltr(`${kwp} kWp`)}`,
      caption: (city: string, model: string) =>
        `ژمارەی پانێڵی Peimar ${ltr(model)} کە لە ${city} پێویستە بەپێی بەکارهێنانی مانگانە`,
      note: 'ڕووبەرەکە تەنها خودی پانێڵەکان دەگرێتەوە، بۆشایی نێوان ڕیزەکان و لێواری بان تێیدا نییە. سێبەر و تۆز و ئاراستەش کار دەکەنە سەر بەرهەمی ڕاستەقینە.',
      module: {
        eyebrow: 'ئەو پانێڵەی ژماردنەکەی لەسەر کراوە',
        tech: `${ltr('N-type TOPCon')} · دوو ڕوو · شووشەی دووانە`,
        power: 'توانا',
        efficiency: 'کارایی',
        size: 'ئەندازەکان',
        weight: 'کێش',
        cells: 'خانەکان',
        cellsText: 'خانەی نیوەبڕاو',
        coefficient: 'هاوکۆڵکەی گەرمی بۆ توانا',
        warranty: 'گەرەنتی',
        warrantyText: (product: number, power: number) =>
          `${ltr(product)} ساڵ گەرەنتیی بەرهەم و ${ltr(power)} ساڵ گەرەنتیی هێڵیی توانا`,
        link: `پانێڵەکانی ${ltr('OR Series OR10H')}`,
        datasheet: 'داتاشیت (PDF)',
        drawing: (model: string, w: string, h: string) => `نەخشەی پانێڵی ${ltr(model)}، ${ltr(`${w} × ${h} mm`)}`,
      },
    },
    temps: {
      eyebrow: 'دیزاینی زنجیرە',
      title: (city: string) => `پلەکانی گەرمیی دیزاین لە ${city}`,
      text: 'ڤۆڵتی زنجیرە لەگەڵ گەرمیی خانەکان دەگۆڕێت، بۆیە دیزاینەر هەموو زنجیرەیەک بەم سێ پلەیە دەپشکنێت. ئەم پلانە لە داتای کەشوهەوای PVGIS بۆ ئەم شارە وەرگیراون.',
      min: {
        label: 'ساردترین پلەی خانە',
        text: 'لەم پلەیەدا ڤۆڵتی بازنەی کراوە (Voc) دەگاتە بەرزترین ئاست، و دەبێت هەر لە خوار زۆرترین ڤۆڵتی DC ی ئینڤێرتەرەوە بمێنێتەوە.',
      },
      nom: {
        label: 'خانە لە ڕۆژێکی هاویندا',
        text: 'گەرمیی ئاسایی کارکردن لە هاویندا، کە ڤۆڵت و توانای چاوەڕوانکراوی لێوە دەردەهێنین.',
      },
      max: {
        label: 'گەرمترین پلەی خانە',
        text: 'لەم پلەیەدا ڤۆڵتی MPP دادەبەزێتە نزمترین ئاست، و دەبێت لە ناو مەودای MPPT ی ئینڤێرتەردا بمێنێتەوە.',
      },
      source: (tmyMin: string, tmyMax: string, summer: string) =>
        `لە ساڵی نموونەیی PVGIS دا: ساردترین هەوا ${ltr(`${tmyMin} °C`)} (${ltr('3 °C')} وەک پەراوێز کەم دەکەینەوە)، گەرمترین هەوا ${ltr(`${tmyMax} °C`)} (${ltr('30 °C')} زیاد دەکەین، چونکە پانێڵ لەبەر خۆری ڕاستەوخۆدایە)، تێکڕای ڕۆژی هاوین ${ltr(`${summer} °C`)} (${ltr('20 °C')} زیاد دەکەین).`,
      heat: (t: string, model: string, ct: string, loss: string) =>
        `لە ${ltr(`${t} °C`)} دا بەرهەمی پانێڵی ${ltr(model)} (${ltr(`${ct} %/°C`)}) نزیکەی ${ltr(`${loss}%`)} لە توانای ناوەکیی خۆی کەمتر دەبێت.`,
      scale: (min: string, nom: string, max: string) =>
        `پلەکانی گەرمیی خانە بۆ دیزاین: ${ltr(`${min} °C`)}، ${ltr(`${nom} °C`)} و ${ltr(`${max} °C`)}`,
      air: 'گەرمیی هەوا لە ساڵی نموونەییدا',
      designer: (city: string) => `زنجیرەکانی سیستەمەکەت بۆ ${city} لە دیزاینەر بپشکنە`,
    },
    faq: {
      heading: (city: string) => `پرسیارە باوەکان دەربارەی وزەی خۆر لە ${city}`,
      qas: (f: CityFacts): Qa[] => [
        {
          q: `سیستەمێکی خۆری ${ltr('1 kWp')} لە ${f.city} چەند کارەبا بەرهەم دەهێنێت؟`,
          a: `ساڵانە نزیکەی ${ltr(`${f.yieldYear} kWh`)}، واتە ڕۆژانە بە تێکڕا ${ltr(`${f.perDay} kWh`)}. ئەمە بەپێی PVGIS بۆ پانێڵی سەر هەیکەلی کراوەیە بە لاریی ${ltr(`${f.tilt}°`)} و ${ltr(`${f.loss}%`)} لەدەستچوونی سیستەم. بەرهەمی مانگانە لە ${ltr(`${f.low} kWh`)} لە ${f.lowMonth} تا ${ltr(`${f.peak} kWh`)} لە ${f.peakMonth} دەگۆڕێت.`,
        },
        {
          q: `ئەگەر مانگانە ${ltr('1,000 kWh')} بەکاربهێنم، لە ${f.city} پێویستم بە چەند پانێڵی Peimar هەیە؟`,
          a: `نزیکەی ${ltr(f.panels)} پانێڵی ${ltr(f.model)} بە توانای ${ltr(`${f.watts} W`)}، کە کۆی گشتییان دەکاتە ${ltr(`${f.installed} kWp`)}. ژماردنەکە بەم شێوەیەیە: ${ltr('12,000 kWh')} لە ساڵێکدا ÷ ${ltr(`${f.yieldYear} kWh`)} بۆ هەر ${ltr('kWp')} = ${ltr(`${f.kwp} kWp`)}، پاشان بۆ ژمارەیەکی تەواو لە پانێڵ بەرز دەکرێتەوە. پانێڵەکان نزیکەی ${ltr(`${f.area} m²`)} دەگرن، بێ بۆشایی نێوان ڕیزەکان.`,
        },
        {
          q: `باشترین لاری بۆ پانێڵی خۆر لە ${f.city} چەندە؟`,
          a: `باشترین لاری ${ltr(`${f.tilt}°`)} لە ئاسۆوەیە، ${f.facing}. بەپێی PVGIS ئەم لاری و ئاراستەیە لە شوێنی ${f.city} (${f.coords}) زۆرترین بەرهەمی ساڵانە دەدات.`,
        },
        {
          q: `بۆ دیزاینی زنجیرە لە ${f.city} کام پلەی گەرمی بەکاردەهێنرێت؟`,
          a: `${ltr(`${f.tmin} °C`)} وەک ساردترین پلەی خانە دادەنرێت بۆ ژماردنی بەرزترین ڤۆڵتی زنجیرە، و ${ltr(`${f.tmax} °C`)} وەک گەرمترین پلە بۆ نزمترین ڤۆڵتی MPP. ${ltr(`${f.tnom} °C`)} پلەی ئاسایی کارکردنە لە هاویندا. ئەم پلانە لە ساڵی نموونەیی PVGIS بۆ ${f.city} وەرگیراون، کە پلەی هەوا تێیدا لە ${ltr(`${f.tmyMin} °C`)} تا ${ltr(`${f.tmyMax} °C`)} دەگۆڕێت.`,
        },
      ],
    },
    nearby: {
      eyebrow: 'شارە نزیکەکان',
      title: 'بەراورد لەگەڵ شارە نزیکەکان',
      yield: 'بەرهەمی ساڵانە',
      distance: 'دووری',
      diff: (city: string) => `جیاوازی لەگەڵ ${city}`,
      all: (n: string) => `هەر ${n} شارەکە`,
    },
    source: {
      eyebrow: 'سەرچاوە',
      text: (loss: string, date: string) =>
        `ژمارەکان لە PVGIS v5.3 وەرگیراون (تیشکی PVGIS-SARAH3 و گەرمیی ERA5)، لە ${ltr(date)}. ژماردنەکە بۆ ${ltr('1 kWp')} پانێڵی سیلیکۆنی کریستاڵییە لەسەر هەیکەلی کراوە، بە باشترین لاری و ئاراستە و ${ltr(`${loss}%`)} لەدەستچوونی سیستەم. ئەو کارەبا زیادەیەی ڕووی پشتەوەی پانێڵی دوو ڕوو دەیدات هەژمار نەکراوە.`,
      method: 'ئەم ژمارانەمان چۆن دەرهێنا',
    },
    cta: {
      title: (city: string) => `سیستەمی وزەی خۆرەکەت بۆ ${city} دابڕێژە.`,
      designer: (city: string) => `سیستەمێک بۆ ${city} دیزاین بکە`,
      contact: 'پەیوەندیمان پێوە بکە',
    },
  },
};

export const solar: Record<Locale, SolarStrings> = { en, ar, ckb };
