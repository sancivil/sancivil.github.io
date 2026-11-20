import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText);
ScrollTrigger.config({ ignoreMobileResize: true });

const root = document.documentElement;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export let lenis: Lenis | null = null;

if (!reduceMotion) {
  lenis = new Lenis({ lerp: 0.11, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis?.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  window.addEventListener('faraday:lock-scroll', () => lenis?.stop());
  window.addEventListener('faraday:unlock-scroll', () => lenis?.start());
}

const once = (el: Element, start = 'top 85%') => ({ trigger: el, start, once: true });

function revealLines(el: HTMLElement) {
  SplitText.create(el, {
    type: 'lines',
    mask: 'lines',
    aria: 'none',
    linesClass: 'split-line',
    autoSplit: true,
    onSplit(self) {
      return gsap.from(self.lines, {
        yPercent: 108,
        duration: 0.95,
        ease: 'expo.out',
        stagger: 0.08,
        scrollTrigger: once(el, 'top 88%'),
      });
    },
  });
}

function revealClip(el: HTMLElement) {
  gsap.fromTo(
    el,
    { clipPath: 'inset(100% 0% 0% 0%)' },
    { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.25, ease: 'expo.out', scrollTrigger: once(el) },
  );
}

function revealRule(el: HTMLElement) {
  const origin = root.dir === 'rtl' ? 'right center' : 'left center';
  gsap.fromTo(
    el,
    { scaleX: 0 },
    { scaleX: 1, duration: 1.1, ease: 'expo.inOut', transformOrigin: origin, scrollTrigger: once(el, 'top 92%') },
  );
}

function revealCount(el: HTMLElement) {
  const to = Number(el.dataset.to ?? el.textContent);
  const decimals = Number(el.dataset.decimals ?? 0);
  if (!Number.isFinite(to)) return;
  const state = { v: 0 };
  const fmt = (v: number) => v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  el.textContent = fmt(0);
  gsap.to(state, {
    v: to,
    duration: 1.6,
    ease: 'power3.out',
    scrollTrigger: once(el, 'top 90%'),
    onUpdate: () => {
      el.textContent = fmt(state.v);
    },
  });
}

function initReveals() {
  if (reduceMotion) return;
  const handlers: Record<string, (el: HTMLElement) => void> = {
    lines: revealLines,
    clip: revealClip,
    rule: revealRule,
    count: revealCount,
  };
  document.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
    handlers[el.dataset.reveal ?? '']?.(el);
  });
}

document.fonts.ready.then(() => {
  initReveals();
  root.classList.add('motion-ready');
  ScrollTrigger.refresh();
});

export { gsap, ScrollTrigger, reduceMotion };
