import type { DesignerStrings } from '../../i18n/designer.ts';
import { checkOp, checkTemp, mpptGroups, type Check } from '../../lib/designer/calc.ts';
import { fmt, kwRating, ltr, unit } from '../../lib/designer/format.ts';
import type { Inverter, Panel, Project, Temps } from '../../lib/designer/types.ts';

export const panelLabel = (p: Panel) => (p.finish ? `${p.model} (${p.finish.code})` : p.model);

/** A project's name inside a sentence, isolated so that right-to-left text never reorders it. */
export const projectName = (p: Project, t: DesignerStrings) => `⁨${p.name || t.rail.untitled}⁩`;

export function panelMeta(p: Panel): string {
  const parts = [`${fmt(p.power)} W`];
  if (p.efficiency) parts.push(`${fmt(p.efficiency * 100, 2)} %`);
  if (p.width && p.height) parts.push(`${fmt(p.width)} × ${fmt(p.height)} mm`);
  return parts.map(ltr).join(' · ');
}

export function inverterRole(inv: Inverter, t: DesignerStrings): string {
  return [t.inverter.phases[inv.phase], ltr(`${inv.numMppt} MPPT`), t.inverter.roles[inv.type]].join(' · ');
}

export function inverterMeta(inv: Inverter, t: DesignerStrings): string {
  return `${ltr(`${kwRating(inv.pnomAc)} kW`)} · ${inverterRole(inv, t)}`;
}

export function configLabel(inv: Inverter, key: string, t: DesignerStrings): string {
  const groups = mpptGroups(inv, key);
  if (groups.length === 1 && groups[0].mppts.length === 1) return t.inverter.configSingle;
  if (groups.every((g) => g.mppts.length === 1)) return t.inverter.configIndependent(groups.length);
  if (groups.length === 1) return t.inverter.configAll;
  return groups.map((g) => (g.mppts.length > 1 ? t.inverter.parallel(g.mppts.join(' + ')) : `MPPT ${g.mppts[0]}`)).join(' · ');
}

export const groupName = (mppts: number[]) => `MPPT ${mppts.join(' + ')}`;

const UNIT: Record<Check['id'], string> = {
  vstart: 'V',
  vmaxDc: 'V',
  vdcModule: 'V',
  vminMppt: 'V',
  vmaxMppt: 'V',
  imax: 'A',
  panels: '',
};

const QTY: Record<Check['id'], string> = {
  vstart: 'Voc',
  vmaxDc: 'Voc',
  vdcModule: 'Voc',
  vminMppt: 'Vmp',
  vmaxMppt: 'Vmp',
  imax: 'Imp',
  panels: '',
};

export function checkValue(c: Check): string {
  const unit = UNIT[c.id];
  const digits = c.id === 'imax' ? 2 : 0;
  return unit ? `${fmt(c.value, digits)} ${unit}` : fmt(c.value);
}

export function checkLimit(c: Check): string {
  const unit = UNIT[c.id];
  const limit = Number.isInteger(c.limit) ? fmt(c.limit) : fmt(c.limit, 2).replace(/0$/, '');
  return unit ? `${limit} ${unit}` : limit;
}

/** Quantity label such as "Voc at −10 °C" for a check. */
export function checkQty(c: Check, temps: Temps, t: DesignerStrings): string {
  const at = checkTemp[c.id];
  if (!at) return t.checks.panelsNeeded;
  return t.checks.at(QTY[c.id], unit(fmt(temps[at]), '°C'));
}

/** Plain sentence for title / aria-description; number runs are isolated for RTL. */
export function checkSentence(c: Check, temps: Temps, t: DesignerStrings): string {
  const qty = checkQty(c, temps, t);
  return t.checks.fail[checkOp[c.id]](qty, ltr(checkValue(c)), ltr(checkLimit(c)), t.checks.names[c.id]);
}
