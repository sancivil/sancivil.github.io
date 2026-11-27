import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { indexNowKey, submit } from '../scripts/deploy/indexnow.mjs';
import { DeployError } from '../scripts/deploy/sync.mjs';
import { redirectSource, verify } from '../scripts/deploy/verify.mjs';
import { MARKER, redirectRules } from '../src/integrations/content-htaccess.ts';

const BUILD = {
  schema: 'faraday.site-build',
  version: 1,
  channel: 'live',
  publishId: 7,
  codeCommit: '5577180d7c39ccc2bdc59273e586d27621085ab3',
  builtAt: '2026-11-24T10:00:00Z',
};
/** The site's .htaccess as the build writes it: the template, with content redirects at the marker. */
const TEMPLATE = readFileSync(new URL('../public/.htaccess', import.meta.url), 'utf8');
const HTACCESS = TEMPLATE.replace(
  MARKER,
  [
    MARKER,
    ...redirectRules([
      { kind: 'family', from: 'psi-j-rf', to: null, line: 'hybrid', permanent: false },
      { kind: 'battery', from: 'psi-x-hs-old', to: 'psi-x-hs-5-0', line: 'hybrid', permanent: true },
    ]),
  ].join('\n'),
);

const folders: string[] = [];
after(() => {
  for (const dir of folders) rmSync(dir, { recursive: true, force: true });
});
const folder = (files: Record<string, string>) => {
  const dir = mkdtempSync(join(tmpdir(), 'deploy-verify-'));
  folders.push(dir);
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), text);
  }
  return dir;
};

/** A stand-in for the live site: `answer` gives each request's status, body and headers, and every path is logged. */
const serve = async (answer: (path: string, body: string) => { status: number; body?: string; location?: string }) => {
  const requests: { path: string; body: string }[] = [];
  const server = createServer((request, response) => {
    let body = '';
    request.on('data', (chunk) => (body += chunk));
    request.on('end', () => {
      const path = request.url ?? '/';
      requests.push({ path, body });
      const reply = answer(path, body);
      response.writeHead(reply.status, reply.location ? { location: reply.location } : {});
      response.end(reply.body ?? '');
    });
  });
  await new Promise<void>((resolve) => server.listen(0, 'localhost', resolve));
  const url = `http://localhost:${(server.address() as AddressInfo).port}`;
  return { url, requests, close: () => new Promise((resolve) => server.close(resolve)) };
};

test('verify waits for build.json to change, then checks the pages and one content redirect', async () => {
  const dist = folder({
    'build.json': JSON.stringify(BUILD),
    '.htaccess': HTACCESS,
    'index.html': '',
    'about/index.html': '',
    'ar/products/storage/psi-x-hs-5-0/index.html': '',
    'ku/about/index.html': '',
  });
  let polls = 0;
  const site = await serve((path) => {
    if (path.startsWith('/build.json?t=')) {
      polls += 1;
      return { status: 200, body: JSON.stringify(polls < 3 ? { ...BUILD, publishId: 6 } : BUILD) };
    }
    if (path === '/products/inverters/psi-j-rf/') return { status: 302, location: '/products/hybrid/' };
    return { status: 200 };
  });
  try {
    const urls = [
      `${site.url}/about/`,
      `${site.url}/ar/products/storage/psi-x-hs-5-0/`,
      `${site.url}/ar/products/storage/psi-x-hs-old/`,
      `${site.url}/ku/about/`,
      `${site.url}/ku/products/hidden/`,
    ];
    const checked = await verify({ dist, urls, siteUrl: site.url, interval: 10 });
    assert.equal(polls, 3);
    assert.deepEqual(checked, [
      '/',
      '/ar/',
      '/ku/',
      '/products/',
      '/about/',
      '/ar/products/storage/psi-x-hs-5-0/',
      '/ku/about/',
      '/products/inverters/psi-j-rf/',
    ]);
    assert.deepEqual(
      site.requests.filter((request) => !request.path.startsWith('/build.json')).map((request) => request.path),
      checked,
    );
  } finally {
    await site.close();
  }
});

test('verify fails with deploy/verify and the path that did not answer', async () => {
  const dist = folder({ 'build.json': JSON.stringify(BUILD), '.htaccess': HTACCESS });
  const site = await serve((path) => {
    if (path.startsWith('/build.json')) return { status: 200, body: JSON.stringify(BUILD) };
    if (path === '/ku/') return { status: 404 };
    return { status: path.startsWith('/products/inverters/') ? 302 : 200 };
  });
  const stale = await serve(() => ({ status: 200, body: JSON.stringify({ ...BUILD, codeCommit: 'old' }) }));
  try {
    await assert.rejects(
      verify({ dist, urls: [], siteUrl: site.url, interval: 10 }),
      (error) => error instanceof DeployError && error.code === 'deploy/verify' && error.ref === '/ku/',
    );
    assert.equal(site.requests.filter((request) => request.path === '/ku/').length, 3, 'three tries');
    await assert.rejects(
      verify({ dist, urls: [], siteUrl: stale.url, timeout: 50, interval: 10 }),
      (error) => error instanceof DeployError && error.code === 'deploy/verify' && error.ref === 'build.json',
    );
  } finally {
    await site.close();
    await stale.close();
  }
});

test('verify passes without changed pages or content redirects', async () => {
  const dist = folder({ 'build.json': JSON.stringify(BUILD), '.htaccess': TEMPLATE });
  const site = await serve((path) => ({ status: 200, body: path.startsWith('/build.json') ? JSON.stringify(BUILD) : '' }));
  try {
    assert.deepEqual(await verify({ dist, urls: [], siteUrl: site.url, interval: 10 }), ['/', '/ar/', '/ku/', '/products/']);
  } finally {
    await site.close();
  }
});

test('the redirect source is the first content rule, never a rule of the template', () => {
  assert.equal(redirectSource(HTACCESS), '/products/inverters/psi-j-rf/');
  assert.equal(redirectSource(TEMPLATE), null);
});

test('IndexNow gets the changed URLs with the key file the site serves', async () => {
  const key = 'f586a05837ee5c94a9f90103dd95467d';
  const dist = folder({ 'ads-policy.txt': 'none', [`${key}.txt`]: key, 'robots.txt': 'User-agent: *', 'security.txt': 'contact' });
  assert.equal(await indexNowKey(dist), key);
  assert.equal(await indexNowKey(folder({ 'robots.txt': '' })), null);

  const endpoint = await serve(() => ({ status: 202 }));
  try {
    const urls = ['https://faradayiq.com/about/', 'https://faradayiq.com/ar/about/'];
    assert.equal(await submit({ urls, key, endpoint: `${endpoint.url}/indexnow` }), 202);
    assert.deepEqual(endpoint.requests.map((request) => request.path), ['/indexnow']);
    assert.deepEqual(JSON.parse(endpoint.requests[0].body), {
      host: 'faradayiq.com',
      key,
      keyLocation: `https://faradayiq.com/${key}.txt`,
      urlList: urls,
    });
  } finally {
    await endpoint.close();
  }
});
