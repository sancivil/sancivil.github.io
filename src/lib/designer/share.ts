import { MAX_COUNT, createProject, hasWork, normalizeProject } from './project.ts';
import type { Catalog, Finance, GroupSel, InverterBlock, Panel, Project, SubArray } from './types.ts';

const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : NaN);
const str = (v: unknown, max = 2000): string => (typeof v === 'string' ? v.slice(0, max) : '');
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const nullableNum = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);
/** Series and strings are whole numbers from 0 to MAX_COUNT; anything else (fractions, 1e9, text) means "not selected". */
const whole = (v: unknown): number => (typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= MAX_COUNT ? v : 0);

const CUSTOM_FIELDS = ['power', 'vmp', 'imp', 'voc', 'isc', 'ctPmax', 'ctVoc', 'ctIsc', 'vdcMax'] as const;

/**
 * Short array form keeps share links compact: [name, number, client, address, notes, cityId, temps, subArrays,
 * customPanels, inverters, finance]. finance ([currency, cost, price per kWh, yearly use]) came later: links without it still open.
 */
export function toCompact(p: Project): unknown[] {
  return [
    p.name,
    p.number,
    p.client,
    p.address,
    p.notes,
    p.cityId,
    [p.temps.tmin, p.temps.tnom, p.temps.tmax],
    p.subArrays.map((s) => [s.id, s.name, s.panelId, s.count]),
    p.customPanels.map((c) => [c.id, c.model, ...CUSTOM_FIELDS.map((f) => c[f])]),
    p.inverters.map((b) => [b.id, b.inverterId, b.count, b.configKey, b.groups.map((g) => [g.subArrayId, g.series, g.strings])]),
    [p.finance.currency, p.finance.cost, p.finance.pricePerKwh, p.finance.useKwh],
  ];
}

/** Rebuild a project from its compact form; pass the catalogue to also repair it against the inverter data (normalizeProject). */
export function fromCompact(raw: unknown, catalog?: Catalog): Project | null {
  if (!Array.isArray(raw) || raw.length < 10) return null;
  const [name, number, client, address, notes, cityId, temps, subs, customs, invs, fin] = raw;
  const t = arr(temps);
  const subArrays: SubArray[] = arr(subs).map((s) => {
    const a = arr(s);
    return { id: str(a[0], 20), name: str(a[1], 120), panelId: str(a[2], 60), count: num(a[3]) };
  });
  const customPanels: Panel[] = arr(customs).map((c) => {
    const a = arr(c);
    const values = Object.fromEntries(CUSTOM_FIELDS.map((f, i) => [f, num(a[i + 2])])) as Record<(typeof CUSTOM_FIELDS)[number], number>;
    return {
      id: str(a[0], 20),
      model: str(a[1], 80),
      series: 'custom',
      finish: null,
      bifacial: false,
      efficiency: null,
      width: null,
      height: null,
      custom: true,
      ...values,
      ctPmax: nullableNum(a[7]),
    };
  });
  const inverters: InverterBlock[] = arr(invs).map((b) => {
    const a = arr(b);
    const groups: GroupSel[] = arr(a[4]).map((g) => {
      const x = arr(g);
      const series = whole(x[1]);
      const strings = whole(x[2]);
      return series > 0 && strings > 0 ? { subArrayId: str(x[0], 20), series, strings } : { subArrayId: str(x[0], 20), series: 0, strings: 0 };
    });
    return { id: str(a[0], 20), inverterId: str(a[1], 60), count: num(a[2]), configKey: str(a[3], 60), groups };
  });
  if (!subArrays.length || !inverters.length) return null;
  const f = arr(fin);
  const finance: Finance = { currency: f[0] === 'USD' ? 'USD' : 'IQD', cost: num(f[1]), pricePerKwh: num(f[2]), useKwh: num(f[3]) };
  const base = createProject();
  const project: Project = {
    ...base,
    name: str(name, 200),
    number: str(number, 200),
    client: str(client, 200),
    address: str(address, 300),
    notes: str(notes),
    cityId: str(cityId, 40),
    temps: { tmin: num(t[0]), tnom: num(t[1]), tmax: num(t[2]) },
    subArrays,
    customPanels,
    inverters,
    finance,
  };
  return catalog ? normalizeProject(project, catalog) : project;
}

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(code: string): string {
  const b64 = code.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

export function encodeProject(p: Project): string {
  return toBase64Url(JSON.stringify(toCompact(p)));
}

/** Never throws: a truncated, corrupted or foreign code gives null, so the caller can say the link is broken. */
export function decodeProject(code: string, catalog?: Catalog): Project | null {
  try {
    return fromCompact(JSON.parse(fromBase64Url(code)), catalog);
  } catch {
    return null;
  }
}

/**
 * The share code in a location hash ("#p=…"), or null when the hash is not a share link. Tolerates what mail and chat
 * apps do to a long link: an encoded "=", spaces or line breaks inside it, punctuation glued to its end.
 */
export function shareCode(hash: string): string | null {
  let text = hash;
  try {
    text = decodeURIComponent(hash);
  } catch {
    // A stray "%" that starts no escape: read the hash as it is.
  }
  return text.replace(/\s+/g, '').match(/^#p=([A-Za-z0-9_-]*)/)?.[1] ?? null;
}

/** A project kept on this device and the share code it was opened from ('' when it was made here). */
export type Saved = { project: Project; from: string };

/** Unchanged since it was opened from a share link, so that link still holds it. */
const inLink = (s: Saved) => s.from !== '' && encodeProject(s.project) === s.from;

/**
 * What opening a share link for `shared` does on a device that holds the open project and maybe one other:
 * 'keep' first sets the open project aside as the other one, whenever that slot is free (empty, a copy, or still held by
 * its link); 'open' replaces the open project when that loses nothing: it holds no work, or its link still holds it;
 * 'ask' when both projects hold work that exists only on this device.
 */
export function shareMove(open: Saved, other: Saved | null, shared: Project): 'open' | 'keep' | 'ask' {
  const code = encodeProject(shared);
  const openCode = encodeProject(open.project);
  if (!hasWork(open.project) || openCode === code) return 'open';
  if (!other || !hasWork(other.project) || inLink(other) || [code, openCode].includes(encodeProject(other.project))) return 'keep';
  return inLink(open) ? 'open' : 'ask';
}
