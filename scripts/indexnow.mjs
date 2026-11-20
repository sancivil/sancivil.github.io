// Tell Bing, Yandex, Seznam and Naver (IndexNow) about every page in the sitemap.
// Bing's index feeds ChatGPT search and Copilot. Run after each deploy: node scripts/indexnow.mjs
import { readFile } from 'node:fs/promises';

const host = 'faradayiq.com';
const key = 'f586a05837ee5c94a9f90103dd95467d';
const sitemap = await readFile(new URL('../dist/sitemap-0.xml', import.meta.url), 'utf8');
const urlList = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'content-type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host, key, keyLocation: `https://${host}/${key}.txt`, urlList }),
});
console.log(`IndexNow: submitted ${urlList.length} URLs, HTTP ${res.status}`);
