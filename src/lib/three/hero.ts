import { Group, PerspectiveCamera, Scene } from 'three';
import { buildModule } from './module.ts';
import { addLights, createRenderer, deg, device, environment, isRtl, watchVisibility } from './stage.ts';
import { smooth } from './timeline.ts';
import type { ModuleSpec } from './types.ts';

const FOV = 32;

/** The lens frames 1.1 × the box height at every size, so the perspective never changes with the layout. */
const FRAME = 1.1;
const PITCH = deg(-11);
const YAW = deg(-30);
const DRIFT = deg(8);

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

export function mountHero(host: HTMLElement, spec: ModuleSpec) {
  const canvas = host.querySelector('canvas')!;
  const rtl = isRtl(host);
  const side = rtl ? -1 : 1;
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const renderer = createRenderer(canvas);
  const scene = new Scene();
  const env = environment(renderer);
  addLights(scene, rtl, 1.9, 1.6);
  const camera = new PerspectiveCamera(FOV, 1, 0.05, 60);

  const pv = buildModule(spec, {
    textureMax: device.textureMax,
    anisotropy: Math.min(8, renderer.capabilities.getMaxAnisotropy()),
    envMap: env,
    envIntensity: 0.8,
    envRotation: 0,
    lineColor: '#ffffff',
  });
  pv.sweepFlip.value = rtl ? 1 : 0;
  const pivot = new Group();
  pivot.rotation.order = 'YXZ';
  pivot.add(pv.root);
  scene.add(pivot);

  const start = performance.now();
  let tx = 0;
  let ty = 0;
  let px = 0;
  let py = 0;

  const render = (now: number) => {
    const t = (now - start) / 1000;
    px += (tx - px) * 0.05;
    py += (ty - py) * 0.05;
    const drift = still ? 0 : deg(8) * Math.sin((2 * Math.PI * t) / 14);
    pivot.rotation.set(PITCH + py * deg(2), side * (YAW + drift) + px * deg(3), 0);
    if (!still) {
      const phase = (t % 6) / 1.8;
      pv.sweep.value = -0.3 + 1.6 * smooth(Math.min(1, phase));
      pv.sweepStrength.value = phase < 1 ? 0.3 * Math.sin(Math.PI * phase) : 0;
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
