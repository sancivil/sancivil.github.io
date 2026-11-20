import { fmt } from '../../lib/designer/format.ts';

function niceMax(v: number): number {
  if (!(v > 0)) return 1;
  const pow = 10 ** Math.floor(Math.log10(v));
  const step = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find((m) => m * pow >= v) ?? 10;
  return step * pow;
}

/** Monthly bars in SVG; labels stay in HTML so they keep their size at every width. Always left to right, January first. */
export function EnergyChart({ monthly, labels, title }: { monthly: number[]; labels: string[]; title: string }) {
  const top = niceMax(Math.max(...monthly));
  const peak = monthly.indexOf(Math.max(...monthly));
  return (
    <figure class="dz-chart" dir="ltr">
      <div class="dz-chart__plot">
        <div class="dz-chart__axis" aria-hidden="true">
          {[1, 0.5].map((f) => (
            <span key={f} style={{ bottom: `${f * 100}%` }} class="num">
              {fmt(top * f)}
            </span>
          ))}
        </div>
        <svg class="dz-chart__svg" viewBox="0 0 120 100" preserveAspectRatio="none" role="img" aria-label={title}>
          {[0.25, 0.5, 0.75, 1].map((f) => (
            <line key={f} class="dz-chart__grid" x1="0" x2="120" y1={100 - f * 100} y2={100 - f * 100} vector-effect="non-scaling-stroke" />
          ))}
          {monthly.map((v, i) => {
            const h = (v / top) * 100;
            return <rect key={i} class={i === peak ? 'is-peak' : undefined} x={i * 10 + 1.75} width="6.5" y={100 - h} height={h} />;
          })}
          <line class="dz-chart__base" x1="0" x2="120" y1="100" y2="100" vector-effect="non-scaling-stroke" />
        </svg>
      </div>
      <div class="dz-chart__labels" aria-hidden="true">
        {labels.map((l, i) => (
          <span key={i}>{l}</span>
        ))}
      </div>
      <div class="dz-chart__values num" aria-hidden="true">
        {monthly.map((v, i) => (
          <span key={i}>{fmt(v)}</span>
        ))}
      </div>
    </figure>
  );
}
