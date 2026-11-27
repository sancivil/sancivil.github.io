/*
  Opening hours as the site prints them, from the owner's seven rows (Saturday to Friday). Consecutive days
  with the same hours form one group: "Saturday–Thursday 09:00–17:00 · Friday closed".
*/
import type { Day, OpeningDay } from './contract.ts';
import type { Locale } from '../i18n/config.ts';
import { keep, ltr } from '../i18n/text.ts';

export const DAY_NAMES: Record<Locale, Record<Day, string>> = {
  en: { sat: 'Saturday', sun: 'Sunday', mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday' },
  ar: { sat: 'السبت', sun: 'الأحد', mon: 'الاثنين', tue: 'الثلاثاء', wed: 'الأربعاء', thu: 'الخميس', fri: 'الجمعة' },
  ckb: { sat: 'شەممە', sun: 'یەکشەممە', mon: 'دووشەممە', tue: 'سێشەممە', wed: 'چوارشەممە', thu: 'پێنجشەممە', fri: 'هەینی' },
};

/** "Saturday–Thursday" in lists, "Saturday to Thursday" in sentences; Arabic and Kurdish use one form. */
const RANGE: Record<Locale, (from: string, to: string, sentence: boolean) => string> = {
  en: (from, to, sentence) => (sentence ? `${from} to ${to}` : `${from}–${to}`),
  ar: (from, to) => `من ${from} إلى ${to}`,
  ckb: (from, to) => `${from} تا ${to}`,
};

const CLOSED: Record<Locale, string> = { en: 'closed', ar: 'عطلة', ckb: 'داخراوە' };
const AND: Record<Locale, (items: string[]) => string> = {
  en: (items) => (items.length > 1 ? `${items.slice(0, -1).join(', ')} and ${items.at(-1)}` : items.join('')),
  ar: (items) => items.join(' و'),
  ckb: (items) => items.join(' و '),
};
const SEPARATOR: Record<Locale, string> = { en: '; ', ar: '؛ ', ckb: '؛ ' };

export interface HoursGroup {
  days: Day[];
  open: string | null;
  close: string | null;
}

/** Runs of consecutive days with the same hours, in week order. */
export function hoursGroups(hours: readonly OpeningDay[]): HoursGroup[] {
  const groups: HoursGroup[] = [];
  for (const { day, open, close } of hours) {
    const last = groups.at(-1);
    if (last && last.open === open && last.close === close) last.days.push(day);
    else groups.push({ days: [day], open, close });
  }
  return groups;
}

/** The days of a group: "Friday", "Saturday–Thursday" or, in a sentence, "Saturday to Thursday". */
export function dayRange(locale: Locale, days: readonly Day[], sentence = false): string {
  const names = DAY_NAMES[locale];
  const first = names[days[0]];
  return days.length === 1 ? first : RANGE[locale](first, names[days[days.length - 1]], sentence);
}

export const timeRange = (open: string, close: string) => `${open}–${close}`;

/** The open days of a week as a sentence part: "Saturday to Thursday, 09:00–17:00" (contact page description). */
export function hoursSentence(locale: Locale, hours: readonly OpeningDay[]): string {
  return hoursGroups(hours)
    .flatMap((g) => (g.open && g.close ? [`${dayRange(locale, g.days, true)}${locale === 'en' ? ',' : '،'} ${timeRange(g.open, g.close)}`] : []))
    .join(SEPARATOR[locale]);
}

/** The whole week on one line, for the footer, the menu and the FAQ page. */
export function hoursLine(locale: Locale, hours: readonly OpeningDay[]): string {
  const time = (open: string, close: string) => (locale === 'en' ? keep : ltr)(timeRange(open, close));
  return hoursGroups(hours)
    .map((g) => `${dayRange(locale, g.days)} ${g.open && g.close ? time(g.open, g.close) : CLOSED[locale]}`)
    .join(' · ');
}

/** One row per group, for the contact block: the days, and the times or null when closed. */
export const hoursRows = (locale: Locale, hours: readonly OpeningDay[]) =>
  hoursGroups(hours).map((g) => ({ days: dayRange(locale, g.days), time: g.open && g.close ? timeRange(g.open, g.close) : null }));

/** The days a week is closed, as one list: "Friday", "Thursday and Friday". */
export const closedDays = (locale: Locale, hours: readonly OpeningDay[]) =>
  AND[locale](hoursGroups(hours).flatMap((g) => (g.open ? [] : [dayRange(locale, g.days, true)])));

const SCHEMA_DAYS = DAY_NAMES.en;

/** schema.org openingHoursSpecification: one entry per set of hours, closed days left out. */
export function openingHoursSpecification(hours: readonly OpeningDay[]) {
  const byTime = new Map<string, { open: string; close: string; days: Day[] }>();
  for (const { day, open, close } of hours) {
    if (!open || !close) continue;
    const key = timeRange(open, close);
    const entry = byTime.get(key) ?? { open, close, days: [] };
    entry.days.push(day);
    byTime.set(key, entry);
  }
  return [...byTime.values()].map((e) => ({
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: e.days.map((day) => SCHEMA_DAYS[day]),
    opens: e.open,
    closes: e.close,
  }));
}
