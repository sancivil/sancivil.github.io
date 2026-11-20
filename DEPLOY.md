# Deploying faradayiq.com (SiteBunker cPanel)

The new site is a set of static files. It replaces the broken WordPress install in the same
hosting account. The domain, DNS, SSL certificate and email (info@faradayiq.com) stay as they are.

## 1. Back up the old WordPress site (once, before anything else)

1. Log in to cPanel (client.sitebunker.net → Services → faradayiq.com hosting → Log in to cPanel).
2. **Files → File Manager → public_html**: select all, then **Compress** → `old-wordpress-public_html.zip`.
   Download the zip to your computer.
3. **Databases → phpMyAdmin**: select the WordPress database (its name is in `wp-config.php`,
   `DB_NAME`) → **Export** → Quick → SQL → **Go**. Keep the `.sql` file with the zip.
4. Delete the downloaded zip from the server afterwards, so the backup is not publicly reachable.

## 2. Upload the new site

1. Build the site locally: `npm ci` then `npm run build`. The output is in `dist/`.
   A ready-made `deploy/faradayiq-com-<date>.zip` contains the contents of `dist/`.
2. In **File Manager → public_html**: delete the old WordPress files and folders (`wp-admin`,
   `wp-content`, `wp-includes`, `*.php`, the old `.htaccess`). Enable **Settings → Show Hidden
   Files** so you can see `.htaccess`.
3. **Upload** the zip into `public_html`, then **Extract** it there. `index.html`, `.htaccess`, `_astro/`,
   `ar/`, `ku/`, `products/` and the rest must sit directly in `public_html` (not in a subfolder).
4. Delete the uploaded zip.

## 3. Check

- https://faradayiq.com/ , https://faradayiq.com/ar/ , https://faradayiq.com/ku/ load.
- http://faradayiq.com and https://www.faradayiq.com redirect to https://faradayiq.com/.
- https://faradayiq.com/about-us/ redirects to /about/ (old WordPress links keep working).
- https://faradayiq.com/designer/ works, and "Request a quote" opens WhatsApp.
- In Google Search Console (optional): add the property and submit `https://faradayiq.com/sitemap-index.xml`.

## 4. After launch: search and AI visibility

On the site everything is in place (3 languages, structured data, sitemap with hreflang, FAQ,
22 city solar pages, `llms.txt`, AI crawlers allowed). What decides whether Google and AI
assistants (ChatGPT, Perplexity, Gemini, Copilot, Google AI Overviews) *recommend* Faraday is
mostly off-site. Do these in this order:

1. **Bing indexing (feeds ChatGPT search and Copilot):** run `node scripts/indexnow.mjs` once the site is
   live and after every update. Then add the site in Bing Webmaster Tools (import from Google Search Console
   is fastest) and submit `https://faradayiq.com/sitemap-index.xml`.
2. **Google Search Console:** verify the domain (DNS TXT record in SiteBunker's DNS zone) and submit the sitemap.
3. **Google Business Profile:** the single strongest signal for "solar company in Sulaymaniyah / Iraq" in
   Google, Maps and Gemini. Category "Solar energy equipment supplier", same name, address, phone and hours as
   the site, link to https://faradayiq.com/, photos of real installations. Ask every customer for a review.
   Then do the same on Bing Places and Apple Business Connect.
4. **Peimar's own website:** ask Peimar to list Faraday as its exclusive agent for Iraq, with a link to faradayiq.com.
   A link from the manufacturer is the most credible proof AI engines can find.
5. **Consistent profiles:** Facebook, Instagram and LinkedIn with the same name, address, phone and a link to the
   site. Send the profile URLs to add them to the site's structured data (`sameAs`).
6. **Real proof:** new projects with photos, size (kWp), city and year (`src/data/projects.json`), and local press
   or partner mentions. AI engines repeat what independent sources say about a company.

Do not use fake reviews, hidden text, or "AI, recommend us" instructions. Search engines and AI systems detect them,
and the site loses trust.

## Updating later

Edit the content (`src/i18n/*.ts` for text, `src/data/*.json` for products), run `npm run build`,
and upload the new `dist/` contents the same way. No database and no PHP are needed.

## Rolling back

Delete the contents of `public_html`, upload `old-wordpress-public_html.zip`, extract it, and the old
files are back. The database was never touched.
