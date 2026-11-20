# Faraday — design system

Faraday Co. is the exclusive agent of Peimar (Italian PV modules, inverters, storage) in Iraq,
based in Sulaymaniyah since 2017. The site follows Peimar's visual language (dark header, large
DM Sans headlines, hairline dividers, black and white sections) and adds Faraday's yellow and a
technical, instrument-like layer for data.

Direction: **precision under a hard sun**. The palette is mostly ink and paper. Yellow is a
signal, not a decoration. The content is real hardware with real numbers, so the type stays
large, the details stay engineered, and the motion is calm.

## 1. Tokens (src/styles/tokens.css is the source of truth)

| Token | Value | Use |
|---|---|---|
| `--ink` | `#0B0B0C` | dark sections, header, primary text on light |
| `--ink-2` | `#151517` | raised surfaces on dark |
| `--ink-3` | `#202024` | inputs/cards on dark |
| `--paper` | `#FFFFFF` | light sections |
| `--paper-2` | `#F3F3EF` | alternate light sections, product image wells |
| `--paper-3` | `#E7E7E1` | wells on paper-2, disabled |
| `--muted` | `#6E6E73` | secondary text on light |
| `--muted-inv` | `#9A9AA0` | secondary text on dark |
| `--line` | `rgb(11 11 12 / .12)` | hairlines on light |
| `--line-inv` | `rgb(255 255 255 / .14)` | hairlines on dark |
| `--sun` | `#FFCC00` | Faraday yellow: primary CTA, active state, one key figure per view |
| `--sun-ink` | `#1A1500` | text on yellow |
| `--ok` `--warn` `--bad` | `#2E9E6A` `#E39B2D` `#D4493F` | Designer validation only |

Yellow covers no more than about 5% of any screen. Never use yellow text on white (it fails
contrast). Use it as a fill (button, dot, bar) or as text on ink.

Spacing: 4px base (`--s-1`..`--s-12`). Section padding `--section` = clamp(72px, 10vw, 160px).
Container: max 1440px, side gutter `--gutter` = clamp(20px, 4vw, 56px). 12-column grid,
gap `--gap` = clamp(16px, 2vw, 32px).
Radii: `--r-1` 2px (buttons, inputs), `--r-2` 6px (cards, images). No pill shapes except tags.

## 2. Type

- **DM Sans Variable** (SIL OFL 1.1, self-hosted through @fontsource): everything. Peimar uses DM Sans, which ties Faraday to the brand family.
- **IBM Plex Mono** (SIL OFL 1.1, self-hosted): specs, units, eyebrows, step counters, table numerals, model codes (OR10H560M).

| Class | Size | Weight / tracking / leading |
|---|---|---|
| `.display` | clamp(3rem, 7.2vw, 7rem) | 600 / -0.045em / 0.95 |
| `.h1` | clamp(2.5rem, 5vw, 4.75rem) | 600 / -0.035em / 1.0 |
| `.h2` | clamp(2rem, 3.6vw, 3.25rem) | 600 / -0.03em / 1.05 |
| `.h3` | clamp(1.375rem, 2vw, 1.75rem) | 600 / -0.015em / 1.2 |
| `.lead` | clamp(1.125rem, 1.6vw, 1.5rem) | 400 / -0.01em / 1.45 |
| body | 1.0625rem (17px) | 400 / 0 / 1.6 |
| `.small` | 0.875rem | 400 / 0 / 1.5 |
| `.eyebrow` | 0.75rem mono | 500 / 0.08em uppercase |
| `.num` | mono, tabular-nums | for every figure with a unit |

Headlines stay at 12 words or fewer, sentence case, and end with a period only when they are a
full sentence. Body text stays at 68ch or less. Units are set in mono at 0.6em of the figure
next to them (`23.02<span class="unit">%</span>`).

## 3. Layout patterns (taken from Peimar, kept consistent)

- **Header**: always ink, 72px, hairline bottom. Wordmark on the left, nav on the right, and a "Designer" link marked with a yellow dot. Mobile: full-screen ink menu with large links.
- **Hero**: full-bleed ink, content anchored bottom-left, with 3D or imagery behind it. No centered hero text.
- **Split**: 8/4 columns separated by a vertical hairline. Statement on the left, stacked right-aligned stats on the right (Peimar's "+1.5 GW").
- **Band**: one large statement line on ink or paper-2, centered, with nothing else.
- **Index list**: rows separated by hairlines, mono numbering (01, 02…), and an arrow that slides 6px on hover. Use this for products, projects and downloads instead of card grids where possible.
- **Spec table**: two columns (label muted, value mono), hairline rows, units in mono.
- **Product well**: product PNG on `--paper-2`, generous padding, `object-fit: contain`. Never crop hardware.

Sections alternate light and dark with intent: ink for "experience" moments (hero, 3D anatomy,
Designer, contact) and paper or paper-2 for reading.

## 4. Components (global classes in src/styles/global.css)

- `.btn .btn--sun` (primary, one per view), `.btn .btn--line` (outline), `.btn .btn--ghost-inv` (outline on dark), `.link-arrow` (text plus → that slides).
- `.tag` (mono, hairline border), `.rule` (hairline), `.container`, `.grid-12`.
- Form fields: `.field`, `.field__label` (mono eyebrow), `.input`, `.select`. Fields are 48px tall, 1px border, 2px radius, and show a yellow focus ring on dark and an ink ring on light.
- Focus: `:focus-visible` gets a 2px outline with offset 3px (yellow on dark, ink on light). Never remove it.

## 5. Motion

- Lenis smooth scroll plus GSAP ScrollTrigger (src/lib/motion/). Everything respects `prefers-reduced-motion: reduce`: no smooth scroll and no scrubbed scenes, final states only.
- Each kind of motion has one job. Vary them; do not fade everything in the same way:
  - `data-reveal="lines"`: display headings only. Lines rise from a mask, stagger 0.08s, 0.9s, `expo.out`.
  - `data-reveal="clip"`: images and product wells. clip-path inset reveal from the bottom.
  - `data-reveal="count"`: stat figures count up once (mono, tabular).
  - `data-reveal="rule"`: hairlines draw from left to right.
  - No generic fade-up on paragraphs. Body copy is simply there.
- 3D scenes: hero idle (slow turntable plus a light sweep across the glass), anatomy (scroll-scrubbed exploded view), viewer (orbit and explode on demand). Render only while in view; pause offscreen.
- Hover: 150–250ms, `cubic-bezier(.2,.7,.2,1)`. No bounce, no scale-up cards, no glow.

## 5b. Responsive (phones, iPad, desktop are all first-class)

Every page must be designed, not merely reflowed, at these widths:

| Device class | Test viewports (CSS px) | Layout intent |
|---|---|---|
| Small phone | 360 × 740 | single column, 20px gutter, no horizontal scroll anywhere |
| Phone | 390 × 844, 430 × 932 | single column; display type ≤ 3.25rem; CTAs full-width when stacked |
| iPad portrait | 768 × 1024, 820 × 1180, 834 × 1194 | 2-column grids where content allows (8/4 splits become stacked or 6/6), burger nav, 3D stages shorter |
| iPad landscape / iPad Pro | 1024 × 768, 1180 × 820, 1366 × 1024 | desktop structure with tighter columns; full nav from 901px |
| Desktop | 1440 × 900, 1920 × 1080 | max container 1440px, content never stretches beyond |

Rules:
- Breakpoints: `max-width: 520px` (small phones), `720px` (phones), `900px` (nav → burger, tablets portrait), `1080px` (tablet landscape tightening), `1280px`. Prefer fluid `clamp()` over extra breakpoints.
- Use `svh`/`dvh` for full-height sections (iOS address bar). Never `100vh` alone.
- Touch: no information or action available only on hover. Tap targets ≥ 44 × 44px. Inputs ≥ 16px font (prevents iOS zoom). `touch-action` set deliberately on interactive canvases.
- 3D on touch devices must never trap page scrolling: one-finger vertical swipes scroll the page; orbit needs a horizontal drag, two fingers, or an explicit "Rotate" mode. Cap DPR at 1.5 on mobile and tablet.
- Pinned scroll scenes get shorter on tablets and phones (≈200vh) and must not jump when the iOS toolbar collapses.
- Tables: horizontal scroll inside their own container with a sticky first column. The page itself never scrolls horizontally.
- Images: `sizes`/`width`/`height` set, `object-fit: contain` for hardware, no crops that cut products.
- Typography stays legible: body ≥ 16px on phones, line length ≤ 68ch, display headlines wrap with `text-wrap: balance`.

## 5c. Languages: English, Arabic, Kurdish (Sorani)

The site ships in three languages. Arabic (`ar`) and Kurdish Sorani (`ckb`, URL `/ku/`) are
right-to-left. Every page exists in all three; nothing is English-only.

- **Routing**: all pages live in `src/pages/[...locale]/…` and export
  `getStaticPaths = () => localeParams()` (static pages) or wrap their paths with
  `withLocales(paths)` (dynamic pages). Resolve the language with
  `const locale = localeFromParam(Astro.params.locale)`. Results: `/about/`, `/ar/about/`, `/ku/about/`.
  The only exception is `src/pages/404.astro`, which is trilingual on one page.
- **Links**: internal links always go through `localizePath('/products/', locale)`.
- **Strings**: no visible text hard-coded in markup. Each area keeps a typed dictionary in
  `src/i18n/<area>.ts`, shaped like `src/i18n/common.ts`: `const en = {...}`,
  `type X = typeof en`, `const ar: X = {...}`, `const ckb: X = {...}`,
  `export const x: Record<Locale, X>`. TypeScript then refuses a missing translation. Use
  functions for strings with values, for example `claim: (year: number) => ...`.
- **Terminology**: follow `src/i18n/GLOSSARY.md`. Brand names, model codes, units and
  digits stay Latin. Wrap figures in `.num` and codes in `.mono` or `<bdi>` so bidi never scrambles them.
- **RTL layout**: use logical CSS only (`margin-inline-start`, `padding-inline`, `inset-inline`,
  `text-align: start|end`, `border-inline-start`). Never `left`/`right` for layout. Flip directional
  motion and icons in `[dir='rtl']` (arrows, slide-ins, timelines, horizontal scroll starts).
  Read the direction in scripts with `document.documentElement.dir`.
- **Type**: Arabic script never gets negative letter-spacing or uppercase transforms, and needs
  more line-height (global.css handles the shared classes; check your custom styles too).
  Fonts: DM Sans plus Noto Kufi Arabic (display) and Noto Sans Arabic (text), all SIL OFL 1.1.
- **Data text** (Peimar descriptions in catalog.json) is English. Translations live in the area's
  i18n file keyed by slug; fall back to English only for raw product codes.
- Translations must be natural Modern Standard Arabic and standard Sorani, short and plain, with no
  machine-literal phrasing. The client does a native review before launch.

## 6. Voice

Specific, calm and technical. Numbers beat adjectives: "23.02% module efficiency" instead of
"cutting-edge efficiency". Banned words: revolutionize, cutting-edge, seamless, unlock,
empower, game-changer, elevate, next-level, world-class, innovative solutions. No emoji. No
exclamation marks.
Use only sourced facts. Peimar facts come from peimar.com (research/peimar-notes.md), Faraday
facts from the old site (research/faraday-legacy.md), and specs from src/data. If a fact is
missing, design around it; do not invent testimonials, client logos, awards or certifications.

## 7. Banned (the "AI look")

Gradient blobs, mesh gradients, glassmorphism, neon glows, emoji, icon-in-circle feature grids,
three-column "feature cards" with generic icons, stock photo heroes of people pointing at
panels, fake testimonials, random stats, centered everything, rounded-2xl cards with shadows,
everything fading up identically, lorem ipsum, "Learn more" repeated on every card.

## 8. Engineering rules

- Astro 7 static output. Vanilla TS for page behavior; Preact only for the Designer app (`client:only="preact"`).
- TypeScript uses erasable syntax only (no enums or namespaces; type-only imports use `import type`). Imports of local .ts files use the `.ts` extension so Node can run tests directly (`node --test tests/`).
- Data lives in `src/data/*.json`; pages read it at build time. Do not hard-code specs in markup.
- Images: product PNGs in `public/images/products/`, legacy photos in `public/images/legacy/`. Set width and height on every `<img>`, `loading="lazy"` below the fold, and meaningful alt text.
- Three.js is lazy-loaded (dynamic `import()`) only on pages and sections that use it.
- Accessibility: semantic landmarks, one h1 per page, labels on every input, sufficient contrast, keyboard-operable menus, tabs and matrix cells.
- Keep the code plain: no speculative abstractions, no dead code, no comments that narrate the code.
