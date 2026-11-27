# Showing the site to Faraday

## Option A: on your laptop (works offline)

```bash
npm ci
npm run build
npm run preview        # open http://127.0.0.1:4321/
```

The build shows the day-one content (the seed). To show the owner's latest content, run `npm run content:pull`
first and build with `CONTENT_DIR=.content npm run build`.

For iPad and phone views, open Chrome DevTools (F12), press Ctrl+Shift+M and pick "iPad Air" or
"iPhone 14 Pro Max" from the device list. Reload after switching so the 3D scenes resize.

## Option B: a link the client opens on their own phone and iPad (free)

Share the GitHub Pages preview, https://sancivil.github.io/. Every push to `main` or `production` and every
Preview from the ERP rebuilds it, so it shows whichever came last. Every page carries noindex and its `llms.txt` points to the
live file, so the preview cannot compete with faradayiq.com.

## Option C: go live on faradayiq.com

Follow DEPLOY.md.

## A 10-minute walkthrough

1. **Home, desktop.** The 3D Peimar module in the hero, then scroll slowly through "Anatomy" (the layers
   separate), then the range, the Designer teaser, the projects, the FAQ and contact.
2. **Products menu and languages.** Open **Products** in the header to show the full-width menu. Then open the
   globe menu and choose **العربية**, then **کوردی**: the same page re-renders fully right-to-left, and the choice
   is remembered.
3. **A product.** Products → Photovoltaic modules → **OR Series OR10H**. Drag the module to turn it, press
   **Explode** and **Dimensions**, then pick **OR10H610MNDB**: the specs, the 3D model and the datasheet
   link update. Press **Design with this module**.
4. **Designer, installer path.** 12 × OR10H560M, inverter **PSI-X1P6000-HY**, "2 independent MPPTs",
   1 × 6 panels on each MPPT. Show the green / amber / grey grid, the voltage checks at the city's
   temperatures, the summary (6.72 kWp, ratio 107.14%), **Generate PDF** and **Request a quote** (WhatsApp).
   These are the same numbers Peimar's own Designer gives.
5. **Designer, homeowner path.** **Start from my needs** → Baghdad, 1,000 kWh a month → the estimate →
   **Continue in the Designer**.
6. **Solar data.** Footer → "Solar data by city" → **Erbil**: the monthly production chart and the sizing table.
7. **Phone.** Open the link from Option B on a phone: the menu, the language switch, and the Designer.

Points to make: Faraday is the exclusive Peimar agent in Iraq; the Designer is public, matches Peimar's
maths, and adds Iraqi city temperatures, yield estimates and a homeowner path; three languages; built for
Google and AI search.
Before launch, a native speaker should review the Arabic and Kurdish text.
