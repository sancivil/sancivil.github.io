import { useMemo, useState } from 'preact/hooks';
import { findInverter, groupContext, mpptGroups, tempsValid, type BlockSummary, type GroupSummary } from '../../lib/designer/calc.ts';
import { catalog, inverters } from '../../lib/designer/data.ts';
import { fmt, kw, kwRating, pct } from '../../lib/designer/format.ts';
import { MAX_COUNT, addInverter, removeInverter, setGroup, setInverterConfig, setInverterCount, setInverterModel } from '../../lib/designer/project.ts';
import type { Inverter, InverterBlock } from '../../lib/designer/types.ts';
import { CheckTable, Matrix } from './Matrix.tsx';
import { ModelPicker, searchKey, type PickerOption } from './ModelPicker.tsx';
import { configLabel, groupName, inverterMeta, inverterRole } from './labels.ts';
import { errors, project, summary, update, useI18n } from './store.ts';
import { Dot, Field, Icon, Num, Section, StepHead, Stepper, describedBy, useTouched } from './ui.tsx';

const TYPE_ORDER = { hybrid: 0, 'on-grid': 1, micro: 2 } as const;
const sortedInverters = [...inverters].sort(
  (a, b) => TYPE_ORDER[a.type] - TYPE_ORDER[b.type] || (a.phase === b.phase ? 0 : a.phase === 'single_phase' ? -1 : 1) || a.pnomAc - b.pnomAc || a.model.localeCompare(b.model),
);

export const stringing = (b: BlockSummary) =>
  b.groups
    .filter((g) => g.sel.series > 0)
    .map((g) => `${g.sel.strings}x${g.sel.series} (${g.mppts.join('+')})`)
    .join(' ');

function InverterCard({ inv }: { inv: Inverter }) {
  const { t } = useI18n();
  const specs: [string, string, string][] = [
    [t.inverter.specPnomAc, kwRating(inv.pnomAc), 'kW'],
    [t.inverter.specPnomDc, kwRating(inv.pnomDc), 'kW'],
    [t.inverter.specVmaxDc, fmt(inv.vmaxDc), 'V'],
    [t.inverter.specMppt, `${fmt(inv.vminMppt)}–${fmt(inv.vmaxMppt)}`, 'V'],
    [t.inverter.specVstart, fmt(inv.vstart), 'V'],
    [t.inverter.specImax, inv.imaxPerMppt.map((i) => fmt(i, Number.isInteger(i) ? 0 : 1)).join(' / '), 'A'],
    [t.inverter.specRatio, `${pct(inv.percPmaxCc, 0)}–${pct(inv.percPminCc, 0)}`, '%'],
  ];
  return (
    <div class="dz-invcard">
      <div class="dz-invcard__well">
        {inv.image && <img src={inv.image} width="720" height="720" alt={inv.model} loading="lazy" decoding="async" />}
      </div>
      <div class="dz-invcard__body">
        <p class="dz-invcard__role">{inverterRole(inv, t)}</p>
        <dl class="dz-specs dz-specs--inv">
          {specs.map(([label, v, u]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>
                <Num v={v} u={u} />
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

function GroupPanel({ block, g, defaultOpen }: { block: InverterBlock; g: GroupSummary; defaultOpen: boolean }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(defaultOpen);
  const p = project.value;
  const ctx = groupContext(p, catalog, block, g.index);
  const name = groupName(g.mppts);
  const id = `dz-${block.id}-g${g.index}`;
  const hasSel = g.sel.series > 0;
  const tone = g.cell ? g.cell.state : 'none';
  const subOptions = p.subArrays.map((s, i) => ({ id: s.id, label: s.name || t.panels.subArray(i + 1) }));

  return (
    <div class={`dz-mppt${open ? ' is-open' : ''}`}>
      <h4 class="dz-mppt__h">
        <button type="button" class="dz-mppt__toggle" aria-expanded={open} aria-controls={`${id}-body`} onClick={() => setOpen(!open)}>
          <span class="dz-mppt__name mono">{name}</span>
          <span class="dz-mppt__sel">
            <Dot tone={hasSel ? tone : 'none'} />
            {hasSel && g.cell ? (
              <span class="num" dir="ltr">
                {g.sel.strings} × {g.sel.series} · {fmt(g.cell.power)} W
              </span>
            ) : (
              t.inverter.empty
            )}
          </span>
          <span class="dz-mppt__chev">
            <Icon name="chevron" />
          </span>
        </button>
      </h4>
      <div class="dz-mppt__body" id={`${id}-body`} hidden={!open}>
        <div class="dz-mppt__feed">
          <Field id={`${id}-feed`} label={t.inverter.fedBy}>
            <select
              id={`${id}-feed`}
              class="select"
              value={g.sel.subArrayId}
              onChange={(e) => update((x) => setGroup(x, block.id, g.index, { subArrayId: e.currentTarget.value, series: 0, strings: 0 }))}
            >
              {!g.sel.subArrayId && <option value="">{t.inverter.chooseSub}</option>}
              {subOptions.map((o) => (
                <option value={o.id} key={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          {hasSel && (
            <button type="button" class="dz-textbtn" onClick={() => update((x) => setGroup(x, block.id, g.index, { series: 0, strings: 0 }))}>
              <Icon name="close" />
              {t.inverter.clear}
            </button>
          )}
        </div>
        {ctx ? (
          <>
            <Matrix
              id={id}
              name={name}
              ctx={ctx}
              sel={g.sel}
              temps={p.temps}
              onSelect={(series, strings) =>
                update((x) =>
                  setGroup(x, block.id, g.index, g.sel.series === series && g.sel.strings === strings ? { series: 0, strings: 0 } : { series, strings }),
                )
              }
            />
            {g.cell && g.cell.state === 'invalid' && (
              <p class="dz-error" role="alert">
                {t.inverter.broken}
              </p>
            )}
            {g.cell && (
              <div class="dz-mppt__checks">
                <p class="dz-subtitle">{t.inverter.checksTitle}</p>
                <CheckTable cell={g.cell} temps={p.temps} />
              </div>
            )}
          </>
        ) : (
          <p class="dz-note">{tempsValid(p.temps) ? t.inverter.noPanel : t.inverter.noTemps}</p>
        )}
      </div>
    </div>
  );
}

function InverterBlockView({ block, index, canRemove }: { block: InverterBlock; index: number; canRemove: boolean }) {
  const { t } = useI18n();
  const [modelTouched, touchModel] = useTouched();
  const [countTouched, touchCount] = useTouched();
  const e = errors.value[3];
  const inv = findInverter(catalog, block.inverterId);
  const b = summary.value.blocks.find((x) => x.block.id === block.id);
  const id = `dz-${block.id}`;
  const modelErr = modelTouched && e[`${block.id}.model`] ? t.errors.inverterModel : null;
  const countErr = countTouched && e[`${block.id}.count`] ? t.errors.count : null;

  const options = useMemo<PickerOption[]>(
    () =>
      sortedInverters.map((i) => ({
        id: i.id,
        group: t.inverter.groups[i.type],
        label: i.model,
        meta: inverterMeta(i, t),
        search: searchKey(i.model, `${i.pnomAc / 1000}kw`, i.pnomAc, t.inverter.phases[i.phase], t.inverter.groups[i.type], i.phase === 'three_phase' ? '3' : '1'),
      })),
    [t],
  );

  return (
    <section class="dz-block" aria-labelledby={`${id}-title`}>
      <header class="dz-block__head">
        <span class="dz-block__index mono" aria-hidden="true">
          {String(index + 1).padStart(2, '0')}
        </span>
        <h3 class="dz-block__title" id={`${id}-title`}>
          {t.inverter.block(index + 1)}
        </h3>
        {canRemove && (
          <button type="button" class="dz-iconbtn" aria-label={t.inverter.remove(index + 1)} onClick={() => update((x) => removeInverter(x, block.id))}>
            <Icon name="close" />
          </button>
        )}
      </header>

      <div class="dz-grid dz-grid--inv">
        <Field id={`${id}-model`} label={t.inverter.model} required error={modelErr} class="dz-span-2">
          <ModelPicker
            id={`${id}-model`}
            value={block.inverterId}
            options={options}
            placeholder={t.inverter.choose}
            searchLabel={t.inverter.search}
            noResults={t.inverter.none}
            invalid={!!modelErr}
            describedBy={describedBy(`${id}-model`, undefined, modelErr)}
            onClose={touchModel}
            onChange={(inverterId) => update((x) => setInverterModel(x, catalog, block.id, inverterId))}
          />
        </Field>
        <Field id={`${id}-count`} label={t.inverter.count} required help={t.inverter.countHelp} error={countErr}>
          <Stepper
            id={`${id}-count`}
            value={block.count}
            min={1}
            max={MAX_COUNT}
            labelLess="−1"
            labelMore="+1"
            invalid={!!countErr}
            describedBy={describedBy(`${id}-count`, t.inverter.countHelp, countErr)}
            onBlur={touchCount}
            onValue={(count) => update((x) => setInverterCount(x, block.id, count))}
          />
        </Field>
        {inv && (
          <Field id={`${id}-config`} label={t.inverter.config} required>
            <select
              id={`${id}-config`}
              class="select"
              value={block.configKey}
              onChange={(ev) => update((x) => setInverterConfig(x, catalog, block.id, ev.currentTarget.value))}
            >
              {inv.mpptConfigs.map((c) => (
                <option value={c.key} key={c.key}>
                  {configLabel(inv, c.key, t)}
                </option>
              ))}
            </select>
          </Field>
        )}
      </div>

      {inv ? (
        <>
          <InverterCard inv={inv} />
          <div class="dz-mppts">
            {b?.groups.map((g) => (
              <GroupPanel key={`${block.configKey}-${g.index}`} block={block} g={g} defaultOpen={g.index < 2 || mpptGroups(inv, block.configKey).length <= 3} />
            ))}
          </div>
        </>
      ) : (
        <p class="dz-note">{t.inverter.pickFirst}</p>
      )}
    </section>
  );
}

export function StringTable() {
  const { t } = useI18n();
  const s = summary.value;
  const blocks = s.blocks.filter((b) => b.inv);
  return (
    <Section title={t.table.title} class="dz-strtable">
      <dl class="dz-kpis">
        <div>
          <dt>{t.table.ratio}</dt>
          <dd>
            <Num v={s.connectedW > 0 ? pct(s.ratio) : '–'} u="%" />
          </dd>
        </div>
        <div>
          <dt>{t.table.pv}</dt>
          <dd>
            <Num v={kw(s.connectedW)} u="kWp" />
          </dd>
        </div>
        <div>
          <dt>{t.table.usage}</dt>
          <dd class="dz-usage">
            {s.subArrays.map((x, i) => {
              const count = x.subArray.count > 0 ? x.subArray.count : 0;
              const state = x.used > count ? 'invalid' : x.used === count && count > 0 ? 'green' : 'amber';
              return (
                <span class="dz-usage__row" key={x.subArray.id}>
                  <span class="dz-usage__name">{x.subArray.name || t.panels.subArray(i + 1)}</span>
                  <Dot tone={state} />
                  <span class="num" dir="ltr">
                    {x.used}/{count}
                  </span>
                  {x.used !== count && (
                    <span class="dz-usage__note">{x.used > count ? t.table.over(x.used - count) : t.table.unassigned(count - x.used)}</span>
                  )}
                </span>
              );
            })}
          </dd>
        </div>
      </dl>
      {blocks.length > 0 && (
        <div class="dz-table-wrap">
          <table class="dz-table">
            <thead>
              <tr>
                <th scope="col">{t.table.colInverter}</th>
                <th scope="col">{t.table.colRatio}</th>
                <th scope="col">{t.table.colPower}</th>
                <th scope="col">{t.table.colStrings}</th>
              </tr>
            </thead>
            <tbody>
              {blocks.map((b) => (
                <tr key={b.block.id}>
                  <th scope="row">
                    <span class="mono" dir="ltr">
                      {Math.max(1, b.block.count)} × {b.inv!.model}
                    </span>
                  </th>
                  <td>
                    {b.pvW > 0 ? (
                      <span class="dz-ratio">
                        <Dot tone={b.tone ?? 'none'} />
                        <span class="num" dir="ltr">
                          {pct(b.ratio)} %
                        </span>
                      </span>
                    ) : (
                      '–'
                    )}
                  </td>
                  <td>
                    <span class="num" dir="ltr">
                      {kw(b.pvW)} kWp
                    </span>
                  </td>
                  <td>
                    <span class="num" dir="ltr">
                      {stringing(b) || '–'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Section>
  );
}

export function StepInverter() {
  const { t } = useI18n();
  const p = project.value;
  return (
    <div class="dz-step-view">
      <StepHead no={3} title={t.steps.names[3]} intro={t.inverter.intro} id="dz-step-title" />
      <Section>
        {p.inverters.map((b, i) => (
          <InverterBlockView key={b.id} block={b} index={i} canRemove={p.inverters.length > 1} />
        ))}
        <button type="button" class="btn btn--line dz-add" onClick={() => update(addInverter)}>
          <Icon name="plus" />
          {t.inverter.add}
        </button>
      </Section>
      <StringTable />
    </div>
  );
}
