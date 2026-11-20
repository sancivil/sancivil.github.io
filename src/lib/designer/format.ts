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

/** Accept Arabic-Indic and Persian digits, the Arabic decimal sign and typographic minus from Iraqi keyboards. */
export function parseNumber(input: string): number {
  const normalized = input
    .trim()
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/٫/g, '.')
    .replace(/[,٬\s]/g, '')
    .replace(/[−–]/g, '-');
  if (!/^-?(\d+\.?\d*|\.\d+)$/.test(normalized)) return NaN;
  return Number(normalized);
}
