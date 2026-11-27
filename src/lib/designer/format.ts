/** Western digits in every language, grouped with commas. */
export function fmt(value: number, decimals = 0): string {
  if (!Number.isFinite(value)) return '–';
  const s = Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return value < 0 && Number(s.replace(/,/g, '')) !== 0 ? `−${s}` : s;
}

export const kw = (w: number, decimals = 2) => fmt(w / 1000, decimals);

/** At most `max` decimals, no trailing zeros: 2 → "2", 2.5 → "2.5". */
export const fmtMax = (v: number, max = 1) => (Number.isInteger(v) ? fmt(v) : fmt(v, max).replace(/\.?0+$/, ''));

/** Inverter ratings: 6000 → "6", 7200 → "7.2", 3680 → "3.68". */
export const kwRating = (w: number) => fmt(w / 1000, w % 1000 === 0 ? 0 : w % 100 === 0 ? 1 : 2);
export const pct = (ratio: number, decimals = 2) => fmt(ratio * 100, decimals);

/** Isolate Latin and number runs in plain-text contexts (title, aria, WhatsApp) so RTL text never reorders them. */
export const ltr = (s: string | number) => `⁦${s}⁩`;

/** A value and its unit that never wrap apart, isolated for RTL text: unit('6', 'kW') → "6 kW". */
export const unit = (value: string, u: string) => ltr(`${value} ${u}`);

/** Arabic-Indic and Persian digits as Western digits: "٦١٠" and "۶۱۰" → "610". */
export const latinDigits = (s: string) =>
  s.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660)).replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0));

/**
 * Accept Arabic-Indic and Persian digits, the Arabic decimal sign, a decimal comma ("4,5", "0,12"), thousands separators
 * ("9,000,000", "٩٬٠٠٠", "9 000"), the typographic minus and bidi marks copied along with a figure. Commas count as
 * thousands separators only in a full grouping such as "1,500"; any other single comma is the decimal point.
 */
export function parseNumber(input: string): number {
  const s = latinDigits(input)
    .replace(/[\s\u061c\u200e\u200f\u202a-\u202e\u2066-\u2069]/g, '')
    .replace(/٫/g, '.')
    .replace(/[−–]/g, '-');
  const grouped = /^-?[1-9]\d{0,2}([,٬]\d{3})+(\.\d*)?$/.test(s);
  const normalized = grouped ? s.replace(/[,٬]/g, '') : s.replace(/^(-?\d*),(\d*)$/, '$1.$2');
  if (!/^-?(\d+\.?\d*|\.\d+)$/.test(normalized)) return NaN;
  return Number(normalized);
}

const IRAQ_DAY = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Baghdad', year: 'numeric', month: '2-digit', day: '2-digit' });

/** The calendar day in Iraq (Asia/Baghdad) as YYYY-MM-DD, whatever the time zone of the device. */
export function iraqDate(at: Date): string {
  const part = Object.fromEntries(IRAQ_DAY.formatToParts(at).map((p) => [p.type, p.value]));
  return `${part.year}-${part.month}-${part.day}`;
}
