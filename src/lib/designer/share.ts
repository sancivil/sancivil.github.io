import { createProject } from './project.ts';
import type { GroupSel, InverterBlock, Panel, Project, SubArray } from './types.ts';

const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : NaN);
const str = (v: unknown, max = 2000): string => (typeof v === 'string' ? v.slice(0, max) : '');
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const nullableNum = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);

const CUSTOM_FIELDS = ['power', 'vmp', 'imp', 'voc', 'isc', 'ctPmax', 'ctVoc', 'ctIsc', 'vdcMax'] as const;

/** Short array form keeps share links compact: [name, number, client, address, notes, cityId, temps, subArrays, customPanels, inverters]. */
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
  ];
}

export function fromCompact(raw: unknown): Project | null {
  if (!Array.isArray(raw) || raw.length < 10) return null;
  const [name, number, client, address, notes, cityId, temps, subs, customs, invs] = raw;
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
      return { subArrayId: str(x[0], 20), series: Math.max(0, num(x[1]) || 0), strings: Math.max(0, num(x[2]) || 0) };
    });
    return { id: str(a[0], 20), inverterId: str(a[1], 60), count: num(a[2]), configKey: str(a[3], 60), groups };
  });
  if (!subArrays.length || !inverters.length) return null;
  const base = createProject();
  return {
    ...base,
    name: str(name, 200),
    number: str(number, 80),
    client: str(client, 200),
    address: str(address, 300),
    notes: str(notes),
    cityId: str(cityId, 40),
    temps: { tmin: num(t[0]), tnom: num(t[1]), tmax: num(t[2]) },
    subArrays,
    customPanels,
    inverters,
  };
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

export function decodeProject(code: string): Project | null {
  try {
    return fromCompact(JSON.parse(fromBase64Url(code)));
  } catch {
    return null;
  }
}
