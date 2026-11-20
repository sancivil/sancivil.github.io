import {
  BackSide,
  BoxGeometry,
  DirectionalLight,
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  NeutralToneMapping,
  PMREMGenerator,
  PlaneGeometry,
  SRGBColorSpace,
  Scene,
  WebGLRenderer,
} from 'three';
import type { BufferGeometry, Side, Texture, Vector3 } from 'three';

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
  renderer.toneMapping = NeutralToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.setClearColor(0x000000, 0);
  return renderer;
}

/**
 * Reflections from a product studio: a dark cyclorama with a large overhead softbox, two tall strip
 * boxes in front at the sides, a low strip under the camera and a warm strip behind. Glass and frame
 * edges pick up their long highlights.
 */
export function environment(renderer: WebGLRenderer): Texture {
  const scene = new Scene();
  const owned: { dispose(): void }[] = [];
  const add = (geometry: BufferGeometry, color: number, intensity: number, place: (m: Mesh) => void, side: Side = DoubleSide) => {
    const material = new MeshBasicMaterial({ color, side });
    material.color.multiplyScalar(intensity);
    const mesh = new Mesh(geometry, material);
    place(mesh);
    scene.add(mesh);
    owned.push(geometry, material);
  };
  const face = (x: number, y: number, z: number) => (m: Mesh) => {
    m.position.set(x, y, z);
    m.lookAt(0, 0.4, 0);
  };
  add(new BoxGeometry(16, 10, 16), 0x17181b, 0.5, (m) => m.position.set(0, 3, 0), BackSide);
  add(new PlaneGeometry(15, 15), 0x26272b, 0.6, (m) => {
    m.rotation.x = -Math.PI / 2;
    m.position.y = -1.9;
  });
  add(new PlaneGeometry(5.5, 3.2), 0xffffff, 3.2, face(0, 7.4, 1.2));
  add(new PlaneGeometry(0.55, 6.5), 0xffffff, 9, face(-3.9, 1.5, 3.6));
  add(new PlaneGeometry(0.4, 6.5), 0xfff5e8, 6, face(4.2, 1.5, 2.4));
  add(new PlaneGeometry(7, 0.32), 0xffffff, 4, face(0, -0.9, 5.8));
  add(new PlaneGeometry(0.6, 6.5), 0xffe6c4, 4.5, face(3.2, 2.2, -5.2));
  add(new PlaneGeometry(0.6, 6.5), 0xdfe8ff, 2.5, face(-3.6, 2.2, -4.8));
  const pmrem = new PMREMGenerator(renderer);
  const texture = pmrem.fromScene(scene, 0.015).texture;
  pmrem.dispose();
  owned.forEach((o) => o.dispose());
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
