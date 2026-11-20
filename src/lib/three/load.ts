// Small eager helpers for the 3D components; three.js itself stays in the lazy chunk.

export const loadScenes = () => import('./index.ts');

let webgl: boolean | undefined;
export function webglAvailable() {
  if (webgl === undefined) {
    try {
      webgl = !!document.createElement('canvas').getContext('webgl2');
    } catch {
      webgl = false;
    }
  }
  return webgl;
}

/** Runs after the window load event, once the main thread is idle. */
export function afterLoadIdle(fn: () => void) {
  const idle = () => {
    if ('requestIdleCallback' in window) requestIdleCallback(fn, { timeout: 2000 });
    else setTimeout(fn, 250);
  };
  if (document.readyState === 'complete') idle();
  else addEventListener('load', idle, { once: true });
}

/** Runs once the element comes within `rootMargin` of the viewport. */
export function whenNear(el: Element, fn: () => void, rootMargin = '300px') {
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
