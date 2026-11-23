# faradayiq.com

Website of Faraday Co., exclusive Peimar agent in Iraq. English, Arabic and Kurdish (Sorani),
a procedural 3D module viewer, and the Faraday PV Designer (a public, no-login rebuild of
Peimar's string-sizing tool).

## Stack

Astro 7 (static output) · TypeScript · Preact + Signals (Designer only) · Three.js · GSAP + Lenis ·
self-hosted fonts (DM Sans, IBM Plex Mono, Noto Kufi Arabic, Noto Sans Arabic, all SIL OFL 1.1).
Node ≥ 22.23.

```bash
npm ci            # install exact versions
npm run dev       # http://127.0.0.1:4321
npm test          # Designer engine tests (Peimar reference case included)
npm run check     # type check
npm run build     # static site in dist/
```

Deployment to the SiteBunker cPanel hosting: see [DEPLOY.md](DEPLOY.md).

## Where things live

| What | Where |
|---|---|
| Design system (tokens, type, motion, responsive, RTL rules) | `DESIGN.md`, `src/styles/` |
| Pages (one file serves `/`, `/ar/`, `/ku/`) | `src/pages/[...locale]/` |
| Text in all three languages | `src/i18n/*.ts` (typed: a missing translation fails the type check) |
| Terminology for Arabic / Kurdish | `src/i18n/GLOSSARY.md` |
| Contact details, nav | `src/data/site.ts` |
| Peimar catalog, module and inverter specs | `src/data/catalog.json`, `src/data/designer/*.json` |
| Solar yield and design temperatures for 22 Iraqi cities (PVGIS) | `src/data/iraq-solar.json` |
| Projects | `src/data/projects.json`, photos in `public/images/legacy/` |
| 3D module (hero, anatomy, viewer) | `src/lib/three/`, `src/components/three/` |
| Designer engine and app | `src/lib/designer/`, `src/components/designer/` |
| Research notes and sources | `research/` |

## Common edits

- **Phone, email, address:** `src/data/site.ts` (plus the localized address in `src/i18n/common.ts`).
- **Page text:** the matching dictionary in `src/i18n/` (`home.ts`, `company.ts`, `products.ts`, `designer.ts`, `three.ts`, `common.ts`). Change all three languages.
- **A new project:** add an entry to `src/data/projects.json`, put the photo in `public/images/legacy/`, and add its translated title and line in `src/i18n/company.ts`.
- **Product data:** the Designer data came from Peimar's Designer API on 2026-11-20 and the catalog from peimar.com. Update the JSON files when Peimar publishes new datasheets.

## Credits and licences

- Solar data: PVGIS © European Union, 2001–2026.
- Product names, datasheets and product images: Peimar S.r.l., used by its exclusive agent in Iraq.
- Fonts: SIL Open Font License 1.1.
- 3D studio reflections: "Studio Small 09" HDRI by Sergej Majboroda, Poly Haven (CC0), `public/hdr/`.
