import { useEffect, useRef, useState } from 'preact/hooks';
import { cities } from '../../lib/designer/data.ts';
import { fmt, kw, pct } from '../../lib/designer/format.ts';
import { stringing } from './StepInverter.tsx';
import { panelLabel, projectName } from './labels.ts';
import { cityName, other, project, summary, useI18n } from './store.ts';
import { Dot, Icon, Num } from './ui.tsx';

type Props = { open: boolean; onToggle: () => void; onShare: () => Promise<{ ok: boolean; url: string }>; onNew: () => void; onSwitch: () => void };

export function ProjectRail({ open, onToggle, onShare, onNew, onSwitch }: Props) {
  const { t, c, locale } = useI18n();
  const [copiedAt, setCopiedAt] = useState(0);
  const [manualUrl, setManualUrl] = useState('');
  const [confirming, setConfirming] = useState(false);
  const keepBtn = useRef<HTMLButtonElement>(null);
  const newBtn = useRef<HTMLButtonElement>(null);
  /** Set by Keep: focus goes back to "New project". After Discard the new project's step title takes it. */
  const kept = useRef(false);
  useEffect(() => {
    if (confirming) keepBtn.current?.focus();
    else if (kept.current) newBtn.current?.focus();
    kept.current = false;
  }, [confirming]);
  const p = project.value;
  const s = summary.value;
  const city = cities.find((c) => c.id === p.cityId);
  const hasSystem = s.installedW > 0 || s.blocks.some((b) => b.inv);

  useEffect(() => {
    if (!copiedAt) return;
    const id = setTimeout(() => setCopiedAt(0), 4000);
    return () => clearTimeout(id);
  }, [copiedAt]);

  const ratioTone = s.connectedW > 0 ? (s.blocks.some((b) => b.tone === 'amber') ? 'amber' : 'green') : 'none';

  return (
    <aside class={`dz-sum${open ? ' is-open' : ''}`} aria-labelledby="dz-sum-title">
      <button type="button" class="dz-sum__toggle" aria-expanded={open} aria-controls="dz-sum-body" onClick={onToggle}>
        <span class="dz-sum__toggle-title eyebrow">{t.rail.title}</span>
        <span class="dz-sum__toggle-figs">
          <span class="num" dir="ltr">
            {kw(s.installedW)} kWp
          </span>
          <span>
            <span class="num">{fmt(s.panelsTotal)}</span> {c.units.panelsCount(s.panelsTotal)}
          </span>
          {s.connectedW > 0 && (
            <span class="num" dir="ltr">
              {pct(s.ratio)} %
            </span>
          )}
        </span>
        <span class="sr-only">{open ? t.rail.hide : t.rail.show}</span>
        <span class="dz-sum__chev" aria-hidden="true">
          <Icon name="chevron" />
        </span>
      </button>

      <div class="dz-sum__body" id="dz-sum-body" data-lenis-prevent>
        <p class="dz-sum__eyebrow eyebrow" id="dz-sum-title">
          {t.rail.title}
        </p>
        <p class="dz-sum__name" dir="auto">
          {p.name || t.rail.untitled}
        </p>
        {city && (
          <p class="dz-sum__city small">
            {cityName(city, locale)}{' '}
            <span class="num" dir="ltr">
              {fmt(p.temps.tmin)} / {fmt(p.temps.tmax)} °C
            </span>
          </p>
        )}

        <dl class="dz-sum__figs">
          <div class="dz-sum__fig dz-sum__fig--main">
            <dt>{t.rail.kwp}</dt>
            <dd>
              <Num v={kw(s.installedW)} u="kWp" />
            </dd>
          </div>
          <div class="dz-sum__fig">
            <dt>{t.rail.panels}</dt>
            <dd>
              <Num v={fmt(s.panelsTotal)} />
            </dd>
          </div>
          <div class="dz-sum__fig">
            <dt>{t.rail.ratio}</dt>
            <dd>
              <Dot tone={ratioTone} />
              <Num v={s.connectedW > 0 ? pct(s.ratio) : '–'} u="%" />
            </dd>
          </div>
          <div class="dz-sum__fig">
            <dt>{t.rail.ac}</dt>
            <dd>
              <Num v={s.acW > 0 ? kw(s.acW) : '–'} u="kW" />
            </dd>
          </div>
        </dl>

        {!hasSystem && <p class="dz-sum__empty small">{t.rail.empty}</p>}

        {hasSystem && (
          <>
            <p class="dz-sum__label">{t.rail.subArrays}</p>
            <ul class="dz-sum__list" role="list">
              {s.subArrays.map((x, i) => (
                <li key={x.subArray.id}>
                  <span class="dz-sum__item-name">{x.subArray.name || t.panels.subArray(i + 1)}</span>
                  {x.panel && x.subArray.count > 0 ? (
                    <span class="mono dz-sum__item-val" dir="ltr">
                      {x.subArray.count} × {panelLabel(x.panel)}
                    </span>
                  ) : (
                    <span class="dz-sum__item-val muted">{t.rail.noModel}</span>
                  )}
                  {x.installedW > 0 && (
                    <span class="num dz-sum__item-meta" dir="ltr">
                      {kw(x.installedW)} kWp · {x.used}/{x.subArray.count}
                    </span>
                  )}
                </li>
              ))}
            </ul>
            <p class="dz-sum__label">{t.rail.inverters}</p>
            <ul class="dz-sum__list" role="list">
              {s.blocks.map((b, i) => (
                <li key={b.block.id}>
                  <span class="dz-sum__item-name">{t.inverter.block(i + 1)}</span>
                  {b.inv ? (
                    <span class="mono dz-sum__item-val" dir="ltr">
                      {b.count} × {b.inv.model}
                    </span>
                  ) : (
                    <span class="dz-sum__item-val muted">{t.rail.noInverter}</span>
                  )}
                  {b.pvW > 0 && (
                    <span class="num dz-sum__item-meta" dir="ltr">
                      <Dot tone={b.tone ?? 'none'} /> {pct(b.ratio)} % · {stringing(b)}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}

        <div class="dz-sum__actions">
          <button
            type="button"
            class="dz-textbtn"
            onClick={async () => {
              const r = await onShare();
              setManualUrl(r.ok ? '' : r.url);
              setCopiedAt(r.ok ? Date.now() : 0);
            }}
          >
            <Icon name="link" />
            {t.actions.share}
          </button>
          <span class="dz-sum__status small" role="status">
            {copiedAt ? t.actions.copied : manualUrl ? t.actions.copyManual : ''}
          </span>
          {manualUrl && (
            <input
              class="input dz-sum__url"
              type="text"
              dir="ltr"
              readOnly
              value={manualUrl}
              aria-label={t.actions.copyManual}
              onFocus={(e) => e.currentTarget.select()}
            />
          )}
          {other.value && (
            <button type="button" class="dz-textbtn dz-sum__switch" onClick={onSwitch}>
              <Icon name="swap" />
              <span>{t.actions.switchTo(projectName(other.value.project, t))}</span>
            </button>
          )}
          {confirming ? (
            <div class="dz-confirm" role="group" aria-label={t.actions.confirmNew}>
              <p class="small">{t.actions.confirmNew}</p>
              <div class="dz-confirm__btns">
                <button
                  type="button"
                  class="dz-textbtn dz-textbtn--danger"
                  onClick={() => {
                    setConfirming(false);
                    onNew();
                  }}
                >
                  {t.actions.discard}
                </button>
                <button
                  type="button"
                  class="dz-textbtn"
                  ref={keepBtn}
                  onClick={() => {
                    kept.current = true;
                    setConfirming(false);
                  }}
                >
                  {t.actions.keep}
                </button>
              </div>
            </div>
          ) : (
            <button type="button" class="dz-textbtn" ref={newBtn} onClick={() => setConfirming(true)}>
              <Icon name="reset" />
              {t.actions.newProject}
            </button>
          )}
          <p class="dz-sum__saved small">{t.rail.saved}</p>
        </div>
      </div>
    </aside>
  );
}
