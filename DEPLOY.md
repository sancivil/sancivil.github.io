# Deploying faradayiq.com (SiteBunker cPanel)

The new site is a set of static files. It replaces the broken WordPress install in the same
hosting account. The domain, DNS, SSL certificate and email (info@faradayiq.com) stay as they are.

GitHub Actions does the building and uploading:

- **Build website** (`.github/workflows/site.yml`) runs on every push to `main` and `production`, and for the
  ERP's Preview. Every build goes to the GitHub Pages preview, with noindex on every page. A build of
  `production` also keeps the faradayiq.com build as the **site-live** artifact, a zip kept for 90 days.
- **Go live** (`.github/workflows/live.yml`) uploads the site-live artifact of one production run to
  `public_html` over FTPS, checks the live site and tells IndexNow which pages changed.

## 1. Once, before the first Go live

1. **Back up the old WordPress site.**
   1. Log in to cPanel (client.sitebunker.net → Services → faradayiq.com hosting → Log in to cPanel).
   2. **Files → File Manager → public_html**: select all, then **Compress** → `old-wordpress-public_html.zip`.
      Download the zip to your computer.
   3. **Databases → phpMyAdmin**: select the WordPress database (its name is in `wp-config.php`,
      `DB_NAME`) → **Export** → Quick → SQL → **Go**. Keep the `.sql` file with the zip.
   4. Delete the downloaded zip from the server afterwards, so the backup is not publicly reachable.
2. **GitHub settings** (repository → Settings):
   - environment `production`, limited to the `production` branch, with the secrets `FTPS_HOST` (the server
     hostname from cPanel, which the certificate names, not faradayiq.com), `FTPS_USER` and `FTPS_PASSWORD` of an
     FTP account whose directory is `public_html` (cPanel → **FTP Accounts**; the deploy writes to the account's
     home folder) and, if it is not 21, `FTPS_PORT`;
   - the `github-pages` environment must allow the `production` branch;
   - the repository secret `CONTENT_DEPLOY_KEY` and the variable `CONTENT_SOURCE` (`seed` until the owner's
     content repo takes over, then `repo`).
3. **Prove FTPS:** Actions → **FTPS probe** → Run workflow on `production`. When it passes, delete
   `.github/workflows/ftps-probe.yml`.

## 2. Go live

- **Content.** The owner publishes in the ERP. It runs the build (Preview), Go live and Put back by itself.
- **Code.** Push to `main` and check the preview. Then release with `git push origin main:production`. When
  **Build website** on `production` has passed, open Actions → **Go live** → Run workflow on `production`, with
  `run_id` = that run's id (the number at the end of its address) and `publish_id` empty.

What Go live does:

1. It refuses a preview build, a build of another publish, a build without a required file, and a build that
   would remove more than 30% of the deployed pages, unless `allow_large_removal` is `yes`.
2. It uploads by `.deploy/manifest.json` (the files of the last complete deploy): new and changed assets first,
   then the pages, swapped in by rename, `.htaccess`, deletions, `build.json`, and the manifest last. A cut
   connection leaves the old site working; the next run finishes the job.
3. It waits until https://faradayiq.com/build.json is the new build, checks the home pages and some changed
   pages, then tells IndexNow about the changed pages.

**The first Go live** has no manifest: it uploads every file and deletes nothing. Its log counts the files on
the server that are not in the build: the old WordPress files and any leftovers of a manual upload (an old zip,
old `_astro/*.js` files). Once the new site is live (§4), delete them by hand in File Manager: `wp-admin/`,
`wp-content/`, `wp-includes/`, every `.php` file (WordPress's PHP would keep running otherwise) and the
leftovers. Never delete `.well-known/`, `cgi-bin/` or `.deploy/`.

**Files changed by hand on the server** are not detected. Delete `.deploy/manifest.json` (File Manager,
Settings → Show Hidden Files) and the next Go live uploads every file again, as on a first run.

## 3. Manual upload (only when Go live cannot run)

1. Open the production **Build website** run on GitHub and download its **site-live** artifact (a zip).
   Do not upload a build made on your computer: it carries the seed or your local content, not the owner's.
2. In **File Manager → public_html**, with **Settings → Show Hidden Files** on: upload the zip, **Extract** it
   there, replacing the files, then delete the zip. `index.html`, `.htaccess`, `_astro/`, `ar/`, `ku/`,
   `products/` and the rest must sit directly in `public_html`, not in a subfolder.
3. Delete `.deploy/manifest.json`, so the next Go live uploads every file. If WordPress was still there, delete
   its files as described under **The first Go live**.

## 4. Check

- https://faradayiq.com/ , https://faradayiq.com/ar/ , https://faradayiq.com/ku/ load.
- https://faradayiq.com/build.json shows the `publishId` and `codeCommit` you deployed.
- http://faradayiq.com and https://www.faradayiq.com redirect to https://faradayiq.com/.
- https://faradayiq.com/about-us/ redirects to /about/ (old WordPress links keep working).
- https://faradayiq.com/designer/ works, and "Request a quote" opens WhatsApp.
- In Google Search Console (optional): add the property and submit `https://faradayiq.com/sitemap-index.xml`.

## 5. After launch: search and AI visibility

On the site everything is in place (3 languages, structured data, sitemap with hreflang, FAQ,
22 city solar pages, `llms.txt`, AI crawlers allowed). What decides whether Google and AI
assistants (ChatGPT, Perplexity, Gemini, Copilot, Google AI Overviews) *recommend* Faraday is
mostly off-site. Do these in this order:

1. **Bing indexing (feeds ChatGPT search and Copilot):** Go live tells IndexNow about the pages it adds, changes
   or removes; the first Go live sends every page. Then add the site in Bing Webmaster Tools (import from Google
   Search Console is fastest) and submit `https://faradayiq.com/sitemap-index.xml`.
2. **Google Search Console:** verify the domain (DNS TXT record in SiteBunker's DNS zone) and submit the sitemap.
3. **Google Business Profile:** the single strongest signal for "solar company in Sulaymaniyah / Iraq" in
   Google, Maps and Gemini. Category "Solar energy equipment supplier", same name, address, phone and hours as
   the site, link to https://faradayiq.com/, photos of real installations. Ask every customer for a review.
   Then do the same on Bing Places and Apple Business Connect.
4. **Peimar's own website:** ask Peimar to list Faraday as its exclusive agent for Iraq, with a link to faradayiq.com.
   A link from the manufacturer is the most credible proof AI engines can find.
5. **Consistent profiles:** Facebook, Instagram and LinkedIn with the same name, address, phone and a link to the
   site. The owner adds the profile URLs in the ERP; they go into the site's structured data (`sameAs`).
6. **Real proof:** new projects with photos, size (kWp), city and year, added in the ERP, and local press or
   partner mentions. AI engines repeat what independent sources say about a company.

Do not use fake reviews, hidden text, or "AI, recommend us" instructions. Search engines and AI systems detect them,
and the site loses trust.

## Rolling back

- **An earlier version:** Put back in the ERP, or Go live with the run id of an earlier production build
  (site-live artifacts are kept 90 days).
- **Back to WordPress:** delete the contents of `public_html` (hidden files included, so `.deploy/` goes too),
  upload `old-wordpress-public_html.zip`, extract it, and the old files are back. The database was never touched.
