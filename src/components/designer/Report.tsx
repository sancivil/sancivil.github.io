import { energyEstimate, moduleAt, tempsValid, type ProjectSummary } from '../../lib/designer/calc.ts';
import { cities } from '../../lib/designer/data.ts';
import { fmt, iraqDate, kw, ltr, pct, unit } from '../../lib/designer/format.ts';
import type { City, Project } from '../../lib/designer/types.ts';
import { contact, localAddress, whatsappLink } from '../../data/site.ts';
import type { DesignerStrings } from '../../i18n/designer.ts';
import type { Locale } from '../../i18n/config.ts';
import { EnergyChart } from './EnergyChart.tsx';
import { CheckTable } from './Matrix.tsx';
import { stringing } from './StepInverter.tsx';
import { Wordmark } from './Wordmark.tsx';
import { configLabel, groupName, panelLabel } from './labels.ts';
import { FinanceFields, PaybackView, paybackLines, projectPayback } from './Payback.tsx';
import { cityName, project, summary, update, useI18n } from './store.ts';
import { Dot, Icon, Num } from './ui.tsx';
import { RatioGauge, StringDiagram, VoltageRuler, useTween } from './Visuals.tsx';

const today = () => iraqDate(new Date());

export function facing(city: City, t: DesignerStrings): string {
  const a = city.optimalAzimuth;
  return a === 0 ? t.energy.south : a > 0 ? t.energy.west(a) : t.energy.east(-a);
}

export function estimateFor(s: ProjectSummary, city: City | null) {
  const w = s.connectedW > 0 ? s.connectedW : s.installedW;
  return city && w > 0 ? energyEstimate(w / 1000, city.yieldMonthly, city.yieldAnnual) : null;
}

function components(s: ProjectSummary, t: DesignerStrings) {
  const rows = new Map<string, { brand: string; model: string; qty: number }>();
  for (const x of s.subArrays) {
    if (!x.panel || !(x.subArray.count > 0)) continue;
    const key = `p:${x.panel.id}`;
    const row = rows.get(key) ?? { brand: x.panel.custom ? t.custom.brand : 'Peimar', model: panelLabel(x.panel), qty: 0 };
    row.qty += x.subArray.count;
    rows.set(key, row);
  }
  for (const b of s.blocks) {
    if (!b.inv) continue;
    const key = `i:${b.inv.id}`;
    const row = rows.get(key) ?? { brand: 'Peimar', model: b.inv.model, qty: 0 };
    row.qty += b.count;
    rows.set(key, row);
  }
  return [...rows.values()];
}

export function quoteText(p: Project, s: ProjectSummary, t: DesignerStrings, locale: Locale, link: string): string {
  const city = cities.find((c) => c.id === p.cityId) ?? null;
  const est = estimateFor(s, city);
  const { r } = projectPayback(p, s, est ? est.annual : null);
  return t.quote.message({
    project: p.name || t.rail.untitled,
    city: city ? cityName(city, locale) : '–',
    panels: s.subArrays
      .filter((x) => x.panel && x.subArray.count > 0)
      .map((x) => ltr(`${x.subArray.count} × ${x.panel!.custom ? '' : 'Peimar '}${panelLabel(x.panel!)} (${kw(x.installedW)} kWp)`)),
    inverters: s.blocks.filter((b) => b.inv).map((b) => ltr(`${b.count} × Peimar ${b.inv!.model}, ${stringing(b)}`)),
    yearly: est ? unit(fmt(est.annual), 'kWh') : null,
    payback: paybackLines(t, r, p.finance, null),
    link,
  });
}

export function QuoteBox({ link }: { link: () => string }) {
  const { t, locale } = useI18n();
  const p = project.value;
  const message = () => quoteText(p, summary.value, t, locale, link());
  const subject = t.quote.subject(p.name || t.rail.untitled);
  return (
    <section class="dz-quote theme-dark dz-screen-only" id="dz-quote" aria-labelledby="dz-quote-title">
      <div>
        <p class="eyebrow eyebrow--dot">Faraday</p>
        <h3 class="h3" id="dz-quote-title">
          {t.actions.quote}
        </h3>
        <p class="dz-quote__text">{t.quote.text}</p>
      </div>
      <div class="dz-quote__actions">
        <a
          class="btn btn--sun"
          href={whatsappLink('')}
          target="_blank"
          rel="noopener"
          onClick={(e) => {
            e.currentTarget.href = whatsappLink(message());
          }}
        >
          {t.quote.whatsapp}
          <Icon name="arrow" dir />
        </a>
        <a
          class="btn btn--line"
          href={`mailto:${contact.email}`}
          onClick={(e) => {
            e.currentTarget.href = `mailto:${contact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message())}`;
          }}
        >
          {t.quote.email}
        </a>
        <p class="dz-quote__mail small">
          {t.quote.orEmail}{' '}
          <span class="mono" dir="ltr">
            {contact.email}
          </span>
        </p>
      </div>
    </section>
  );
}

function Kpi({ label, v, u }: { label: string; v: string; u?: string }) {
  return (
    <div class="dz-kpi">
      <dt>{label}</dt>
      <dd>
        <Num v={v} u={u} />
      </dd>
    </div>
  );
}

/** Key figures of the design; they count to their values on screen and print as final values. */
function Dashboard({ s, est, still }: { s: ProjectSummary; est: ReturnType<typeof estimateFor>; still: boolean }) {
  const { t } = useI18n();
  const connected = s.connectedW > 0;
  const kwp = useTween(s.installedW / 1000, 900, still);
  const kwh = useTween(est ? est.annual : NaN, 1100, still);
  const ratio = useTween(connected ? s.ratio : NaN, 1100, still);
  const fed = s.blocks.filter((b) => b.inv && b.pvW > 0).map((b) => b.inv!);
  const same = fed.length > 0 && fed.every((i) => i.percPmaxCc === fed[0].percPmaxCc && i.percPminCc === fed[0].percPminCc);
  const range: [number, number] | null = same ? [fed[0].percPmaxCc, fed[0].percPminCc] : null;
  const tone = connected ? (s.blocks.every((b) => b.tone !== 'amber') ? 'green' : 'amber') : null;
  return (
    <div class="dz-dash">
      <div class="dz-dash__tile dz-dash__tile--peak">
        <p class="dz-dash__label">{t.summary.peak}</p>
        <p class="dz-dash__fig">
          <Num v={fmt(kwp, 2)} u="kWp" />
        </p>
      </div>
      <div class="dz-dash__tile">
        <p class="dz-dash__label">{t.dash.yearly}</p>
        <p class="dz-dash__fig">
          <Num v={est ? fmt(kwh) : '–'} u="kWh" />
        </p>
      </div>
      <div class="dz-dash__tile dz-dash__tile--ratio">
        <p class="dz-dash__label">
          {tone && <Dot tone={tone} />}
          {t.summary.ratio}
        </p>
        <div class="dz-dash__gauge">
          <RatioGauge ratio={connected ? s.ratio : NaN} range={range} tone={tone} still={still} />
          <p class="dz-dash__fig">
            <Num v={connected ? fmt(ratio * 100, 2) : '–'} u="%" />
          </p>
        </div>
        {range && <p class="dz-dash__note">{t.dash.range(unit(`${pct(range[0], 0)}–${pct(range[1], 0)}`, '%'))}</p>}
      </div>
      <dl class="dz-dash__counts">
        <Kpi label={t.summary.panels} v={fmt(s.panelsTotal)} />
        <Kpi label={t.summary.inverters} v={fmt(s.invertersTotal)} />
        <Kpi label={t.summary.ac} v={kw(s.acW)} u="kW" />
      </dl>
    </div>
  );
}

/** Cost and price inputs on screen; the result prints with the report once both are entered. */
function PaybackSection({ s, est, printOnly }: { s: ProjectSummary; est: ReturnType<typeof estimateFor>; printOnly?: boolean }) {
  const { t } = useI18n();
  const p = project.value;
  const { r, tech, useKwh } = projectPayback(p, s, est ? est.annual : null);
  if (printOnly && !r) return null;
  return (
    <section class={`dz-rsec dz-pbsec${r ? '' : ' dz-screen-only'}`}>
      <h4 class="dz-rsec__title">{t.payback.title}</h4>
      <div class="dz-pbsec__grid">
        {!printOnly && (
          <div class="dz-pbsec__inputs dz-screen-only">
            <p class="dz-pbsec__intro">{t.payback.intro}</p>
            <FinanceFields id="dz-pb" value={p.finance} onChange={(patch) => update((x) => ({ ...x, finance: { ...x.finance, ...patch } }))} />
          </div>
        )}
        {r ? (
          <PaybackView r={r} cost={p.finance.cost} currency={p.finance.currency} tech={tech} useKwh={useKwh} />
        ) : (
          <p class="dz-note dz-pbsec__hint">{est ? t.payback.hint : t.payback.noEnergy}</p>
        )}
      </div>
    </section>
  );
}

export function Report({ printOnly }: { printOnly?: boolean }) {
  const { t, locale } = useI18n();
  const p = project.value;
  const s = summary.value;
  const city = cities.find((c) => c.id === p.cityId) ?? null;
  const est = estimateFor(s, city);
  const temps = tempsValid(p.temps) ? p.temps : null;
  const rows = components(s, t);
  const months = t.months;

  return (
    <article class={`dz-report${printOnly ? ' dz-print-only' : ''}`} aria-label={t.report.title}>
      <header class="dz-report__head dz-print-block">
        <Wordmark />
        <div>
          <p class="dz-report__title">{t.report.title}</p>
          <p class="dz-report__meta mono" dir="ltr">
            {today()}
          </p>
        </div>
      </header>
      <h3 class="dz-report__project">{p.name || t.rail.untitled}</h3>

      <section class="dz-rsec">
        <h4 class="dz-rsec__title">{t.summary.general}</h4>
        <dl class="dz-deflist">
          {p.number && (
            <div>
              <dt>{t.project.number}</dt>
              <dd dir="auto">{p.number}</dd>
            </div>
          )}
          {p.client && (
            <div>
              <dt>{t.project.client}</dt>
              <dd dir="auto">{p.client}</dd>
            </div>
          )}
          {p.address && (
            <div>
              <dt>{t.project.address}</dt>
              <dd dir="auto">{p.address}</dd>
            </div>
          )}
          <div>
            <dt>{t.summary.city}</dt>
            <dd>{city ? cityName(city, locale) : t.site.custom}</dd>
          </div>
          <div>
            <dt>{t.summary.temps}</dt>
            <dd>
              <span class="num" dir="ltr">
                {temps ? `${fmt(temps.tmin)} / ${fmt(temps.tnom)} / ${fmt(temps.tmax)} °C` : '–'}
              </span>
            </dd>
          </div>
          <div>
            <dt>{t.summary.date}</dt>
            <dd>
              <span class="num" dir="ltr">
                {today()}
              </span>
            </dd>
          </div>
        </dl>
      </section>

      <section class="dz-rsec">
        <h4 class="dz-rsec__title">{t.summary.system}</h4>
        <Dashboard s={s} est={est} still={!!printOnly} />
      </section>

      <PaybackSection s={s} est={est} printOnly={printOnly} />

      <section class="dz-rsec">
        <h4 class="dz-rsec__title">{t.summary.components}</h4>
        <div class="dz-table-wrap">
          <table class="dz-table">
            <thead>
              <tr>
                <th scope="col">{t.summary.brand}</th>
                <th scope="col">{t.summary.model}</th>
                <th scope="col" class="is-num">
                  {t.summary.qty}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.model}>
                  <td>{r.brand}</td>
                  <td>
                    <span class="mono" dir="ltr">
                      {r.model}
                    </span>
                  </td>
                  <td class="is-num">
                    <span class="num">{r.qty}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section class="dz-rsec dz-energy">
        <h4 class="dz-rsec__title">{t.energy.title}</h4>
        {city && est ? (
          <>
            <dl class="dz-kpis dz-kpis--energy">
              <Kpi label={t.energy.annual} v={fmt(est.annual)} u="kWh" />
              <Kpi label={t.energy.specific} v={fmt(est.specific)} u="kWh/kWp" />
            </dl>
            <p class="dz-subtitle">{t.energy.monthly}</p>
            <EnergyChart monthly={est.monthly} labels={t.monthsShort} title={t.energy.chart(cityName(city, locale), unit(fmt(est.annual), 'kWh'))} />
            <details class="dz-details">
              <summary>
                {t.energy.table}
                <Icon name="chevron" />
              </summary>
              <div class="dz-table-wrap">
                <table class="dz-table dz-table--compact">
                  <thead>
                    <tr>
                      <th scope="col">{t.energy.month}</th>
                      <th scope="col" class="is-num">
                        kWh
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {est.monthly.map((v, i) => (
                      <tr key={i}>
                        <th scope="row">{months[i]}</th>
                        <td class="is-num">
                          <span class="num">{fmt(v)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
            <p class="dz-source small">{t.energy.assumptions(cityName(city, locale), city.optimalTilt, facing(city, t))}</p>
            <p class="dz-source small">{t.energy.source}</p>
          </>
        ) : (
          <p class="dz-note">{t.summary.noCity}</p>
        )}
      </section>

      <section class="dz-rsec">
        <h4 class="dz-rsec__title">{t.summary.pvField}</h4>
        {s.subArrays.map((x, i) => {
          if (!x.panel) return null;
          const m = temps ? moduleAt(x.panel, temps) : null;
          const name = x.subArray.name || t.panels.subArray(i + 1);
          return (
            <div class="dz-rgroup" key={x.subArray.id}>
              <p class="dz-rgroup__head">
                <span class="dz-rgroup__name">{name}</span>
                <span class="mono" dir="ltr">
                  {x.subArray.count} × {panelLabel(x.panel)} · {kw(x.installedW)} kWp
                </span>
                <span class="dz-rgroup__used">
                  {t.summary.used}{' '}
                  <span class="num" dir="ltr">
                    {x.used}/{x.subArray.count}
                  </span>
                </span>
              </p>
              <p class="dz-caption">{t.summary.stc}</p>
              <dl class="dz-stc">
                {(
                  [
                    ['Pmax', `${fmt(x.panel.power)} W`],
                    ['Voc', `${fmt(x.panel.voc, 2)} V`],
                    ['Vmp', `${fmt(x.panel.vmp, 2)} V`],
                    ['Isc', `${fmt(x.panel.isc, 2)} A`],
                    ['Imp', `${fmt(x.panel.imp, 2)} A`],
                    ['ct Pmax', x.panel.ctPmax === null ? '–' : `${fmt(x.panel.ctPmax, 2)} %/°C`],
                    ['ct Voc', `${fmt(x.panel.ctVoc, 2)} %/°C`],
                    ['ct Isc', `${fmt(x.panel.ctIsc, 3)} %/°C`],
                    ['Vmax', `${fmt(x.panel.vdcMax)} V`],
                  ] as const
                ).map(([label, v]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>
                      <span class="num" dir="ltr">
                        {v}
                      </span>
                    </dd>
                  </div>
                ))}
              </dl>
              {m && temps && (
                <div class="dz-table-wrap">
                  <table class="dz-table dz-table--compact">
                    <caption class="dz-caption">{t.summary.atTemps}</caption>
                    <thead>
                      <tr>
                        <th scope="col" />
                        {[temps.tmin, temps.tnom, temps.tmax].map((v, k) => (
                          <th scope="col" class="is-num" key={k}>
                            <span class="num" dir="ltr">
                              {fmt(v)} °C
                            </span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(
                        [
                          ['Voc', [m.vocTmin, m.vocTnom, m.vocTmax], 'V', 2],
                          ['Vmp', [m.vmpTmin, m.vmpTnom, m.vmpTmax], 'V', 2],
                          ['Imp', [m.impTmin, m.impTnom, m.impTmax], 'A', 2],
                        ] as const
                      ).map(([label, values, unit, d]) => (
                        <tr key={label}>
                          <th scope="row">{label}</th>
                          {values.map((v, k) => (
                            <td class="is-num" key={k}>
                              <span class="num" dir="ltr">
                                {fmt(v, d)} {unit}
                              </span>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </section>

      <section class="dz-rsec">
        <h4 class="dz-rsec__title">{t.summary.inverterDetail}</h4>
        {s.blocks.map((b, i) => {
          if (!b.inv) return null;
          const n = b.count;
          return (
            <div class="dz-rgroup" key={b.block.id}>
              <p class="dz-rgroup__head">
                <span class="dz-rgroup__name">{t.inverter.block(i + 1)}</span>
                <span class="mono" dir="ltr">
                  {n} × {b.inv.model}
                </span>
                <span>{configLabel(b.inv, b.block.configKey, t)}</span>
                {b.pvW > 0 && (
                  <span class="dz-ratio">
                    <Dot tone={b.tone ?? 'none'} />
                    <span class="num" dir="ltr">
                      {pct(b.ratio)} % · {kw(b.pvW)} kWp
                    </span>
                  </span>
                )}
              </p>
              <StringDiagram b={b} />
              {b.groups
                .filter((g) => g.cell)
                .map((g) => {
                  const sub = p.subArrays.findIndex((x) => x.id === g.sel.subArrayId);
                  const subName = sub >= 0 ? p.subArrays[sub].name || t.panels.subArray(sub + 1) : '';
                  return (
                    <div class="dz-rmppt" key={g.index}>
                      <p class="dz-rmppt__head">
                        <span class="mono">{groupName(g.mppts)}</span>
                        <span>{subName}</span>
                        <span class="num" dir="ltr">
                          {g.sel.strings} × {g.sel.series} · {fmt(g.cell!.power)} W
                        </span>
                      </p>
                      {temps && <VoltageRuler cell={g.cell!} temps={temps} />}
                      {temps && <CheckTable cell={g.cell!} temps={temps} />}
                    </div>
                  );
                })}
            </div>
          );
        })}
      </section>

      {p.notes.trim() && (
        <section class="dz-rsec">
          <h4 class="dz-rsec__title">{t.summary.notes}</h4>
          <p class="dz-notes" dir="auto">
            {p.notes}
          </p>
        </section>
      )}

      <footer class="dz-report__foot">
        <p class="small">{t.report.disclaimer}</p>
        <p class="small dz-print-block">
          <bdi>{contact.company}</bdi> · {localAddress(locale).street}
          {locale === 'en' ? ',' : '،'} {localAddress(locale).city} ·{' '}
          <span class="mono" dir="ltr">
            {contact.phoneDisplay}
          </span>{' '}
          ·{' '}
          <span class="mono" dir="ltr">
            {contact.email}
          </span>
        </p>
      </footer>
    </article>
  );
}
