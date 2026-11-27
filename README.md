# faradayiq.com

Website of Faraday Co., exclusive Peimar agent in Iraq. English, Arabic and Kurdish (Sorani),
a procedural 3D module viewer, and the Faraday PV Designer (a public, no-login rebuild of
Peimar's string-sizing tool).

## Stack

Astro 7 (static output) · TypeScript · Preact + Signals (Designer only) · Three.js · GSAP + Lenis ·
self-hosted fonts (DM Sans, IBM Plex Mono, Noto Kufi Arabic, Noto Sans Arabic, all SIL OFL 1.1).
Node ≥ 22.23.

```bash
npm ci               # install exact versions
npm run dev          # http://127.0.0.1:4321
npm test             # content contract and importer, Designer engine (Peimar reference case), deploy scripts
npm run check        # type check
npm run build        # static site in dist/
npm run check:dist   # checks dist/: pages, links, images, sitemap, hreflang, JSON-LD, redirects
```

`dev`, `test`, `check` and `build` first run `npm run content:import`, which validates the owner content
in `CONTENT_DIR` (default: the seed, `tests/fixtures/content-seed.v1`) and writes `src/content/generated/`
and the photo variants in `public/media/` (both git-ignored).

Deployment to the SiteBunker cPanel hosting: see [DEPLOY.md](DEPLOY.md).

## Where things live

| What | Where |
|---|---|
| Design system (tokens, type, motion, responsive, RTL rules) | `DESIGN.md`, `src/styles/` |
| Pages (one file serves `/`, `/ar/`, `/ku/`) | `src/pages/[...locale]/` |
| Text in all three languages | `src/i18n/*.ts` (typed: a missing translation fails the type check) |
| Terminology for Arabic / Kurdish | `src/i18n/GLOSSARY.md` |
| Owner content: company details, phones, hours, product texts and photos, projects, history, figures | edited in the ERP and published as a snapshot to `sancivil/faraday-site-content`; until then, the seed `tests/fixtures/content-seed.v1/snapshot.json` |
| The one way pages read owner content | `src/content/index.ts` (contract `src/content/contract.ts`, importer `scripts/content/import.ts`) |
| Peimar technical data (curated series, families, batteries, warranty programme, site images) | `src/data/technical/*.json` |
| Module and inverter specs for the Designer | `src/data/designer/*.json` |
| Nav, and the contact details client scripts need | `src/data/site.ts` |
| Solar yield and design temperatures for 22 Iraqi cities (PVGIS) | `src/data/iraq-solar.json` |
| 3D module (hero, anatomy, viewer) | `src/lib/three/`, `src/components/three/` |
| Designer engine and app | `src/lib/designer/`, `src/components/designer/` |
| CI and deploy | `.github/workflows/`, `scripts/deploy/` |
| Research notes and sources | `research/` |

## Common edits

- **Phones, email, address, hours, products, photos, projects, history, figures:** the owner edits them in the
  ERP's Website pages (Preview, then Go live). They are not in this repo.
- **Build with the ERP's content locally:** `npm run content:pull` (needs git access to
  `sancivil/faraday-site-content`), then `CONTENT_DIR=.content npm run build`.
- **Page text:** the matching dictionary in `src/i18n/` (`home.ts`, `company.ts`, `products.ts`, `designer.ts`, `three.ts`, `common.ts`). Change all three languages. It must stay true for any owner content (see DESIGN.md §5d).
- **Peimar technical data:** `src/data/technical/*.json`, joined to the owner's entries by `curatedKey`. The
  Designer data came from Peimar's Designer API on 2026-11-20. Update the JSON files when Peimar publishes new datasheets.
- **The seed** is the day-one content. Builds of a push use it until the repository variable `CONTENT_SOURCE`
  is `repo` (the ERP's runs always build the content they send). The developer commits it once to the content
  repo as `snapshot.json`, on `main` with `live` at the same commit: the ERP's "Import the current website" and
  the `repo` builds read `live` (contract/README.md §1). After an edit, recompute its `contentHash` (`contentHash()`
  in `src/content/contract.ts`), then run `npm run content:import -- --check` and `npm test`.
- **Product images:** after adding or replacing a render in `public/images/products/`, run `node scripts/images/products.ts` and commit the WebP copies it writes next to it; pages serve those through `srcset`.

## Credits and licences

- Solar data: PVGIS © European Union, 2001–2026.
- Product names, datasheets and product images: Peimar S.r.l., used by its exclusive agent in Iraq.
- Fonts: SIL Open Font License 1.1.
- 3D studio reflections: "Studio Small 09" HDRI by Sergej Majboroda, Poly Haven (CC0), `public/hdr/`.
