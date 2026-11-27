import {
  CanvasTexture,
  DirectionalLight,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  SRGBColorSpace,
  Scene,
  Spherical,
  Vector3,
} from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { buildModule } from './module.ts';
import type { MarkKey, PvModule } from './module.ts';
import { deg, detailTextureMax, fitDistance, isRtl, prepare, setUp, watchVisibility } from './stage.ts';
import { drawShadow } from './textures.ts';
import type { ModuleSpec } from './types.ts';

const FOV = 30;
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

type View = { radius: number; phi: number; theta: number };
type Tween<T> = { from: T; to: T; start: number; dur: number };

export interface ViewerElements {
  stage: HTMLElement;
  canvas: HTMLCanvasElement;
  /** Overlay holding an <svg> and labels [data-dim="w|h|d"]. */
  dims: HTMLElement;
  /** Space covered by overlaid UI at the top and bottom of the stage, in CSS px. */
  insets: () => { top: number; bottom: number };
  /** Hotspot layer: buttons [data-spot="glass|cells|frame|junction|label"] (aria-expanded marks the open one) and one [data-card]. */
  spots?: HTMLElement;
}

/** Builds the scene a slice at a time; resolves once its first frame is ready to draw (see `prepare`). */
export async function mountViewer(el: ViewerElements, initial: ModuleSpec) {
  const { stage, canvas } = el;
  const side = isRtl(stage) ? -1 : 1;

  const setup = await setUp(canvas, side < 0);
  const { renderer, anisotropy, photo } = setup;
  const scene = new Scene();
  let env = setup.env;
  let envStrength = 1;
  let envRotation = 0;
  const camera = new PerspectiveCamera(FOV, 1, 0.05, 60);
  // Key light rides with the camera so front, back and exploded views are all lit; warm rim stays put.
  const key = new DirectionalLight(0xffffff, 2.1);
  key.position.set(-2 * side, 3, 2);
  camera.add(key);
  const rim = new DirectionalLight(0xfff0d8, 0.6);
  rim.position.set(4 * side, 2.5, -3);
  scene.add(camera, rim);

  const controls = new OrbitControls(camera, canvas);
  controls.enabled = false;
  canvas.style.touchAction = 'pan-y pinch-zoom';
  controls.enableDamping = true;
  controls.dampingFactor = 0.09;
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.rotateSpeed = 0.75;
  controls.minPolarAngle = deg(45);
  controls.maxPolarAngle = deg(98);

  const shadowTexture = new CanvasTexture(drawShadow());
  shadowTexture.colorSpace = SRGBColorSpace;
  const shadowGeometry = new PlaneGeometry(1, 1);
  const shadowMaterial = new MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false, toneMapped: false });
  const shadow = new Mesh(shadowGeometry, shadowMaterial);
  shadow.rotation.x = -Math.PI / 2;
  scene.add(shadow);

  const spotEls = el.spots ? [...el.spots.querySelectorAll<HTMLElement>('[data-spot]')] : [];
  const card = el.spots?.querySelector<HTMLElement>('[data-card]') ?? null;
  const spotPoint = new Vector3();
  const spotNormal = new Vector3();
  const toCamera = new Vector3();
  /** World position of a hotspot (left in spotPoint) and how squarely its face looks at the camera (−1…1). */
  const facing = (key: MarkKey) => {
    const m = pv.marks[key];
    spotPoint.copy(m.at);
    spotPoint.x *= side;
    spotPoint.applyMatrix4(pv.layers[m.layer].matrixWorld);
    spotNormal.set(0, 0, m.face).transformDirection(pv.root.matrixWorld);
    return spotNormal.dot(toCamera.copy(camera.position).sub(spotPoint).normalize());
  };

  const svg = el.dims.querySelector('svg')!;
  const path = svg.querySelector('path')!;
  const labels = {
    w: el.dims.querySelector<HTMLElement>('[data-dim="w"]')!,
    h: el.dims.querySelector<HTMLElement>('[data-dim="h"]')!,
    d: el.dims.querySelector<HTMLElement>('[data-dim="d"]')!,
  };

  let pv: PvModule;
  let explode = 0;
  let fit = 6;
  let dimsOn = false;
  let visible = false;
  let raf = 0;
  let camTween: Tween<View> | null = null;
  let explodeTween: Tween<number> | null = null;
  const sph = new Spherical();

  const current = (): View => {
    sph.setFromVector3(camera.position.clone().sub(controls.target));
    return { radius: sph.radius, phi: sph.phi, theta: sph.theta };
  };
  const home = (): View => ({ radius: fit, phi: deg(80), theta: side * deg(-32) });
  const setView = (v: View) => {
    sph.set(v.radius, v.phi, v.theta);
    camera.position.setFromSpherical(sph).add(controls.target);
  };

  const request = () => {
    if (!raf && visible) raf = requestAnimationFrame(frame);
  };

  let disposed = false;
  /** After the first frame: reflections from the photographed studio (not on phones). Rebuilds keep it. */
  const upgrade = async () => {
    const s = await photo();
    if (!s) return;
    if (disposed) return s.texture.dispose();
    envStrength = s.gain;
    envRotation = s.rotation;
    pv.setEnvironment(s.texture, envStrength, envRotation);
    env.dispose();
    env = s.texture;
    request();
  };

  const goTo = (to: Partial<View>, dur = 800) => {
    const from = current();
    const dest = { ...from, ...to };
    const turn = dest.theta - from.theta;
    dest.theta = from.theta + ((((turn + Math.PI) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) - Math.PI;
    camTween = { from, to: dest, start: performance.now(), dur };
    request();
  };

  const applyExplode = () => {
    pv.setExplode(explode);
    pv.root.position.z = -pv.center(explode);
    let lo = Infinity;
    let hi = -Infinity;
    for (const p of pv.points(explode)) {
      lo = Math.min(lo, p.z);
      hi = Math.max(hi, p.z);
    }
    shadow.scale.set(pv.size.w * 1.7, (hi - lo) * 1.5 + 0.35, 1);
    shadow.position.y = -pv.size.h / 2 - 0.002;
  };

  const project = (x: number, y: number, z: number, w: number, h: number) => {
    const v = new Vector3(x, y, z).applyMatrix4(pv.root.matrixWorld).project(camera);
    return [((v.x + 1) / 2) * w, ((1 - v.y) / 2) * h];
  };

  const drawDims = () => {
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    const { w: W, h: H, d: D } = pv.size;
    const o = W * 0.07;
    const fz = pv.layers[5].position.z;
    const zf = D / 2 + fz;
    const zb = -D / 2 + fz;
    const ex = (side * W) / 2;
    const P = (x: number, y: number, z: number) => project(x, y, z, w, h);
    const lines = {
      w: [P(-W / 2, -H / 2, zf), P(-W / 2, -H / 2 - o, zf), P(W / 2, -H / 2 - o, zf), P(W / 2, -H / 2, zf)],
      h: [P(ex, -H / 2, zf), P(ex + side * o, -H / 2, zf), P(ex + side * o, H / 2, zf), P(ex, H / 2, zf)],
      d: [P(ex, H / 2, zb), P(ex, H / 2 + o, zb), P(ex, H / 2 + o, zf), P(ex, H / 2, zf)],
    };
    let d = '';
    for (const key of ['w', 'h', 'd'] as const) {
      const [e1, a, b, e2] = lines[key];
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      const tx = (b[0] - a[0]) / len;
      const ty = (b[1] - a[1]) / len;
      const sx = (tx - ty) * 4;
      const sy = (ty + tx) * 4;
      d += `M${e1}L${a}M${e2}L${b}M${a}L${b}`;
      d += `M${a[0] - sx},${a[1] - sy}L${a[0] + sx},${a[1] + sy}M${b[0] - sx},${b[1] - sy}L${b[0] + sx},${b[1] + sy}`;
      const nl = Math.hypot(a[0] - e1[0], a[1] - e1[1]) || 1;
      const nx = (a[0] - e1[0]) / nl;
      const ny = (a[1] - e1[1]) / nl;
      const push = key === 'd' ? 22 : 16;
      labels[key].style.transform = `translate(${(a[0] + b[0]) / 2 + nx * push}px, ${(a[1] + b[1]) / 2 + ny * push}px) translate(-50%, -50%)`;
    }
    path.setAttribute('d', d);
  };

  const drawSpots = () => {
    if (!el.spots || el.spots.hidden) return;
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    let open: [number, number] | null = null;
    let openAway = false;
    for (const spot of spotEls) {
      const d = facing(spot.dataset.spot as MarkKey);
      const v = spotPoint.project(camera);
      const x = ((v.x + 1) / 2) * w;
      const y = ((1 - v.y) / 2) * h;
      spot.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      spot.classList.toggle('is-away', d < 0.15);
      if (spot.getAttribute('aria-expanded') === 'true') {
        open = [x, y];
        openAway = d < 0.15;
      }
    }
    if (!card || card.hidden || !open) return;
    card.classList.toggle('is-away', openAway);
    const { top, bottom } = el.insets();
    const cw = card.offsetWidth;
    const ch = card.offsetHeight;
    const gap = 26;
    const fits = (cx: number) => cx >= 8 && cx + cw <= w - 8;
    const after = side > 0 ? open[0] + gap : open[0] - gap - cw;
    const before = side > 0 ? open[0] - gap - cw : open[0] + gap;
    const cx = fits(after) ? after : fits(before) ? before : Math.min(w - cw - 8, Math.max(8, open[0] - cw / 2));
    const cy = Math.min(h - bottom - ch, Math.max(Math.min(top, 16), open[1] - ch / 2));
    card.style.transform = `translate(${cx.toFixed(1)}px, ${Math.max(8, cy).toFixed(1)}px)`;
  };

  function frame(now: number) {
    raf = 0;
    let busy = false;
    if (camTween) {
      const k = Math.min(1, (now - camTween.start) / camTween.dur);
      const e = ease(k);
      const { from, to } = camTween;
      setView({
        radius: from.radius + (to.radius - from.radius) * e,
        phi: from.phi + (to.phi - from.phi) * e,
        theta: from.theta + (to.theta - from.theta) * e,
      });
      if (k >= 1) camTween = null;
      busy = true;
    }
    if (explodeTween) {
      const k = Math.min(1, (now - explodeTween.start) / explodeTween.dur);
      explode = explodeTween.from + (explodeTween.to - explodeTween.from) * ease(k);
      applyExplode();
      if (k >= 1) explodeTween = null;
      busy = true;
    }
    const moved = controls.update();
    renderer.render(scene, camera);
    if (dimsOn) drawDims();
    drawSpots();
    if (!stage.classList.contains('is-ready')) {
      stage.classList.add('is-ready');
      void upgrade();
    }
    if (busy || moved) request();
  }

  const layout = () => {
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    const { top, bottom } = el.insets();
    const safe = Math.max(120, h - top - bottom);
    const cy = (top + safe / 2) / h;
    const fullH = 2 * Math.max(cy, 1 - cy) * h;
    camera.aspect = w / fullH;
    camera.setViewOffset(w, fullH, 0, cy >= 0.5 ? 0 : fullH - h, w, h);
    camera.updateProjectionMatrix();
    const pts: Vector3[] = [];
    for (let a = 0; a < 360; a += 30) {
      for (const p of pv.points(0)) pts.push(p.applyAxisAngle(new Vector3(0, 1, 0), deg(a)));
    }
    const ratio = camTween ? 1 : current().radius / fit;
    fit = fitDistance(pts, FOV, camera.aspect, 0.86, (0.94 * safe) / fullH);
    controls.minDistance = fit * 0.55;
    controls.maxDistance = fit * 1.35;
    if (!camTween) setView({ ...current(), radius: fit * (Number.isFinite(ratio) && ratio > 0 ? ratio : 1) });
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    request();
  };

  let latest = 0;
  let building: Promise<unknown> = Promise.resolve();
  /**
   * Builds and prepares a module, then swaps it in. One build runs at a time, and a request that a newer one overtakes
   * before or during its build is dropped (resolves false): arrowing through the model chips builds the model the
   * reader stops on, not every model on the way.
   */
  const build = (next: ModuleSpec) => {
    const ticket = ++latest;
    const stale = () => disposed || ticket !== latest;
    const done = building.then(async () => {
      if (stale()) return false;
      const built = await buildModule(next, {
        textureMax: detailTextureMax(renderer),
        anisotropy,
        envMap: env,
        envIntensity: envStrength,
        envRotation,
        lineColor: '#0b0b0c',
      });
      if (!stale()) await prepare(renderer, built.root, camera, scene, built.textures);
      if (stale()) {
        built.dispose();
        return false;
      }
      if (pv) {
        scene.remove(pv.root);
        pv.dispose();
      }
      pv = built;
      pv.setEnvironment(env, envStrength, envRotation);
      scene.add(pv.root);
      applyExplode();
      labels.w.textContent = `${next.width} mm`;
      labels.h.textContent = `${next.height} mm`;
      labels.d.textContent = `${next.depth} mm`;
      return true;
    });
    // The next build waits for this one, failed or not; a failure still rejects this call.
    building = done.catch(() => {});
    return done;
  };

  await Promise.all([build(initial), prepare(renderer, shadow, camera, scene, [shadowTexture])]);
  controls.enabled = true;
  setView(home());
  layout();

  controls.addEventListener('change', request);
  controls.addEventListener('start', () => {
    camTween = null;
  });

  const onKey = (e: KeyboardEvent) => {
    const v = current();
    const moves: Record<string, Partial<View>> = {
      ArrowLeft: { theta: v.theta - deg(20) },
      ArrowRight: { theta: v.theta + deg(20) },
      ArrowUp: { phi: Math.max(controls.minPolarAngle, v.phi - deg(10)) },
      ArrowDown: { phi: Math.min(controls.maxPolarAngle, v.phi + deg(10)) },
    };
    if (!(e.key in moves)) return;
    e.preventDefault();
    goTo(moves[e.key], 450);
  };
  canvas.addEventListener('keydown', onKey);

  const ro = new ResizeObserver(layout);
  ro.observe(stage);
  const stopWatching = watchVisibility(stage, (v) => {
    visible = v;
    request();
  });

  return {
    async setSpec(next: ModuleSpec) {
      if (await build(next)) layout();
    },
    front() {
      goTo({ phi: deg(86), theta: 0, radius: fit });
    },
    back() {
      goTo({ phi: deg(86), theta: Math.PI, radius: fit });
    },
    reset() {
      goTo(home());
      this.setExplode(false);
    },
    setExplode(on: boolean) {
      explodeTween = { from: explode, to: on ? 1 : 0, start: performance.now(), dur: 900 };
      const v = current();
      if (on && Math.abs(Math.sin(v.theta)) < 0.45) {
        goTo({ theta: Math.cos(v.theta) > 0 ? side * deg(-42) : Math.PI + side * deg(42) }, 900);
      }
      request();
    },
    /** Shows or hides the hotspot layer. */
    setSpots(on: boolean) {
      if (el.spots) el.spots.hidden = !on;
      request();
    },
    /** Redraws hotspots and the open card; turns the module first when the hotspot faces away. */
    reveal(key?: MarkKey) {
      if (key && facing(key) < 0.15) {
        if (pv.marks[key].face > 0) this.front();
        else this.back();
      }
      request();
    },
    setDims(on: boolean) {
      dimsOn = on;
      el.dims.hidden = !on;
      request();
    },
    zoom(factor: number) {
      const r = current().radius * factor;
      goTo({ radius: Math.min(controls.maxDistance, Math.max(controls.minDistance, r)) }, 420);
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      stopWatching();
      ro.disconnect();
      canvas.removeEventListener('keydown', onKey);
      controls.dispose();
      pv.dispose();
      shadowGeometry.dispose();
      shadowMaterial.dispose();
      shadowTexture.dispose();
      env.dispose();
      renderer.dispose();
    },
  };
}

export type ModuleViewerScene = Awaited<ReturnType<typeof mountViewer>>;
