import { FRAME_LIP, LAM_INSET, cellLayout, colLeft, rowTop } from './layout.ts';
import type { ModuleSpec } from './types.ts';

const FRAME = { black: '#141416', silver: '#b9bcc1', red: '#763c28', green: '#343b29' } as const;
const BACK = { white: '#ffffff', black: '#1d1e21', glass: '#2b2f37' } as const;
const CELLS = { standard: '#161a24', red: '#6e3324', green: '#2f4431' } as const;

const r1 = (n: number) => Math.round(n * 10) / 10;

/** Front elevation in mm, used before the 3D view loads and when WebGL is missing. */
export function moduleSvg(spec: ModuleSpec): string {
  const L = cellLayout(spec);
  let cells = '';
  for (let r = 0; r < L.rows; r++) {
    const y = LAM_INSET + rowTop(L, r);
    for (let k = 0; k < L.cols; k++) {
      cells += `M${r1(LAM_INSET + colLeft(L, k))} ${r1(y)}h${r1(L.cellW)}v${r1(L.cellH)}h${r1(-L.cellW)}z`;
    }
  }
  const inner = spec.width - 2 * FRAME_LIP;
  const innerH = spec.height - 2 * FRAME_LIP;
  return (
    `<svg viewBox="0 0 ${spec.width} ${spec.height}" aria-hidden="true" focusable="false">` +
    `<rect width="${spec.width}" height="${spec.height}" rx="4" fill="${FRAME[spec.frame]}"/>` +
    `<rect x="${FRAME_LIP}" y="${FRAME_LIP}" width="${inner}" height="${innerH}" fill="${BACK[spec.back]}"/>` +
    `<path d="${cells}" fill="${CELLS[spec.tint]}"/>` +
    `</svg>`
  );
}
