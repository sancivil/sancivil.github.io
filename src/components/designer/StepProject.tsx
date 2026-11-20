import { cities } from '../../lib/designer/data.ts';
import { fmt, ltr } from '../../lib/designer/format.ts';
import { PEIMAR_DEFAULT_TEMPS, setTemps } from '../../lib/designer/project.ts';
import type { Project, Temps } from '../../lib/designer/types.ts';
import { cityName, errors, project, update, useI18n } from './store.ts';
import { Field, Icon, NumberInput, Section, StepHead, describedBy, useTouched } from './ui.tsx';

const TEMP_KEYS = ['tmin', 'tnom', 'tmax'] as const;

function TextField({ id, field, label, required, error }: { id: string; field: 'name' | 'number' | 'client' | 'address'; label: string; required?: boolean; error?: string | null }) {
  const [touched, touch] = useTouched();
  const shown = touched ? error : null;
  return (
    <Field id={id} label={label} required={required} error={shown}>
      <input
        id={id}
        class="input"
        type="text"
        dir="auto"
        autocomplete="off"
        maxLength={200}
        value={project.value[field]}
        aria-required={required || undefined}
        aria-invalid={shown ? true : undefined}
        aria-describedby={describedBy(id, undefined, shown)}
        onBlur={touch}
        onInput={(e) => update((p) => ({ ...p, [field]: e.currentTarget.value }))}
      />
    </Field>
  );
}

function TempField({ k, error, order }: { k: (typeof TEMP_KEYS)[number]; error: boolean; order: boolean }) {
  const { t } = useI18n();
  const [touched, touch] = useTouched();
  const id = `dz-${k}`;
  const msg = touched && error ? t.errors.temp : null;
  const help = { tmin: t.site.tminHelp, tnom: t.site.tnomHelp, tmax: t.site.tmaxHelp }[k];
  return (
    <Field id={id} label={t.site[k]} required help={help} error={msg}>
      <NumberInput
        id={id}
        value={project.value.temps[k]}
        unit={ltr('°C')}
        signed
        invalid={!!msg || order}
        describedBy={describedBy(id, help, msg)}
        onBlur={touch}
        onValue={(v) => update((p) => setTemps(p, { [k]: v }))}
      />
    </Field>
  );
}

const sameTemps = (a: Temps, b: Temps) => a.tmin === b.tmin && a.tnom === b.tnom && a.tmax === b.tmax;

export function StepProject() {
  const { t, locale } = useI18n();
  const p: Project = project.value;
  const e = errors.value[1];
  const city = cities.find((c) => c.id === p.cityId) ?? null;
  const edited = city ? !sameTemps(city.design, p.temps) : false;

  return (
    <div class="dz-step-view">
      <StepHead no={1} title={t.steps.names[1]} intro={t.project.intro} id="dz-step-title" />

      <Section title={t.project.section}>
        <div class="dz-grid">
          <TextField id="dz-name" field="name" label={t.project.name} required error={e.name ? t.errors.name : null} />
          <TextField id="dz-number" field="number" label={t.project.number} />
          <TextField id="dz-client" field="client" label={t.project.client} />
          <TextField id="dz-address" field="address" label={t.project.address} />
          <Field id="dz-notes" label={t.project.notes} class="dz-span-2">
            <textarea
              id="dz-notes"
              class="textarea"
              dir="auto"
              rows={4}
              maxLength={2000}
              value={p.notes}
              onInput={(ev) => update((x) => ({ ...x, notes: ev.currentTarget.value }))}
            />
          </Field>
        </div>
      </Section>

      <Section title={t.site.section}>
        <div class="dz-grid">
          <Field id="dz-city" label={t.site.city} help={t.site.cityHelp} class="dz-span-2">
            <select
              id="dz-city"
              class="select"
              value={p.cityId}
              aria-describedby="dz-city-help"
              onChange={(ev) => {
                const id = ev.currentTarget.value;
                const next = cities.find((c) => c.id === id);
                update((x) => ({ ...x, cityId: id, temps: next ? { ...next.design } : x.temps }));
              }}
            >
              <option value="">{t.site.custom}</option>
              {cities.map((c) => (
                <option value={c.id} key={c.id}>
                  {cityName(c, locale)}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div class="dz-temps">
          {TEMP_KEYS.map((k) => (
            <TempField key={k} k={k} error={!!e[k]} order={!!e.order} />
          ))}
        </div>
        {e.order && (
          <p class="dz-error" role="alert">
            {t.errors.order}
          </p>
        )}
        <p class="dz-source small">
          {city ? (
            edited ? (
              <>
                {t.site.edited}{' '}
                <button type="button" class="dz-textbtn" onClick={() => update((x) => ({ ...x, temps: { ...city.design } }))}>
                  <Icon name="reset" />
                  {t.site.reset(cityName(city, locale))}
                </button>
              </>
            ) : (
              t.site.fromCity(cityName(city, locale))
            )
          ) : sameTemps(p.temps, PEIMAR_DEFAULT_TEMPS) ? (
            t.site.defaults
          ) : null}
          {city && (
            <span class="dz-source__values num" dir="ltr">
              {TEMP_KEYS.map((k) => `${fmt(city.design[k])} °C`).join(' / ')}
            </span>
          )}
        </p>
      </Section>
    </div>
  );
}
