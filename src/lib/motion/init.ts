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

/** Counts from data-from (0 when absent) up to the figure as it scrolls in; the figure itself never changes (.count-up). */
function revealCount(el: HTMLElement) {
  const figure = el.textContent ?? '';
  const from = Number(el.dataset.from ?? 0);
  const to = Number(el.dataset.to ?? figure);
  const decimals = Number(el.dataset.decimals ?? 0);
  if (!Number.isFinite(from) || !Number.isFinite(to)) return;
  const fmt = (v: number) =>
    v.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      useGrouping: figure.includes(','),
    });
  ScrollTrigger.create({
    ...once(el, 'top bottom'),
    onEnter: () => {
      const real = document.createElement('span');
      const running = document.createElement('span');
      const box = document.createElement('span');
      real.textContent = figure;
      running.textContent = fmt(from);
      running.setAttribute('aria-hidden', 'true');
      box.className = 'count-up';
      box.append(real, running);
      el.replaceChildren(box);
      const state = { v: from };
      gsap.to(state, {
        v: to,
        duration: 1.6,
        ease: 'power3.out',
        onUpdate: () => {
          running.textContent = fmt(state.v);
        },
        onComplete: () => el.replaceChildren(figure),
      });
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
  // The first paint shows every element as it is. Only what is still below the fold can be hidden now and
  // revealed as it scrolls in; anything already on screen stays put rather than vanish and replay.
  document.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
    if (el.getBoundingClientRect().top < window.innerHeight) return;
    handlers[el.dataset.reveal ?? '']?.(el);
  });
}

document.fonts.ready.then(() => {
  initReveals();
  root.classList.add('motion-ready');
  ScrollTrigger.refresh();
});

export { gsap, ScrollTrigger, reduceMotion };
