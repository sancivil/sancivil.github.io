import { effect } from '@preact/signals';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { common } from '../../i18n/common.ts';
import { isRtl, type Locale } from '../../i18n/config.ts';
import { designer } from '../../i18n/designer.ts';
import { findInverter } from '../../lib/designer/calc.ts';
import { catalog, cities } from '../../lib/designer/data.ts';
import { applyDeepLinks, createProject, type StepNo } from '../../lib/designer/project.ts';
import { decodeProject, encodeProject, shareCode, shareMove } from '../../lib/designer/share.ts';
import { NeedsWizard } from './NeedsWizard.tsx';
import { ProjectRail } from './ProjectRail.tsx';
import { Report } from './Report.tsx';
import { StepInverter } from './StepInverter.tsx';
import { StepPanels } from './StepPanels.tsx';
import { StepProject } from './StepProject.tsx';
import { StepRail } from './StepRail.tsx';
import { StepSummary } from './StepSummary.tsx';
import {
  I18n,
  cityName,
  emptyHomeFinance,
  emptyNeeds,
  errors,
  goTo,
  homeFinance,
  mode,
  needs,
  notice,
  openProject,
  origin,
  other,
  persist,
  project,
  reachable,
  restore,
  step,
  summary,
  switchProjects,
  useI18n,
} from './store.ts';
import { Icon } from './ui.tsx';
import { panelLabel, projectName } from './labels.ts';

const shareLink = () => `${location.origin}${location.pathname}#p=${encodeProject(project.value)}`;

function StepNav({ onMove }: { onMove: () => void }) {
  const { t } = useI18n();
  const s = step.value;
  const err = s === 4 ? {} : errors.value[s];
  const valid = Object.keys(err).length === 0;
  const codes = Object.values(err);
  const extra = s === 3 ? [codes.includes('invalid') && t.errors.invalid, codes.includes('over') && t.errors.over].filter(Boolean).join(' ') : '';
  const go = (n: number) => {
    goTo(n as StepNo);
    onMove();
  };
  return (
    <nav class="dz-stepnav dz-screen-only" aria-label={t.steps.backNext}>
      {s > 1 ? (
        <button type="button" class="btn btn--line" onClick={() => go(s - 1)}>
          <span class="dz-flip">
            <Icon name="arrow" dir />
          </span>
          {t.steps.back}
        </button>
      ) : (
        <span />
      )}
      {s < 4 && (
        <div class="dz-stepnav__next">
          {!valid && (
            <p class="dz-stepnav__hint small" id="dz-next-hint">
              {t.steps.hint[s as 1 | 2 | 3]} {extra}
            </p>
          )}
          <button type="button" class="btn btn--sun" disabled={!valid} aria-describedby={valid ? undefined : 'dz-next-hint'} onClick={() => go(s + 1)}>
            {t.steps.nextTo(t.steps.names[(s + 1) as StepNo])}
            <Icon name="arrow" dir />
          </button>
        </div>
      )}
    </nav>
  );
}

export default function DesignerApp({ locale }: { locale: Locale }) {
  const i18n = useMemo(() => ({ t: designer[locale], c: common[locale], locale, rtl: isRtl(locale) }), [locale]);
  const t = i18n.t;
  const root = useRef<HTMLDivElement>(null);
  const noticeBox = useRef<HTMLDivElement>(null);
  const [sumOpen, setSumOpen] = useState(false);
  const [inView, setInView] = useState(false);
  const [ready, setReady] = useState(false);
  const shown = useRef({ step: step.value, back: false });
  const scrollToApp = (focus: boolean, instant = false) => {
    const el = root.current;
    if (!el) return;
    if (focus) requestAnimationFrame(() => document.getElementById('dz-step-title')?.focus({ preventScroll: true }));
    const header = document.querySelector<HTMLElement>('[data-header]');
    const appTop = el.getBoundingClientRect().top + window.scrollY;
    // The site header slides away while the page scrolls down past 240px.
    const headerHides = appTop > window.scrollY && appTop > 240;
    const top = appTop - (header && !headerHides ? header.offsetHeight : 0);
    if (window.scrollY > top || el.getBoundingClientRect().top > window.innerHeight * 0.5) {
      const reduce = instant || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
    }
  };

  const onSwitch = () => {
    switchProjects();
    notice.value = { text: t.notice.switched(projectName(project.value, t)) };
    setSumOpen(false);
    scrollToApp(true);
  };

  /** Open the project of a share link; work that exists only on this device is kept or, failing that, asked about. */
  const receive = (code: string) => {
    const shared = decodeProject(code, catalog);
    if (!shared) {
      notice.value = { text: t.notice.sharedBroken };
      return;
    }
    const open = { project: project.value, from: origin.value };
    const take = () => {
      openProject(shared, encodeProject(shared));
      const kept = other.value;
      notice.value = kept
        ? {
            text: `${t.notice.shared} ${t.notice.kept(projectName(kept.project, t))}`,
            actions: [{ label: t.actions.switchTo(projectName(kept.project, t)), run: onSwitch }],
          }
        : { text: t.notice.shared };
    };
    const move = shareMove(open, other.value, shared);
    if (move === 'ask') {
      const answer = (replace: boolean) => () => {
        if (replace) take();
        else notice.value = null;
        scrollToApp(true);
      };
      notice.value = {
        text: t.notice.sharedReplace(projectName(open.project, t)),
        actions: [
          { label: t.needs.replace, run: answer(true) },
          { label: t.needs.keepCurrent, run: answer(false), focus: true },
        ],
      };
      return;
    }
    if (move === 'keep') other.value = open;
    take();
  };

  useEffect(() => {
    const url = new URL(location.href);
    const code = shareCode(url.hash);
    const moduleId = url.searchParams.get('module');
    const inverterId = url.searchParams.get('inverter');
    const city = cities.find((c) => c.id === url.searchParams.get('city'));
    restore();
    if (code !== null) receive(code);
    let jump = code !== null;
    if (moduleId || inverterId) {
      const before = project.value;
      project.value = applyDeepLinks(project.value, catalog, moduleId, inverterId);
      if (project.value !== before) {
        if (!project.value.name.trim()) project.value = { ...project.value, name: t.project.defaultName };
        const panel = catalog.panels.find((m) => m.id === moduleId);
        const inv = findInverter(catalog, inverterId ?? '');
        notice.value = { text: [panel && t.notice.module(panelLabel(panel)), inv && t.notice.inverter(inv.model)].filter(Boolean).join(' ') };
        mode.value = 'design';
        step.value = Math.min(inv ? 3 : 2, reachable.value) as StepNo;
        jump = true;
      }
    }
    if (city && code === null && !moduleId && !inverterId) {
      project.value = { ...project.value, cityId: city.id, temps: { ...city.design } };
      needs.value = { ...needs.value, cityId: city.id };
      notice.value = { text: t.notice.city(cityName(city, locale)) };
      mode.value = 'needs';
      jump = true;
    }
    if (code !== null || moduleId || inverterId || city) history.replaceState(null, '', url.pathname);
    setReady(true);
    // After an instant jump the header or the tablet project bar can still cover the notice; nudge it into view.
    const uncover = () => {
      const target = root.current?.querySelector('.dz-notice') ?? document.getElementById('dz-step-title');
      if (!target) return;
      const header = document.querySelector<HTMLElement>('[data-header]');
      const bar = root.current?.querySelector<HTMLElement>('.dz-sum__toggle')?.getBoundingClientRect();
      const barH = bar && bar.height > 0 && bar.top < window.innerHeight / 3 ? bar.height : 0;
      const gap = target.getBoundingClientRect().top - (header?.offsetHeight ?? 0) - barH - 16;
      if (gap < 0) window.scrollBy({ top: gap, behavior: 'auto' });
    };
    const arrive = () =>
      requestAnimationFrame(() => {
        scrollToApp(false, true);
        setTimeout(uncover, 350);
      });
    if (jump) {
      if (document.readyState === 'complete') arrive();
      else window.addEventListener('load', arrive, { once: true });
    }

    /** A share link pasted into the address bar of this tab changes only the hash. */
    const onHash = () => {
      const pasted = shareCode(location.hash);
      if (pasted === null) return;
      receive(pasted);
      history.replaceState(null, '', location.pathname);
      arrive();
    };
    window.addEventListener('hashchange', onHash);

    const onLanding = (e: MouseEvent) => {
      const link = (e.target as Element | null)?.closest?.('[data-dz-mode]');
      if (!link) return;
      e.preventDefault();
      if (link.getAttribute('data-dz-mode') === 'needs') {
        mode.value = 'needs';
      } else {
        mode.value = 'design';
        step.value = 1;
      }
      scrollToApp(true);
    };
    document.addEventListener('click', onLanding);

    const header = document.querySelector<HTMLElement>('[data-header]');
    const setTop = () => root.current?.style.setProperty('--dz-top', header?.classList.contains('is-hidden') ? '0px' : 'var(--header-h)');
    const mo = header ? new MutationObserver(setTop) : null;
    if (header) mo!.observe(header, { attributes: true, attributeFilter: ['class'] });
    setTop();

    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { rootMargin: '0px 0px -40% 0px' });
    if (root.current) io.observe(root.current);

    return () => {
      document.removeEventListener('click', onLanding);
      window.removeEventListener('hashchange', onHash);
      mo?.disconnect();
      io.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    let timer = 0;
    const save = () => {
      timer = 0;
      persist();
    };
    const dispose = effect(() => {
      void project.value;
      void origin.value;
      void other.value;
      void step.value;
      void mode.value;
      void needs.value;
      void homeFinance.value;
      clearTimeout(timer);
      timer = window.setTimeout(save, 250);
    });
    // Leaving the page, or a phone moving the tab to the background, must not lose the last edits.
    const flush = () => {
      if (!timer) return;
      clearTimeout(timer);
      save();
    };
    const onHidden = () => document.visibilityState === 'hidden' && flush();
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', onHidden);
    return () => {
      clearTimeout(timer);
      dispose();
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', onHidden);
    };
  }, [ready]);

  useEffect(() => {
    noticeBox.current?.querySelector<HTMLButtonElement>('[data-focus]')?.focus({ preventScroll: true });
  }, [notice.value]);

  useEffect(() => {
    if (!sumOpen || !window.matchMedia('(max-width: 899px)').matches) return;
    const html = document.documentElement;
    html.style.overflow = 'hidden';
    window.dispatchEvent(new CustomEvent('faraday:lock-scroll'));
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setSumOpen(false);
    document.addEventListener('keydown', onKey);
    return () => {
      html.style.overflow = '';
      window.dispatchEvent(new CustomEvent('faraday:unlock-scroll'));
      document.removeEventListener('keydown', onKey);
    };
  }, [sumOpen]);

  const onShare = async () => {
    const url = shareLink();
    try {
      await navigator.clipboard.writeText(url);
      return { ok: true, url };
    } catch {
      return { ok: false, url };
    }
  };

  const onNew = () => {
    openProject(createProject());
    needs.value = emptyNeeds();
    homeFinance.value = emptyHomeFinance();
    notice.value = null;
    setSumOpen(false);
    scrollToApp(true);
  };

  const onMove = () => {
    setSumOpen(false);
    scrollToApp(true);
  };

  const design = mode.value === 'design';
  const s = step.value;
  if (s !== shown.current.step) shown.current = { step: s, back: s < shown.current.step };

  return (
    <I18n.Provider value={i18n}>
      <div class={`dz dz--${mode.value}${inView ? ' is-in-view' : ''}`} ref={root} role="region" aria-label={t.app.label}>
        <StepRail onNavigate={onMove} />
        <div class="dz-work" data-dir={shown.current.back ? 'back' : 'next'}>
          {notice.value && (
            <div class="dz-notice dz-screen-only" role="status" ref={noticeBox}>
              <div class="dz-notice__body">
                <p id="dz-notice-text">{notice.value.text}</p>
                {notice.value.actions && (
                  <div class="dz-notice__actions" role="group" aria-labelledby="dz-notice-text">
                    {notice.value.actions.map((a) => (
                      <button type="button" class="dz-textbtn" key={a.label} data-focus={a.focus || undefined} onClick={a.run}>
                        {a.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button type="button" class="dz-iconbtn" aria-label={t.notice.dismiss} onClick={() => (notice.value = null)}>
                <Icon name="close" />
              </button>
            </div>
          )}
          <button
            type="button"
            class="dz-modeswitch link-arrow"
            onClick={() => {
              mode.value = design ? 'needs' : 'design';
              onMove();
            }}
          >
            {design ? t.steps.needs : t.steps.equipment}
          </button>
          {mode.value === 'needs' ? (
            <NeedsWizard onContinue={onMove} />
          ) : (
            <>
              {s === 1 && <StepProject />}
              {s === 2 && <StepPanels />}
              {s === 3 && <StepInverter />}
              {s === 4 && <StepSummary shareLink={shareLink} />}
              <StepNav onMove={onMove} />
            </>
          )}
          {design && s !== 4 && summary.value.allValid && <Report printOnly />}
        </div>
        {design && <ProjectRail open={sumOpen} onToggle={() => setSumOpen(!sumOpen)} onShare={onShare} onNew={onNew} onSwitch={onSwitch} />}
        {design && sumOpen && <div class="dz-scrim" aria-hidden="true" onClick={() => setSumOpen(false)} />}
      </div>
    </I18n.Provider>
  );
}
