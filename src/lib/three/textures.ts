import { colLeft, rowTop } from './layout.ts';
import type { CellLayout } from './layout.ts';
import { pace } from './stage.ts';
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

/** Tangent-space normal map (OpenGL convention, +y up) from the red channel of a height map; edges wrap. Yields between rows. */
async function toNormal(height: HTMLCanvasElement, strength: number): Promise<HTMLCanvasElement> {
  const w = height.width;
  const h = height.height;
  const src = height.getContext('2d', { willReadFrequently: true })!.getImageData(0, 0, w, h).data;
  const out = canvas(w, h);
  const ctx = out.getContext('2d')!;
  const img = ctx.createImageData(w, h);
  const d = img.data;
  const k = strength / 255;
  for (let y = 0; y < h; y++) {
    await pace();
    const row = y * w;
    const up = ((y + h - 1) % h) * w;
    const down = ((y + 1) % h) * w;
    for (let x = 0; x < w; x++) {
      const dx = (src[(row + ((x + 1) % w)) * 4] - src[(row + ((x + w - 1) % w)) * 4]) * k;
      const dy = (src[(down + x) * 4] - src[(up + x) * 4]) * k;
      const n = 127.5 / Math.sqrt(dx * dx + dy * dy + 1);
      const i = (row + x) * 4;
      d[i] = 127.5 - dx * n;
      d[i + 1] = 127.5 + dy * n;
      d[i + 2] = 127.5 + n;
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return out;
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
  /** Normal map of the cell side: cell edges, finger lines, round busbar wires, flat ribbons and the crystalline grain. */
  normal: HTMLCanvasElement;
}

const sheets = new Map<string, Promise<CellSheet>>();

/** Paints the cell sheet a slice at a time (see `pace`): a 4096 px sheet is over 0.1 s of main-thread work. */
export function drawCellSheet(spec: ModuleSpec, L: CellLayout, maxPx: number): Promise<CellSheet> {
  const key = [spec.model, spec.width, spec.height, spec.cells, spec.halfCut, spec.back, spec.cellType, maxPx].join('|');
  let sheet = sheets.get(key);
  if (!sheet) {
    sheet = paintCellSheet(spec, L, maxPx);
    sheets.set(key, sheet);
    // Keep the two latest (hero and anatomy share one); model pickers would otherwise pile up ~20 MB per model.
    if (sheets.size > 2) sheets.delete(sheets.keys().next().value!);
  }
  return sheet;
}

async function paintCellSheet(spec: ModuleSpec, L: CellLayout, maxPx: number): Promise<CellSheet> {
  const s = maxPx / Math.max(L.lamW, L.lamH);
  const w = Math.round(L.lamW * s);
  const h = Math.round(L.lamH * s);
  const color = canvas(w, h);
  const surface = canvas(w, h);
  const height = canvas(w, h);
  const c = color.getContext('2d')!;
  const m = surface.getContext('2d')!;
  const z = height.getContext('2d', { willReadFrequently: true })!;
  m.fillStyle = 'rgb(0,150,0)';
  m.fillRect(0, 0, w, h);
  z.fillStyle = 'rgb(70,70,70)';
  z.fillRect(0, 0, w, h);
  /** The height map rasterises on the CPU when it is read: reading one pixel keeps that work inside the current slice. */
  const slice = () => {
    z.getImageData(0, 0, 1, 1);
    return pace();
  };

  const rand = seeded(`${spec.model}-${spec.cells}`);
  const poly = spec.cellType === 'poly';
  const dark = spec.back === 'black';
  const cw = L.cellW * s;
  const ch = L.cellH * s;
  const chamfer = poly ? 0 : cw * (L.cellW < 170 ? 0.07 : 0.035);
  const fingerStep = Math.max(2, 1.9 * s);
  /** Finger relief only where the lines are at least 3 px apart; finer than that it would alias. */
  const fingerRelief = fingerStep >= 3;

  // Crystalline grain of mono silicon: faint in the colour, a little stronger in the relief. Each canvas takes it from
  // a tile backed like itself (GPU or CPU memory); a pattern that crosses over makes the main thread wait for the GPU.
  let grain: { color: CanvasPattern; relief: CanvasPattern } | null = null;
  if (!poly) {
    const img = new ImageData(128, 128);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = rand() < 0.5 ? 0 : 255;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = Math.round(rand() * 255);
    }
    const tile = (target: CanvasRenderingContext2D, settings?: CanvasRenderingContext2DSettings) => {
      const t = canvas(128, 128);
      t.getContext('2d', settings)!.putImageData(img, 0, 0);
      return target.createPattern(t, 'repeat')!;
    };
    grain = { color: tile(c), relief: tile(z, { willReadFrequently: true }) };
  }

  for (let r = 0; r < L.rows; r++) {
    const y = rowTop(L, r) * s;
    const top = spec.halfCut ? (r % 2 === 0 ? chamfer : 0) : chamfer;
    const bottom = spec.halfCut ? (r % 2 === 1 ? chamfer : 0) : chamfer;
    for (let k = 0; k < L.cols; k++) {
      const x = colLeft(L, k) * s;
      const light = poly ? 30 + (rand() - 0.5) * 6 : 11 + (rand() - 0.5) * 2;
      const hue = poly ? 216 : 223;
      const sat = poly ? 56 : 48;
      const grad = c.createLinearGradient(x, y, x + cw * 0.3, y + ch);
      grad.addColorStop(0, `hsl(${hue} ${sat}% ${light + 0.9}%)`);
      grad.addColorStop(0.55, `hsl(${hue + 4} ${sat - 6}% ${light}%)`);
      grad.addColorStop(1, `hsl(${hue} ${sat}% ${light - 0.6}%)`);
      cellPath(c, x, y, cw, ch, top, bottom);
      c.fillStyle = grad;
      c.fill();
      m.fillStyle = 'rgb(0,112,0)';
      cellPath(m, x, y, cw, ch, top, bottom);
      m.fill();
      z.fillStyle = 'rgb(128,128,128)';
      cellPath(z, x, y, cw, ch, top, bottom);
      z.fill();

      for (const g of [c, z]) {
        g.save();
        cellPath(g, x, y, cw, ch, top, bottom);
        g.clip();
      }
      if (poly) {
        for (let f = 0; f < 26; f++) {
          const fx = x + rand() * cw;
          const fy = y + rand() * ch;
          const size = (0.12 + rand() * 0.3) * cw;
          const facet = new Path2D();
          facet.moveTo(fx, fy);
          for (let v = 0; v < 4; v++) facet.lineTo(fx + (rand() - 0.5) * size, fy + (rand() - 0.5) * size);
          facet.closePath();
          c.fillStyle = `hsl(${212 + rand() * 10} ${48 + rand() * 18}% ${light + (rand() - 0.5) * 12}% / 0.55)`;
          c.fill(facet);
          // Each crystal grain sits a little higher or lower, so its edges catch the light.
          const level = Math.round(118 + rand() * 20);
          z.fillStyle = `rgb(${level} ${level} ${level} / 0.6)`;
          z.fill(facet);
        }
      }
      if (grain) {
        z.globalAlpha = 0.12;
        z.fillStyle = grain.relief;
        z.fillRect(x, y, cw, ch);
        z.globalAlpha = 1;
      }
      c.fillStyle = poly ? 'rgb(225 230 240 / 0.1)' : dark ? 'rgb(120 130 150 / 0.03)' : 'rgb(170 180 205 / 0.05)';
      z.fillStyle = 'rgb(176,176,176)';
      for (let fy = y + fingerStep / 2; fy < y + ch; fy += fingerStep) {
        c.fillRect(x, fy, cw, 0.6);
        if (fingerRelief) z.fillRect(x, fy - 0.2, cw, 1);
      }
      c.restore();
      z.restore();
    }
    await slice();
  }

  // Colour grain over the silicon only: source-atop keeps the gaps clear.
  if (grain) {
    c.save();
    c.globalCompositeOperation = 'source-atop';
    c.globalAlpha = 0.045;
    c.fillStyle = grain.color;
    c.fillRect(0, 0, w, h);
    c.restore();
  }

  const busbars = L.cellW >= 200 ? 18 : L.cellW >= 175 ? 16 : L.cellW >= 160 ? 9 : 5;
  const thin = busbars > 6;
  const bw = thin ? Math.max(0.9, 0.32 * s) : Math.max(1, 1.2 * s);
  const ribbonColor = dark ? 'rgb(34 36 41)' : 'rgb(204 208 214)';
  const ribbonSurface = dark ? 'rgb(0,120,90)' : 'rgb(0,105,210)';
  const reach = 6 * s;
  const strip = Math.max(2, 4 * s);
  const perBlock = L.rows / L.blocks;

  /** Ribbon or busbar; `round` wires get a soft shoulder in the height map so they catch light like a cylinder. */
  const ribbon = (x: number, y: number, rw: number, rh: number, alpha: number, round = false) => {
    c.globalAlpha = alpha;
    c.fillStyle = ribbonColor;
    c.fillRect(x, y, rw, rh);
    c.globalAlpha = 1;
    m.fillStyle = ribbonSurface;
    m.fillRect(x, y, rw, rh);
    if (round) {
      z.fillStyle = 'rgb(170,170,170)';
      z.fillRect(x - 1, y, rw + 2, rh);
    }
    z.fillStyle = round ? 'rgb(225,225,225)' : 'rgb(196,196,196)';
    z.fillRect(x, y, rw, rh);
  };

  for (let b = 0; b < L.blocks; b++) {
    const yTop = rowTop(L, b * perBlock) * s - reach;
    const yBottom = (rowTop(L, (b + 1) * perBlock - 1) + L.cellH) * s + reach;
    for (let k = 0; k < L.cols; k++) {
      const x = colLeft(L, k) * s;
      for (let i = 0; i < busbars; i++) ribbon(x + ((i + 0.5) * cw) / busbars - bw / 2, yTop, bw, yBottom - yTop, thin ? 0.3 : 0.9, thin);
      await slice();
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
      ribbon(xs, b === 0 ? yBottom : yTop - strip, xe - xs, strip * 0.6, 0.7);
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

  return { color, surface, relief, normal: await toNormal(height, 3) };
}

/** Satin-brushed aluminium as a 256 px normal tile: streaks run along v, the extrusion direction of the frame. */
export function drawBrushed(): Promise<HTMLCanvasElement> {
  const size = 256;
  const height = canvas(size, size);
  const z = height.getContext('2d', { willReadFrequently: true })!;
  const img = z.createImageData(size, size);
  const rand = seeded('brushed');
  const streaks = Array.from({ length: size }, () => rand());
  for (let x = 0; x < size; x++) {
    const across = (streaks[x] + streaks[(x + 1) % size]) / 2 - 0.5;
    for (let y = 0; y < size; y++) {
      const i = (y * size + x) * 4;
      img.data[i] = 128 + across * 80 + (rand() - 0.5) * 10;
      img.data[i + 3] = 255;
    }
  }
  z.putImageData(img, 0, 0);
  return toNormal(height, 1.5);
}

const fmt = (n: number) => String(Math.round(n * 100) / 100);

/** Rear rating label from the datasheet: model, STC ratings, system voltage, size and standards. */
export function drawLabel(spec: ModuleSpec, standards: boolean): HTMLCanvasElement {
  const W = 1024;
  const H = 640;
  const cv = canvas(W, H);
  const c = cv.getContext('2d')!;
  const sans = '"DM Sans Variable", "DM Sans", sans-serif';
  const mono = '"IBM Plex Mono", monospace';
  c.fillStyle = '#f2f2ee';
  c.fillRect(0, 0, W, H);
  c.fillStyle = '#111113';
  c.fillRect(0, 0, W, 116);
  c.fillStyle = '#f2f2ee';
  c.font = `700 62px ${sans}`;
  c.fillText('PEIMAR', 44, 82);
  c.font = `500 44px ${mono}`;
  c.textAlign = 'right';
  c.fillText(spec.model, W - 44, 78);
  const r = spec.rating;
  const rows: [string, string][] = [
    ['Maximum power (Pmax)', spec.power ? `${spec.power} W` : '—'],
    ...(r
      ? ([
          ['Open-circuit voltage (Voc)', `${fmt(r.voc)} V`],
          ['Short-circuit current (Isc)', `${fmt(r.isc)} A`],
          ['Voltage at Pmax (Vmp)', `${fmt(r.vmp)} V`],
          ['Current at Pmax (Imp)', `${fmt(r.imp)} A`],
          ['Maximum system voltage', `${r.vdcMax} V DC`],
          ...(r.fuse ? ([['Maximum series fuse', `${r.fuse} A`]] as [string, string][]) : []),
        ] as [string, string][])
      : []),
    ['Dimensions', `${spec.height} × ${spec.width} × ${spec.depth} mm`],
  ];
  const top = 168;
  const step = Math.min(52, 380 / rows.length);
  rows.forEach(([k, v], i) => {
    const y = top + i * step;
    c.textAlign = 'left';
    c.fillStyle = '#55555a';
    c.font = `400 29px ${sans}`;
    c.fillText(k, 44, y);
    c.textAlign = 'right';
    c.fillStyle = '#111113';
    c.font = `500 31px ${mono}`;
    c.fillText(v, W - 44, y);
    c.fillStyle = 'rgb(17 17 19 / 0.14)';
    c.fillRect(44, y + 15, W - 88, 2);
  });
  c.textAlign = 'left';
  c.fillStyle = '#55555a';
  c.font = `400 24px ${mono}`;
  c.fillText('STC: 1000 W/m², 25 °C, AM 1.5', 44, H - 40);
  if (standards) {
    c.textAlign = 'right';
    c.fillStyle = '#111113';
    c.fillText('IEC 61215 · IEC 61730', W - 44, H - 40);
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
