import { AgXToneMapping, DirectionalLight, PMREMGenerator, SRGBColorSpace, WebGLRenderer } from 'three';
import type { Scene, Texture, Vector3 } from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const shortSide = Math.min(screen.width, screen.height);
const coarse = matchMedia('(pointer: coarse)').matches;

export const device = {
  touch: coarse,
  /** DPR cap: 2 on desktop, 1.5 on touch devices (tablets and phones). */
  dpr: Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 2),
  /** Longest texture side: 2048, or 1024 on phones. */
  textureMax: shortSide <= 720 ? 1024 : 2048,
};

export function createRenderer(canvas: HTMLCanvasElement) {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(device.dpr);
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = AgXToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.setClearColor(0x000000, 0);
  return renderer;
}

export function environment(renderer: WebGLRenderer): Texture {
  const pmrem = new PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const texture = pmrem.fromScene(room, 0.04).texture;
  room.dispose();
  pmrem.dispose();
  return texture;
}

/** Key light from the upper front on the reading-start side, warm rim from behind on the end side. */
export function addLights(scene: Scene, rtl: boolean, key = 2.6, rim = 1.5) {
  const side = rtl ? -1 : 1;
  const keyLight = new DirectionalLight(0xffffff, key);
  keyLight.position.set(-3 * side, 4, 5);
  const rimLight = new DirectionalLight(0xfff0d8, rim);
  rimLight.position.set(4 * side, 2.5, -3);
  scene.add(keyLight, rimLight);
}

/** Distance along +Z (camera looking at the origin) that keeps every point inside the frame. */
export function fitDistance(points: Vector3[], fovY: number, aspect: number, mx = 0.9, my = mx) {
  const tan = Math.tan((fovY * Math.PI) / 360);
  const tanV = tan * my;
  const tanH = tan * aspect * mx;
  let d = 0;
  for (const p of points) d = Math.max(d, p.z + Math.abs(p.x) / tanH, p.z + Math.abs(p.y) / tanV);
  return d;
}

/** Calls back with true while the element is on screen and the tab is visible. */
export function watchVisibility(el: Element, cb: (visible: boolean) => void, rootMargin = '0px') {
  let inView = false;
  const update = () => cb(inView && document.visibilityState === 'visible');
  const io = new IntersectionObserver(
    ([entry]) => {
      inView = entry.isIntersecting;
      update();
    },
    { rootMargin },
  );
  io.observe(el);
  document.addEventListener('visibilitychange', update);
  return () => {
    io.disconnect();
    document.removeEventListener('visibilitychange', update);
  };
}

export const isRtl = (el: Element) => getComputedStyle(el).direction === 'rtl';
export const deg = (d: number) => (d * Math.PI) / 180;
