import type { ComponentChildren } from 'preact';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { useI18n } from './store.ts';
import { Icon } from './ui.tsx';

export type PickerOption = { id: string; group: string; label: string; meta: string; search: string; thumb?: string | null };

function Thumb({ src }: { src: string | null | undefined }) {
  return <span class="dz-pick__thumb">{src && <img src={src} width="40" height="40" alt="" loading="lazy" decoding="async" />}</span>;
}

type Props = {
  id: string;
  value: string;
  options: PickerOption[];
  placeholder: string;
  searchLabel: string;
  noResults: string;
  invalid?: boolean;
  describedBy?: string;
  onChange: (id: string) => void;
  onClose?: () => void;
  footer?: ComponentChildren;
};

const norm = (s: string) => s.toLowerCase().replace(/[\s()\-_.]/g, '');

/** Searchable listbox grouped by series or type; arrow keys, Enter and Escape work from the search field. */
export function ModelPicker({ id, value, options, placeholder, searchLabel, noResults, invalid, describedBy, onChange, onClose, footer }: Props) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  const filtered = useMemo(() => {
    const terms = query.trim().split(/\s+/).filter(Boolean).map(norm);
    return terms.length ? options.filter((o) => terms.every((term) => o.search.includes(term))) : options;
  }, [query, options]);

  const selected = options.find((o) => o.id === value);
  const thumbs = options.some((o) => o.thumb !== undefined);

  const close = (focusTrigger: boolean) => {
    setOpen(false);
    setQuery('');
    onClose?.();
    if (focusTrigger) trigger.current?.focus();
  };

  useEffect(() => {
    if (!open) return;
    const start = Math.max(0, filtered.findIndex((o) => o.id === value));
    setActive(start);
    search.current?.focus();
    const onDown = (e: PointerEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) close(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    list.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  const pick = (o: PickerOption | undefined) => {
    if (!o) return;
    onChange(o.id);
    close(true);
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(filtered.length - 1, a + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      pick(filtered[active]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      close(true);
    } else if (e.key === 'Tab') {
      close(false);
    }
  };

  let lastGroup = '';
  return (
    <div class={`dz-pick${open ? ' is-open' : ''}${thumbs ? ' has-thumbs' : ''}`} ref={root}>
      <button
        type="button"
        id={id}
        ref={trigger}
        class="dz-pick__trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        onClick={() => (open ? close(false) : setOpen(true))}
      >
        {thumbs && selected && <Thumb src={selected.thumb} />}
        {selected ? (
          <span class="dz-pick__value">
            <span class="dz-pick__label mono" dir="ltr">
              {selected.label}
            </span>
            <span class="dz-pick__meta">{selected.meta}</span>
          </span>
        ) : (
          <span class="dz-pick__placeholder">{placeholder}</span>
        )}
        <Icon name="chevron" />
      </button>
      {open && (
        <div class="dz-pick__pop">
          <input
            ref={search}
            class="input dz-pick__search"
            type="search"
            dir="auto"
            role="combobox"
            aria-label={searchLabel}
            placeholder={searchLabel}
            aria-expanded="true"
            aria-controls={`${id}-list`}
            aria-autocomplete="list"
            aria-activedescendant={filtered[active] ? `${id}-opt-${active}` : undefined}
            value={query}
            onInput={(e) => {
              setQuery(e.currentTarget.value);
              setActive(0);
            }}
            onKeyDown={onKey}
          />
          {query && (
            <button
              type="button"
              class="dz-pick__clear"
              aria-label={t.form.clearSearch}
              onClick={() => {
                setQuery('');
                setActive(0);
                search.current?.focus();
              }}
            >
              <Icon name="close" />
            </button>
          )}
          <ul class="dz-pick__list" id={`${id}-list`} role="listbox" ref={list} data-lenis-prevent>
            {filtered.length === 0 && <li class="dz-pick__empty">{noResults}</li>}
            {filtered.map((o, i) => {
              const header = o.group !== lastGroup;
              lastGroup = o.group;
              return [
                header && (
                  <li class="dz-pick__group" role="presentation" key={`g-${o.group}`}>
                    {o.group}
                  </li>
                ),
                <li
                  key={o.id}
                  id={`${id}-opt-${i}`}
                  data-index={i}
                  role="option"
                  aria-selected={o.id === value}
                  class={`dz-pick__opt${i === active ? ' is-active' : ''}`}
                  onPointerMove={() => setActive(i)}
                  onClick={() => pick(o)}
                >
                  {thumbs && <Thumb src={o.thumb} />}
                  <span class="dz-pick__label mono" dir="ltr">
                    {o.label}
                  </span>
                  <span class="dz-pick__meta">{o.meta}</span>
                  {o.id === value && <Icon name="check" />}
                </li>,
              ];
            })}
          </ul>
          {footer}
        </div>
      )}
    </div>
  );
}

export const searchKey = (...parts: (string | number | null | undefined)[]) => norm(parts.filter((p) => p !== null && p !== undefined).join(' '));
