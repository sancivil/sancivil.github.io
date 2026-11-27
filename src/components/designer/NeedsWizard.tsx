import type { CommonStrings } from '../../i18n/common.ts';
import type { ComponentChildren } from 'preact';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { whatsappLink } from '../../data/site.ts';
import { batteries, cities, inverters, panels } from '../../lib/designer/data.ts';
import { fmt, fmtMax, kwRating, ltr, pct, unit } from '../../lib/designer/format.ts';
import { AGEING, moduleTech, payback, priceFromBill, rate } from '../../lib/designer/payback.ts';
import { hasWork } from '../../lib/designer/project.ts';
import { encodeProject } from '../../lib/designer/share.ts';
import { projectFromSizing, sizeFromNeeds, type Needs, type Sizing, type SizingOutcome } from '../../lib/designer/sizing.ts';
import type { Phase, Project } from '../../lib/designer/types.ts';
import { FinanceFields, PaybackView, paybackLines } from './Payback.tsx';
import { projectName } from './labels.ts';
import { cityName, homeFinance, needs, notice, openProject, project, step, useI18n } from './store.ts';
import { Field, Icon, Num, NumberInput, describedBy, useTouched } from './ui.tsx';

const sizingData = { panels, inverters, cities, batteries };

type NeedKey = keyof Omit<Needs, 'cityId' | 'phase'>;

type NumberFieldProps = { id: string; k: NeedKey; label: string; unit: string; help: string; error: string | null; onUnparsed: (unparsed: boolean) => void };

function NumberField({ id, k, label, unit, help, error, onUnparsed }: NumberFieldProps) {
  const [touched, touch] = useTouched();
  const shown = touched ? error : null;
  return (
    <Field id={id} label={label} help={help} error={shown} required={k === 'monthlyKwh'}>
      <NumberInput
        id={id}
        value={needs.value[k]}
        unit={unit}
        invalid={!!shown}
        describedBy={describedBy(id, help, shown)}
        onBlur={touch}
        onUnparsed={onUnparsed}
        onValue={(v) => (needs.value = { ...needs.value, [k]: v })}
      />
    </Field>
  );
}

/** Hours as the outage sentence shows them: at most one decimal. */
const tenth = (v: number) => Math.round(v * 10) / 10;

function layoutText(s: Sizing): string {
  return s.layout.groups
    .map((g, i) => (g.series > 0 ? `MPPT ${i + 1}: ${g.strings} × ${g.series}` : null))
    .filter(Boolean)
    .join(' · ');
}

function batteryText(s: Sizing): string | null {
  if (!s.battery || !s.battery.items.length) return null;
  return s.battery.items.map((i) => (i.qty > 1 ? `${i.qty} × ${i.name}` : i.name)).join(' + ');
}

export function NeedsWizard({ onContinue }: { onContinue: () => void }) {
  const { t, c, locale } = useI18n();
  const n = needs.value;
  /** Fields whose text is not a number: they count as wrong, never as left empty. */
  const [unparsed, setUnparsed] = useState<Partial<Record<NeedKey, boolean>>>({});
  const flag = (k: NeedKey) => (u: boolean) => setUnparsed((x) => ({ ...x, [k]: u }));
  const anyUnparsed = Object.values(unparsed).some(Boolean);
  const outcome = useMemo((): SizingOutcome => (anyUnparsed ? { ok: false, reason: 'input' } : sizeFromNeeds(n, sizingData)), [n, anyUnparsed]);
  const city = cities.find((x) => x.id === n.cityId) ?? null;

  const err = (k: NeedKey, ok: boolean, message: string) => (ok && !unparsed[k] ? null : message);
  const hoursOk = (v: number) => Number.isNaN(v) || (v >= 0 && v <= 24);
  const monthlyErr = err('monthlyKwh', n.monthlyKwh > 0 && n.monthlyKwh <= 200000, t.needs.errMonthly);
  const gridErr = err('gridHours', hoursOk(n.gridHours), t.needs.errHours);
  const kwErr = err('backupKw', Number.isNaN(n.backupKw) || (n.backupKw >= 0 && n.backupKw <= 500), t.needs.errKw);
  const backupHoursErr = err('backupHours', hoursOk(n.backupHours), t.needs.errHours);

  const fin = homeFinance.value;
  const byBill = fin.basis === 'bill';
  const billPrice = priceFromBill(fin.bill, n.monthlyKwh);
  /** A price from the bill counts as rounded under the bill field, so the result, the quotes and the design agree. */
  const price = byBill ? (Number.isFinite(billPrice) ? Number(rate(billPrice).replace(/,/g, '')) : NaN) : fin.pricePerKwh;
  const setFin = (patch: Partial<typeof fin>) => (homeFinance.value = { ...homeFinance.value, ...patch });
  const prices = { currency: fin.currency, cost: fin.cost, pricePerKwh: price };
  const result = outcome.ok
    ? payback({
        cost: fin.cost,
        pricePerKwh: price,
        annualKwh: outcome.sizing.productionKwh,
        useKwh: outcome.sizing.annualKwh,
        ageing: AGEING[moduleTech(outcome.sizing.panel)],
      })
    : null;

  /** The design carries the payback inputs. */
  const projectFor = (s: Sizing): Project => ({
    ...projectFromSizing(s, t.needs.projectName(cityName(s.city, locale))),
    finance: { currency: fin.currency, cost: fin.cost, pricePerKwh: price, useKwh: s.annualKwh },
  });

  const shareFor = (s: Sizing) => `${location.origin}${location.pathname}#p=${encodeProject(projectFor(s))}`;

  const [confirming, setConfirming] = useState(false);
  useEffect(() => setConfirming(false), [n]);

  const go = (s: Sizing, replace = false) => {
    const next = projectFor(s);
    const current = project.value;
    if (!replace && hasWork(current) && encodeProject(current) !== encodeProject(next)) {
      setConfirming(true);
      return;
    }
    setConfirming(false);
    openProject(next);
    step.value = 3;
    // A message about the replaced project (a share link's Replace/Keep question included) no longer applies.
    notice.value = null;
    onContinue();
  };

  const quote = (s: Sizing) =>
    whatsappLink(
      t.quote.needsMessage({
        city: cityName(s.city, locale),
        monthly: ltr(`${fmt(n.monthlyKwh)} kWh`),
        kwp: ltr(`${fmt(s.kwp, 2)} kWp`),
        panels: ltr(`${s.panelCount} × Peimar ${s.panel.model}`),
        inverter: ltr(`${s.inverterCount} × Peimar ${s.inverter.model}`),
        battery: batteryText(s) ? ltr(`${batteryText(s)} (${fmtMax(s.battery!.totalKwh)} kWh)`) : null,
        payback: paybackLines(t, result, prices, byBill ? fin.bill : null),
        link: shareFor(s),
      }),
    );

  const noFitText = (o: Extract<SizingOutcome, { ok: false }>) => {
    const target = unit(fmt(o.targetKwp ?? 0, 2), 'kWp');
    const load = unit(fmtMax(n.backupKw), 'kW');
    if (o.limit === 'backupLoad' && o.maxLoadKw !== undefined) return t.needs.noFitBackupLoad(load, unit(fmt(o.maxLoadKw), 'kW'));
    if (o.limit === 'backupPv') return t.needs.noFitBackupPv(target, load);
    if (o.limit === 'small' && o.minKwp !== undefined) return t.needs.noFitSmall(unit(fmt(o.minKwp, 2), 'kWp'));
    if (o.limit === 'large' && o.maxKwp !== undefined) return t.needs.noFitLarge(unit(fmt(o.maxKwp, 0), 'kWp'));
    return t.needs.noFit(target);
  };

  const phases: Phase[] = ['single_phase', 'three_phase'];

  return (
    <div class="dz-step-view dz-needs">
      <header class="dz-head">
        <p class="dz-head__no eyebrow" aria-hidden="true">
          <span>{t.landing.eyebrow}</span>
        </p>
        <h2 class="h2 dz-head__title" id="dz-step-title" tabIndex={-1}>
          {t.needs.title}
        </h2>
        <p class="dz-head__intro">{t.needs.intro}</p>
      </header>

      <div class="dz-needs__grid">
        <form class="dz-needs__form" onSubmit={(e) => e.preventDefault()} noValidate>
          <Field id="dz-n-city" label={t.needs.city} required>
            <select
              id="dz-n-city"
              class="select"
              value={n.cityId}
              onChange={(e) => (needs.value = { ...needs.value, cityId: e.currentTarget.value })}
            >
              <option value="">{t.needs.chooseCity}</option>
              {cities.map((x) => (
                <option key={x.id} value={x.id}>
                  {cityName(x, locale)}
                </option>
              ))}
            </select>
          </Field>
          <NumberField
            id="dz-n-monthly"
            k="monthlyKwh"
            label={t.needs.monthly}
            unit={t.needs.monthlyUnit}
            help={t.needs.monthlyHelp}
            error={monthlyErr}
            onUnparsed={flag('monthlyKwh')}
          />
          <NumberField id="dz-n-grid" k="gridHours" label={t.needs.gridHours} unit={t.needs.gridUnit} help={t.needs.gridHelp} error={gridErr} onUnparsed={flag('gridHours')} />
          <div class="dz-grid dz-grid--tight">
            <NumberField id="dz-n-kw" k="backupKw" label={t.needs.backupKw} unit="kW" help={t.needs.backupKwHelp} error={kwErr} onUnparsed={flag('backupKw')} />
            <NumberField
              id="dz-n-hours"
              k="backupHours"
              label={t.needs.backupHours}
              unit={t.needs.hoursUnit}
              help={t.needs.backupHoursHelp}
              error={backupHoursErr}
              onUnparsed={flag('backupHours')}
            />
          </div>
          <fieldset class="dz-seg">
            <legend class="field__label">{t.needs.phase}</legend>
            <div class="dz-seg__options">
              {phases.map((ph) => (
                <label class={`dz-seg__opt${n.phase === ph ? ' is-on' : ''}`} key={ph}>
                  <input
                    type="radio"
                    name="dz-phase"
                    value={ph}
                    checked={n.phase === ph}
                    onChange={() => (needs.value = { ...needs.value, phase: ph })}
                  />
                  {t.inverter.phases[ph]}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset class="dz-fin-group">
            <legend class="dz-fin-group__title">
              {t.payback.title} <span class="dz-fin-group__opt">({t.payback.optional})</span>
            </legend>
            <p class="dz-help dz-fin-group__intro">{t.payback.intro}</p>
            <FinanceFields
              id="dz-n-pb"
              value={fin}
              onChange={setFin}
              bill={{ basis: fin.basis, value: fin.bill, monthlyKwh: n.monthlyKwh, onBasis: (basis) => setFin({ basis }), onValue: (bill) => setFin({ bill }) }}
            />
          </fieldset>
        </form>

        <section class="dz-needs__result theme-dark" aria-live="polite" aria-labelledby="dz-n-result">
          <p class="eyebrow eyebrow--dot" id="dz-n-result">
            {t.needs.eyebrow}
          </p>
          {!outcome.ok && outcome.reason === 'input' && <p class="dz-needs__empty">{city && monthlyErr === null ? t.needs.fixField : t.needs.empty}</p>}
          {!outcome.ok && outcome.reason === 'noFit' && <p class="dz-needs__empty">{noFitText(outcome)}</p>}
          {outcome.ok && (
            <SizingView
              s={outcome.sizing}
              n={n}
              onContinue={() => go(outcome.sizing)}
              confirm={confirming ? { name: projectName(project.value, t), onReplace: () => go(outcome.sizing, true), onKeep: () => setConfirming(false) } : null}
              quoteHref={() => quote(outcome.sizing)}
              units={c.units}
            >
              {result ? (
                <PaybackView r={result} cost={fin.cost} currency={fin.currency} tech={moduleTech(outcome.sizing.panel)} useKwh={outcome.sizing.annualKwh} />
              ) : (
                <p class="dz-sizing__pbhint small">{t.payback.hint}</p>
              )}
            </SizingView>
          )}
          {city && <p class="dz-needs__source small">{t.energy.source}</p>}
        </section>
      </div>
    </div>
  );
}

type Confirm = { name: string; onReplace: () => void; onKeep: () => void };

type SizingProps = { s: Sizing; n: Needs; onContinue: () => void; confirm: Confirm | null; quoteHref: () => string; units: CommonStrings['units']; children: ComponentChildren };

function SizingView({ s, n, onContinue, confirm, quoteHref, units, children }: SizingProps) {
  const { t, locale } = useI18n();
  const replaceBtn = useRef<HTMLButtonElement>(null);
  const continueBtn = useRef<HTMLButtonElement>(null);
  const wasConfirming = useRef(false);
  useEffect(() => {
    if (confirm) replaceBtn.current?.focus();
    else if (wasConfirming.current) continueBtn.current?.focus();
    wasConfirming.current = !!confirm;
  }, [!!confirm]);
  const city = cityName(s.city, locale);
  const coverage = s.productionKwh / s.annualKwh;
  const bat = batteryText(s);
  /** Outage hours as the sentence shows them; the sentence compares the shown figures, so it never reads "off 0 hours". */
  const off = tenth(s.outageHours ?? 0);
  const coef = s.panel.ctPmax ?? 0;

  return (
    <div class="dz-sizing">
      <p class="dz-sizing__label">{t.needs.kwpLabel}</p>
      <p class="dz-sizing__kwp">
        <Num v={fmt(s.kwp, 2)} u="kWp" />
      </p>
      <p class="dz-sizing__formula">
        {t.needs.formula(
          <Num v={fmt(s.annualKwh)} u="kWh" />,
          <Num v={fmt(s.city.yieldAnnual)} u="kWh/kWp" />,
          city,
          <Num v={fmt(s.targetKwp, 2)} u="kWp" />,
        )}
      </p>

      <dl class="dz-sizing__rows">
        <div>
          <dt>{t.needs.module}</dt>
          <dd>
            <span class="mono dz-sizing__code" dir="ltr">
              {s.panelCount} × {s.panel.model}
            </span>
            <span class="dz-sizing__note">
              <span class="num" dir="ltr">
                {fmt(s.panel.power)} W · {fmt((s.panel.efficiency ?? 0) * 100, 2)} %
              </span>
            </span>
          </dd>
        </div>
        <div>
          <dt>{t.needs.inverter}</dt>
          <dd>
            <span class="mono dz-sizing__code" dir="ltr">
              {s.inverterCount} × {s.inverter.model}
            </span>
            <span class="dz-sizing__note">
              {t.needs.inverterNote(t.inverter.phases[s.inverter.phase], unit(kwRating(s.inverter.pnomAc), 'kW'), unit(pct(s.ratio, 1), '%'))}
            </span>
          </dd>
        </div>
        <div>
          <dt>{t.needs.strings}</dt>
          <dd>
            <span class="num dz-sizing__code" dir="ltr">
              {layoutText(s)}
            </span>
            <span class="dz-sizing__note">{t.needs.stringsOk(unit(fmt(s.city.design.tmin), '°C'), unit(fmt(s.city.design.tmax), '°C'), city)}</span>
          </dd>
        </div>
        <div>
          <dt>{t.needs.battery}</dt>
          <dd>
            {s.battery ? (
              <>
                {s.battery.items.length > 0 && (
                  <span class="mono dz-sizing__code dz-sizing__parts" dir="ltr">
                    {s.battery.items.map((i, k) => (
                      <span key={i.name}>
                        {k > 0 && ' + '}
                        <span class="dz-nowrap">{i.qty > 1 ? `${i.qty} × ${i.name}` : i.name}</span>
                      </span>
                    ))}
                  </span>
                )}
                <span class="dz-sizing__note">
                  {bat
                    ? t.needs.batteryNote(unit(fmtMax(s.battery.totalKwh), 'kWh'), unit(fmtMax(s.battery.neededKwh), 'kWh'), ltr(`${fmtMax(n.backupKw)} kW × ${fmtMax(n.backupHours)} h ÷ 0.9`))
                    : t.needs.batteryUnknown}
                  {s.battery.overMax ? ` ${t.needs.batteryOver}` : ''}
                </span>
                {off > 0 && (
                  <span class="dz-sizing__note">
                    {tenth(n.backupHours) >= off
                      ? t.needs.outageCovered(off, unit(fmtMax(n.backupKw), 'kW'))
                      : t.needs.outage(off, tenth(n.backupHours), unit(fmtMax(n.backupKw), 'kW'))}
                  </span>
                )}
              </>
            ) : (
              <span class="dz-sizing__note">{t.needs.noBattery}</span>
            )}
          </dd>
        </div>
        <div>
          <dt>{t.needs.production}</dt>
          <dd>
            <span class="dz-sizing__code">
              <Num v={fmt(s.productionKwh)} u="kWh" />
            </span>
            <span class="dz-sizing__note">{t.needs.coverage(unit(fmt(coverage * 100), '%'))}</span>
          </dd>
        </div>
        {s.areaM2 > 0 && (
          <div>
            <dt>{t.needs.area}</dt>
            <dd>
              <span class="dz-sizing__code">
                <Num v={fmt(s.areaM2)} u="m²" />
              </span>
              <span class="dz-sizing__note">
                <span class="num">{s.panelCount}</span> {units.panelsCount(s.panelCount)}
              </span>
            </dd>
          </div>
        )}
      </dl>

      <div class="dz-sizing__pb">{children}</div>

      <div class="dz-sizing__why">
        <p class="dz-sizing__why-title">{t.needs.why}</p>
        <p class="small">{t.needs.whyText(ltr(fmt((s.panel.efficiency ?? 0) * 100, 2)), ltr(fmt(coef, 2)))}</p>
      </div>

      <p class="dz-sizing__disclaimer small">{t.needs.disclaimer}</p>

      {confirm && (
        <div class="dz-confirm dz-confirm--replace" role="group" aria-labelledby="dz-replace-text">
          <p class="small" id="dz-replace-text">
            {t.needs.replaceText(confirm.name)}
          </p>
          <div class="dz-confirm__btns">
            <button type="button" class="btn btn--sun" ref={replaceBtn} onClick={confirm.onReplace}>
              {t.needs.replace}
            </button>
            <button type="button" class="btn btn--ghost-inv" onClick={confirm.onKeep}>
              {t.needs.keepCurrent}
            </button>
          </div>
        </div>
      )}

      <div class="dz-sizing__actions" hidden={!!confirm}>
        <button type="button" class="btn btn--sun" ref={continueBtn} onClick={onContinue}>
          {t.needs.continue}
          <Icon name="arrow" dir />
        </button>
        <a
          class="btn btn--line"
          href={whatsappLink('')}
          target="_blank"
          rel="noopener"
          onClick={(e) => {
            e.currentTarget.href = quoteHref();
          }}
        >
          {t.actions.quote}
        </a>
      </div>
    </div>
  );
}

