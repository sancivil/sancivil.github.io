import { Group, PerspectiveCamera, Scene } from 'three';
import { buildModule } from './module.ts';
import { addLights, createRenderer, deg, device, environment, fitDistance, isRtl, watchVisibility } from './stage.ts';
import { anatomyAt } from './timeline.ts';
import type { ModuleSpec } from './types.ts';

const FOV = 32;

/** Scroll-scrubbed exploded view: front three-quarter view → side view while the layers separate. */
export function mountAnatomy(stage: HTMLElement, spec: ModuleSpec) {
  const canvas = stage.querySelector('canvas')!;
  const side = isRtl(stage) ? -1 : 1;

  const renderer = createRenderer(canvas);
  const scene = new Scene();
  const env = environment(renderer);
  addLights(scene, side < 0, 1.9, 1.7);
  const camera = new PerspectiveCamera(FOV, 1, 0.05, 60);

  const pv = buildModule(spec, {
    textureMax: device.textureMax,
    anisotropy: Math.min(8, renderer.capabilities.getMaxAnisotropy()),
    envMap: env,
    envIntensity: 0.75,
    envRotation: 0,
    lineColor: '#ffffff',
  });
  const pivot = new Group();
  pivot.rotation.order = 'YXZ';
  pivot.add(pv.root);
  scene.add(pivot);

  let progress = 0;
  const pose = (p: number) => {
    const s = anatomyAt(p);
    pivot.rotation.set(deg(-8 - 7 * s.turn), side * deg(-30 - 38 * s.turn), 0);
    pv.setExplode(s.layers);
    pv.root.position.z = -pv.center(s.layers);
    return s;
  };

  let visible = false;
  let dirty = true;
  let raf = 0;
  const draw = () => {
    raf = 0;
    if (!visible) return;
    pose(progress);
    renderer.render(scene, camera);
    dirty = false;
    stage.classList.add('is-ready');
  };
  const requestDraw = () => {
    dirty = true;
    if (visible && !raf) raf = requestAnimationFrame(draw);
  };

  const resize = () => {
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    let d = 0;
    for (const p of [0, 0.3, 0.6, 1]) {
      const s = pose(p);
      pivot.updateMatrixWorld(true);
      const pts = pv.points(s.layers).map((v) => v.applyMatrix4(pv.root.matrixWorld));
      d = Math.max(d, fitDistance(pts, FOV, camera.aspect, 0.88, 0.86));
    }
    camera.position.set(0, 0, d);
    camera.updateProjectionMatrix();
    requestDraw();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(stage);

  const stopWatching = watchVisibility(
    stage,
    (v) => {
      visible = v;
      if (v && dirty) requestDraw();
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
      cancelAnimationFrame(raf);
      stopWatching();
      ro.disconnect();
      pv.dispose();
      env.dispose();
      renderer.dispose();
    },
  };
}
