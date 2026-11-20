import type { StepNo } from '../../lib/designer/project.ts';
import { goTo, mode, reachable, step, useI18n } from './store.ts';
import { Icon } from './ui.tsx';

const STEPS: StepNo[] = [1, 2, 3, 4];

export function StepRail({ onNavigate }: { onNavigate: () => void }) {
  const { t } = useI18n();
  const current = mode.value === 'design' ? step.value : null;

  return (
    <nav class="dz-rail theme-dark" aria-label={t.steps.label}>
      <div class="dz-rail__inner">
        <p class="dz-rail__title eyebrow eyebrow--dot">{t.app.label}</p>
        <ol class="dz-steps" role="list">
          {STEPS.map((n) => {
            const locked = n > reachable.value;
            const active = current === n;
            const done = !active && n < reachable.value;
            return (
              <li key={n}>
                <button
                  type="button"
                  class={`dz-step${active ? ' is-active' : ''}${done ? ' is-done' : ''}`}
                  aria-current={active ? 'step' : undefined}
                  disabled={locked}
                  title={locked ? t.steps.locked : undefined}
                  onClick={() => {
                    goTo(n);
                    onNavigate();
                  }}
                >
                  <span class="dz-step__no mono">{String(n).padStart(2, '0')}</span>
                  <span class="dz-step__name">{t.steps.names[n]}</span>
                  <span class="dz-step__short">{t.steps.short[n]}</span>
                  <span class="dz-step__mark" aria-hidden="true">
                    {done && <Icon name="check" />}
                  </span>
                  {done && <span class="sr-only">, {t.steps.done}</span>}
                </button>
              </li>
            );
          })}
        </ol>
        <button
          type="button"
          class={`dz-rail__mode link-arrow${mode.value === 'needs' ? ' is-active' : ''}`}
          aria-pressed={mode.value === 'needs'}
          onClick={() => {
            mode.value = mode.value === 'needs' ? 'design' : 'needs';
            onNavigate();
          }}
        >
          {mode.value === 'needs' ? t.steps.equipment : t.steps.needs}
        </button>
      </div>
    </nav>
  );
}
