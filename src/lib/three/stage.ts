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
  WebGLRenderTarget,
  WebGLRenderer,
} from 'three';
import type { BufferGeometry, Camera, DataTexture, Material, Object3D, Side, Texture, Vector3 } from 'three';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';

const SLICE = 12;
let sliceFrame = -1;
let sliceStart = 0;

/** Resolves at the next animation frame, which opens a new slice for `pace`. */
async function nextFrame() {
  const frame = await new Promise<number>((resolve) => requestAnimationFrame(resolve));
  if (frame !== sliceFrame) {
    sliceFrame = frame;
    sliceStart = performance.now();
  }
}

/**
 * Long set-up work awaits this between its steps: it returns at once while the current slice has time left, else at the
 * next animation frame. All such work shares one slice of 12 ms per frame, so pieces of it running side by side still
 * leave each frame most of its time.
 */
export async function pace() {
  while (performance.now() - sliceStart >= SLICE) await nextFrame();
}

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

/**
 * Resolves once the GPU has run every command issued so far, checking a fence once a frame. Until then any blocking
 * call, a WebGL query or the first fill of a 2D canvas, would wait for it on the main thread.
 */
async function caughtUp(renderer: WebGLRenderer) {
  const gl = renderer.getContext() as WebGL2RenderingContext;
  const fence = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0)!;
  gl.flush();
  while (gl.getSyncParameter(fence, gl.SYNC_STATUS) !== gl.SIGNALED) await nextFrame();
  gl.deleteSync(fence);
}

/**
 * A renderer on the canvas's WebGL 2 context (made by the component with `sceneContext`, load.ts), its texture
 * anisotropy limit, the procedural studio as its environment (`env`), and `photo()` to call after the first frame for
 * the photographed studio (see `studio`). Creating the renderer and prefiltering the procedural studio each get a task
 * of their own: PMREMGenerator compiles its filters on first use, a wait no caller can split. The limit is read while
 * the GPU is idle (a query waits for the GPU to catch up), and the photo's conversion program compiles alongside the
 * filters, so the later upgrade waits for nothing.
 */
export async function setUp(canvas: HTMLCanvasElement, rtl: boolean) {
  const renderer = new WebGLRenderer({ canvas, context: canvas.getContext('webgl2')! });
  renderer.setPixelRatio(device.dpr);
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = NeutralToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.setClearColor(0x000000, 0);
  const anisotropy = renderer.capabilities.getMaxAnisotropy();
  await nextFrame();
  const pmrem = new PMREMGenerator(renderer);
  if (!phone) {
    // The program is built for the bound render target (no tone mapping, linear output), as the conversion draws.
    const target = new WebGLRenderTarget(1, 1);
    renderer.setRenderTarget(target);
    pmrem.compileEquirectangularShader();
    renderer.setRenderTarget(null);
    target.dispose();
  }
  const env = environment(pmrem, rtl);
  if (phone) pmrem.dispose();
  await caughtUp(renderer);
  return { renderer, anisotropy, env, photo: () => studio(pmrem, rtl) };
}

/**
 * Readies an object for its first frame so that frame only draws. Its programs start compiling a material at a time
 * (the GPU builds them in parallel where the browser has KHR_parallel_shader_compile) and its `textures` upload a
 * slice at a time. Once the GPU has caught up, `compileAsync` waits for the programs, by then without blocking: each
 * of its readiness queries waits for the GPU. `scene` gives the lights and environment they are built for.
 */
export async function prepare(renderer: WebGLRenderer, object: Object3D, camera: Camera, scene: Scene, textures: Texture[]) {
  const owners = new Map<Material, Object3D>();
  object.traverse((o) => {
    const m = (o as Mesh).material;
    for (const material of Array.isArray(m) ? m : m ? [m] : []) if (!owners.has(material)) owners.set(material, o);
  });
  for (const owner of new Set(owners.values())) {
    renderer.compile(owner, camera, scene);
    await pace();
  }
  for (const texture of textures) {
    renderer.initTexture(texture);
    await pace();
  }
  await caughtUp(renderer);
  await renderer.compileAsync(object, camera, scene);
}

/**
 * Reflections from a product studio: a dark cyclorama with a large overhead softbox, two tall strip
 * boxes in front at the sides, a low strip under the camera and a warm strip behind. Glass and frame
 * edges pick up their long highlights. `rtl` mirrors the room so mirrored scenes reflect the same
 * strips (otherwise a turned module picks up the warm strip instead of the cool one).
 */
function environment(pmrem: PMREMGenerator, rtl: boolean): Texture {
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
  const texture = pmrem.fromScene(scene, 0.015).texture;
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
      const to = (row + x) * 4;
      for (let k = 0; k < 4; k++) out[to + k] = data[from + k];
    }
  }
  t.image.data = out;
  t.needsUpdate = true;
  return t;
}

/**
 * Upgrades a scene to the photographed studio (through `setUp`'s `photo`): call after its first frame. The 1.6 MB HDR
 * loads once per page; phones keep the procedural studio. Resolves to null there or when loading fails.
 */
async function studio(pmrem: PMREMGenerator, rtl: boolean): Promise<{ texture: Texture; gain: number; rotation: number } | null> {
  if (phone) return null;
  let source = studios.get(rtl);
  if (!source) {
    source = new HDRLoader().loadAsync(STUDIO.url).then((t) => (rtl ? mirror(t) : t));
    studios.set(rtl, source);
  }
  try {
    const equirect = await source;
    // The file was decoded in this task; prefilter it in the next.
    await nextFrame();
    const texture = pmrem.fromEquirectangular(equirect).texture;
    equirect.dispose();
    return { texture, gain: STUDIO.gain, rotation: rtl ? -STUDIO.rotation : STUDIO.rotation };
  } catch {
    return null;
  } finally {
    pmrem.dispose();
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
