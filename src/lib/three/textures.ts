import { colLeft, rowTop } from './layout.ts';
import type { CellLayout } from './layout.ts';
import type { ModuleSpec } from './types.ts';

export function seeded(text: string) {
  let a = 2166136261;
  for (let i = 0; i < text.length; i++) a = Math.imul(a ^ text.charCodeAt(i), 16777619);
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function canvas(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function cellPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, top: number, bottom: number) {
  ctx.beginPath();
  ctx.moveTo(x + top, y);
  ctx.lineTo(x + w - top, y);
  ctx.lineTo(x + w, y + top);
  ctx.lineTo(x + w, y + h - bottom);
  ctx.lineTo(x + w - bottom, y + h);
  ctx.lineTo(x + bottom, y + h);
  ctx.lineTo(x, y + h - bottom);
  ctx.lineTo(x, y + top);
  ctx.closePath();
}

export interface CellSheet {
  /** sRGB colour with alpha: cells and ribbons opaque, gaps transparent. */
  color: HTMLCanvasElement;
  /** Roughness in G, metalness in B (three.js convention). */
  surface: HTMLCanvasElement;
  /** Half-size height map: cells and ribbons raised, gaps low. Gives the backsheet its faint relief. */
  relief: HTMLCanvasElement;
}

const sheets = new Map<string, CellSheet>();

export function drawCellSheet(spec: ModuleSpec, L: CellLayout, maxPx: number): CellSheet {
  const key = [spec.model, spec.width, spec.height, spec.cells, spec.halfCut, spec.back, spec.cellType, maxPx].join('|');
  const cached = sheets.get(key);
  if (cached) return cached;

  const s = maxPx / Math.max(L.lamW, L.lamH);
  const w = Math.round(L.lamW * s);
  const h = Math.round(L.lamH * s);
  const color = canvas(w, h);
  const surface = canvas(w, h);
  const c = color.getContext('2d')!;
  const m = surface.getContext('2d')!;
  m.fillStyle = 'rgb(0,150,0)';
  m.fillRect(0, 0, w, h);

  const rand = seeded(`${spec.model}-${spec.cells}`);
  const poly = spec.cellType === 'poly';
  const dark = spec.back === 'black';
  const cw = L.cellW * s;
  const ch = L.cellH * s;
  const chamfer = poly ? 0 : cw * (L.cellW < 170 ? 0.07 : 0.035);
  const fingerStep = Math.max(2, 1.9 * s);

  for (let r = 0; r < L.rows; r++) {
    const y = rowTop(L, r) * s;
    const top = spec.halfCut ? (r % 2 === 0 ? chamfer : 0) : chamfer;
    const bottom = spec.halfCut ? (r % 2 === 1 ? chamfer : 0) : chamfer;
    for (let k = 0; k < L.cols; k++) {
      const x = colLeft(L, k) * s;
      const light = poly ? 30 + (rand() - 0.5) * 6 : 7 + (rand() - 0.5) * 2.2;
      const hue = poly ? 216 : 226;
      const sat = poly ? 56 : 34;
      const grad = c.createLinearGradient(x, y, x + cw * 0.3, y + ch);
      grad.addColorStop(0, `hsl(${hue} ${sat}% ${light + 1}%)`);
      grad.addColorStop(1, `hsl(${hue} ${sat}% ${light - 0.6}%)`);
      cellPath(c, x, y, cw, ch, top, bottom);
      c.fillStyle = grad;
      c.fill();
      m.fillStyle = 'rgb(0,128,0)';
      cellPath(m, x, y, cw, ch, top, bottom);
      m.fill();

      c.save();
      cellPath(c, x, y, cw, ch, top, bottom);
      c.clip();
      if (poly) {
        for (let f = 0; f < 26; f++) {
          const fx = x + rand() * cw;
          const fy = y + rand() * ch;
          const size = (0.12 + rand() * 0.3) * cw;
          c.beginPath();
          c.moveTo(fx, fy);
          for (let v = 0; v < 4; v++) c.lineTo(fx + (rand() - 0.5) * size, fy + (rand() - 0.5) * size);
          c.closePath();
          c.fillStyle = `hsl(${212 + rand() * 10} ${48 + rand() * 18}% ${light + (rand() - 0.5) * 12}% / 0.55)`;
          c.fill();
        }
      }
      c.fillStyle = poly ? 'rgb(225 230 240 / 0.1)' : 'rgb(150 162 190 / 0.035)';
      for (let fy = y + fingerStep / 2; fy < y + ch; fy += fingerStep) c.fillRect(x, fy, cw, 0.6);
      c.restore();
    }
  }

  const busbars = L.cellW >= 175 ? Math.round(L.cellW / 15) : L.cellW >= 160 ? 9 : 5;
  const thin = busbars > 6;
  const bw = thin ? Math.max(0.7, 0.4 * s) : Math.max(1, 1.2 * s);
  const ribbonColor = dark ? 'rgb(44 46 52)' : 'rgb(190 194 201)';
  const ribbonSurface = dark ? 'rgb(0,110,90)' : 'rgb(0,70,255)';
  const reach = 6 * s;
  const strip = Math.max(2, 4 * s);
  const perBlock = L.rows / L.blocks;

  const ribbon = (x: number, y: number, rw: number, rh: number, alpha: number) => {
    c.globalAlpha = alpha;
    c.fillStyle = ribbonColor;
    c.fillRect(x, y, rw, rh);
    c.globalAlpha = 1;
    m.fillStyle = ribbonSurface;
    m.fillRect(x, y, rw, rh);
  };

  for (let b = 0; b < L.blocks; b++) {
    const yTop = rowTop(L, b * perBlock) * s - reach;
    const yBottom = (rowTop(L, (b + 1) * perBlock - 1) + L.cellH) * s + reach;
    for (let k = 0; k < L.cols; k++) {
      const x = colLeft(L, k) * s;
      for (let i = 0; i < busbars; i++) ribbon(x + ((i + 0.5) * cw) / busbars - bw / 2, yTop, bw, yBottom - yTop, thin ? 0.42 : 0.9);
    }
    const pairs = (from: number, y: number) => {
      for (let k = from; k + 1 < L.cols; k += 2) {
        const x = colLeft(L, k) * s;
        ribbon(x + cw * 0.08, y, (colLeft(L, k + 1) + L.cellW) * s - x - cw * 0.16, strip, 0.95);
      }
    };
    const outerTop = b === 0;
    const outerBottom = b === L.blocks - 1;
    if (outerTop) pairs(0, yTop - strip);
    if (outerBottom) pairs(L.blocks === 1 ? 1 : 0, yBottom);
    if (L.blocks === 2) {
      const xs = L.x0 * s + cw * 0.08;
      const xe = (colLeft(L, L.cols - 1) + L.cellW) * s - cw * 0.08;
      ribbon(xs, b === 0 ? yBottom : yTop - strip, xe - xs, strip * 0.6, 0.85);
    }
  }

  const relief = canvas(Math.round(w / 2), Math.round(h / 2));
  const r = relief.getContext('2d')!;
  r.fillStyle = '#fff';
  r.fillRect(0, 0, relief.width, relief.height);
  r.globalCompositeOperation = 'destination-in';
  r.drawImage(color, 0, 0, relief.width, relief.height);
  r.globalCompositeOperation = 'destination-over';
  r.fillStyle = '#555';
  r.fillRect(0, 0, relief.width, relief.height);

  const sheet = { color, surface, relief };
  sheets.set(key, sheet);
  // Keep the two latest (hero and anatomy share one); model pickers would otherwise pile up ~20 MB per model.
  if (sheets.size > 2) sheets.delete(sheets.keys().next().value!);
  return sheet;
}

/** Rating label on the back: model, power and size as printed on the datasheet. */
export function drawLabel(spec: ModuleSpec): HTMLCanvasElement {
  const cv = canvas(640, 400);
  const c = cv.getContext('2d')!;
  c.fillStyle = '#f5f5f1';
  c.fillRect(0, 0, 640, 400);
  c.strokeStyle = '#1c1c1f';
  c.lineWidth = 3;
  c.strokeRect(12, 12, 616, 376);
  c.fillStyle = '#121214';
  c.font = '600 46px "DM Sans Variable", "DM Sans", sans-serif';
  c.fillText('PEIMAR', 36, 72);
  c.font = '500 28px "IBM Plex Mono", monospace';
  c.textAlign = 'right';
  c.fillText(spec.model, 604, 70);
  c.textAlign = 'left';
  c.fillRect(36, 94, 568, 2);
  const rows: [string, string][] = [
    ['Model', spec.model],
    ['Pmax', spec.power ? `${spec.power} W` : '—'],
    ['Cells', String(spec.cells)],
    ['Size', `${spec.width} × ${spec.height} × ${spec.depth} mm`],
  ];
  c.font = '400 24px "IBM Plex Mono", monospace';
  rows.forEach(([k, v], i) => {
    const y = 140 + i * 40;
    c.fillStyle = '#6b6b70';
    c.fillText(k, 36, y);
    c.fillStyle = '#121214';
    c.fillText(v, 170, y);
  });
  const rand = seeded(spec.model);
  c.fillStyle = '#121214';
  for (let x = 36; x < 420; ) {
    const bw = 2 + Math.floor(rand() * 4);
    if (rand() > 0.35) c.fillRect(x, 314, bw, 52);
    x += bw + 2;
  }
  return cv;
}

export function drawShadow(): HTMLCanvasElement {
  const cv = canvas(256, 256);
  const c = cv.getContext('2d')!;
  const g = c.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, 'rgb(0 0 0 / 0.38)');
  g.addColorStop(0.5, 'rgb(0 0 0 / 0.14)');
  g.addColorStop(1, 'rgb(0 0 0 / 0)');
  c.fillStyle = g;
  c.fillRect(0, 0, 256, 256);
  return cv;
}
