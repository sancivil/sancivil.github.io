// Small eager helpers for the 3D components; three.js itself stays in the lazy chunk.

export const loadScenes = () => import('./index.ts');

/**
 * The WebGL 2 context of a scene's canvas, with the attributes every scene uses (the scene takes it from the canvas);
 * null where the browser has none, so the component shows its fallback without loading three.js.
 */
export const sceneContext = (canvas: HTMLCanvasElement) =>
  canvas.getContext('webgl2', { alpha: true, antialias: true, powerPreference: 'high-performance' });

const idle = (fn: () => void) => {
  if ('requestIdleCallback' in window) requestIdleCallback(() => fn(), { timeout: 2000 });
  else setTimeout(fn, 250);
};

/** Runs once the element comes within `rootMargin` of the viewport. */
function whenNear(el: Element, fn: () => void, rootMargin: string) {
  const io = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      fn();
    },
    { rootMargin },
  );
  io.observe(el);
}

/**
 * After the load event the GPU process still draws the page (web fonts, the large images) for a few hundred
 * milliseconds; a WebGL context created meanwhile waits for it, 100–200 ms on Arabic and Kurdish pages.
 */
const SETTLE_MS = 300;

let mounting: Promise<unknown> = Promise.resolve();

/**
 * Starts a 3D scene once the page has loaded and settled: `mount` once the element is within `rootMargin` of the
 * viewport and the main thread is idle. Scenes mount one at a time, each once the one before is up, so a page's
 * scenes never wait on each other's GPU work.
 */
export function startScene(el: Element, rootMargin: string, mount: () => Promise<unknown>) {
  const queue = () => {
    mounting = mounting
      .then(() => new Promise<void>((resolve) => idle(resolve)))
      .then(mount)
      .catch(reportError);
  };
  const settle = () => setTimeout(() => whenNear(el, queue, rootMargin), SETTLE_MS);
  if (document.readyState === 'complete') settle();
  else addEventListener('load', settle, { once: true });
}
