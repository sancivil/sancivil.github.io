import type { RefObject } from 'preact';
import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import type { BlockSummary, Cell } from '../../lib/designer/calc.ts';
import { fmt, ltr, unit } from '../../lib/designer/format.ts';
import type { Temps } from '../../lib/designer/types.ts';
import { GAUGE_MAX, GAUGE_MIN, along, gaugeAt, labelRows, stringRun, voltageRuler } from '../../lib/designer/visual.ts';
import { checkQty } from './labels.ts';
import { useI18n } from './store.ts';
import { Dot } from './ui.tsx';

const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Eases a figure to its new value (count-up on first show); the final value at once under reduced motion. */
export function useTween(target: number, ms = 900, still = false): number {
  const [value, setValue] = useState(() => (still || reduced() || !Number.isFinite(target) ? target : 0));
  const from = useRef(value);
  useEffect(() => {
    if (still || !Number.isFinite(target) || reduced()) {
      from.current = target;
      setValue(target);
      return;
    }
    const a = Number.isFinite(from.current) ? from.current : 0;
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const k = Math.min(1, (now - t0) / ms);
      const v = a + (target - a) * (1 - (1 - k) ** 4);
      from.current = v;
      setValue(k < 1 ? v : target);
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return value;
}

function useWidth<T extends HTMLElement>(): [RefObject<T>, number] {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(el.clientWidth);
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width];
}

/* ---------- string diagram ---------- */

const MOD_W = 13;
const MOD_H = 22;
const SLOT = 16;
const ROW = 34;
const HEAD = 22;
const GAP = 12;
const PAD = 8;
const TOP = 30;
const SLOTS = 10;
const BOX_W = 116;

/** Short MPPT name for the drawing: "MPPT 1", "MPPT 1 + 2", "MPPT 1–9". */
const shortName = (mppts: number[]) => `MPPT ${mppts.length > 2 ? `${mppts[0]}–${mppts[mppts.length - 1]}` : mppts.join(' + ')}`;

type DiagramProps = { b: BlockSummary; lit?: number | null };

/** Inverter as a box with its MPPT inputs; each MPPT's strings as rows of panels wired + and − to its input. */
export function StringDiagram({ b, lit = null }: DiagramProps) {
  const { t, rtl } = useI18n();
  const inv = b.inv!;
  const longest = Math.max(1, ...b.groups.map((g) => (g.cell ? g.sel.series : 0)));
  const slots = Math.min(SLOTS, longest);
  const x0 = PAD + 6;
  const runX = x0 + 10;
  const runEnd = runX + slots * SLOT - (SLOT - MOD_W);
  const plusBus = Math.max(runEnd + 14, runX + 96);
  const minusBus = plusBus + 10;
  const boxX = minusBus + 22;
  const W = boxX + BOX_W + PAD;

  let y = TOP;
  const layout = b.groups.map((g) => {
    const rows = g.cell ? g.sel.strings : 1;
    const top = y;
    y += HEAD + rows * ROW + GAP;
    return { g, top, rows };
  });
  const H = y - GAP + PAD;
  const X = (x: number) => (rtl ? W - x : x);
  const rx = (x: number, w: number) => (rtl ? W - x - w : x);
  const anchor = (a: 'start' | 'end') => (rtl ? (a === 'start' ? 'end' : 'start') : a);
  const path = (pts: [number, number][]) => pts.map(([px, py], i) => `${i ? 'L' : 'M'}${X(px)} ${py}`).join(' ');

  const desc = b.groups
    .map((g) => `${shortName(g.mppts)}: ${g.cell ? t.inverter.cell(g.sel.strings, g.sel.series, unit(fmt(g.cell.power), 'W'), g.cell.modules) : t.diagram.empty}`)
    .join('; ');

  return (
    <figure class="dz-diagram">
      <figcaption class="dz-subtitle">{t.diagram.title}</figcaption>
      <div class="dz-diagram__scroll">
        <svg class="dz-diagram__svg" viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ width: `min(100%, ${Math.round(W * 1.3)}px)` }} role="img" aria-label={`${t.diagram.label(ltr(inv.model))}. ${desc}`}>
          <rect class="dz-diagram__box" x={rx(boxX, BOX_W)} y={PAD} width={BOX_W} height={H - 2 * PAD} rx="3" />
          <text class="dz-diagram__model" x={X(boxX + BOX_W / 2)} y={PAD + 16} text-anchor="middle">
            {inv.model}
          </text>
          {b.count > 1 && (
            <text class="dz-diagram__count" x={X(boxX + BOX_W / 2)} y={PAD + 28} text-anchor="middle">
              {`× ${b.count}`}
            </text>
          )}
          {layout.map(({ g, top, rows }, gi) => {
            const row0 = top + HEAD;
            const plusY = row0 + 6;
            const minusY = row0 + MOD_H + 5;
            const run = g.cell ? stringRun(g.sel.series, slots) : null;
            const cls = `dz-diagram__group dz-c${gi % 12}${lit === g.index ? ' is-lit' : ''}${g.cell ? '' : ' is-empty'}${g.cell?.state === 'invalid' ? ' is-bad' : ''}`;
            return (
              <g class={cls} key={g.index}>
                <text class="dz-diagram__label" x={X(x0)} y={top + 14} text-anchor={anchor('start')}>
                  {g.cell ? `${shortName(g.mppts)} · ${g.sel.strings} × ${g.sel.series}` : shortName(g.mppts)}
                </text>
                {run ? (
                  <>
                    {Array.from({ length: rows }, (_, r) => {
                      const ry = row0 + r * ROW;
                      const drawn = run.lead + (run.hidden ? 1 + run.trail : 0);
                      const end = runX + drawn * SLOT - (SLOT - MOD_W);
                      return (
                        <g key={r}>
                          <path class="dz-diagram__wire is-plus" d={path([[end, ry + 6], [plusBus, ry + 6]])} />
                          <path class="dz-diagram__wire is-minus" d={path([[runX, ry + MOD_H - 5], [x0, ry + MOD_H - 5], [x0, ry + MOD_H + 5], [minusBus, ry + MOD_H + 5]])} />
                          <path class="dz-diagram__link" d={path([[runX, ry + MOD_H / 2], [end, ry + MOD_H / 2]])} />
                          {Array.from({ length: drawn }, (_, k) => {
                            const mx = runX + k * SLOT;
                            if (run.hidden && k === run.lead)
                              return (
                                <text class="dz-diagram__more" key={k} x={X(mx + MOD_W / 2)} y={ry + MOD_H / 2 + 4} text-anchor="middle">
                                  …
                                </text>
                              );
                            return (
                              <g class="dz-diagram__mod" key={k}>
                                <rect x={rx(mx, MOD_W)} y={ry} width={MOD_W} height={MOD_H} rx="1" />
                                <path d={path([[mx + 1.5, ry + MOD_H / 2], [mx + MOD_W - 1.5, ry + MOD_H / 2]])} />
                              </g>
                            );
                          })}
                        </g>
                      );
                    })}
                    {rows > 1 && <path class="dz-diagram__wire is-plus" d={path([[plusBus, plusY], [plusBus, row0 + (rows - 1) * ROW + 6]])} />}
                    {rows > 1 && <path class="dz-diagram__wire is-minus" d={path([[minusBus, minusY], [minusBus, row0 + (rows - 1) * ROW + MOD_H + 5]])} />}
                    <path class="dz-diagram__wire is-plus is-feed" d={path([[plusBus, plusY], [boxX, plusY]])} />
                    <path class="dz-diagram__wire is-minus is-feed" d={path([[minusBus, minusY], [boxX, minusY]])} />
                  </>
                ) : (
                  <>
                    <text class="dz-diagram__empty" x={X(runX)} y={row0 + 15} text-anchor={anchor('start')}>
                      {t.diagram.empty}
                    </text>
                    <path class="dz-diagram__stub" d={path([[minusBus, plusY], [boxX, plusY]])} />
                    <path class="dz-diagram__stub" d={path([[minusBus, minusY], [boxX, minusY]])} />
                  </>
                )}
                <rect class="dz-diagram__port" x={rx(boxX - 3, 6)} y={plusY - 3} width="6" height="6" />
                <rect class="dz-diagram__port" x={rx(boxX - 3, 6)} y={minusY - 3} width="6" height="6" />
                <text class="dz-diagram__pole" x={X(boxX + 10)} y={plusY + 3.5} text-anchor="middle">
                  +
                </text>
                <text class="dz-diagram__pole" x={X(boxX + 10)} y={minusY + 3.5} text-anchor="middle">
                  −
                </text>
                <text class="dz-diagram__input" x={X(boxX + 20)} y={(plusY + minusY) / 2 + 4} text-anchor={anchor('start')}>
                  {shortName(g.mppts)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <p class="dz-diagram__key small">{t.diagram.key}</p>
    </figure>
  );
}

/* ---------- voltage ruler ---------- */

type Tick = { v: number };

type LaneProps = { name: string; band: [number, number]; bar: [number, number]; pass: boolean; ticks: Tick[]; gap: number; max: number };

function Lane({ name, band, bar, pass, ticks, gap, max }: LaneProps) {
  const xs = ticks.map((k) => along(k.v, max));
  const rows = labelRows(xs, gap);
  const depth = rows.length ? Math.max(...rows) + 1 : 0;
  const pc = (v: number) => `${along(v, max) * 100}%`;
  return (
    <div class={`dz-ruler__lane ${pass ? 'is-pass' : 'is-fail'}`} style={{ '--rows': depth }}>
      <span class="dz-ruler__name mono">{name}</span>
      <div class="dz-ruler__plot">
        {ticks.map((k, i) => (
          <span
            key={i}
            class={`dz-ruler__tick num${xs[i] > 0.92 ? ' is-end' : xs[i] < 0.08 ? ' is-start' : ''}`}
            style={{ insetInlineStart: pc(k.v), '--row': rows[i] }}
          >
            {fmt(k.v)}
          </span>
        ))}
        <div class="dz-ruler__track">
          <span class="dz-ruler__band" style={{ insetInlineStart: pc(band[0]), width: `${(along(band[1], max) - along(band[0], max)) * 100}%` }} />
          {ticks.map((k, i) => (
            <span key={i} class="dz-ruler__limit" style={{ insetInlineStart: pc(k.v) }} />
          ))}
          <span class="dz-ruler__bar" style={{ insetInlineStart: pc(bar[0]), width: `max(4px, ${(along(bar[1], max) - along(bar[0], max)) * 100}%)` }} />
        </div>
      </div>
    </div>
  );
}

/** Every Peimar check of one layout on a 0–max DC voltage scale, with the MPPT current as a meter. */
export function VoltageRuler({ cell, temps }: { cell: Cell; temps: Temps }) {
  const { t } = useI18n();
  const [ref, width] = useWidth<HTMLDivElement>();
  const r = voltageRuler(cell);
  const gap = width > 0 ? 52 / width : 0.16;
  const vmpOk = r.vmp[0].pass && r.vmp[1].pass;
  const vocOk = r.voc[0].pass && r.voc[1].pass;
  const ceiling = Math.min(r.vmaxDc, r.vdcModule);
  const limits = [...new Set([r.vstart, r.vmaxDc, r.vdcModule])].map((v) => ({ v }));
  const range = (a: number, b: number) => unit(`${fmt(a)}–${fmt(b)}`, 'V');
  const imax = cell.checks.find((c) => c.id === 'imax')!;
  const amps = (v: number) => fmt(v, Number.isInteger(v) ? 0 : 2);

  return (
    <figure class="dz-ruler" aria-label={t.ruler.label(ltr(`${cell.strings} × ${cell.series}`))}>
      <figcaption class="dz-subtitle">{t.ruler.title}</figcaption>
      <div class="dz-ruler__lanes" dir="ltr" ref={ref} aria-hidden="true">
        <Lane name="Vmp" band={r.window} bar={[r.vmp[0].value, r.vmp[1].value]} pass={vmpOk} ticks={r.window.map((v) => ({ v }))} gap={gap} max={r.max} />
        <Lane name="Voc" band={[r.vstart, ceiling]} bar={[r.voc[0].value, r.voc[1].value]} pass={vocOk} ticks={limits} gap={gap} max={r.max} />
        <div class="dz-ruler__axis num">
          <span>0</span>
          <span>{`${fmt(r.max)} V`}</span>
        </div>
      </div>
      <ul class="dz-ruler__read" role="list">
        <li class={vmpOk ? 'is-pass' : 'is-fail'}>
          <Dot tone={vmpOk ? 'green' : 'invalid'} />
          <span class="mono">Vmp</span>
          <span class="num" dir="ltr">
            {`${fmt(r.vmp[0].value)}–${fmt(r.vmp[1].value)} V`}
          </span>
          <span class="dz-ruler__verdict">{(vmpOk ? t.ruler.vmpIn : t.ruler.vmpOut)(range(r.window[0], r.window[1]))}</span>
        </li>
        <li class={vocOk ? 'is-pass' : 'is-fail'}>
          <Dot tone={vocOk ? 'green' : 'invalid'} />
          <span class="mono">Voc</span>
          <span class="num" dir="ltr">
            {`${fmt(r.voc[0].value)}–${fmt(r.voc[1].value)} V`}
          </span>
          <span class="dz-ruler__verdict">{(vocOk ? t.ruler.vocIn : t.ruler.vocOut)(range(r.vstart, ceiling))}</span>
        </li>
        <li class={r.current.pass ? 'is-pass' : 'is-fail'}>
          <Dot tone={r.current.pass ? 'green' : 'invalid'} />
          <span class="mono">Imp</span>
          <span class="num" dir="ltr">
            {`${amps(r.current.value)} A ≤ ${amps(r.current.limit)} A`}
          </span>
          <span class="dz-ruler__meter" aria-hidden="true" dir="ltr">
            <span style={{ width: `${Math.min(100, (r.current.value / r.current.limit) * 100)}%` }} />
          </span>
          <span class="dz-ruler__verdict">{checkQty(imax, temps, t)}</span>
        </li>
      </ul>
      <p class="dz-ruler__note small">{t.ruler.span(unit(fmt(temps.tmax), '°C'), unit(fmt(temps.tmin), '°C'))}</p>
    </figure>
  );
}

/* ---------- power ratio gauge ---------- */

const arcPoint = (f: number, r: number): [number, number] => [60 - r * Math.cos(Math.PI * f), 60 - r * Math.sin(Math.PI * f)];

function arc(a: number, b: number, r: number): string {
  const [x1, y1] = arcPoint(a, r);
  const [x2, y2] = arcPoint(b, r);
  return `M${x1.toFixed(2)} ${y1.toFixed(2)} A${r} ${r} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

/** Half-dial from 40 % to 160 %; the Peimar range is the green arc. Always drawn left to right, like the meter it is. */
type GaugeProps = { ratio: number; range: [number, number] | null; tone: 'green' | 'amber' | null; still?: boolean };

export function RatioGauge({ ratio, range, tone, still = false }: GaugeProps) {
  const f = useTween(gaugeAt(ratio), 1100, still);
  const [nx, ny] = arcPoint(f, 40);
  return (
    <svg class={`dz-gauge is-${tone ?? 'none'}`} viewBox="0 0 120 66" width="120" height="66" aria-hidden="true">
      <path class="dz-gauge__track" d={arc(0, 1, 46)} />
      {range && <path class="dz-gauge__band" d={arc(gaugeAt(range[0]), gaugeAt(range[1]), 46)} />}
      {[GAUGE_MIN, 1, GAUGE_MAX].map((v) => {
        const [ax, ay] = arcPoint(gaugeAt(v), 52);
        const [bx, by] = arcPoint(gaugeAt(v), 56);
        return <line key={v} class="dz-gauge__mark" x1={ax} y1={ay} x2={bx} y2={by} />;
      })}
      {Number.isFinite(ratio) && <line class="dz-gauge__needle" x1="60" y1="60" x2={nx} y2={ny} />}
      <circle class="dz-gauge__hub" cx="60" cy="60" r="3.5" />
    </svg>
  );
}
