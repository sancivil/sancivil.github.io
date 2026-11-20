import { useMemo } from 'preact/hooks';
import { whatsappLink } from '../../data/site.ts';
import { batteries, cities, inverters, panels } from '../../lib/designer/data.ts';
import { fmt, fmtMax, kwRating, ltr, pct, unit } from '../../lib/designer/format.ts';
import { encodeProject } from '../../lib/designer/share.ts';
import { projectFromSizing, sizeFromNeeds, type Needs, type Sizing } from '../../lib/designer/sizing.ts';
import type { Phase } from '../../lib/designer/types.ts';
import { cityName, needs, project, step, mode, useI18n } from './store.ts';
import { Field, Icon, Num, NumberInput, describedBy, useTouched } from './ui.tsx';

const sizingData = { panels, inverters, cities, batteries };

function NumberField({ id, k, label, unit, help, error, integer }: { id: string; k: keyof Omit<Needs, 'cityId' | 'phase'>; label: string; unit: string; help: string; error: string | null; integer?: boolean }) {
  const [touched, touch] = useTouched();
  const shown = touched ? error : null;
  return (
    <Field id={id} label={label} help={help} error={shown} required={k === 'monthlyKwh'}>
      <NumberInput
        id={id}
        value={needs.value[k]}
        unit={unit}
        integer={integer}
        invalid={!!shown}
        describedBy={describedBy(id, help, shown)}
        onBlur={touch}
        onValue={(v) => (needs.value = { ...needs.value, [k]: v })}
      />
    </Field>
  );
}

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
  const outcome = useMemo(() => sizeFromNeeds(n, sizingData), [n]);
  const city = cities.find((x) => x.id === n.cityId) ?? null;

  const hoursErr = (v: number) => (Number.isNaN(v) || (v >= 0 && v <= 24) ? null : t.needs.errHours);
  const kwErr = Number.isNaN(n.backupKw) || (n.backupKw >= 0 && n.backupKw <= 500) ? null : t.needs.errKw;
  const monthlyErr = n.monthlyKwh > 0 && n.monthlyKwh <= 200000 ? null : t.needs.errMonthly;

  const shareFor = (s: Sizing) => {
    const p = projectFromSizing(s, t.needs.projectName(cityName(s.city, locale)));
    return `${location.origin}${location.pathname}#p=${encodeProject(p)}`;
  };

  const go = (s: Sizing) => {
    project.value = projectFromSizing(s, t.needs.projectName(cityName(s.city, locale)));
    mode.value = 'design';
    step.value = 3;
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
        link: shareFor(s),
      }),
    );

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
          <NumberField id="dz-n-monthly" k="monthlyKwh" label={t.needs.monthly} unit={t.needs.monthlyUnit} help={t.needs.monthlyHelp} error={monthlyErr} />
          <NumberField id="dz-n-grid" k="gridHours" label={t.needs.gridHours} unit={t.needs.gridUnit} help={t.needs.gridHelp} error={hoursErr(n.gridHours)} />
          <div class="dz-grid dz-grid--tight">
            <NumberField id="dz-n-kw" k="backupKw" label={t.needs.backupKw} unit="kW" help={t.needs.backupKwHelp} error={kwErr} />
            <NumberField id="dz-n-hours" k="backupHours" label={t.needs.backupHours} unit={t.needs.hoursUnit} help={t.needs.backupHoursHelp} error={hoursErr(n.backupHours)} />
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
        </form>

        <section class="dz-needs__result theme-dark" aria-live="polite" aria-labelledby="dz-n-result">
          <p class="eyebrow eyebrow--dot" id="dz-n-result">
            {t.needs.eyebrow}
          </p>
          {!outcome.ok && outcome.reason === 'input' && <p class="dz-needs__empty">{t.needs.empty}</p>}
          {!outcome.ok && outcome.reason === 'noFit' && (
            <p class="dz-needs__empty">{t.needs.noFit(unit(fmt(outcome.targetKwp ?? 0, 2), 'kWp'))}</p>
          )}
          {outcome.ok && (
            <SizingView
              s={outcome.sizing}
              n={n}
              onContinue={() => go(outcome.sizing)}
              quoteHref={() => quote(outcome.sizing)}
              units={c.units}
            />
          )}
          {city && <p class="dz-needs__source small">{t.energy.source}</p>}
        </section>
      </div>
    </div>
  );
}

function SizingView({ s, n, onContinue, quoteHref, units }: { s: Sizing; n: Needs; onContinue: () => void; quoteHref: () => string; units: { panels: string; inverters: string } }) {
  const { t, locale } = useI18n();
  const city = cityName(s.city, locale);
  const coverage = s.productionKwh / s.annualKwh;
  const bat = batteryText(s);
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
                {s.outageHours !== null && (
                  <span class="dz-sizing__note">{t.needs.outage(ltr(fmtMax(s.outageHours)), ltr(fmtMax(n.backupHours)), unit(fmtMax(n.backupKw), 'kW'))}</span>
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
                <span class="num">{s.panelCount}</span> {units.panels}
              </span>
            </dd>
          </div>
        )}
      </dl>

      <div class="dz-sizing__why">
        <p class="dz-sizing__why-title">{t.needs.why}</p>
        <p class="small">{t.needs.whyText(ltr(fmt((s.panel.efficiency ?? 0) * 100, 2)), ltr(fmt(coef, 2)))}</p>
      </div>

      <p class="dz-sizing__disclaimer small">{t.needs.disclaimer}</p>

      <div class="dz-sizing__actions">
        <button type="button" class="btn btn--sun" onClick={onContinue}>
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

