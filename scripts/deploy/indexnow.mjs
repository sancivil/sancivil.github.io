// Tells IndexNow (Bing, Yandex, Seznam, Naver) which pages a deploy added, changed or removed:
//   node scripts/deploy/indexnow.mjs dist-live   (after verify.mjs; reads .deploy-out/changed-urls.txt)
// The key is the one the site serves: the file at the root of the build named <key>.txt that holds its own name.
//   SITE_URL  the site's address, https://faradayiq.com when empty
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { CHANGED_URLS, SITE_URL } from './sync.mjs';

export const INDEXNOW = 'https://api.indexnow.org/indexnow';

/**
 * @param {string} dist
 * @returns {Promise<string | null>}
 */
export async function indexNowKey(dist) {
  for (const name of await readdir(dist)) {
    const key = /^([A-Za-z0-9-]{8,128})\.txt$/.exec(name)?.[1];
    if (key && (await readFile(join(dist, name), 'utf8')).trim() === key) return key;
  }
  return null;
}

/**
 * @param {{ urls: string[], key: string, siteUrl?: string, endpoint?: string }} options
 * @returns {Promise<number>} the HTTP status; 200 and 202 mean accepted
 */
export async function submit({ urls, key, siteUrl = SITE_URL, endpoint = INDEXNOW }) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: new URL(siteUrl).host, key, keyLocation: `${siteUrl}/${key}.txt`, urlList: urls }),
    signal: AbortSignal.timeout(30_000),
  });
  await response.body?.cancel();
  return response.status;
}

if (import.meta.main) {
  const [dist] = process.argv.slice(2);
  if (!dist) throw new Error('usage: node scripts/deploy/indexnow.mjs <dist>');
  const urls = (await readFile(CHANGED_URLS, 'utf8')).split('\n').filter(Boolean);
  const key = await indexNowKey(dist);
  if (urls.length === 0) {
    console.log('IndexNow: no page changed');
  } else if (!key) {
    console.log('::warning::IndexNow: the build has no key file');
    process.exitCode = 1;
  } else {
    const status = await submit({ urls, key, siteUrl: process.env.SITE_URL || SITE_URL });
    console.log(`IndexNow: submitted ${urls.length} URLs, HTTP ${status}`);
    if (status !== 200 && status !== 202) process.exitCode = 1;
  }
}
