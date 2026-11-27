import type { ComponentChildren, JSX } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { parseNumber } from '../../lib/designer/format.ts';
import { useI18n } from './store.ts';

export function Num({ v, u, class: className }: { v: string; u?: string; class?: string }) {
  return (
    <span class={`num ${className ?? ''}`} dir="ltr">
      {v}
      {u && <span class="unit">{u}</span>}
    </span>
  );
}

type IconName = 'arrow' | 'chevron' | 'check' | 'plus' | 'minus' | 'close' | 'link' | 'print' | 'reset' | 'copy' | 'swap';

const paths: Record<IconName, string> = {
  copy: 'M5.5 5.5h7.5v7.5H5.5zM3 10.5V3h7.5',
  arrow: 'M3 8h10M9 4l4 4-4 4',
  chevron: 'M4 6l4 4 4-4',
  check: 'M3 8.5l3.2 3L13 4.5',
  plus: 'M8 3v10M3 8h10',
  minus: 'M3 8h10',
  close: 'M4 4l8 8M12 4l-8 8',
  link: 'M6.5 9.5l3-3M7 4.5l1-1a2.5 2.5 0 013.5 3.5l-1 1M9 11.5l-1 1A2.5 2.5 0 014.5 9l1-1',
  print: 'M4.5 6V2.5h7V6M4.5 11.5h-2v-5h11v5h-2M4.5 9.5h7v4h-7z',
  reset: 'M3 3v3.5h3.5M3.5 6.5A5 5 0 113 9',
  swap: 'M2.5 5.5h10M10 3l2.5 2.5L10 8M13.5 10.5h-10M6 8l-2.5 2.5L6 13',
};

/** `dir` icons point to the inline end and mirror in right-to-left pages. */
export function Icon({ name, dir }: { name: IconName; dir?: boolean }) {
  return (
    <svg class={`dz-ico${dir ? ' dz-ico--dir' : ''}`} viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
      <path d={paths[name]} fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square" />
    </svg>
  );
}

type FieldProps = {
  id: string;
  label: ComponentChildren;
  required?: boolean;
  help?: string;
  error?: string | null;
  class?: string;
  children: ComponentChildren;
};

export function Field({ id, label, required, help, error, class: className, children }: FieldProps) {
  const { t } = useI18n();
  return (
    <div class={`field dz-field ${className ?? ''}`}>
      <label class="field__label" for={id}>
        {label}
        {required && (
          <span class="dz-req" aria-hidden="true">
            *
          </span>
        )}
        {required && <span class="sr-only"> ({t.form.required})</span>}
      </label>
      {children}
      {help && !error && (
        <p class="dz-help" id={`${id}-help`}>
          {help}
        </p>
      )}
      {error && (
        <p class="dz-error" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}

export const describedBy = (id: string, help?: string, error?: string | null) => (error ? `${id}-error` : help ? `${id}-help` : undefined);

type NumberInputProps = {
  id: string;
  value: number;
  onValue: (v: number) => void;
  unit?: string;
  integer?: boolean;
  signed?: boolean;
  invalid?: boolean;
  describedBy?: string;
  onBlur?: () => void;
  /** Told whether the text in the field is something other than a number; an empty field is not. */
  onUnparsed?: (unparsed: boolean) => void;
  placeholder?: string;
};

/** Text input that keeps the typed draft and reports a parsed number (NaN while empty or invalid). */
export function NumberInput({ id, value, onValue, unit, integer, signed, invalid, describedBy: db, onBlur, onUnparsed, placeholder }: NumberInputProps) {
  const show = (v: number) => (Number.isFinite(v) ? String(v) : '');
  const [draft, setDraft] = useState(show(value));
  const focused = useRef(false);
  const unparsed = draft.trim() !== '' && Number.isNaN(parseNumber(draft));
  useEffect(() => {
    if (!focused.current && !Object.is(parseNumber(draft), value)) setDraft(show(value));
  }, [value]);
  useEffect(() => {
    onUnparsed?.(unparsed);
  }, [unparsed]);
  return (
    <div class={`dz-num-input${unit ? ' has-unit' : ''}`}>
      <input
        id={id}
        class="input dz-input"
        type="text"
        dir="ltr"
        inputMode={signed ? 'text' : integer ? 'numeric' : 'decimal'}
        autocomplete="off"
        spellcheck={false}
        enterKeyHint="next"
        placeholder={placeholder}
        value={draft}
        aria-invalid={invalid || undefined}
        aria-describedby={db}
        onFocus={() => {
          focused.current = true;
        }}
        onBlur={() => {
          focused.current = false;
          onBlur?.();
        }}
        onInput={(e) => {
          const text = e.currentTarget.value;
          setDraft(text);
          onValue(parseNumber(text));
        }}
      />
      {unit && (
        <span class="dz-num-input__unit" aria-hidden="true">
          {unit}
        </span>
      )}
    </div>
  );
}

type StepperProps = Omit<NumberInputProps, 'integer'> & { min?: number; max?: number; labelLess: string; labelMore: string };

export function Stepper({ min = 1, max = 9999, labelLess, labelMore, ...input }: StepperProps) {
  const current = Number.isFinite(input.value) ? input.value : 0;
  const set = (v: number) => input.onValue(Math.min(max, Math.max(min, v)));
  return (
    <div class="dz-stepper">
      <button type="button" class="dz-stepper__btn" aria-label={labelLess} disabled={current <= min} onClick={() => set(current - 1)}>
        <Icon name="minus" />
      </button>
      <NumberInput {...input} integer />
      <button type="button" class="dz-stepper__btn" aria-label={labelMore} disabled={current >= max} onClick={() => set(current + 1)}>
        <Icon name="plus" />
      </button>
    </div>
  );
}

export function useTouched(): [boolean, () => void] {
  const [touched, setTouched] = useState(false);
  return [touched, () => setTouched(true)];
}

export function Dot({ tone }: { tone: 'green' | 'amber' | 'invalid' | 'none' }) {
  return <span class={`dz-dot dz-dot--${tone}`} aria-hidden="true" />;
}

export function StepHead({ no, title, intro, id }: { no: number; title: string; intro: string; id: string }) {
  const { t } = useI18n();
  return (
    <header class="dz-head">
      <p class="dz-head__no mono" aria-hidden="true">
        <span>{String(no).padStart(2, '0')}</span>
        <span class="dz-head__of">/ 04</span>
      </p>
      <h2 class="h2 dz-head__title" id={id} tabIndex={-1}>
        <span class="sr-only">{t.steps.stepOf(no)}: </span>
        {title}
      </h2>
      <p class="dz-head__intro">{intro}</p>
    </header>
  );
}

export function Section({ title, children, class: className, aside }: { title?: string; children: ComponentChildren; class?: string; aside?: JSX.Element | null }) {
  return (
    <section class={`dz-section ${className ?? ''}`}>
      {(title || aside) && (
        <div class="dz-section__head">
          {title && <h3 class="dz-section__title">{title}</h3>}
          {aside}
        </div>
      )}
      {children}
    </section>
  );
}
