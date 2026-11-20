import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import { MATRIX_COLS, MATRIX_ROWS, checkOp, evaluateCell, lastValidSeries, matrixBlockers, matrixStart, type Cell, type GroupContext } from '../../lib/designer/calc.ts';
import { fmt, ltr, pct, unit } from '../../lib/designer/format.ts';
import type { GroupSel, Temps } from '../../lib/designer/types.ts';
import { checkLimit, checkQty, checkSentence, checkValue } from './labels.ts';
import { useI18n } from './store.ts';
import { Icon } from './ui.tsx';
import { VoltageRuler } from './Visuals.tsx';

type Props = {
  id: string;
  name: string;
  ctx: GroupContext;
  sel: GroupSel;
  temps: Temps;
  onSelect: (series: number, strings: number) => void;
};

type Scale = { unit: 'W' | 'kW'; decimals: number };

/** One unit and precision per matrix, so cells scan as a table and fit 44px on phones: 560 W, 6.72 kW, 122.0 kW. */
function powerScale(maxW: number): Scale {
  if (maxW < 1000) return { unit: 'W', decimals: 0 };
  return { unit: 'kW', decimals: maxW < 100000 ? 2 : 1 };
}

const scaled = (w: number, s: Scale) => (s.unit === 'W' ? fmt(w) : fmt(w / 1000, s.decimals));

function windowFor(first: number, series: number): number {
  if (series <= 0) return first;
  if (series < first) return series;
  if (series > first + MATRIX_COLS - 1) return series - MATRIX_COLS + 1;
  return first;
}

export function Matrix({ id, name, ctx, sel, temps, onSelect }: Props) {
  const { t, rtl } = useI18n();
  const first = matrixStart(ctx);
  const last = lastValidSeries(ctx.mod, ctx.panel, ctx.inv) ?? first;
  const [start, setStart] = useState(() => windowFor(first, sel.series));
  const [focus, setFocus] = useState<[number, number] | null>(null);
  const [probe, setProbe] = useState<[number, number] | null>(null);
  const grid = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const keyboard = useRef(false);

  const identity = `${ctx.panel.id}|${ctx.inv.id}|${temps.tmin}|${temps.tmax}`;
  useEffect(() => {
    setStart(windowFor(first, sel.series));
    setProbe(null);
  }, [identity]);

  useLayoutEffect(() => {
    const box = scroller.current;
    const cell = box?.querySelector('.is-selected');
    if (!box || !cell || box.scrollWidth <= box.clientWidth) return;
    const b = box.getBoundingClientRect();
    const c = cell.getBoundingClientRect();
    if (c.left < b.left || c.right > b.right) box.scrollLeft += c.left + c.width / 2 - (b.left + b.width / 2);
  }, []);

  useLayoutEffect(() => {
    if (!keyboard.current || !focus) return;
    keyboard.current = false;
    grid.current?.querySelector<HTMLButtonElement>(`[data-r="${focus[0]}"][data-c="${focus[1]}"]`)?.focus();
  }, [focus, start]);

  const columns = Array.from({ length: MATRIX_COLS }, (_, c) => start + c);
  const rows: Cell[][] = Array.from({ length: MATRIX_ROWS }, (_, r) => columns.map((s) => evaluateCell(ctx, s, r + 1)));
  const page = (dir: 1 | -1) => setStart((s) => Math.max(1, s + dir * MATRIX_COLS));
  const canPrev = start > 1;
  const canNext = start + MATRIX_COLS <= last;
  const selInView = sel.series >= start && sel.series < start + MATRIX_COLS && sel.strings >= 1 && sel.strings <= MATRIX_ROWS;
  const tab = focus ?? (selInView ? [sel.strings - 1, sel.series - start] : [0, 0]);
  const probed = probe ? evaluateCell(ctx, probe[0], probe[1]) : null;
  const scale = powerScale(rows[MATRIX_ROWS - 1][MATRIX_COLS - 1].power);
  const power = (w: number) => `${scaled(w, scale)} ${scale.unit}`;
  const sep = rtl ? '، ' : ', ';

  const move = (e: KeyboardEvent, r: number, c: number) => {
    const forward = rtl ? 'ArrowLeft' : 'ArrowRight';
    const backward = rtl ? 'ArrowRight' : 'ArrowLeft';
    let nr = r;
    let nc = c;
    if (e.key === forward) nc++;
    else if (e.key === backward) nc--;
    else if (e.key === 'ArrowDown') nr++;
    else if (e.key === 'ArrowUp') nr--;
    else if (e.key === 'Home') nc = 0;
    else if (e.key === 'End') nc = MATRIX_COLS - 1;
    else return;
    e.preventDefault();
    keyboard.current = true;
    nr = Math.min(MATRIX_ROWS - 1, Math.max(0, nr));
    if (nc >= MATRIX_COLS) {
      if (canNext) setStart((s) => s + 1);
      nc = MATRIX_COLS - 1;
    } else if (nc < 0) {
      if (start > 1) setStart((s) => s - 1);
      nc = 0;
    }
    setFocus([nr, nc]);
  };

  const reasons = (cell: Cell) => cell.failed.map((f) => checkSentence(f, temps, t)).join(' ');
  const blockers = matrixBlockers(ctx);
  const label = (cell: Cell) => {
    const text = `${t.inverter.cell(cell.strings, cell.series, power(cell.power), cell.modules)}${sep}${t.inverter.state[cell.state]}`;
    return cell.failed.length ? `${text}. ${reasons(cell)}` : text;
  };
  const sample = rows[0][0];

  return (
    <div class="dz-matrix">
      <div class="dz-matrix__bar">
        <p class="dz-matrix__axis" id={`${id}-cols`}>
          {t.inverter.series}
          <span class="dz-matrix__range num" dir="ltr">
            {start}–{start + MATRIX_COLS - 1}
          </span>
        </p>
        <div class="dz-matrix__paging">
          <button type="button" class="dz-iconbtn" aria-label={t.inverter.prev} disabled={!canPrev} onClick={() => page(-1)}>
            <span class="dz-flip">
              <Icon name="arrow" dir />
            </span>
          </button>
          <button type="button" class="dz-iconbtn" aria-label={t.inverter.more} disabled={!canNext} onClick={() => page(1)}>
            <Icon name="arrow" dir />
          </button>
        </div>
      </div>

      <div class="dz-matrix__scroll" ref={scroller}>
        <div class="dz-matrix__grid" role="grid" aria-label={t.inverter.matrix(name)} ref={grid}>
          <div class="dz-matrix__row" role="row">
            <div class="dz-matrix__corner" role="columnheader">
              {t.inverter.strings}
            </div>
            {columns.map((s) => (
              <div class="dz-matrix__colhead num" role="columnheader" key={s}>
                {s}
              </div>
            ))}
          </div>
          {rows.map((row, r) => (
            <div class="dz-matrix__row" role="row" key={r}>
              <div class="dz-matrix__rowhead" role="rowheader">
                <span class="num">{r + 1}</span>
              </div>
              {row.map((cell, c) => {
                const isSel = sel.series === cell.series && sel.strings === cell.strings;
                const isProbe = !!probe && probe[0] === cell.series && probe[1] === cell.strings;
                return (
                  <div role="gridcell" key={cell.series} class="dz-matrix__cellwrap">
                    <button
                      type="button"
                      class={`dz-cell is-${cell.state}${isSel ? ' is-selected' : ''}${isProbe ? ' is-probe' : ''}`}
                      data-r={r}
                      data-c={c}
                      tabIndex={tab[0] === r && tab[1] === c ? 0 : -1}
                      aria-pressed={isSel}
                      aria-disabled={cell.state === 'invalid' || undefined}
                      aria-label={label(cell)}
                      title={reasons(cell) || undefined}
                      onFocus={() => setFocus([r, c])}
                      onKeyDown={(e) => move(e, r, c)}
                      onClick={() => {
                        if (cell.state === 'invalid') {
                          setProbe(isProbe ? null : [cell.series, cell.strings]);
                          return;
                        }
                        setProbe(null);
                        onSelect(cell.series, cell.strings);
                      }}
                    >
                      <span class="dz-cell__w num" dir="ltr">
                        {scaled(cell.power, scale)}
                        <span class="unit">{scale.unit}</span>
                      </span>
                      <span class="dz-cell__n num" dir="ltr">
                        ({cell.modules})
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {blockers.length > 0 && (
        <p class="dz-matrix__probe small">
          <strong>{t.inverter.blocked}</strong> {blockers.map((f) => checkSentence(f, temps, t)).join(' ')}
        </p>
      )}

      <p class="dz-matrix__probe small" role="status">
        {probed && probed.state === 'invalid' && (
          <>
            <strong>{t.inverter.whyNot(ltr(`${probed.strings} × ${probed.series}`))}</strong> {reasons(probed)}
          </>
        )}
      </p>
      {probed && probed.state === 'invalid' && <VoltageRuler cell={probed} temps={temps} />}

      <ul class="dz-legend" role="list">
        <li class="dz-legend__key">
          <span class="dz-legend__sample num" dir="ltr">
            {scaled(sample.power, scale)}
            <span class="unit">{scale.unit}</span> ({sample.modules})
          </span>
          {t.inverter.legendCell}
        </li>
        <li>
          <span class="dz-swatch is-green" aria-hidden="true" />
          {t.inverter.legendGreen}
        </li>
        <li>
          <span class="dz-swatch is-amber" aria-hidden="true" />
          {t.inverter.legendAmber(unit(`${pct(ctx.inv.percPmaxCc, 0)}–${pct(ctx.inv.percPminCc, 0)}`, '%'))}
        </li>
        <li>
          <span class="dz-swatch is-invalid" aria-hidden="true" />
          {t.inverter.legendInvalid}
        </li>
        <li>
          <span class="dz-swatch is-selected" aria-hidden="true" />
          {t.inverter.legendSelected}
        </li>
      </ul>
    </div>
  );
}

export function CheckTable({ cell, temps }: { cell: Cell; temps: Temps }) {
  const { t } = useI18n();
  return (
    <div class="dz-table-wrap">
      <table class="dz-table dz-checks">
        <thead>
          <tr>
            <th scope="col">{t.checks.colCheck}</th>
            <th scope="col">{t.checks.colValue}</th>
            <th scope="col">{t.checks.colLimit}</th>
            <th scope="col">{t.checks.colResult}</th>
          </tr>
        </thead>
        <tbody>
          {cell.checks.map((c) => (
            <tr key={c.id} class={c.pass ? '' : 'is-fail'}>
              <th scope="row">
                {t.checks.names[c.id]}
                <span class="dz-checks__qty">
                  {checkQty(c, temps, t)}
                </span>
              </th>
              <td>
                <span class="num" dir="ltr">
                  {checkValue(c)}
                </span>
              </td>
              <td>
                <span class="num" dir="ltr">
                  {checkOp[c.id]} {checkLimit(c)}
                </span>
              </td>
              <td>
                <span class={`dz-result ${c.pass ? 'is-pass' : 'is-fail'}`}>
                  <Icon name={c.pass ? 'check' : 'close'} />
                  {c.pass ? t.checks.pass : t.checks.failed}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

