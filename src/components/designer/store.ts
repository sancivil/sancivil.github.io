import { computed, signal } from '@preact/signals';
import { createContext } from 'preact';
import { useContext } from 'preact/hooks';
import type { CommonStrings } from '../../i18n/common.ts';
import type { Locale } from '../../i18n/config.ts';
import type { DesignerStrings } from '../../i18n/designer.ts';
import { summarize } from '../../lib/designer/calc.ts';
import { catalog } from '../../lib/designer/data.ts';
import { createProject, reachableStep, stepErrors, type StepNo } from '../../lib/designer/project.ts';
import { fromCompact, toCompact } from '../../lib/designer/share.ts';
import type { Needs } from '../../lib/designer/sizing.ts';
import type { City, Finance, Project } from '../../lib/designer/types.ts';

export type Mode = 'design' | 'needs';

export const emptyNeeds = (): Needs => ({ cityId: '', monthlyKwh: NaN, gridHours: NaN, backupKw: NaN, backupHours: NaN, phase: 'single_phase' });

/** Payback inputs of the needs path: the monthly bill (basis 'bill') can stand in for the price per kWh. */
export type HomeFinance = Omit<Finance, 'useKwh'> & { basis: 'kwh' | 'bill'; bill: number };
const emptyHomeFinance = (): HomeFinance => ({ currency: 'IQD', cost: NaN, pricePerKwh: NaN, basis: 'kwh', bill: NaN });

export const project = signal<Project>(createProject());
export const step = signal<StepNo>(1);
export const mode = signal<Mode>('design');
export const needs = signal<Needs>(emptyNeeds());
export const homeFinance = signal<HomeFinance>(emptyHomeFinance());
export const notice = signal<string | null>(null);

export const summary = computed(() => summarize(project.value, catalog));
export const reachable = computed(() => reachableStep(project.value, catalog));
export const errors = computed(() => ({
  1: stepErrors(project.value, catalog, 1),
  2: stepErrors(project.value, catalog, 2),
  3: stepErrors(project.value, catalog, 3),
}));

export function update(fn: (p: Project) => Project) {
  project.value = fn(project.value);
}

export function goTo(n: StepNo) {
  mode.value = 'design';
  step.value = Math.min(n, reachable.value) as StepNo;
}

const STORAGE_KEY = 'faraday-designer-v1';

export function restore(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    const p = fromCompact(data.p, catalog);
    if (!p) return false;
    project.value = p;
    mode.value = data.m === 'needs' ? 'needs' : 'design';
    step.value = Math.min(Number(data.s) || 1, reachable.value) as StepNo;
    const num = (v: unknown) => (typeof v === 'number' ? v : NaN);
    if (data.n && typeof data.n === 'object') {
      const n = data.n;
      needs.value = {
        cityId: typeof n.cityId === 'string' ? n.cityId : '',
        monthlyKwh: num(n.monthlyKwh),
        gridHours: num(n.gridHours),
        backupKw: num(n.backupKw),
        backupHours: num(n.backupHours),
        phase: n.phase === 'three_phase' ? 'three_phase' : 'single_phase',
      };
    }
    if (data.f && typeof data.f === 'object') {
      const f = data.f;
      homeFinance.value = {
        currency: f.currency === 'USD' ? 'USD' : 'IQD',
        cost: num(f.cost),
        pricePerKwh: num(f.pricePerKwh),
        basis: f.basis === 'bill' ? 'bill' : 'kwh',
        bill: num(f.bill),
      };
    }
    return true;
  } catch {
    return false;
  }
}

export function persist() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ p: toCompact(project.value), s: step.value, m: mode.value, n: needs.value, f: homeFinance.value }),
    );
  } catch {
    /* storage full or blocked: the design still works for this visit */
  }
}

export type I18nValue = { t: DesignerStrings; c: CommonStrings; locale: Locale; rtl: boolean };
export const I18n = createContext<I18nValue | null>(null);

export function useI18n(): I18nValue {
  const value = useContext(I18n);
  if (!value) throw new Error('Designer components need the I18n provider');
  return value;
}

export function cityName(city: City, locale: Locale): string {
  return locale === 'ar' ? city.nameAr : locale === 'ckb' ? city.nameKu : city.name;
}
