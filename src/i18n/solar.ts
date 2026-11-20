import type { Locale } from './config.ts';

/** Keeps a figure and its Latin unit together and in reading order inside Arabic-script text. */
const ltr = (s: string | number) => `\u2066${String(s).replaceAll(' ', '\u00a0').replaceAll('/', '/\u2060')}\u2069`;

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
  and: (items: string[]) =>
    items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`,
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
        tempsSub: 'min / typical / max',
      },
      scale: (lo: string, hi: string) => `Scale ${lo}–${hi} kWh/kWp`,
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
        `At ${t} °C, the ${model} (${ct} %/⁠°C) delivers about ${loss}% less than its rated power.`,
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
  coords: (lat: string, lon: string) => `${ltr(`${lat}°`)} شمالًا · ${ltr(`${lon}°`)} شرقًا`,
  elevation: (m: string) => `${ltr(`${m} m`)} فوق سطح البحر`,
  facing: (az: number) => (az === 0 ? 'باتجاه الجنوب تمامًا' : `باتجاه الجنوب مع انحراف ${ltr(`${az}°`)} نحو الغرب`),
  azimuthWord: (az: number) => (az === 0 ? 'جنوبًا تمامًا' : 'من الجنوب نحو الغرب'),
  credit: 'PVGIS © European Union, 2001–2026',
  and: (items: string[]) => items.join(' و'),
  index: {
    meta: {
      title: (n: string) => `إنتاج الطاقة الشمسية في مدن العراق — بيانات PVGIS لـ\u00a0${n} مدينة`,
      description: (f: IraqFacts) =>
        `ما تنتجه ألواح شمسية بقدرة ${ltr('1 kWp')} سنويًا في ${f.count} مدينة عراقية: من ${ltr(`${f.lowY} kWh`)} في ${f.lowest} إلى ${ltr(`${f.bestY} kWh`)} في ${f.best}. بيانات PVGIS مع زاوية الميل المثلى ودرجات حرارة التصميم.`,
    },
    dataset: {
      name: (n: string) => `إنتاج الطاقة الشمسية في ${n} مدينة عراقية — PVGIS`,
      description: (n: string) =>
        `الإنتاج السنوي والشهري لقدرة ${ltr('1 kWp')}، والإشعاع على سطح الألواح، والزوايا المثلى، ودرجات حرارة تصميم السلاسل في ${n} مدينة عراقية، من PVGIS v5.3.`,
    },
    eyebrow: (n: string) => `بيانات PVGIS · ${n} مدينة`,
    title: 'إنتاج الطاقة الشمسية في أنحاء العراق',
    lead: (f: IraqFacts) =>
      `ما تنتجه ألواح شمسية بقدرة ${ltr('1 kWp')} من الكهرباء في السنة في ${f.count} مدينة عراقية: من ${ltr(`${f.lowY} kWh`)} في ${f.lowest} إلى ${ltr(`${f.bestY} kWh`)} في ${f.best}. أرقام PVGIS لألواح على هياكل مفتوحة بزاوية الميل المثلى، مع فواقد نظام ${ltr(`${f.loss}%`)}.`,
    stats: {
      best: (city: string) => `أعلى إنتاج · ${city}`,
      lowest: (city: string) => `أدنى إنتاج · ${city}`,
      tilt: 'زاوية الميل المثلى',
    },
    table: {
      eyebrow: 'كل المدن',
      title: 'الإنتاج والإشعاع ودرجات حرارة التصميم حسب المدينة',
      lead: `الإنتاج السنوي هو الكهرباء التي تنتجها ألواح بقدرة ${ltr('1 kWp')} في سنة. الإشعاع هو ضوء الشمس الذي يصل إلى سطح الألواح المائلة. ودرجات حرارة التصميم هي درجات حرارة الخلايا التي تُفحص عندها جهود السلاسل.`,
      sort: { label: 'طريقة العرض', north: 'من الشمال إلى الجنوب', yield: 'الأعلى إنتاجًا أولًا' },
      col: {
        rank: 'الترتيب',
        city: 'المدينة',
        yield: 'الإنتاج السنوي',
        irradiation: 'الإشعاع',
        tilt: 'الميل',
        azimuth: 'الاتجاه',
        temps: 'درجات حرارة التصميم',
        tempsSub: 'دنيا / نموذجية / قصوى',
      },
      scale: (lo: string, hi: string) => `المقياس ${ltr(`${lo}–${hi} kWh/kWp`)}`,
      caption: (n: string) =>
        `الإنتاج السنوي حسب PVGIS، والإشعاع على سطح الألواح، والزوايا المثلى، ودرجات حرارة التصميم لـ\u00a0${n} مدينة عراقية`,
      swipe: 'اسحب لرؤية بقية الأعمدة',
    },
    method: {
      eyebrow: 'المنهجية',
      title: 'كيف حُسبت هذه الأرقام',
      rows: (loss: string, date: string) => [
        {
          label: 'المصدر',
          text: 'PVGIS v5.3 من مركز البحوث المشترك التابع للمفوضية الأوروبية (أداتا PVcalc و TMY)',
        },
        { label: 'الإشعاع الشمسي', text: 'بيانات الأقمار الصناعية PVGIS-SARAH3' },
        { label: 'درجات الحرارة', text: `بيانات ERA5 للفترة ${ltr('2005–2023')} على شكل سنة مناخية نموذجية` },
        {
          label: 'النظام',
          text: `ألواح سيليكون بلوري بقدرة ${ltr('1 kWp')} على هياكل مفتوحة، بزاوية الميل والاتجاه المثليين`,
        },
        {
          label: 'الفواقد',
          text: `فواقد نظام ${ltr(`${loss}%`)}، ويضيف PVGIS فواقد الحرارة وزاوية سقوط الأشعة والطيف`,
        },
        { label: 'الموقع', text: 'إحداثيات مركز المدينة' },
        {
          label: 'درجات حرارة التصميم',
          text: `الدنيا: أدنى حرارة للهواء في السنة النموذجية ناقص ${ltr('3 °C')}. النموذجية: متوسط نهار الصيف زائد ${ltr('20 °C')}. القصوى: أعلى حرارة للهواء زائد ${ltr('30 °C')}.`,
        },
        { label: 'تاريخ جلب البيانات', text: ltr(date) },
      ],
      note: 'يتأثر الإنتاج الفعلي باتجاه السطح والظل والغبار. ولا تشمل الأرقام مكسب الوجه الخلفي للألواح ثنائية الوجه.',
    },
    faq: {
      heading: 'أسئلة عن إنتاج الطاقة الشمسية في العراق',
      qas: (f: IraqFacts): Qa[] => [
        {
          q: 'أي مدينة عراقية تحصل على أكبر قدر من الطاقة الشمسية؟',
          a: `من بين ${f.count} مدينة في هذه الصفحة، تسجّل ${f.best} أعلى إنتاج حسب PVGIS: ${ltr(`${f.bestY} kWh`)} لكل ${ltr('kWp')} سنويًا. تليها ${f.second} (${ltr(f.secondY)}) و${f.third} (${ltr(f.thirdY)}). وأدناها ${f.lowest} بـ\u00a0${ltr(`${f.lowY} kWh`)} لكل ${ltr('kWp')}، أي أقل بنسبة ${ltr(`${f.diff}%`)} من ${f.best}.`,
        },
        {
          q: `كم تنتج ألواح شمسية بقدرة ${ltr('1 kWp')} من الكهرباء في العراق؟`,
          a: `بين ${ltr(`${f.lowY} kWh`)} سنويًا في ${f.lowest} و${ltr(`${f.bestY} kWh`)} في ${f.best}، أي من ${ltr(f.lowDay)} إلى ${ltr(`${f.bestDay} kWh`)} يوميًا في المتوسط. تفترض أرقام PVGIS ألواحًا على هياكل مفتوحة بزاوية الميل المثلى وفواقد نظام ${ltr(`${f.loss}%`)}.`,
        },
        {
          q: 'ما أفضل زاوية ميل للألواح الشمسية في العراق؟',
          a: `بين ${ltr(`${f.tiltMin}°`)} و${ltr(`${f.tiltMax}°`)} عن الأفق، باتجاه الجنوب أو مع انحراف حتى ${ltr(`${f.azMax}°`)} نحو الغرب. وتقلّ الزاوية المثلى جنوبًا: يعطي PVGIS ${ltr(`${f.tiltMin}°`)} لمدينة ${f.flattest} و${ltr(`${f.tiltMax}°`)} لمدينة ${f.steepest}.`,
        },
      ],
    },
    cta: { title: 'حدّد حجم نظام لمدينتك.', designer: 'افتح أداة التصميم', contact: 'تحدّث مع Faraday' },
  },
  city: {
    meta: {
      title: (city: string) => `الألواح الشمسية في ${city} — الإنتاج وحجم النظام وألواح Peimar`,
      description: (city: string, y: string, tilt: string) =>
        `تنتج ألواح شمسية بقدرة ${ltr('1 kWp')} في ${city} نحو ${ltr(`${y} kWh`)} سنويًا حسب PVGIS. الإنتاج الشهري، وزاوية الميل المثلى (${ltr(`${tilt}°`)})، وعدد ألواح Peimar، ودرجات حرارة تصميم السلاسل.`,
    },
    dataset: {
      name: (city: string) => `إنتاج الطاقة الشمسية ودرجات حرارة التصميم في ${city}، العراق — PVGIS`,
      description: (city: string, y: string, irr: string, tilt: string) =>
        `الإنتاج الشهري والسنوي لقدرة ${ltr('1 kWp')} (${ltr(`${y} kWh`)} سنويًا)، والإشعاع على سطح الألواح (${ltr(`${irr} kWh/m²`)})، وزاوية الميل المثلى (${ltr(`${tilt}°`)})، ودرجات حرارة تصميم السلاسل في ${city}، من PVGIS v5.3.`,
    },
    eyebrow: (gov: string) => `بيانات الطاقة الشمسية · ${gov}`,
    title: (city: string) => `الطاقة الشمسية في ${city}`,
    lead: (city: string, y: string, day: string, tilt: string) =>
      `في ${city}، ينتج كل ${ltr('kWp')} من الألواح الشمسية نحو ${ltr(`${y} kWh`)} في السنة، أي ${ltr(`${day} kWh`)} يوميًا في المتوسط، بزاوية الميل المثلى ${ltr(`${tilt}°`)}.`,
    stats: {
      yield: 'الإنتاج لكل kWp سنويًا',
      irradiation: 'الإشعاع على الألواح سنويًا',
      tilt: 'زاوية الميل المثلى',
      azimuth: 'الاتجاه الأمثل',
    },
    monthly: {
      eyebrow: 'الإنتاج الشهري',
      title: (city: string) => `ما تنتجه ألواح بقدرة ${ltr('1 kWp')} في ${city} شهرًا بشهر`,
      text: (peakMonth: string, peak: string, lowMonth: string, low: string) =>
        `أعلى الأشهر إنتاجًا ${peakMonth} بـ\u00a0${ltr(`${peak} kWh`)}، وأدناها ${lowMonth} بـ\u00a0${ltr(`${low} kWh`)}.`,
      total: (t: string) => `المجموع السنوي ${ltr(`${t} kWh`)}`,
      chartLabel: (city: string) => `الإنتاج الشهري لقدرة ${ltr('1 kWp')} في ${city}، بوحدة ${ltr('kWh')}`,
      average: 'المتوسط',
      axis: 'kWh',
    },
    sizing: {
      eyebrow: 'حجم النظام',
      title: (city: string) => `عدد ألواح Peimar حسب استهلاكك في ${city}`,
      text: (y: string, model: string, w: string) =>
        `القدرة المطلوبة = الاستهلاك السنوي ÷ ${ltr(`${y} kWh`)} لكل ${ltr('kWp')}. عدد الألواح = القدرة المطلوبة ÷ ${ltr(`${w} W`)}، مقرّبًا إلى الأعلى بألواح ${ltr(model)} كاملة.`,
      col: { use: 'الاستهلاك الشهري', kwp: 'القدرة المطلوبة', panels: 'عدد الألواح', area: 'مساحة الألواح' },
      perMonth: 'kWh/شهر',
      perYear: (kwh: string) => `${ltr(`${kwh} kWh`)} سنويًا`,
      installed: (kwp: string) => `قدرة مركّبة ${ltr(`${kwp} kWp`)}`,
      caption: (city: string, model: string) => `عدد ألواح Peimar ${model} اللازمة في ${city} لكل استهلاك شهري`,
      note: 'تشمل مساحة الألواح الألواحَ وحدها، دون المسافات بين الصفوف أو حواف السطح. ويتأثر الإنتاج الفعلي بالظل والغبار والاتجاه.',
      module: {
        eyebrow: 'اللوح المعتمد في الحساب',
        tech: `${ltr('TOPCon')} من النوع ${ltr('N')} · ثنائي الوجه · زجاج مزدوج`,
        power: 'القدرة',
        efficiency: 'الكفاءة',
        size: 'الأبعاد',
        weight: 'الوزن',
        cells: 'الخلايا',
        cellsText: 'خلية نصفية',
        coefficient: 'معامل الحرارة للقدرة',
        warranty: 'الضمان',
        warrantyText: (product: number, power: number) =>
          `ضمان المنتج ${ltr(product)} عامًا، وضمان القدرة الخطي ${ltr(power)} عامًا`,
        link: 'ألواح OR Series OR10H',
        datasheet: 'ورقة البيانات الفنية (PDF)',
        drawing: (model: string, w: string, h: string) => `مخطط اللوح ${ltr(model)}، ${ltr(`${w} × ${h} mm`)}`,
      },
    },
    temps: {
      eyebrow: 'تصميم السلاسل',
      title: (city: string) => `درجات حرارة التصميم في ${city}`,
      text: 'يتغيّر جهد السلسلة مع حرارة الخلايا. وتفحص أداة التصميم السلاسل عند هذه القيم الثلاث، المستخرجة من بيانات PVGIS المناخية للمدينة.',
      min: {
        label: 'أدنى حرارة للخلية',
        text: 'تحدّد أعلى جهد للدائرة المفتوحة (Voc)، ويجب أن يبقى دون أقصى جهد DC للإنفرتر.',
      },
      nom: { label: 'حرارة صيفية نموذجية للخلية', text: 'حرارة تشغيل نموذجية في يوم صيفي، للجهد والقدرة المتوقعين.' },
      max: {
        label: 'أعلى حرارة للخلية',
        text: 'تحدّد أدنى جهد عند نقطة القدرة القصوى (MPP)، ويجب أن يبقى ضمن نطاق MPPT للإنفرتر.',
      },
      source: (tmyMin: string, tmyMax: string, summer: string) =>
        `من السنة النموذجية في PVGIS: أدنى حرارة للهواء ${ltr(`${tmyMin} °C`)} (ناقص هامش ${ltr('3 °C')})، وأعلاها ${ltr(`${tmyMax} °C`)} (زائد ${ltr('30 °C')} للوح تحت الشمس المباشرة)، ومتوسط نهار الصيف ${ltr(`${summer} °C`)} (زائد ${ltr('20 °C')}).`,
      heat: (t: string, model: string, ct: string, loss: string) =>
        `عند ${ltr(`${t} °C`)}، ينتج لوح ${ltr(model)} (${ltr(`${ct} %/°C`)}) أقل من قدرته الاسمية بنحو ${ltr(`${loss}%`)}.`,
      scale: (min: string, nom: string, max: string) =>
        `درجات حرارة الخلايا للتصميم: ${ltr(`${min} °C`)} و${ltr(`${nom} °C`)} و${ltr(`${max} °C`)}`,
      air: 'الهواء، السنة النموذجية',
      designer: (city: string) => `افحص السلاسل لمدينة ${city} في أداة التصميم`,
    },
    faq: {
      heading: (city: string) => `أسئلة عن الطاقة الشمسية في ${city}`,
      qas: (f: CityFacts): Qa[] => [
        {
          q: `كم ينتج نظام شمسي بقدرة ${ltr('1 kWp')} من الكهرباء في ${f.city}؟`,
          a: `نحو ${ltr(`${f.yieldYear} kWh`)} سنويًا، أي ${ltr(`${f.perDay} kWh`)} يوميًا في المتوسط، حسب PVGIS لألواح على هياكل مفتوحة بزاوية الميل المثلى ${ltr(`${f.tilt}°`)} وفواقد نظام ${ltr(`${f.loss}%`)}. ويتراوح الإنتاج الشهري بين ${ltr(`${f.low} kWh`)} في ${f.lowMonth} و${ltr(`${f.peak} kWh`)} في ${f.peakMonth}.`,
        },
        {
          q: `كم لوحًا من Peimar أحتاج لاستهلاك ${ltr('1,000 kWh')} شهريًا في ${f.city}؟`,
          a: `نحو ${ltr(f.panels)} ${Number(f.panels) <= 10 ? 'ألواح' : 'لوحًا'} من ${ltr(f.model)} بقدرة ${ltr(`${f.watts} W`)} للوح، أي ${ltr(`${f.installed} kWp`)} إجمالًا. الحساب: ${ltr('12,000 kWh')} سنويًا ÷ ${ltr(`${f.yieldYear} kWh`)} لكل ${ltr('kWp')} = ${ltr(`${f.kwp} kWp`)}، مقرّبًا إلى عدد ألواح كامل. وتغطي الألواح نحو ${ltr(`${f.area} m²`)} دون المسافات بين الصفوف.`,
        },
        {
          q: `ما أفضل زاوية ميل للألواح الشمسية في ${f.city}؟`,
          a: `${ltr(`${f.tilt}°`)} عن الأفق، ${f.facing}. وهذه الزوايا تعطي أعلى إنتاج سنوي حسب PVGIS عند إحداثيات ${f.city} (${f.coords}).`,
        },
        {
          q: `ما درجات الحرارة التي يُعتمد عليها في حساب السلاسل في ${f.city}؟`,
          a: `${ltr(`${f.tmin} °C`)} أدنى حرارة للخلية لحساب أعلى جهد للسلسلة، و${ltr(`${f.tmax} °C`)} أعلى حرارة لحساب أدنى جهد MPP، و${ltr(`${f.tnom} °C`)} حرارة تشغيل صيفية نموذجية. وهي مستخرجة من السنة النموذجية في PVGIS لمدينة ${f.city}، حيث تتراوح حرارة الهواء بين ${ltr(`${f.tmyMin} °C`)} و${ltr(`${f.tmyMax} °C`)}.`,
        },
      ],
    },
    nearby: {
      eyebrow: 'مدن قريبة',
      title: 'قارن بالمدن القريبة',
      yield: 'الإنتاج السنوي',
      distance: 'المسافة',
      diff: (city: string) => `مقارنة بمدينة ${city}`,
      all: (n: string) => `كل المدن (${n})`,
    },
    source: {
      eyebrow: 'المصدر',
      text: (loss: string, date: string) =>
        `أرقام PVGIS v5.3 (إشعاع PVGIS-SARAH3 وحرارة ERA5)، جُلبت في ${ltr(date)}: ألواح سيليكون بلوري بقدرة ${ltr('1 kWp')} على هياكل مفتوحة بزاوية الميل والاتجاه المثليين، مع فواقد نظام ${ltr(`${loss}%`)}. ولا تشمل مكسب الوجه الخلفي للألواح ثنائية الوجه.`,
      method: 'كيف حُسبت هذه الأرقام',
    },
    cta: {
      title: (city: string) => `خطّط لنظام شمسي في ${city}.`,
      designer: (city: string) => `صمّم نظامًا لمدينة ${city}`,
      contact: 'تحدّث مع Faraday',
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
  elevation: (m: string) => `${ltr(`${m} m`)} لە سەرووی ئاستی دەریاوە`,
  facing: (az: number) => (az === 0 ? 'ڕێک ڕووەو باشوور' : `ڕووەو باشوور، ${ltr(`${az}°`)} بەرەو ڕۆژئاوا`),
  azimuthWord: (az: number) => (az === 0 ? 'ڕێک باشوور' : 'لە باشوورەوە بەرەو ڕۆژئاوا'),
  credit: 'PVGIS © European Union, 2001–2026',
  and: (items: string[]) =>
    items.length < 2 ? items.join('') : `${items.slice(0, -1).join('، ')} و ${items[items.length - 1]}`,
  index: {
    meta: {
      title: (n: string) => `بەرهەمی وزەی خۆر لە شارەکانی عێراق — داتای PVGIS بۆ ${n} شار`,
      description: (f: IraqFacts) =>
        `بەرهەمی ساڵانەی پانێڵی خۆری ${ltr('1 kWp')} لە ${f.count} شاری عێراق: لە ${ltr(`${f.lowY} kWh`)} لە ${f.lowest} تا ${ltr(`${f.bestY} kWh`)} لە ${f.best}. داتای PVGIS لەگەڵ باشترین لاری و پلەکانی گەرمیی دیزاین.`,
    },
    dataset: {
      name: (n: string) => `بەرهەمی وزەی خۆر بۆ ${n} شاری عێراق — PVGIS`,
      description: (n: string) =>
        `بەرهەمی ساڵانە و مانگانەی ${ltr('1 kWp')}، تیشک لەسەر ڕووی پانێڵ، باشترین گۆشەکان و پلەکانی گەرمیی دیزاینی زنجیرە بۆ ${n} شاری عێراق، لە PVGIS v5.3.`,
    },
    eyebrow: (n: string) => `داتای PVGIS · ${n} شار`,
    title: 'بەرهەمی وزەی خۆر لە سەرانسەری عێراق',
    lead: (f: IraqFacts) =>
      `ئەو کارەبایەی پانێڵی خۆری ${ltr('1 kWp')} لە ساڵێکدا لە ${f.count} شاری عێراق بەرهەمی دەهێنێت: لە ${ltr(`${f.lowY} kWh`)} لە ${f.lowest} تا ${ltr(`${f.bestY} kWh`)} لە ${f.best}. ژمارەکانی PVGIS بۆ پانێڵ لەسەر پایەی کراوە بە باشترین لاری، لەگەڵ ${ltr(`${f.loss}%`)} لەدەستچوونی سیستەم.`,
    stats: {
      best: (city: string) => `بەرزترین بەرهەم · ${city}`,
      lowest: (city: string) => `نزمترین بەرهەم · ${city}`,
      tilt: 'باشترین لاری',
    },
    table: {
      eyebrow: 'هەموو شارەکان',
      title: 'بەرهەم، تیشکی خۆر و پلەکانی گەرمیی دیزاین بەپێی شار',
      lead: `بەرهەمی ساڵانە ئەو کارەبایەیە کە پانێڵی ${ltr('1 kWp')} لە ساڵێکدا دەیدات. تیشک ئەو ڕووناکیی خۆرەیە کە دەگاتە ڕووی پانێڵە لارەکان. پلەکانی گەرمیی دیزاین ئەو پلە گەرمییانەی خانەکانن کە ڤۆڵتی زنجیرەکانیان پێ دەپشکنرێت.`,
      sort: { label: 'ڕیزکردن', north: 'لە باکوورەوە بۆ باشوور', yield: 'بەرزترین بەرهەم سەرەتا' },
      col: {
        rank: 'ڕیز',
        city: 'شار',
        yield: 'بەرهەمی ساڵانە',
        irradiation: 'تیشک',
        tilt: 'لاری',
        azimuth: 'ئاراستە',
        temps: 'پلەکانی گەرمیی دیزاین',
        tempsSub: 'کەمترین / ئاسایی / زۆرترین',
      },
      scale: (lo: string, hi: string) => `پێوەر ${ltr(`${lo}–${hi} kWh/kWp`)}`,
      caption: (n: string) =>
        `بەرهەمی ساڵانەی PVGIS، تیشک لەسەر ڕووی پانێڵ، باشترین گۆشەکان و پلەکانی گەرمیی دیزاین بۆ ${n} شاری عێراق`,
      swipe: 'بۆ ستوونەکانی تر ڕایبکێشە',
    },
    method: {
      eyebrow: 'ڕێباز',
      title: 'ئەم ژمارانە چۆن دەرهێنراون',
      rows: (loss: string, date: string) => [
        {
          label: 'سەرچاوە',
          text: 'PVGIS v5.3 لە ناوەندی توێژینەوەی هاوبەشی کۆمیسیۆنی ئەورووپا (ئامرازەکانی PVcalc و TMY)',
        },
        { label: 'تیشکی خۆر', text: 'داتای مانگی دەستکردی PVGIS-SARAH3' },
        { label: 'پلەی گەرمی', text: `داتای ERA5 بۆ ساڵانی ${ltr('2005–2023')}، وەک ساڵێکی کەشوهەوای نموونەیی` },
        {
          label: 'سیستەم',
          text: `پانێڵی سیلیکۆنی کریستاڵیی ${ltr('1 kWp')} لەسەر پایەی کراوە، بە باشترین لاری و ئاراستە`,
        },
        {
          label: 'لەدەستچوون',
          text: `${ltr(`${loss}%`)} لەدەستچوونی سیستەم؛ PVGIS لەدەستچوونی گەرمی، گۆشەی تیشک و سپێکتروم زیاد دەکات`,
        },
        { label: 'شوێن', text: 'شوێنی جوگرافیی ناوەندی شار' },
        {
          label: 'پلەکانی گەرمیی دیزاین',
          text: `ساردترین: نزمترین پلەی هەوای ساڵی نموونەیی کەم ${ltr('3 °C')}. ئاسایی: تێکڕای ڕۆژی هاوین زیاد ${ltr('20 °C')}. گەرمترین: بەرزترین پلەی هەوا زیاد ${ltr('30 °C')}.`,
        },
        { label: 'بەرواری وەرگرتن', text: ltr(date) },
      ],
      note: 'ئاراستەی بان، سێبەر و تۆز بەرهەمی ڕاستەقینە دەگۆڕن. بەرهەمی زیادەی ڕووی پشتەوەی پانێڵی دوو ڕوو لەم ژمارانەدا نییە.',
    },
    faq: {
      heading: 'پرسیار دەربارەی بەرهەمی وزەی خۆر لە عێراق',
      qas: (f: IraqFacts): Qa[] => [
        {
          q: 'کام شاری عێراق زۆرترین وزەی خۆر وەردەگرێت؟',
          a: `لە نێوان ${f.count} شاری ئەم پەڕەیەدا، ${f.best} بەرزترین بەرهەمی PVGIS ی هەیە: ${ltr(`${f.bestY} kWh`)} بۆ هەر ${ltr('kWp')} لە ساڵێکدا. دوای ئەو ${f.second} (${ltr(f.secondY)}) و ${f.third} (${ltr(f.thirdY)}) دێن. ${f.lowest} نزمترینە بە ${ltr(`${f.lowY} kWh`)} بۆ هەر ${ltr('kWp')}، واتە ${ltr(`${f.diff}%`)} کەمتر لە ${f.best}.`,
        },
        {
          q: `پانێڵی خۆری ${ltr('1 kWp')} لە عێراق چەند کارەبا بەرهەم دەهێنێت؟`,
          a: `لە نێوان ${ltr(`${f.lowY} kWh`)} لە ساڵێکدا لە ${f.lowest} و ${ltr(`${f.bestY} kWh`)} لە ${f.best}، واتە بە تێکڕا ڕۆژانە ${ltr(f.lowDay)} تا ${ltr(`${f.bestDay} kWh`)}. ژمارەکانی PVGIS پانێڵ لەسەر پایەی کراوە بە باشترین لاری و ${ltr(`${f.loss}%`)} لەدەستچوونی سیستەم دادەنێن.`,
        },
        {
          q: 'باشترین لاری بۆ پانێڵی خۆر لە عێراق چەندە؟',
          a: `لە نێوان ${ltr(`${f.tiltMin}°`)} و ${ltr(`${f.tiltMax}°`)} لە ئاسۆوە، ڕووەو باشوور یان تا ${ltr(`${f.azMax}°`)} بەرەو ڕۆژئاوا. گۆشەی باشتر لە باشوور نزمترە: PVGIS بۆ ${f.flattest} ${ltr(`${f.tiltMin}°`)} و بۆ ${f.steepest} ${ltr(`${f.tiltMax}°`)} دەدات.`,
        },
      ],
    },
    cta: { title: 'قەبارەی سیستەمێک بۆ شارەکەت دیاری بکە.', designer: 'دیزاینەر بکەرەوە', contact: 'قسە لەگەڵ Faraday بکە' },
  },
  city: {
    meta: {
      title: (city: string) => `پانێڵی خۆر لە ${city} — بەرهەم، قەبارەی سیستەم و پانێڵی Peimar`,
      description: (city: string, y: string, tilt: string) =>
        `پانێڵی خۆری ${ltr('1 kWp')} لە ${city} ساڵانە نزیکەی ${ltr(`${y} kWh`)} بەرهەم دەهێنێت (PVGIS). بەرهەمی مانگانە، باشترین لاری (${ltr(`${tilt}°`)})، ژمارەی پانێڵی Peimar و پلەکانی گەرمیی دیزاینی زنجیرە.`,
    },
    dataset: {
      name: (city: string) => `بەرهەمی وزەی خۆر و پلەکانی گەرمیی دیزاین لە ${city}، عێراق — PVGIS`,
      description: (city: string, y: string, irr: string, tilt: string) =>
        `بەرهەمی مانگانە و ساڵانەی ${ltr('1 kWp')} (${ltr(`${y} kWh`)} لە ساڵێکدا)، تیشک لەسەر ڕووی پانێڵ (${ltr(`${irr} kWh/m²`)})، باشترین لاری (${ltr(`${tilt}°`)}) و پلەکانی گەرمیی دیزاینی زنجیرە لە ${city}، لە PVGIS v5.3.`,
    },
    eyebrow: (gov: string) => `داتای وزەی خۆر · ${gov}`,
    title: (city: string) => `وزەی خۆر لە ${city}`,
    lead: (city: string, y: string, day: string, tilt: string) =>
      `لە ${city}، هەر ${ltr('kWp')} پانێڵی خۆر ساڵانە نزیکەی ${ltr(`${y} kWh`)} بەرهەم دەهێنێت، واتە بە تێکڕا ڕۆژانە ${ltr(`${day} kWh`)}، بە لاریی گونجاوی ${ltr(`${tilt}°`)}.`,
    stats: {
      yield: 'بەرهەم بۆ هەر kWp لە ساڵێکدا',
      irradiation: 'تیشکی خۆر لەسەر پانێڵەکان لە ساڵێکدا',
      tilt: 'باشترین لاری',
      azimuth: 'باشترین ئاراستە',
    },
    monthly: {
      eyebrow: 'بەرهەمی مانگانە',
      title: (city: string) => `پانێڵی ${ltr('1 kWp')} لە ${city} مانگ بە مانگ چەند بەرهەم دەهێنێت`,
      text: (peakMonth: string, peak: string, lowMonth: string, low: string) =>
        `باشترین مانگ ${peakMonth}ە بە ${ltr(`${peak} kWh`)}، و لاوازترینیان ${lowMonth}ە بە ${ltr(`${low} kWh`)}.`,
      total: (t: string) => `کۆی ساڵانە ${ltr(`${t} kWh`)}`,
      chartLabel: (city: string) => `بەرهەمی مانگانەی ${ltr('1 kWp')} لە ${city}، بە ${ltr('kWh')}`,
      average: 'تێکڕا',
      axis: 'kWh',
    },
    sizing: {
      eyebrow: 'قەبارەی سیستەم',
      title: (city: string) => `ژمارەی پانێڵی Peimar بەپێی بەکارهێنانت لە ${city}`,
      text: (y: string, model: string, w: string) =>
        `توانای پێویست = بەکارهێنانی ساڵانە ÷ ${ltr(`${y} kWh`)} بۆ هەر ${ltr('kWp')}. ژمارەی پانێڵ = توانای پێویست ÷ ${ltr(`${w} W`)}، بەرەو سەرەوە بۆ پانێڵی تەواوی ${ltr(model)} خڕ دەکرێتەوە.`,
      col: { use: 'بەکارهێنانی مانگانە', kwp: 'توانای پێویست', panels: 'ژمارەی پانێڵ', area: 'ڕووبەری پانێڵەکان' },
      perMonth: 'kWh/مانگ',
      perYear: (kwh: string) => `${ltr(`${kwh} kWh`)} لە ساڵێکدا`,
      installed: (kwp: string) => `${ltr(`${kwp} kWp`)} دامەزراو`,
      caption: (city: string, model: string) =>
        `ژمارەی پانێڵی Peimar ${model} کە لە ${city} پێویستە بۆ هەر بەکارهێنانێکی مانگانە`,
      note: 'ڕووبەری پانێڵەکان تەنها خودی پانێڵەکانە، بەبێ بۆشایی نێوان ڕیزەکان و لێواری بان. سێبەر، تۆز و ئاراستە بەرهەمی ڕاستەقینە دەگۆڕن.',
      module: {
        eyebrow: 'پانێڵی بنەمای ژماردن',
        tech: `${ltr('TOPCon')} ی جۆری ${ltr('N')} · دوو ڕوو · شووشەی دووانە`,
        power: 'توانا',
        efficiency: 'کارایی',
        size: 'قەبارە',
        weight: 'کێش',
        cells: 'خانەکان',
        cellsText: 'خانەی نیوەبڕاو',
        coefficient: 'هاوکۆڵکەی پلەی گەرمیی توانا',
        warranty: 'گەرەنتی',
        warrantyText: (product: number, power: number) =>
          `${ltr(product)} ساڵ گەرەنتیی بەرهەم، ${ltr(power)} ساڵ گەرەنتیی هێڵیی توانا`,
        link: 'پانێڵەکانی OR Series OR10H',
        datasheet: 'داتاشیت (PDF)',
        drawing: (model: string, w: string, h: string) => `نەخشەی پانێڵی ${ltr(model)}، ${ltr(`${w} × ${h} mm`)}`,
      },
    },
    temps: {
      eyebrow: 'دیزاینی زنجیرە',
      title: (city: string) => `پلەکانی گەرمیی دیزاین لە ${city}`,
      text: 'ڤۆڵتی زنجیرە لەگەڵ پلەی گەرمیی خانەکان دەگۆڕێت. دیزاینەر زنجیرەکان بەم سێ بەهایە دەپشکنێت، کە لە داتای کەشوهەوای PVGIS بۆ شارەکە وەرگیراون.',
      min: {
        label: 'ساردترین پلەی خانە',
        text: 'بەرزترین ڤۆڵتی بازنەی کراوە (Voc) دیاری دەکات، کە دەبێت لە خوار زۆرترین ڤۆڵتی DC ی ئینڤێرتەرەوە بمێنێتەوە.',
      },
      nom: { label: 'پلەی ئاسایی هاوین', text: 'پلەی کارکردنی ئاسایی لە ڕۆژێکی هاویندا، بۆ ڤۆڵت و توانای چاوەڕوانکراو.' },
      max: {
        label: 'گەرمترین پلەی خانە',
        text: 'نزمترین ڤۆڵتی MPP دیاری دەکات، کە دەبێت لە ناو مەودای MPPT ی ئینڤێرتەردا بمێنێتەوە.',
      },
      source: (tmyMin: string, tmyMax: string, summer: string) =>
        `لە ساڵی نموونەیی PVGIS: نزمترین پلەی هەوا ${ltr(`${tmyMin} °C`)} (کەم ${ltr('3 °C')} وەک پەراوێز)، بەرزترین ${ltr(`${tmyMax} °C`)} (زیاد ${ltr('30 °C')} بۆ پانێڵ لە بەر خۆری ڕاستەوخۆ)، تێکڕای ڕۆژی هاوین ${ltr(`${summer} °C`)} (زیاد ${ltr('20 °C')}).`,
      heat: (t: string, model: string, ct: string, loss: string) =>
        `لە ${ltr(`${t} °C`)} دا، پانێڵی ${ltr(model)} (${ltr(`${ct} %/°C`)}) نزیکەی ${ltr(`${loss}%`)} کەمتر لە توانای ناوەکیی خۆی بەرهەم دەهێنێت.`,
      scale: (min: string, nom: string, max: string) =>
        `پلەکانی گەرمیی خانە بۆ دیزاین: ${ltr(`${min} °C`)}، ${ltr(`${nom} °C`)} و ${ltr(`${max} °C`)}`,
      air: 'هەوا، ساڵی نموونەیی',
      designer: (city: string) => `زنجیرەکان بۆ ${city} لە دیزاینەر بپشکنە`,
    },
    faq: {
      heading: (city: string) => `پرسیار دەربارەی وزەی خۆر لە ${city}`,
      qas: (f: CityFacts): Qa[] => [
        {
          q: `سیستەمێکی خۆری ${ltr('1 kWp')} لە ${f.city} چەند کارەبا بەرهەم دەهێنێت؟`,
          a: `ساڵانە نزیکەی ${ltr(`${f.yieldYear} kWh`)}، واتە بە تێکڕا ڕۆژانە ${ltr(`${f.perDay} kWh`)}، بەپێی PVGIS بۆ پانێڵ لەسەر پایەی کراوە بە لاریی گونجاوی ${ltr(`${f.tilt}°`)} و ${ltr(`${f.loss}%`)} لەدەستچوونی سیستەم. بەرهەمی مانگانە لە ${ltr(`${f.low} kWh`)} لە ${f.lowMonth} تا ${ltr(`${f.peak} kWh`)} لە ${f.peakMonth} دەگۆڕێت.`,
        },
        {
          q: `بۆ ${ltr('1,000 kWh')} لە مانگێکدا لە ${f.city} چەند پانێڵی Peimar پێویستە؟`,
          a: `نزیکەی ${ltr(f.panels)} پانێڵی ${ltr(f.model)} ی ${ltr(`${f.watts} W`)}، کۆی گشتی ${ltr(`${f.installed} kWp`)}. ژماردنەکە: ${ltr('12,000 kWh')} لە ساڵێکدا ÷ ${ltr(`${f.yieldYear} kWh`)} بۆ هەر ${ltr('kWp')} = ${ltr(`${f.kwp} kWp`)}، بەرەو سەرەوە بۆ پانێڵی تەواو خڕ دەکرێتەوە. پانێڵەکان نزیکەی ${ltr(`${f.area} m²`)} دەگرن، بەبێ بۆشایی نێوان ڕیزەکان.`,
        },
        {
          q: `باشترین لاری بۆ پانێڵی خۆر لە ${f.city} چەندە؟`,
          a: `${ltr(`${f.tilt}°`)} لە ئاسۆوە، ${f.facing}. بەپێی PVGIS ئەم گۆشانە بەرزترین بەرهەمی ساڵانە لە شوێنی ${f.city} (${f.coords}) دەدەن.`,
        },
        {
          q: `بۆ ژماردنی زنجیرە لە ${f.city} کام پلە گەرمییانە بەکاردەهێنرێن؟`,
          a: `${ltr(`${f.tmin} °C`)} وەک ساردترین پلەی خانە بۆ بەرزترین ڤۆڵتی زنجیرە، ${ltr(`${f.tmax} °C`)} وەک گەرمترین پلە بۆ نزمترین ڤۆڵتی MPP، و ${ltr(`${f.tnom} °C`)} وەک پلەی کارکردنی ئاسایی هاوین. ئەمانە لە ساڵی نموونەیی PVGIS بۆ ${f.city} وەرگیراون، کە پلەی هەوا تێیدا لە ${ltr(`${f.tmyMin} °C`)} تا ${ltr(`${f.tmyMax} °C`)} دەگۆڕێت.`,
        },
      ],
    },
    nearby: {
      eyebrow: 'شارە نزیکەکان',
      title: 'بەراوردی بکە لەگەڵ شارە نزیکەکان',
      yield: 'بەرهەمی ساڵانە',
      distance: 'دووری',
      diff: (city: string) => `بەراورد لەگەڵ ${city}`,
      all: (n: string) => `هەموو شارەکان (${n})`,
    },
    source: {
      eyebrow: 'سەرچاوە',
      text: (loss: string, date: string) =>
        `ژمارەکانی PVGIS v5.3 (تیشکی PVGIS-SARAH3 و پلەی گەرمیی ERA5)، لە ${ltr(date)} وەرگیراون: پانێڵی سیلیکۆنی کریستاڵیی ${ltr('1 kWp')} لەسەر پایەی کراوە بە باشترین لاری و ئاراستە، لەگەڵ ${ltr(`${loss}%`)} لەدەستچوونی سیستەم. بەرهەمی زیادەی ڕووی پشتەوەی پانێڵی دوو ڕوو تێیدا نییە.`,
      method: 'ئەم ژمارانە چۆن دەرهێنراون',
    },
    cta: {
      title: (city: string) => `پلانی سیستەمێکی خۆر بۆ ${city} دابنێ.`,
      designer: (city: string) => `سیستەمێک بۆ ${city} دیزاین بکە`,
      contact: 'قسە لەگەڵ Faraday بکە',
    },
  },
};

export const solar: Record<Locale, SolarStrings> = { en, ar, ckb };
