import { Fog, Group, PerspectiveCamera, Scene, Vector3 } from 'three';
import { buildModule } from './module.ts';
import { addLights, createRenderer, deg, device, environment, fitDistance, isRtl, maxAnisotropy, studio, watchVisibility } from './stage.ts';
import { anatomyAt, smooth } from './timeline.ts';
import type { ModuleSpec } from './types.ts';

const FOV = 32;
/** The camera moves in by this share of its distance while the stack separates. */
const DOLLY = 0.08;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/**
 * Scroll-scrubbed exploded view: front three-quarter view → side view while the layers separate.
 * Each separated layer gets a hairline callout from a point on the layer to its numbered label in a
 * column on the end side of the stage ([data-callouts]: one <g data-line> and one [data-tag] per layer).
 */
export function mountAnatomy(stage: HTMLElement, spec: ModuleSpec) {
  const canvas = stage.querySelector('canvas')!;
  const side = isRtl(stage) ? -1 : 1;
  const callouts = stage.querySelector<HTMLElement>('[data-callouts]');
  const svg = callouts?.querySelector('svg') ?? null;
  const lines = callouts ? [...callouts.querySelectorAll<SVGGElement>('[data-line]')] : [];
  const tags = callouts ? [...callouts.querySelectorAll<HTMLElement>('[data-tag]')] : [];

  const renderer = createRenderer(canvas);
  const scene = new Scene();
  let env = environment(renderer, side < 0);
  addLights(scene, side < 0, 1.7, 1.8);
  const fog = new Fog(0x0b0b0c, 1, 10);
  scene.fog = fog;
  const camera = new PerspectiveCamera(FOV, 1, 0.05, 60);

  const pv = buildModule(spec, {
    textureMax: device.textureMax,
    anisotropy: maxAnisotropy(renderer),
    envMap: env,
    envIntensity: 0.9,
    envRotation: 0,
    lineColor: '#ffffff',
  });
  const pivot = new Group();
  pivot.rotation.order = 'YXZ';
  pivot.add(pv.root);
  scene.add(pivot);

  let progress = 0;
  let base = 6;
  let width = 1;
  let height = 1;
  let reserve = 0;
  let top = 0;
  let tagWidths: number[] = [];

  const pose = (p: number) => {
    const s = anatomyAt(p);
    pivot.rotation.set(deg(-8 - 7 * s.turn), side * deg(-30 - 38 * s.turn), 0);
    pv.setExplode(s.layers);
    pv.root.position.z = -pv.center(s.layers);
    const z = base * (1 - DOLLY * smooth(p));
    camera.position.set(0, 0, z);
    // Depth cue: the back of the stack sinks slightly into the ink.
    fog.near = z - 0.3;
    fog.far = z + 4.5;
    return s;
  };

  const v = new Vector3();
  const project = (p: Vector3) => {
    v.copy(p).applyMatrix4(pv.root.matrixWorld).project(camera);
    return { x: ((v.x + 1) / 2) * width, y: ((1 - v.y) / 2) * height };
  };

  const drawCallouts = (s: ReturnType<typeof anatomyAt>) => {
    if (!callouts) return;
    const gap = reserve > 60 ? 30 : 26;
    const anchors = tags.map((_, i) => project(pv.anchor(i, s.layers, side)));
    const ys = anchors.map((a) => a.y);
    for (let i = 0; i < ys.length; i++) ys[i] = Math.max(ys[i], i ? ys[i - 1] + gap : top);
    for (let i = ys.length - 1; i >= 0; i--) ys[i] = Math.min(ys[i], i < ys.length - 1 ? ys[i + 1] - gap : height - 20);
    const end = side > 0 ? width - reserve + 6 : reserve - 6;
    tags.forEach((tag, i) => {
      const a = anchors[i];
      const y = ys[i];
      const knee = end - side * 26;
      const d = side * (knee - a.x) > 10 ? `M${a.x},${a.y}L${knee},${y}L${end},${y}` : `M${a.x},${a.y}L${end},${y}`;
      const k = s.layers[i];
      const g = lines[i];
      g.firstElementChild!.setAttribute('d', d);
      g.lastElementChild!.setAttribute('transform', `translate(${a.x} ${a.y})`);
      g.style.opacity = k > 0.01 ? '1' : '0';
      g.style.setProperty('--draw', String(1 - k));
      g.classList.toggle('is-active', i === s.active);
      const x = side > 0 ? end + 8 : end - 8 - tagWidths[i];
      tag.style.transform = `translate(${x}px, ${y}px) translateY(-50%)`;
      tag.style.opacity = String(clamp01((k - 0.55) / 0.45));
      tag.classList.toggle('is-active', i === s.active);
    });
  };

  let visible = false;
  let dirty = true;
  let raf = 0;
  let disposed = false;
  /** After the first frame: reflections from the photographed studio (not on phones). */
  const upgrade = async () => {
    const s = await studio(renderer, side < 0);
    if (!s) return;
    if (disposed) return s.texture.dispose();
    pv.setEnvironment(s.texture, 0.9 * s.gain, s.rotation);
    env.dispose();
    env = s.texture;
    requestDraw();
  };
  const draw = () => {
    raf = 0;
    if (!visible) return;
    const s = pose(progress);
    renderer.render(scene, camera);
    drawCallouts(s);
    dirty = false;
    if (!stage.classList.contains('is-ready')) {
      stage.classList.add('is-ready');
      void upgrade();
    }
  };
  const requestDraw = () => {
    dirty = true;
    if (visible && !raf) raf = requestAnimationFrame(draw);
  };

  const resize = () => {
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    if (!w || !h) return;
    width = w;
    height = h;
    renderer.setSize(w, h, false);
    const named = w >= 560;
    callouts?.classList.toggle('is-compact', !named);
    reserve = callouts ? (named ? Math.min(230, w * 0.3) : 46) : 0;
    tagWidths = tags.map((t) => t.offsetWidth);
    const header = parseFloat(getComputedStyle(stage).getPropertyValue('--header-h')) || 72;
    top = Math.min(h * 0.3, header + 20);
    camera.aspect = w / h;
    camera.setViewOffset(w, h, (side * reserve) / 2, 0, w, h);
    camera.updateProjectionMatrix();
    const aspect = (w - reserve) / h;
    let d = 0;
    for (const p of [0, 0.3, 0.6, 0.8, 1]) {
      const s = pose(p);
      pivot.updateMatrixWorld(true);
      const pts = pv.points(s.layers).map((q) => q.applyMatrix4(pv.root.matrixWorld));
      d = Math.max(d, fitDistance(pts, FOV, aspect, 0.88, 0.84) / (1 - DOLLY * smooth(p)));
    }
    base = d;
    svg?.setAttribute('viewBox', `0 0 ${w} ${h}`);
    requestDraw();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(stage);

  const stopWatching = watchVisibility(
    stage,
    (on) => {
      visible = on;
      if (on && dirty) requestDraw();
    },
    '100px',
  );

  return {
    setProgress(p: number) {
      if (p === progress) return;
      progress = p;
      requestDraw();
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      stopWatching();
      ro.disconnect();
      pv.dispose();
      env.dispose();
      renderer.dispose();
    },
  };
}
