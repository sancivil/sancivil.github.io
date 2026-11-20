/** Scroll progress (0–1) of the anatomy scene, shared by the captions and the 3D stage. */
export const LAYER_COUNT = 7;

const START = 0.06;
const STEP = 0.125;
const MOVE = 0.1;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const smooth = (t: number) => t * t * (3 - 2 * t);

export function anatomyAt(p: number) {
  return {
    turn: smooth(clamp01(p / 0.92)),
    layers: Array.from({ length: LAYER_COUNT }, (_, i) => smooth(clamp01((p - START - i * STEP) / MOVE))),
    active: Math.min(LAYER_COUNT - 1, Math.max(0, Math.floor((p - START) / STEP))),
  };
}
