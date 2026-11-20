import type { ModuleSpec } from './types.ts';

/** Frame wall thickness and the width of the frame lip over the glass, in mm. */
export const FRAME_WALL = 1.6;
export const FRAME_LIP = 11;
/** The laminate edge sits this far inside the outer frame face (mm). */
export const LAM_INSET = FRAME_WALL + 0.4;

/** Cell grid inside the laminate, in mm from the laminate's top-left corner. */
export interface CellLayout {
  lamW: number;
  lamH: number;
  cols: number;
  rows: number;
  blocks: number;
  cellW: number;
  cellH: number;
  gapX: number;
  gapY: number;
  center: number;
  x0: number;
  y0: number;
}

/** 6 columns across the short side; half-cut modules are two mirrored blocks with a centre gap. */
export function cellLayout(spec: ModuleSpec): CellLayout {
  const lamW = spec.width - 2 * LAM_INSET;
  const lamH = spec.height - 2 * LAM_INSET;
  const cols = 6;
  const rows = Math.max(1, Math.round(spec.cells / cols));
  const blocks = spec.halfCut && rows % 2 === 0 ? 2 : 1;
  const gapX = 3;
  const gapY = spec.halfCut ? 1.8 : 2.5;
  const center = blocks === 2 ? 22 : 0;
  const side = FRAME_LIP - LAM_INSET + 4.5;
  const end = FRAME_LIP - LAM_INSET + 13;
  const cellW = (lamW - 2 * side - (cols - 1) * gapX) / cols;
  const fitH = (lamH - 2 * end - center - (rows - blocks) * gapY) / rows;
  const cellH = spec.halfCut ? fitH : Math.min(fitH, cellW);
  const gridH = rows * cellH + (rows - blocks) * gapY + center;
  return { lamW, lamH, cols, rows, blocks, cellW, cellH, gapX, gapY, center, x0: side, y0: (lamH - gridH) / 2 };
}

export const rowTop = (L: CellLayout, r: number) =>
  L.y0 + r * (L.cellH + L.gapY) + Math.floor(r / (L.rows / L.blocks)) * (L.center - L.gapY);
export const colLeft = (L: CellLayout, k: number) => L.x0 + k * (L.cellW + L.gapX);
