import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { folderRemote } from '../scripts/deploy/folder.mjs';
import { DeployError, MANIFEST, localFiles, pageUrl, sync, type Remote } from '../scripts/deploy/sync.mjs';

const buildJson = (publishId: number, channel = 'live') =>
  JSON.stringify({
    schema: 'faraday.site-build',
    version: 1,
    channel,
    publishId,
    contentHash: null,
    contentCommit: null,
    codeCommit: '5577180d7c39ccc2bdc59273e586d27621085ab3',
    builtAt: `2026-11-24T10:00:0${publishId}Z`,
    accepts: { snapshotVersion: 1, maxMinor: 0 },
  });

/** Day one of a small site: the required files, a few pages per language and some assets. */
const SITE: Record<string, string> = {
  'index.html': 'home',
  '404.html': 'not found',
  '.htaccess': 'rules',
  'sitemap-index.xml': 'sitemaps',
  'sitemap-0.xml': 'urls',
  'build.json': buildJson(1),
  'data/site-reference.v1.json': '{"reference":1}',
  'llms.txt': 'llms',
  'ar/index.html': 'home ar',
  'ku/index.html': 'home ku',
  'about/index.html': 'about',
  'ar/about/index.html': 'about ar',
  'ku/about/index.html': 'about ku',
  'products/index.html': 'products',
  'ar/products/index.html': 'products ar',
  'ku/products/index.html': 'products ku',
  'products/storage/psi-x-hs-5-0/index.html': 'battery',
  'ar/products/storage/psi-x-hs-5-0/index.html': 'battery ar',
  'ku/products/storage/psi-x-hs-5-0/index.html': 'battery ku',
  '_astro/Base.Bz__e-2R.css': 'css',
  '_astro/app.CFEkTCSu.js': 'js',
  'images/legacy/roof.webp': 'photo',
};
/** The next publish: one page changed, one page new, one page and one asset gone, and new hashed assets. */
const NEXT: Record<string, string | null> = {
  'build.json': buildJson(2),
  '.htaccess': 'rules with a redirect',
  'sitemap-0.xml': 'urls 2',
  'about/index.html': 'about, edited',
  'products/items/ground-kit/index.html': 'item',
  'ku/products/storage/psi-x-hs-5-0/index.html': null,
  '_astro/app.CFEkTCSu.js': null,
  '_astro/app.D8elt9vk.js': 'js 2',
};

const folders: string[] = [];
const scratch = (name: string) => {
  const dir = mkdtempSync(join(tmpdir(), `deploy-${name}-`));
  folders.push(dir);
  return dir;
};
after(() => {
  for (const dir of folders) rmSync(dir, { recursive: true, force: true });
});

const build = (changes: Record<string, string | null> = {}) => {
  const dir = scratch('build');
  for (const [path, text] of Object.entries({ ...SITE, ...changes })) {
    if (text === null) continue;
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), text);
  }
  return dir;
};
const site = (changes: Record<string, string | null> = {}) =>
  Object.fromEntries(Object.entries({ ...SITE, ...changes }).filter((entry): entry is [string, string] => entry[1] !== null));

/** The web host: its files and every operation the deploy made on them. */
interface Server {
  files: Map<string, Buffer>;
  ops: string[];
}
const server = (files: Record<string, string> = {}): Server => ({
  files: new Map(Object.entries(files).map(([path, text]) => [path, Buffer.from(text)])),
  ops: [],
});
const texts = ({ files }: Server) => Object.fromEntries([...files].map(([path, data]) => [path, data.toString()]));
const siteFiles = (host: Server) =>
  Object.fromEntries(Object.entries(texts(host)).filter(([path]) => !path.startsWith('.deploy/')));
const mutations = ({ ops }: Server) => ops.filter((op) => !op.startsWith('read ') && !op.startsWith('list '));

/**
 * A connection to the host. `refuse` makes an operation fail the way a dropped connection does; `overwrites: false`
 * is a server whose rename never replaces an existing file.
 */
interface Behaviour {
  overwrites?: boolean;
  refuse?: (op: string) => boolean;
}
const connect = ({ files, ops }: Server, { overwrites = true, refuse = () => false }: Behaviour = {}): Remote => {
  const act = (op: string) => {
    if (refuse(op)) throw Object.assign(new Error('connection lost'), { code: 'ECONNRESET' });
    ops.push(op);
  };
  return {
    read: async (path) => {
      act(`read ${path}`);
      return files.get(path) ?? null;
    },
    write: async (path, data) => {
      act(`write ${path}`);
      files.set(path, Buffer.from(data));
    },
    rename: async (from, to) => {
      act(`rename ${from} ${to}`);
      const data = files.get(from);
      if (!data || (files.has(to) && !overwrites)) throw Object.assign(new Error('rename refused'), { code: 550 });
      files.set(to, data);
      files.delete(from);
    },
    remove: async (path) => {
      act(`remove ${path}`);
      files.delete(path);
    },
    list: async (dir) => {
      act(`list ${dir}`);
      const prefix = dir === '' ? '' : `${dir}/`;
      const entries = new Map<string, boolean>();
      for (const path of files.keys()) {
        if (!path.startsWith(prefix)) continue;
        const [name, ...rest] = path.slice(prefix.length).split('/');
        entries.set(name, entries.get(name) || rest.length > 0);
      }
      return [...entries].map(([name, isDir]) => ({ name, dir: isDir }));
    },
    close: async () => {},
  };
};

const deploy = (
  dist: string,
  remote: Remote,
  run: string,
  options: { publishId?: string; allowLargeRemoval?: boolean } = {},
) => {
  const lines: string[] = [];
  const urls = sync({ dist, remote, run, retryDelay: 0, log: (line) => lines.push(line), ...options });
  return { urls, lines };
};
const refusal = (code: string, ref: string) => (error: unknown) =>
  error instanceof DeployError && error.code === code && error.ref === ref;
const pageUrls = (paths: string[]) => paths.map((path) => pageUrl('https://faradayiq.com', path)).sort();
const manifestOf = (host: Server) => JSON.parse(host.files.get(MANIFEST)!.toString());

/** Files on the server that are no part of the site: an old upload, and folders the deploy never touches. */
const OUTSIDE = { 'old-wordpress.zip': 'zip', '.well-known/acme-challenge/token': 'acme', 'cgi-bin/php': 'cgi' };
/** A host that already carries the first publish, deployed by this script. */
const deployed = async (options: Behaviour = {}) => {
  const host = server(OUTSIDE);
  await deploy(build(), connect(host, options), '100').urls;
  host.ops.length = 0;
  return host;
};

test('a first run uploads every file, deletes nothing and writes the manifest last', async () => {
  const dist = build();
  const host = server({ 'index.html': 'old home', 'error_log': 'log', ...OUTSIDE });
  const { urls, lines } = deploy(dist, connect(host), '11');
  assert.deepEqual(await urls, pageUrls(Object.keys(SITE).filter((path) => path.endsWith('.html') && path !== '404.html')));

  assert.deepEqual(siteFiles(host), { ...site(), 'error_log': 'log', ...OUTSIDE });
  assert.deepEqual(manifestOf(host), {
    schema: 'faraday.deploy-manifest',
    version: 1,
    run: '11',
    renameOverwrites: true,
    files: await localFiles(dist),
  });
  assert.deepEqual([...host.files.keys()].filter((path) => path.startsWith('.deploy/')), [MANIFEST]);
  const firstRun = 'first run: every file is uploaded and nothing is deleted; 2 files on the server are not in this build';
  assert.ok(lines.includes(firstRun));
  assert.deepEqual(
    mutations(host).filter((op) => op.startsWith('remove ')),
    ['remove .deploy/probe-new.part-11', 'remove .deploy/probe-old.part-11', 'remove .deploy/pending.json'],
  );
  assert.deepEqual(mutations(host).slice(-2), [`rename ${MANIFEST}.part-11 ${MANIFEST}`, 'remove .deploy/pending.json']);
});

test('a later run uploads only what changed and deletes only files of the last manifest', async () => {
  const host = await deployed();
  const { urls } = deploy(build(NEXT), connect(host), '12');
  assert.deepEqual(
    await urls,
    pageUrls(['about/index.html', 'products/items/ground-kit/index.html', 'ku/products/storage/psi-x-hs-5-0/index.html']),
  );
  assert.deepEqual(siteFiles(host), { ...site(NEXT), ...OUTSIDE });

  const touched = new Set(mutations(host).flatMap((op) => op.split(' ').slice(1)));
  for (const path of Object.keys(SITE)) {
    assert.equal(touched.has(path), path in NEXT, `${path} ${path in NEXT ? 'was not deployed' : 'was touched'}`);
  }
  assert.ok(!mutations(host).some((op) => op.includes('probe')), 'the rename probe runs on the first run only');
  assert.equal(manifestOf(host).run, '12');
});

test('assets first, pages swapped in by rename, .htaccess after the pages, build.json and the manifest last', async () => {
  const host = await deployed();
  await deploy(build(NEXT), connect(host), '12').urls;
  const ops = mutations(host);
  const at = (op: string) => {
    assert.ok(ops.includes(op), `missing: ${op}`);
    return ops.indexOf(op);
  };
  const part = (path: string) => `${path}.part-12`;
  const swap = (path: string) => at(`rename ${part(path)} ${path}`);

  assert.ok(at('write _astro/app.D8elt9vk.js') < at(`write ${part('about/index.html')}`), 'assets before pages');
  assert.ok(!ops.includes('write about/index.html'), 'pages are never written in place');
  const isPart = (op: string) => op.startsWith('write ') && op.endsWith('.part-12') && !op.includes('.deploy/');
  const lastPart = Math.max(...ops.flatMap((op, i) => (isPart(op) ? [i] : [])));
  assert.ok(lastPart < swap('products/items/ground-kit/index.html'), 'every part is uploaded before the first swap');
  assert.ok(swap('products/items/ground-kit/index.html') < swap('about/index.html'), 'new pages before changed pages');
  assert.ok(swap('about/index.html') < swap('sitemap-0.xml'), 'pages before the sitemap');
  assert.ok(swap('sitemap-0.xml') < swap('.htaccess'), '.htaccess after the pages');
  assert.ok(swap('.htaccess') < at('remove ku/products/storage/psi-x-hs-5-0/index.html'), 'deletions after .htaccess');
  assert.ok(at('remove _astro/app.CFEkTCSu.js') < swap('build.json'), 'build.json after the deletions');
  assert.deepEqual(ops.slice(-3), [
    `write ${part(MANIFEST)}`,
    `rename ${part(MANIFEST)} ${MANIFEST}`,
    'remove .deploy/pending.json',
  ]);
});

test('the removal guard refuses to remove more than 30% of the pages unless it is allowed', async () => {
  const without = (...pages: string[]) => Object.fromEntries(pages.map((page) => [`${page}/index.html`, null]));
  const battery = 'products/storage/psi-x-hs-5-0';
  const ten = without('about', 'ar/about', 'ku/about');
  const seven = { ...ten, ...without(battery, `ar/${battery}`, `ku/${battery}`) };
  const six = { ...seven, ...without('ku/products') };
  const host = server();
  await deploy(build(ten), connect(host), '11').urls;
  assert.equal(Object.keys(site(ten)).filter((path) => path.endsWith('.html')).length, 10);
  host.ops.length = 0;
  const before = texts(host);

  await assert.rejects(deploy(build(six), connect(host), '12').urls, refusal('deploy/removal-guard', '6/10'));
  assert.deepEqual(texts(host), before);
  assert.deepEqual(host.ops, [`read ${MANIFEST}`]);

  await deploy(build(seven), connect(host), '13').urls;
  assert.deepEqual(siteFiles(host), site(seven), 'exactly 70% of the pages is allowed');

  await deploy(build(ten), connect(host), '14').urls;
  await deploy(build(six), connect(host), '15', { allowLargeRemoval: true }).urls;
  assert.deepEqual(siteFiles(host), site(six));
});

test('an interrupted run leaves the old site working, and the next run converges', async () => {
  const host = await deployed();
  const live = siteFiles(host);
  let dropped = false;
  const dropAtFirstSwap = (op: string) => (dropped ||= op.startsWith('rename ') && op.includes('.part-12 '));
  await assert.rejects(deploy(build(NEXT), connect(host, { refuse: dropAtFirstSwap }), '12').urls, (error) =>
    error instanceof DeployError && error.code === 'deploy/ftps-upload',
  );
  const after = siteFiles(host);
  for (const [path, text] of Object.entries(live)) assert.equal(after[path], text, `${path} changed before the swap`);
  assert.ok(Object.keys(after).some((path) => path.endsWith('.part-12')), 'the parts were uploaded');
  assert.ok(host.files.has('.deploy/pending.json'));

  const dropAtDeletion = (op: string) => op === 'remove _astro/app.CFEkTCSu.js';
  await assert.rejects(
    deploy(build(NEXT), connect(host, { refuse: dropAtDeletion }), '13').urls,
    refusal('deploy/ftps-upload', '_astro/app.CFEkTCSu.js'),
  );
  assert.equal(host.files.get('about/index.html')?.toString(), 'about, edited', 'the pages were swapped');
  assert.equal(host.files.get('build.json')?.toString(), buildJson(1), 'build.json waits for the deletions');
  assert.equal(manifestOf(host).run, '100', 'the manifest is still the last complete one');

  await deploy(build(NEXT), connect(host), '14').urls;
  assert.deepEqual(siteFiles(host), { ...site(NEXT), ...OUTSIDE });
  assert.deepEqual([...host.files.keys()].filter((path) => path.startsWith('.deploy/')), [MANIFEST]);
  assert.equal(manifestOf(host).run, '14');
});

test('a server whose rename keeps the old file gets deletes before each swap', async () => {
  const host = await deployed({ overwrites: false });
  assert.equal(manifestOf(host).renameOverwrites, false);
  assert.deepEqual(siteFiles(host), { ...site(), ...OUTSIDE });

  await deploy(build(NEXT), connect(host, { overwrites: false }), '12').urls;
  assert.deepEqual(siteFiles(host), { ...site(NEXT), ...OUTSIDE });
  const ops = mutations(host);
  assert.ok(ops.indexOf('remove about/index.html') < ops.indexOf('rename about/index.html.part-12 about/index.html'));
});

test('connections dropped during the rename probe do not turn on delete-before-rename', async () => {
  const host = server();
  let drops = 0;
  const dropProbeRename = (op: string) => op.startsWith('rename .deploy/probe-') && (drops += 1) <= 2;
  await deploy(build(), connect(host, { refuse: dropProbeRename }), '11').urls;
  assert.equal(drops, 3);
  assert.equal(manifestOf(host).renameOverwrites, true);
  assert.deepEqual(siteFiles(host), site());
});

test('a failed transfer is tried again, four times in all', async () => {
  const fresh = server();
  const listing = new Set(['list ', 'read .deploy/pending.json']);
  await deploy(build(), connect(fresh, { refuse: (op) => listing.delete(op) }), '11').urls;
  assert.deepEqual(siteFiles(fresh), site());
  assert.equal(listing.size, 0);

  const host = await deployed();
  const flaky = new Set(['write _astro/app.D8elt9vk.js', `read ${MANIFEST}`, 'read .deploy/pending.json']);
  const { lines, urls } = deploy(build(NEXT), connect(host, { refuse: (op) => flaky.delete(op) }), '12');
  await urls;
  assert.equal(flaky.size, 0);
  assert.deepEqual(siteFiles(host), { ...site(NEXT), ...OUTSIDE });
  assert.ok(lines.includes('_astro/app.D8elt9vk.js: try 1 of 4 failed (ECONNRESET)'));
  assert.ok(lines.includes(`${MANIFEST}: try 1 of 4 failed (ECONNRESET)`));

  const always = (op: string) => op === 'write about/index.html.part-13';
  const edited = build({ ...NEXT, 'about/index.html': 'about, edited again' });
  const failed = deploy(edited, connect(host, { refuse: always }), '13');
  await assert.rejects(failed.urls, refusal('deploy/ftps-upload', 'about/index.html'));
  assert.equal(failed.lines.filter((line) => line.startsWith('about/index.html: try')).length, 4);
});

test('a build that is not a complete live build never reaches the server', async () => {
  const cases: [Record<string, string | null>, string][] = [
    [{ 'ku/index.html': null }, 'ku/index.html'],
    [{ 'data/site-reference.v1.json': null }, 'data/site-reference.v1.json'],
    [{ '.htaccess': null }, '.htaccess'],
    [{ 'build.json': buildJson(1, 'preview') }, 'build.json'],
    [{ 'build.json': '{' }, 'build.json'],
    [{ '.well-known/security.txt': 'contact' }, '.well-known/security.txt'],
  ];
  for (const [changes, ref] of cases) {
    const host = server();
    await assert.rejects(deploy(build(changes), connect(host), '11').urls, refusal('deploy/required-files', ref));
    assert.deepEqual(host.ops, [], `${ref}: the server was touched`);
  }
  const host = server();
  const otherPublish = deploy(build(), connect(host), '11', { publishId: '2' });
  await assert.rejects(otherPublish.urls, refusal('deploy/required-files', 'build.json'));
  await deploy(build(), connect(host), '11', { publishId: '1' }).urls;
  assert.deepEqual(siteFiles(host), site());
});

test('an unreadable manifest makes a run that uploads everything and deletes nothing', async () => {
  const host = await deployed();
  const outside = { '../outside.txt': { sha256: '0'.repeat(64), size: 1 } };
  host.files.set(MANIFEST, Buffer.from(JSON.stringify({ ...manifestOf(host), files: outside })));
  const { lines, urls } = deploy(build(NEXT), connect(host), '12');
  await urls;
  assert.ok(lines.includes(`${MANIFEST} is unreadable: this run uploads every file and deletes none`));
  assert.deepEqual(siteFiles(host), { ...site(), ...site(NEXT), ...OUTSIDE });
  assert.ok(!mutations(host).some((op) => op.startsWith('remove ') && !op.startsWith('remove .deploy/')));
});

test('a dry run between two local folders, through the command line', async () => {
  const dist = build(NEXT);
  const target = scratch('target');
  const cwd = scratch('cwd');
  writeFileSync(join(target, 'error_log'), 'log');
  const script = fileURLToPath(new URL('../scripts/deploy/ftps-sync.mjs', import.meta.url));
  const env = { ...process.env, DEPLOY_DIR: target, GITHUB_RUN_ID: '21', PUBLISH_ID: '', ALLOW_LARGE_REMOVAL: '', SITE_URL: '' };
  const run = (dir: string, extra: Record<string, string> = {}) =>
    spawnSync(process.execPath, [script, dir], { cwd, encoding: 'utf8', env: { ...env, ...extra } });

  const first = run(dist);
  assert.equal(first.status, 0, first.stdout + first.stderr);
  const remote = folderRemote(target);
  for (const [path, text] of Object.entries(site(NEXT))) assert.equal(String(await remote.read(path)), text, path);
  assert.equal(String(await remote.read('error_log')), 'log');
  assert.deepEqual(JSON.parse(String(await remote.read(MANIFEST))).files, await localFiles(dist));
  assert.ok(!existsSync(join(target, '.deploy/pending.json')));
  assert.equal(
    readFileSync(join(cwd, '.deploy-out/changed-urls.txt'), 'utf8'),
    pageUrls(Object.keys(site(NEXT)).filter((path) => path.endsWith('.html') && path !== '404.html'))
      .map((url) => `${url}\n`)
      .join(''),
  );

  const again = run(dist, { PUBLISH_ID: '2' });
  assert.equal(again.status, 0, again.stdout + again.stderr);
  assert.equal(readFileSync(join(cwd, '.deploy-out/changed-urls.txt'), 'utf8'), '');

  const broken = run(build({ ...NEXT, 'ar/index.html': null }));
  assert.equal(broken.status, 1);
  assert.ok(broken.stdout.includes('::error title=deploy/required-files::ar/index.html'), broken.stdout);
});
