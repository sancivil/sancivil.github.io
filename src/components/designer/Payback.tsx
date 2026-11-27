import { useState } from 'preact/hooks';
import type { DesignerStrings } from '../../i18n/designer.ts';
import type { ProjectSummary } from '../../lib/designer/calc.ts';
import { fmt, fmtMax, ltr, unit } from '../../lib/designer/format.ts';
import {
  AGEING,
  CURRENCIES,
  MAX_AMOUNT,
  PAYBACK_YEARS,
  amount,
  amountOk,
  designTech,
  money,
  payback,
  perKwh,
  priceFromBill,
  yearsMonths,
  type Payback,
  type Tech,
} from '../../lib/designer/payback.ts';
import type { Currency, Finance, Project } from '../../lib/designer/types.ts';
import { niceMax } from './EnergyChart.tsx';
import { useI18n, type HomeFinance } from './store.ts';
import { Field, Num, NumberInput, describedBy, useTouched } from './ui.tsx';

type Prices = Pick<Finance, 'currency' | 'cost' | 'pricePerKwh'>;

/** Payback of a Designer project: its own cost and price, the energy estimate and the steepest module ageing line. */
export function projectPayback(p: Project, s: ProjectSummary, annualKwh: number | null) {
  const tech = designTech(s.subArrays.flatMap((x) => (x.panel ? [x.panel] : [])));
  const useKwh = p.finance.useKwh > 0 ? p.finance.useKwh : undefined;
  const r = annualKwh ? payback({ cost: p.finance.cost, pricePerKwh: p.finance.pricePerKwh, annualKwh, useKwh, ageing: AGEING[tech] }) : null;
  return { r, tech, useKwh };
}

const durationText = (t: DesignerStrings, months: number | null) => {
  if (months === null) return t.payback.over(PAYBACK_YEARS);
  const d = yearsMonths(months);
  return t.payback.duration(d.years, d.months, String).join('');
};

/** Lines for the WhatsApp and email quote; empty until the payback can be computed. */
export function paybackLines(t: DesignerStrings, r: Payback | null, f: Prices, bill: number | null): string[] {
  if (!r) return [];
  return t.payback.quote({
    cost: ltr(money(f.cost, f.currency)),
    price: ltr(perKwh(f.pricePerKwh, f.currency)),
    bill: bill === null ? null : ltr(money(bill, f.currency)),
    time: durationText(t, r.months),
    yearly: ltr(money(r.yearly, f.currency)),
  });
}

function Seg<V extends string>({ name, legend, options, value, onChange }: { name: string; legend: string; options: [V, string][]; value: V; onChange: (v: V) => void }) {
  return (
    <fieldset class="dz-seg">
      <legend class="field__label">{legend}</legend>
      <div class="dz-seg__options">
        {options.map(([v, label]) => (
          <label class={`dz-seg__opt${value === v ? ' is-on' : ''}`} key={v}>
            <input type="radio" name={name} value={v} checked={value === v} onChange={() => onChange(v)} />
            {label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function amountError(t: DesignerStrings, value: number, unparsed: boolean): string | null {
  if (unparsed) return t.payback.errNumber;
  if (Number.isNaN(value) || amountOk(value)) return null;
  return value > MAX_AMOUNT ? t.payback.errLarge(fmt(MAX_AMOUNT)) : t.payback.errAmount;
}

function AmountField({ id, label, unit: u, help, value, onValue }: { id: string; label: string; unit: string; help: string; value: number; onValue: (v: number) => void }) {
  const { t } = useI18n();
  const [touched, touch] = useTouched();
  const [unparsed, setUnparsed] = useState(false);
  const error = touched ? amountError(t, value, unparsed) : null;
  return (
    <Field id={id} label={label} help={help} error={error}>
      <NumberInput
        id={id}
        value={value}
        unit={u}
        invalid={!!error}
        describedBy={describedBy(id, help, error)}
        onBlur={touch}
        onUnparsed={setUnparsed}
        onValue={onValue}
      />
    </Field>
  );
}

type BillInput = { basis: HomeFinance['basis']; value: number; monthlyKwh: number; onBasis: (b: HomeFinance['basis']) => void; onValue: (v: number) => void };

/** Currency, project cost and electricity price; with `bill` (needs path) the monthly bill can replace the price per kWh. */
export function FinanceFields({ id, value, onChange, bill }: { id: string; value: Prices; onChange: (patch: Partial<Prices>) => void; bill?: BillInput }) {
  const { t } = useI18n();
  const cur = value.currency;
  const derived = bill ? priceFromBill(bill.value, bill.monthlyKwh) : NaN;
  const billHelp = !bill || !(bill.monthlyKwh > 0) ? t.payback.billNeedsMonthly : Number.isFinite(derived) ? t.payback.billPrice(ltr(perKwh(derived, cur))) : t.payback.billHelp;
  return (
    <div class="dz-fin">
      <Seg
        name={`${id}-currency`}
        legend={t.payback.currency}
        options={CURRENCIES.map((c): [Currency, string] => [c, c])}
        value={cur}
        onChange={(currency) => onChange({ currency })}
      />
      <AmountField id={`${id}-cost`} label={t.payback.cost} unit={cur} help={t.payback.costHelp} value={value.cost} onValue={(cost) => onChange({ cost })} />
      {bill && (
        <Seg
          name={`${id}-basis`}
          legend={t.payback.basis}
          options={[
            ['kwh', t.payback.basisKwh],
            ['bill', t.payback.basisBill],
          ]}
          value={bill.basis}
          onChange={bill.onBasis}
        />
      )}
      {bill?.basis === 'bill' ? (
        <AmountField key="bill" id={`${id}-bill`} label={t.payback.bill} unit={t.payback.billUnit(cur)} help={billHelp} value={bill.value} onValue={bill.onValue} />
      ) : (
        <AmountField
          key="price"
          id={`${id}-price`}
          label={t.payback.price}
          unit={`${cur}/kWh`}
          help={t.payback.priceHelp}
          value={value.pricePerKwh}
          onValue={(pricePerKwh) => onChange({ pricePerKwh })}
        />
      )}
    </div>
  );
}

const TICKS = [0, 5, 10, 15, 20, 25];

/** Savings so far against the project cost, year 0 to 25. Always left to right; labels stay in HTML. */
function PaybackChart({ r, cost, currency }: { r: Payback; cost: number; currency: Currency }) {
  const { t, rtl } = useI18n();
  const [hover, setHover] = useState<number | null>(null);
  const top = niceMax(Math.max(r.total, cost));
  const x = (year: number) => (year / PAYBACK_YEARS) * 100;
  const h = (v: number) => (v / top) * 100;
  const points = r.cumulative.map((v, i) => `${x(i)},${100 - h(v)}`).join(' ');
  const dir = rtl ? 'rtl' : 'ltr';
  // After an early crossing the curve runs above the cost line, so its label moves below the line, on the right.
  const below = r.crossing !== null && r.crossing < PAYBACK_YEARS / 2 && h(cost) >= 18;
  const probe = (e: PointerEvent) => {
    const box = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const year = Math.round(((e.clientX - box.left) / box.width) * PAYBACK_YEARS);
    setHover(Math.min(PAYBACK_YEARS, Math.max(1, year)));
  };
  return (
    <figure class="dz-pbchart" dir="ltr">
      <div class="dz-pbchart__plot" onPointerMove={probe} onPointerDown={probe} onPointerLeave={() => setHover(null)}>
        <svg
          class="dz-pbchart__svg"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          role="img"
          aria-label={t.payback.chart(ltr(money(cost, currency)), r.breakEvenYear, ltr(money(r.total, currency)), PAYBACK_YEARS)}
        >
          <line class="dz-pbchart__grid" x1="0" x2="100" y1="50" y2="50" vector-effect="non-scaling-stroke" />
          <line class="dz-pbchart__cost" x1="0" x2="100" y1={100 - h(cost)} y2={100 - h(cost)} vector-effect="non-scaling-stroke" />
          <polyline class="dz-pbchart__line" points={points} vector-effect="non-scaling-stroke" />
          <line class="dz-pbchart__base" x1="0" x2="100" y1="100" y2="100" vector-effect="non-scaling-stroke" />
        </svg>
        <span class={`dz-pbchart__tag dz-pbchart__tag--cost${below ? ' is-below' : ''}`} style={{ bottom: `${h(cost)}%` }} aria-hidden="true">
          <span dir={dir}>
            {t.payback.costLine} <span class="num">{ltr(money(cost, currency))}</span>
          </span>
        </span>
        <span class="dz-pbchart__tag dz-pbchart__tag--end num" style={{ bottom: `${h(r.total)}%` }} aria-hidden="true">
          {money(r.total, currency)}
        </span>
        {r.crossing !== null && <span class="dz-pbchart__dot" style={{ left: `${x(r.crossing)}%`, bottom: `${h(cost)}%` }} aria-hidden="true" />}
        {hover !== null && (
          <>
            <span class="dz-pbchart__cross" style={{ left: `${x(hover)}%` }} aria-hidden="true" />
            <span class="dz-pbchart__probe" style={{ left: `${x(hover)}%`, bottom: `${h(r.cumulative[hover])}%` }} aria-hidden="true" />
            <span class={`dz-pbchart__tip${hover > PAYBACK_YEARS / 2 ? ' is-end' : ''}`} style={{ left: `${x(hover)}%` }} aria-hidden="true">
              <span dir={dir}>{t.payback.tip(hover, ltr(money(r.cumulative[hover], currency)))}</span>
            </span>
          </>
        )}
      </div>
      <div class="dz-pbchart__years num" aria-hidden="true">
        {TICKS.map((year) => (
          <span key={year} style={{ left: `${x(year)}%` }}>
            {year}
          </span>
        ))}
      </div>
      <p class="dz-pbchart__axis" aria-hidden="true">
        <span dir={dir}>{t.payback.axisYear}</span>
      </p>
    </figure>
  );
}

/** Payback time, savings and the cumulative chart; labelled as an estimate with its assumptions. */
export function PaybackView({ r, cost, currency, tech, useKwh }: { r: Payback; cost: number; currency: Currency; tech: Tech; useKwh?: number }) {
  const { t } = useI18n();
  const time = r.months === null ? null : yearsMonths(r.months);
  const share = (v: number) => unit(fmtMax(v * 100, 2), '%');
  const ageing = AGEING[tech];
  return (
    <div class="dz-pb">
      <p class="dz-pb__label">{t.payback.label}</p>
      <p class="dz-pb__time">
        {time
          ? t.payback.duration(time.years, time.months, (v) => v).map((part, i) =>
              typeof part === 'number' ? (
                <span class="num" key={i}>
                  {part}
                </span>
              ) : (
                <span class="dz-pb__word" key={i}>
                  {part}
                </span>
              ),
            )
          : t.payback.over(PAYBACK_YEARS)}
      </p>
      <dl class="dz-pb__figs">
        <div>
          <dt>{t.payback.yearly}</dt>
          <dd>
            <Num v={amount(r.yearly, currency)} u={currency} />
          </dd>
        </div>
        <div>
          <dt>{t.payback.monthly}</dt>
          <dd>
            <Num v={amount(r.monthly, currency)} u={currency} />
          </dd>
        </div>
        <div>
          <dt>{t.payback.total(PAYBACK_YEARS)}</dt>
          <dd>
            <Num v={amount(r.total, currency)} u={currency} />
          </dd>
        </div>
      </dl>
      <PaybackChart r={r} cost={cost} currency={currency} />
      {useKwh !== undefined && <p class="dz-pb__note small">{t.payback.capped(unit(fmt(useKwh), 'kWh'))}</p>}
      <p class="dz-pb__note small">{t.payback.note(t.payback.tech[tech], share(ageing.firstYear), share(ageing.perYear))}</p>
    </div>
  );
}
