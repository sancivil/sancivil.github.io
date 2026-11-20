import { Color, Group, MeshStandardMaterial, PerspectiveCamera, Scene, Vector3 } from 'three';
import type { Mesh } from 'three';
import { buildModule } from './module.ts';
import { addLights, createRenderer, deg, device, environment, isRtl, watchVisibility } from './stage.ts';
import type { SunPosition } from './sun.ts';
import { smooth } from './timeline.ts';
import type { ModuleSpec } from './types.ts';

const FOV = 32;

/** The lens frames 1.1 × the box height at every size, so the perspective never changes with the layout. */
const FRAME = 1.1;
const PITCH = deg(-11);
const YAW = deg(-30);
const DRIFT = deg(8);
/** Scroll-away pose: share of the yaw that turns toward face-on, recession (× distance) and lift (× module height). */
const AWAY = { turn: 0.72, pitch: 0.55, recede: 0.32, lift: 0.07 };

const step = (a: number, b: number, x: number) => smooth(Math.min(1, Math.max(0, (x - a) / (b - a))));

/** Sunlight colour by elevation (°): deep gold at the horizon, warm white by mid-morning. */
const SUN_STOPS: [number, string][] = [
  [0, '#ff9a52'],
  [7, '#ffc68c'],
  [16, '#ffe4c2'],
  [32, '#fff4e6'],
  [60, '#fffcf6'],
];
const sunColor = (h: number, out: Color) => {
  const i = SUN_STOPS.findIndex(([e]) => e > h);
  if (i <= 0) return out.set(SUN_STOPS[i === 0 ? 0 : SUN_STOPS.length - 1][1]);
  const [e0, c0] = SUN_STOPS[i - 1];
  const [e1, c1] = SUN_STOPS[i];
  return out.set(c0).lerp(new Color(c1), (h - e0) / (e1 - e0));
};

interface Look {
  dir: Vector3;
  key: Color;
  keyI: number;
  rim: Color;
  rimI: number;
  exposure: number;
  env: number;
  sweep: Color;
  sweepI: number;
  /** Seconds per sweep cycle. */
  period: number;
}

/**
 * The light of a sun position on a south-facing module seen from the front: east is +x (mirrored
 * in RTL with the composition), up is +y, south is toward the camera. The azimuth is compressed so
 * the key never drops behind the glass. Below the horizon the key turns into a cool, dim moonlight.
 */
function look(sun: SunPosition, side: number): Look {
  const day = step(-6, 3, sun.elevation);
  const h = deg(Math.max(6, sun.elevation));
  const phi = deg(Math.max(-58, Math.min(58, (sun.azimuth - 180) * 0.65)));
  const sunDir = new Vector3(-side * Math.cos(h) * Math.sin(phi), Math.sin(h), Math.cos(h) * Math.cos(phi));
  const moonDir = new Vector3(-0.42 * side, 0.64, 0.64).normalize();
  const low = 1 - step(3, 18, sun.elevation);
  const warm = sunColor(Math.max(0, sun.elevation), new Color());
  const mix = (night: Color, dayC: Color) => night.clone().lerp(dayC, day);
  return {
    dir: moonDir.lerp(sunDir, day).normalize(),
    key: mix(new Color('#cfdbff'), warm),
    keyI: 2 + day * (0.5 * step(2, 30, sun.elevation) - 0.4),
    rim: mix(new Color('#a9bcff'), new Color('#fff0d8').lerp(new Color('#ffb768'), low)),
    rimI: 1.6 + day * (0.5 * low),
    exposure: 1.06 - 0.06 * day,
    env: 1.15 - 0.15 * day,
    sweep: mix(new Color(0.78, 0.86, 1), new Color(1, 0.96, 0.88).lerp(new Color(1, 0.78, 0.52), low)),
    sweepI: 0.38 - 0.08 * day,
    period: 11 - 5 * day,
  };
}

/**
 * Framing per box: module height as a share of the box height, clear space above its top edge and
 * inside the end edge (px), and the widest share of the box it may cover. The top edge always clears
 * the header; the lower part runs behind the spec strip (or the phone/tablet fade) and past the end edge.
 */
function framing(w: number, h: number) {
  const phone = matchMedia('(max-width: 720px)').matches;
  return {
    k: phone ? 1.06 : 1.1,
    top: Math.min(88, Math.max(28, 0.085 * h)),
    end: phone ? 0.05 * w : Math.min(64, 0.06 * w),
    maxW: phone ? 0.66 : 0.58,
  };
}

export function mountHero(host: HTMLElement, spec: ModuleSpec, sun: SunPosition) {
  const canvas = host.querySelector('canvas')!;
  const rtl = isRtl(host);
  const side = rtl ? -1 : 1;
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const phone = matchMedia('(max-width: 720px)');

  const renderer = createRenderer(canvas);
  const scene = new Scene();
  const env = environment(renderer, rtl);
  const lights = addLights(scene, rtl, 1.9, 1.6);
  const camera = new PerspectiveCamera(FOV, 1, 0.05, 60);

  const pv = buildModule(spec, {
    textureMax: device.textureMax,
    anisotropy: Math.min(8, renderer.capabilities.getMaxAnisotropy()),
    envMap: env,
    envIntensity: 1,
    envRotation: 0,
    lineColor: '#ffffff',
  });
  const pivot = new Group();
  pivot.rotation.order = 'YXZ';
  pivot.add(pv.root);
  scene.add(pivot);

  const reflective = new Map<MeshStandardMaterial, number>();
  pv.root.traverse((o) => {
    const m = (o as Mesh).material;
    for (const x of Array.isArray(m) ? m : m ? [m] : []) {
      if (x instanceof MeshStandardMaterial && x.envMap) reflective.set(x, x.envMapIntensity);
    }
  });
  let target = look(sun, side);
  const lit = look(sun, side);
  let envApplied = -1;
  /** Eases the applied light toward the target (k = 1 snaps). */
  const applyLook = (k: number) => {
    lit.dir.lerp(target.dir, k).normalize();
    lit.key.lerp(target.key, k);
    lit.rim.lerp(target.rim, k);
    lit.sweep.lerp(target.sweep, k);
    for (const p of ['keyI', 'rimI', 'exposure', 'env', 'sweepI', 'period'] as const) lit[p] += (target[p] - lit[p]) * k;
    lights.key.color.copy(lit.key);
    lights.key.intensity = lit.keyI;
    lights.rim.color.copy(lit.rim);
    lights.rim.intensity = lit.rimI;
    renderer.toneMappingExposure = lit.exposure;
    pv.sweepTint.value.copy(lit.sweep);
    if (Math.abs(lit.env - envApplied) > 0.002) {
      envApplied = lit.env;
      reflective.forEach((base, m) => (m.envMapIntensity = base * lit.env));
    }
  };
  applyLook(1);
  pv.sweepFlip.value = lit.dir.x > 0 ? 1 : 0;

  let last = performance.now();
  let cycle = 0.7;
  let tx = 0;
  let ty = 0;
  let px = 0;
  let py = 0;
  let away = 0;
  let awayTarget = 0;
  let dist = 1;

  const render = (now: number) => {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (!still) applyLook(1 - Math.exp(-dt * 5));
    px += (tx - px) * 0.05;
    py += (ty - py) * 0.05;
    away += (awayTarget - away) * 0.12;
    if (Math.abs(awayTarget - away) < 1e-4) away = awayTarget;
    const a = smooth(away) * (phone.matches ? 0.5 : 1);
    const drift = still ? 0 : DRIFT * Math.sin((2 * Math.PI * now) / 14000) * (1 - a);
    pivot.rotation.set(PITCH * (1 - AWAY.pitch * a) + py * deg(2), side * (YAW * (1 - AWAY.turn * a) + drift) + px * deg(3), 0);
    pivot.position.set(0, AWAY.lift * pv.size.h * a, -AWAY.recede * dist * a);
    if (!still) {
      // A soft band glides back and forth across the glass and never leaves it, so the module is
      // always lit; one return trip takes two light periods. The side follows the light at each turn.
      cycle += dt / (lit.period * 2);
      if (cycle >= 1) {
        cycle %= 1;
        pv.sweepFlip.value = lit.dir.x > 0 ? 1 : 0;
      }
      const wave = 0.5 - 0.5 * Math.cos(2 * Math.PI * cycle);
      pv.sweep.value = 0.12 + 0.76 * wave;
      pv.sweepStrength.value = lit.sweepI * (0.72 + 0.28 * Math.sin(Math.PI * wave));
    }
    renderer.render(scene, camera);
    if (!host.classList.contains('is-ready')) host.classList.add('is-ready');
  };

  let running = false;
  let raf = 0;
  const frame = (now: number) => {
    render(now);
    raf = requestAnimationFrame(frame);
  };
  const setRunning = (on: boolean) => {
    if (on === running) return;
    running = on;
    if (on) raf = requestAnimationFrame(frame);
    else cancelAnimationFrame(raf);
  };

  const corners = pv.points(0);
  const tan = Math.tan(deg(FOV / 2));
  /** Screen extents in px from the module centre over the whole drift and parallax range. */
  const extents = (k: number, h: number) => {
    const dist = (pv.size.h * FRAME) / (2 * k * tan);
    const unit = (FRAME * h) / 2 / tan;
    const e = { dist, top: 0, start: 0, end: 0, endTop: 0 };
    pivot.position.set(0, 0, 0);
    for (const yaw of [-1, 0, 1]) {
      for (const pitch of [-1, 1]) {
        pivot.rotation.set(PITCH + pitch * deg(2), side * (YAW + yaw * DRIFT) + yaw * deg(3), 0);
        pivot.updateMatrixWorld(true);
        for (const p of corners) {
          const v = p.clone().applyMatrix4(pivot.matrixWorld);
          const s = unit / (dist - v.z);
          const x = side * v.x * s;
          e.top = Math.min(e.top, -v.y * s);
          e.start = Math.min(e.start, x);
          e.end = Math.max(e.end, x);
          if (p.y > 0) e.endTop = Math.max(e.endTop, x);
        }
      }
    }
    return e;
  };

  const resize = () => {
    const w = host.clientWidth;
    const h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    const f = framing(w, h);
    // Keep the module's top edge below the sun chip where the chip is shown.
    const chip = host.querySelector<HTMLElement>('[data-sun]');
    if (chip?.offsetParent) f.top = Math.max(f.top, chip.offsetTop + chip.offsetHeight + 14);
    let e = extents(f.k, h);
    const span = e.end - e.start;
    if (span > f.maxW * w) e = extents((f.k * f.maxW * w) / span, h);
    const cx = rtl ? f.end + e.endTop : w - f.end - e.endTop;
    const cy = f.top - e.top;
    const fullW = FRAME * w;
    const fullH = FRAME * h;
    camera.aspect = w / h;
    camera.setViewOffset(fullW, fullH, fullW / 2 - cx, fullH / 2 - cy, w, h);
    camera.position.set(0, 0, e.dist);
    dist = e.dist;
    camera.updateProjectionMatrix();
    render(performance.now());
  };
  const ro = new ResizeObserver(resize);
  ro.observe(host);

  const onPointer = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    tx = (e.clientX / innerWidth) * 2 - 1;
    ty = (e.clientY / innerHeight) * 2 - 1;
  };
  if (!still && !device.touch) window.addEventListener('pointermove', onPointer, { passive: true });

  const stopWatching = watchVisibility(host, (visible) => setRunning(visible && !still));

  return {
    /** Lights the module for a sun position; eased while animating, immediate with reduced motion. */
    setSun(next: SunPosition) {
      target = look(next, side);
      if (still) {
        applyLook(1);
        render(performance.now());
      }
    },
    /** Share of the hero scrolled away (0–1): the module turns toward face-on, recedes and lifts. */
    setScroll(p: number) {
      awayTarget = still ? 0 : Math.min(1, Math.max(0, p));
    },
    dispose() {
      setRunning(false);
      stopWatching();
      ro.disconnect();
      window.removeEventListener('pointermove', onPointer);
      pv.dispose();
      env.dispose();
      renderer.dispose();
    },
  };
}
