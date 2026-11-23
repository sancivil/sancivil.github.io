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
import type { BufferGeometry, DataTexture, Side, Texture, Vector3 } from 'three';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';

const phone = Math.min(screen.width, screen.height) <= 720;
const coarse = matchMedia('(pointer: coarse)').matches;

export const device = {
  touch: coarse,
  /** DPR cap: 2 on desktop, 1.5 on touch devices (tablets and phones). */
  dpr: Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 2),
  /** Longest texture side for scenes seen whole: 2048, or 1024 on phones. */
  textureMax: phone ? 1024 : 2048,
};

/** Longest cell-texture side for close views (hero, viewer): 4096 on desktop GPUs that take it, 2048 on tablets, 1024 on phones. */
export const detailTextureMax = (renderer: WebGLRenderer) =>
  phone ? 1024 : coarse || renderer.capabilities.maxTextureSize < 8192 ? 2048 : 4096;

export const maxAnisotropy = (renderer: WebGLRenderer) => renderer.capabilities.getMaxAnisotropy();

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
 * edges pick up their long highlights. `rtl` mirrors the room so mirrored scenes reflect the same
 * strips (otherwise a turned module picks up the warm strip instead of the cool one).
 */
export function environment(renderer: WebGLRenderer, rtl = false): Texture {
  const side = rtl ? -1 : 1;
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
    m.position.set(side * x, y, z);
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

/**
 * Photographed studio for reflections: Poly Haven "Studio Small 09" (Sergej Majboroda, CC0), a white
 * infinity cove with two large octaboxes under a dark ceiling. `gain` matches its brightness to the
 * procedural studio; `rotation` turns the room so the hero glass catches the cove as a soft gradient
 * and the octaboxes (whose egg-crate grids would print as stripes) fall on the frame edges instead.
 */
const STUDIO = { url: '/hdr/studio_small_09_1k.hdr', gain: 0.45, rotation: (-100 * Math.PI) / 180 };
const studios = new Map<boolean, Promise<DataTexture>>();

/** Mirrors the room east–west (x → −x) for RTL, as `environment` does. */
function mirror(t: DataTexture) {
  const { data, width, height } = t.image as { data: Uint16Array; width: number; height: number };
  const out = new Uint16Array(data.length);
  for (let y = 0; y < height; y++) {
    const row = y * width;
    for (let x = 0; x < width; x++) {
      const from = (row + ((((width >> 1) - 1 - x) % width) + width) % width) * 4;
      out.set(data.subarray(from, from + 4), (row + x) * 4);
    }
  }
  t.image.data = out;
  t.needsUpdate = true;
  return t;
}

/**
 * Upgrades a scene to the photographed studio: call after its first frame. The 1.6 MB HDR loads once
 * per page; phones keep the procedural studio. Resolves to null there or when loading fails.
 */
export async function studio(renderer: WebGLRenderer, rtl: boolean): Promise<{ texture: Texture; gain: number; rotation: number } | null> {
  if (phone) return null;
  let source = studios.get(rtl);
  if (!source) {
    source = new HDRLoader().loadAsync(STUDIO.url).then((t) => (rtl ? mirror(t) : t));
    studios.set(rtl, source);
  }
  try {
    const equirect = await source;
    const pmrem = new PMREMGenerator(renderer);
    const texture = pmrem.fromEquirectangular(equirect).texture;
    pmrem.dispose();
    equirect.dispose();
    return { texture, gain: STUDIO.gain, rotation: rtl ? -STUDIO.rotation : STUDIO.rotation };
  } catch {
    return null;
  }
}

/** Key light from the upper front on the reading-start side, warm rim from behind on the end side. */
export function addLights(scene: Scene, rtl: boolean, key = 2.6, rim = 1.5) {
  const side = rtl ? -1 : 1;
  const keyLight = new DirectionalLight(0xffffff, key);
  keyLight.position.set(-3 * side, 4, 5);
  const rimLight = new DirectionalLight(0xfff0d8, rim);
  rimLight.position.set(4 * side, 2.5, -3);
  scene.add(keyLight, rimLight);
  return { key: keyLight, rim: rimLight };
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
