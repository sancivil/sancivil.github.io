import { useMemo, useState } from 'preact/hooks';
import { findPanel } from '../../lib/designer/calc.ts';
import { catalog, panelRender, panels, seriesRank } from '../../lib/designer/data.ts';
import { fmt, kw, ltr } from '../../lib/designer/format.ts';
import { MAX_COUNT, addCustomPanel, addSubArray, removeSubArray, updateSubArray } from '../../lib/designer/project.ts';
import type { Panel, SubArray } from '../../lib/designer/types.ts';
import { ModelPicker, searchKey, type PickerOption } from './ModelPicker.tsx';
import { panelLabel, panelMeta } from './labels.ts';
import { errors, project, update, useI18n } from './store.ts';
import { Field, Icon, Num, NumberInput, Section, StepHead, Stepper, describedBy, useTouched } from './ui.tsx';

const sortedPanels = [...panels].sort((a, b) => seriesRank(a.series) - seriesRank(b.series) || a.power - b.power || a.id.localeCompare(b.id));

function PanelSpecs({ panel }: { panel: Panel }) {
  const { t } = useI18n();
  const items: [string, string, string][] = [
    [t.spec.power, fmt(panel.power), 'W'],
    ['Voc', fmt(panel.voc, 2), 'V'],
    ['Vmp', fmt(panel.vmp, 2), 'V'],
    ['Isc', fmt(panel.isc, 2), 'A'],
    ['Imp', fmt(panel.imp, 2), 'A'],
  ];
  if (panel.efficiency) items.push([t.spec.efficiency, fmt(panel.efficiency * 100, 2), '%']);
  if (panel.ctPmax !== null) items.push([`${t.spec.coef} Pmax`, fmt(panel.ctPmax, 2), '%/°C']);
  if (panel.width && panel.height) items.push([t.spec.size, `${fmt(panel.width)} × ${fmt(panel.height)}`, 'mm']);
  return (
    <dl class="dz-specs">
      {items.map(([label, v, u]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>
            <Num v={v} u={u} />
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** The chosen model: its series' studio render (when there is one) beside the datasheet figures. */
function PanelCard({ panel }: { panel: Panel }) {
  const { t } = useI18n();
  const src = panelRender(panel);
  return (
    <div class={`dz-modcard${src ? '' : ' is-plain'}`} key={panel.id}>
      {src && (
        <div class="dz-modcard__well">
          <img src={src} width="188" height="400" alt={t.dash.renderAlt(ltr(panel.series))} loading="lazy" decoding="async" />
        </div>
      )}
      <div class="dz-modcard__body">
        <p class="dz-modcard__model mono" dir="ltr">
          {panelLabel(panel)}
        </p>
        <PanelSpecs panel={panel} />
      </div>
    </div>
  );
}

type CustomDraft = Record<'name' | 'power' | 'vmp' | 'imp' | 'voc' | 'isc' | 'ctPmax' | 'ctVoc' | 'ctIsc' | 'vdcMax', number | string>;

const NUMERIC = ['power', 'vmp', 'imp', 'voc', 'isc', 'ctPmax', 'ctVoc', 'ctIsc', 'vdcMax'] as const;
const UNITS: Record<(typeof NUMERIC)[number], string> = {
  power: 'W',
  vmp: 'V',
  imp: 'A',
  voc: 'V',
  isc: 'A',
  ctPmax: ltr('%/°C'),
  ctVoc: ltr('%/°C'),
  ctIsc: ltr('%/°C'),
  vdcMax: 'V',
};

function CustomPanelForm({ subArray, onDone }: { subArray: SubArray; onDone: () => void }) {
  const { t } = useI18n();
  const [d, setD] = useState<CustomDraft>({ name: '', power: NaN, vmp: NaN, imp: NaN, voc: NaN, isc: NaN, ctPmax: NaN, ctVoc: NaN, ctIsc: NaN, vdcMax: 1500 });
  const [tried, setTried] = useState(false);
  const n = (k: (typeof NUMERIC)[number]) => d[k] as number;

  const err: Partial<Record<keyof CustomDraft, string>> = {};
  if (!String(d.name).trim()) err.name = t.custom.errRequired;
  for (const k of ['power', 'vmp', 'imp', 'voc', 'isc'] as const) if (!(n(k) > 0)) err[k] = t.custom.errPositive;
  for (const k of ['ctPmax', 'ctVoc', 'ctIsc'] as const) if (!(n(k) >= -2 && n(k) <= 2)) err[k] = t.custom.errCoef;
  if (!(n('vdcMax') >= 100 && n('vdcMax') <= 2000)) err.vdcMax = t.custom.errVdc;
  if (!err.voc && !err.vmp && n('voc') <= n('vmp')) err.voc = t.custom.errVoc;
  if (!err.isc && !err.imp && n('isc') < n('imp')) err.isc = t.custom.errIsc;
  const valid = Object.keys(err).length === 0;
  const show = (k: keyof CustomDraft) => (tried ? (err[k] ?? null) : null);

  const save = () => {
    setTried(true);
    if (!valid) return;
    update((p) =>
      addCustomPanel(
        p,
        {
          model: String(d.name).trim(),
          series: 'custom',
          finish: null,
          bifacial: false,
          power: n('power'),
          vmp: n('vmp'),
          imp: n('imp'),
          voc: n('voc'),
          isc: n('isc'),
          vdcMax: n('vdcMax'),
          efficiency: null,
          ctPmax: n('ctPmax'),
          ctVoc: n('ctVoc'),
          ctIsc: n('ctIsc'),
          width: null,
          height: null,
        },
        subArray.id,
      ),
    );
    onDone();
  };

  const labels: Record<(typeof NUMERIC)[number], string> = {
    power: t.custom.pmax,
    vmp: t.custom.vmp,
    imp: t.custom.imp,
    voc: t.custom.voc,
    isc: t.custom.isc,
    ctPmax: t.custom.ctPmax,
    ctVoc: t.custom.ctVoc,
    ctIsc: t.custom.ctIsc,
    vdcMax: t.custom.vdcMax,
  };
  const base = `dz-custom-${subArray.id}`;

  return (
    <fieldset class="dz-custom">
      <legend class="dz-custom__title">{t.custom.title}</legend>
      <p class="dz-help">{t.custom.intro}</p>
      <div class="dz-grid dz-grid--3">
        <Field id={`${base}-name`} label={t.custom.name} required error={show('name')} class="dz-span-3">
          <input
            id={`${base}-name`}
            class="input"
            type="text"
            dir="auto"
            maxLength={80}
            value={d.name}
            aria-invalid={show('name') ? true : undefined}
            onInput={(e) => setD({ ...d, name: e.currentTarget.value })}
          />
        </Field>
        {NUMERIC.map((k) => (
          <Field key={k} id={`${base}-${k}`} label={labels[k]} required error={show(k)}>
            <NumberInput
              id={`${base}-${k}`}
              value={n(k)}
              unit={UNITS[k]}
              signed={k.startsWith('ct')}
              invalid={!!show(k)}
              describedBy={describedBy(`${base}-${k}`, undefined, show(k))}
              onValue={(v) => setD((prev) => ({ ...prev, [k]: v }))}
            />
          </Field>
        ))}
      </div>
      <div class="dz-actions-row">
        <button type="button" class="btn btn--line" onClick={save}>
          {t.custom.save}
        </button>
        <button type="button" class="dz-textbtn" onClick={onDone}>
          {t.custom.cancel}
        </button>
      </div>
    </fieldset>
  );
}

function SubArrayBlock({ subArray, index, canRemove }: { subArray: SubArray; index: number; canRemove: boolean }) {
  const { t } = useI18n();
  const [customOpen, setCustomOpen] = useState(false);
  const [modelTouched, touchModel] = useTouched();
  const [countTouched, touchCount] = useTouched();
  const p = project.value;
  const e = errors.value[2];
  const panel = findPanel(p, catalog, subArray.panelId);
  const title = subArray.name || t.panels.subArray(index + 1);
  const id = `dz-${subArray.id}`;

  const options = useMemo<PickerOption[]>(
    () => [
      ...p.customPanels.map((c) => ({
        id: c.id,
        group: t.panels.customGroup,
        label: c.model,
        meta: panelMeta(c),
        search: searchKey(c.model, c.power, 'custom'),
        thumb: null,
      })),
      ...sortedPanels.map((m) => ({
        id: m.id,
        group: m.series,
        label: panelLabel(m),
        meta: panelMeta(m),
        search: searchKey(panelLabel(m), m.power, `${m.power}w`, m.efficiency ? (m.efficiency * 100).toFixed(2) : null, m.bifacial ? 'bifacial' : null),
        thumb: panelRender(m),
      })),
    ],
    [p.customPanels, t],
  );

  const modelErr = modelTouched && e[`${subArray.id}.model`] ? t.errors.model : null;
  const countErr = countTouched && e[`${subArray.id}.count`] ? t.errors.count : null;
  const peak = panel && subArray.count > 0 ? panel.power * subArray.count : NaN;

  return (
    <section class="dz-block" aria-labelledby={`${id}-title`}>
      <header class="dz-block__head">
        <span class="dz-block__index mono" aria-hidden="true">
          {String(index + 1).padStart(2, '0')}
        </span>
        <h3 class="sr-only" id={`${id}-title`}>
          {title}
        </h3>
        <input
          class="dz-block__name"
          type="text"
          dir="auto"
          maxLength={60}
          aria-label={t.panels.name}
          placeholder={t.panels.subArray(index + 1)}
          value={subArray.name}
          onInput={(ev) => update((x) => updateSubArray(x, subArray.id, { name: ev.currentTarget.value }))}
        />
        {canRemove && (
          <button type="button" class="dz-iconbtn" aria-label={t.panels.remove(title)} onClick={() => update((x) => removeSubArray(x, subArray.id))}>
            <Icon name="close" />
          </button>
        )}
      </header>

      <div class="dz-grid dz-grid--panels">
        <Field id={`${id}-model`} label={t.panels.model} required error={modelErr} class="dz-span-3">
          <ModelPicker
            id={`${id}-model`}
            value={subArray.panelId}
            options={options}
            placeholder={t.panels.choose}
            searchLabel={t.panels.search}
            noResults={t.panels.none}
            invalid={!!modelErr}
            describedBy={describedBy(`${id}-model`, undefined, modelErr)}
            onClose={touchModel}
            onChange={(panelId) => update((x) => updateSubArray(x, subArray.id, { panelId }))}
          />
        </Field>
        <div class="field dz-field">
          <span class="field__label">{t.panels.brand}</span>
          <p class="dz-static">{panel?.custom ? t.custom.brand : 'Peimar'}</p>
        </div>
        <Field id={`${id}-count`} label={t.panels.count} required error={countErr}>
          <Stepper
            id={`${id}-count`}
            value={subArray.count}
            min={1}
            max={MAX_COUNT}
            labelLess="−1"
            labelMore="+1"
            invalid={!!countErr}
            describedBy={describedBy(`${id}-count`, undefined, countErr)}
            onBlur={touchCount}
            onValue={(count) => update((x) => updateSubArray(x, subArray.id, { count }))}
          />
        </Field>
        <div class="field dz-field dz-peak">
          <span class="field__label">{t.panels.peak}</span>
          <output class="dz-peak__value" aria-live="polite">
            <Num v={Number.isFinite(peak) ? kw(peak) : '–'} u="kWp" />
          </output>
        </div>
      </div>

      {panel && <PanelCard panel={panel} />}

      {customOpen ? (
        <CustomPanelForm subArray={subArray} onDone={() => setCustomOpen(false)} />
      ) : (
        <p class="dz-custom-link small">
          {t.panels.cantFind}{' '}
          <button type="button" class="dz-textbtn" onClick={() => setCustomOpen(true)}>
            {t.panels.addCustom}
          </button>
        </p>
      )}
    </section>
  );
}

export function StepPanels() {
  const { t } = useI18n();
  const p = project.value;
  return (
    <div class="dz-step-view">
      <StepHead no={2} title={t.steps.names[2]} intro={t.panels.intro} id="dz-step-title" />
      <Section>
        {p.subArrays.map((s, i) => (
          <SubArrayBlock key={s.id} subArray={s} index={i} canRemove={p.subArrays.length > 1} />
        ))}
        <button type="button" class="btn btn--line dz-add" onClick={() => update(addSubArray)}>
          <Icon name="plus" />
          {t.panels.add}
        </button>
      </Section>
    </div>
  );
}
