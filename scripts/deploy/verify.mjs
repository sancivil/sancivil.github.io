// Checks that the site serves the build just deployed: node scripts/deploy/verify.mjs dist-live
// build.json must equal the build's own within 60 s; /, /ar/, /ku/, /products/ and one page per language from
// .deploy-out/changed-urls.txt must answer 200, and the build's first content redirect 301 or 302.
//   SITE_URL  the site's address, https://faradayiq.com when empty
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { setTimeout } from 'node:timers/promises';
import { isDeepStrictEqual } from 'node:util';
import { CHANGED_URLS, DeployError, SITE_URL, fail, pagePath } from './sync.mjs';

const TRIES = 3;
const get = (url) =>
  fetch(url, { redirect: 'manual', headers: { 'user-agent': 'faraday-deploy' }, signal: AbortSignal.timeout(15_000) });
const liveBuild = (siteUrl) =>
  get(`${siteUrl}/build.json?t=${Date.now()}`)
    .then((response) => response.json())
    .catch(() => null);

/**
 * The English path of the first content redirect in an .htaccess (the rule form of the content-htaccess
 * integration: `RewriteRule ^((?:ar|ku)/)?products/<folder>/<slug>/?$ …`), or null when there is none.
 * @param {string} htaccess
 */
export function redirectSource(htaccess) {
  const rule = /^\s*RewriteRule \^\(\(\?:ar\|ku\)\/\)\?(products\/[a-z-]+\/[a-z0-9]+(?:-[a-z0-9]+)*)\/\?\$ /m.exec(htaccess);
  return rule ? `/${rule[1]}/` : null;
}

async function answers(siteUrl, path, statuses, interval) {
  for (let tries = 1; tries <= TRIES; tries += 1) {
    const status = await get(`${siteUrl}${path}`).then(
      async (response) => {
        await response.body?.cancel();
        return response.status;
      },
      () => 0,
    );
    if (statuses.includes(status)) return;
    if (tries < TRIES) await setTimeout(interval);
  }
  throw new DeployError('deploy/verify', path);
}

/**
 * @param {object} options
 * @param {string} options.dist  the build that was deployed
 * @param {string[]} options.urls  the page URLs the deploy added, changed or removed
 * @param {string} [options.siteUrl]
 * @param {number} [options.timeout]  how long build.json may take to change, in milliseconds
 * @param {number} [options.interval]  milliseconds between tries
 * @returns {Promise<string[]>} the paths checked
 */
export async function verify({ dist, urls, siteUrl = SITE_URL, timeout = 60_000, interval = 3_000 }) {
  const expected = JSON.parse(await readFile(join(dist, 'build.json'), 'utf8'));
  const deadline = Date.now() + timeout;
  while (!isDeepStrictEqual(await liveBuild(siteUrl), expected)) {
    if (Date.now() > deadline) throw new DeployError('deploy/verify', 'build.json');
    await setTimeout(interval);
  }
  const paths = ['/', '/ar/', '/ku/', '/products/'];
  const changed = urls.filter((url) => existsSync(join(dist, pagePath(siteUrl, url)))).map((url) => url.slice(siteUrl.length));
  for (const language of [/^\/(?!ar\/|ku\/)/, /^\/ar\//, /^\/ku\//]) {
    const page = changed.find((path) => language.test(path));
    if (page && !paths.includes(page)) paths.push(page);
  }
  for (const path of paths) await answers(siteUrl, path, [200], interval);
  const source = redirectSource(await readFile(join(dist, '.htaccess'), 'utf8'));
  if (source) await answers(siteUrl, source, [301, 302], interval);
  return source ? [...paths, source] : paths;
}

if (import.meta.main) {
  try {
    const [dist] = process.argv.slice(2);
    if (!dist) throw new Error('usage: node scripts/deploy/verify.mjs <dist>');
    const siteUrl = process.env.SITE_URL || SITE_URL;
    const urls = (await readFile(CHANGED_URLS, 'utf8')).split('\n').filter(Boolean);
    const checked = await verify({ dist, urls, siteUrl });
    console.log(`verified: ${siteUrl} serves this build; ${checked.length} addresses answered as expected`);
  } catch (error) {
    fail(error, 'deploy/verify');
  }
}
