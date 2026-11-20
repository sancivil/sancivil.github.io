import { QuoteBox, Report } from './Report.tsx';
import { useI18n } from './store.ts';
import { Icon, StepHead } from './ui.tsx';

export function StepSummary({ shareLink }: { shareLink: () => string }) {
  const { t } = useI18n();
  return (
    <div class="dz-step-view">
      <div class="dz-screen-only">
        <StepHead no={4} title={t.steps.names[4]} intro={t.summary.intro} id="dz-step-title" />
        <div class="dz-actions-row dz-actions-row--top">
          <button type="button" class="btn btn--line" onClick={() => window.print()}>
            <Icon name="print" />
            {t.actions.pdf}
          </button>
          <a class="btn btn--line" href="#dz-quote">
            {t.actions.quote}
            <Icon name="arrow" dir />
          </a>
        </div>
      </div>
      <Report />
      <QuoteBox link={shareLink} />
    </div>
  );
}
