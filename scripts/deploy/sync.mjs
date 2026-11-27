// Deploys a live build (dist-live) by manifest, so an interrupted run leaves the old site working and the next
// run converges. Order: new and changed assets under their final names; pages and data files uploaded as
// `<path>.part-<run>` and renamed over the old files, new pages before changed ones; .htaccess after the pages;
// removed files deleted; build.json; .deploy/manifest.json (path → sha256, size) last. A first run (no manifest)
// uploads everything and deletes nothing. The remote is FTPS in CI (ftps.mjs) or a local folder (folder.mjs).
import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { setTimeout } from 'node:timers/promises';

export const SITE_URL = 'https://faradayiq.com';
export const CHANGED_URLS = '.deploy-out/changed-urls.txt';
export const MANIFEST = '.deploy/manifest.json';
const PENDING = '.deploy/pending.json';
/** Connections to the server, and transfers at a time. */
export const PARALLEL = 4;
/** Tries per server operation: the first and three retries. */
export const TRIES = 4;
/** A live build without one of these never reaches the server. */
export const REQUIRED = [
  'index.html',
  '404.html',
  '.htaccess',
  'sitemap-index.xml',
  'build.json',
  'data/site-reference.v1.json',
  'ar/index.html',
  'ku/index.html',
];
/** Server folders that hold no site files: a build may not contain them and the deploy never deletes in them. */
const UNTOUCHED = ['.well-known', 'cgi-bin', '.deploy'];
/** Swapped in by rename, so a visitor never gets half a file; everything else is an asset. */
const SWAPPED = /\.(html|xml|txt|json|htaccess)$/;
const SHA256 = /^[0-9a-f]{64}$/;

/**
 * The web host as the deploy sees it. Paths are relative to the site root and use '/'.
 * @typedef {object} Remote
 * @property {(path: string) => Promise<Buffer | null>} read  null when the file does not exist
 * @property {(path: string, data: Buffer) => Promise<void>} write  creates missing folders, replaces an existing file
 * @property {(from: string, to: string) => Promise<void>} rename  some servers refuse to replace an existing `to`
 * @property {(path: string) => Promise<void>} remove  also succeeds when the file is already gone
 * @property {(dir: string) => Promise<{ name: string, dir: boolean }[]>} list  '' is the site root
 * @property {() => Promise<void>} close
 */

/** A deploy failure as CI reports it, `::error title=<code>::<ref>` (contract §9): a code and a path, never content. */
export class DeployError extends Error {
  /**
   * @param {string} code
   * @param {string} ref
   */
  constructor(code, ref) {
    super(`${code} ${ref}`);
    this.code = code;
    this.ref = ref;
  }
}

/**
 * Prints the annotation of a failed command and sets its exit code; `code` stands for errors without their own.
 * @param {any} error
 * @param {string} code
 */
export function fail(error, code) {
  const known = error instanceof DeployError;
  if (!known) console.error(error);
  const ref = String(known ? error.ref : (error?.code ?? error?.name));
  const message = ref.replaceAll('%', '%25').replaceAll('\r', '%0D').replaceAll('\n', '%0A');
  console.log(`::error title=${known ? error.code : code}::${message}`);
  process.exitCode = 1;
}

/** Pages are the HTML files a visitor opens: all of them but 404.html. */
const isPage = (path) => path.endsWith('.html') && path !== '404.html';
/**
 * @param {string} siteUrl
 * @param {string} path
 */
export const pageUrl = (siteUrl, path) => `${siteUrl}/${path.replace(/(^|\/)index\.html$/, '$1')}`;
/**
 * @param {string} siteUrl
 * @param {string} url
 */
export const pagePath = (siteUrl, url) => {
  const path = url.slice(siteUrl.length + 1);
  return path === '' || path.endsWith('/') ? `${path}index.html` : path;
};

const parseJson = (bytes) => {
  try {
    return JSON.parse(bytes.toString('utf8'));
  } catch {
    return undefined;
  }
};
const json = (value) => Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
const safe = (path) =>
  /^[^/\\]/.test(path) &&
  !path.includes('\\') &&
  path.split('/').every((part) => part !== '' && part !== '.' && part !== '..');
/** The only paths the deploy writes from a build or deletes: below the site root, outside the untouched folders. */
const sitePath = (path) => safe(path) && !UNTOUCHED.includes(path.split('/')[0]);

/**
 * Every file of the build, sorted, as path → sha256 and size.
 * @param {string} dist
 * @returns {Promise<Record<string, { sha256: string, size: number }>>}
 */
export async function localFiles(dist) {
  const paths = (await readdir(dist, { recursive: true, withFileTypes: true }))
    .filter((entry) => entry.isFile())
    .map((entry) => relative(dist, join(entry.parentPath, entry.name)).split(sep).join('/'))
    .sort();
  const files = {};
  for (const path of paths) {
    if (!sitePath(path)) throw new DeployError('deploy/required-files', path);
    const bytes = await readFile(join(dist, path));
    files[path] = { sha256: createHash('sha256').update(bytes).digest('hex'), size: bytes.length };
  }
  return files;
}

/** The build must be a live build, of this publish when one is named, with every required file. */
async function checkBuild(dist, files, publishId) {
  const missing = REQUIRED.find((path) => !files[path]);
  if (missing) throw new DeployError('deploy/required-files', missing);
  const build = parseJson(await readFile(join(dist, 'build.json')));
  const live = build?.schema === 'faraday.site-build' && build.version === 1 && build.channel === 'live';
  if (!live || (publishId !== '' && String(build.publishId) !== publishId)) {
    throw new DeployError('deploy/required-files', 'build.json');
  }
}

/** The manifest of the last complete deploy, or null on a first run. */
async function readManifest(remote, attempt, log) {
  const bytes = await attempt(MANIFEST, () => remote.read(MANIFEST));
  if (!bytes) return null;
  const manifest = parseJson(bytes);
  const files = manifest?.files;
  const valid =
    manifest?.schema === 'faraday.deploy-manifest' &&
    manifest.version === 1 &&
    typeof manifest.renameOverwrites === 'boolean' &&
    typeof files === 'object' &&
    files !== null &&
    !Array.isArray(files) &&
    Object.entries(files).every(
      ([path, file]) => sitePath(path) && SHA256.test(file?.sha256) && Number.isInteger(file?.size),
    );
  if (valid) return manifest;
  log(`${MANIFEST} is unreadable: this run uploads every file and deletes none`);
  return null;
}

/** Refuses a build with under 70% of the pages on the server, unless large removals are allowed. */
function guardRemoval(files, old) {
  const pages = (paths) => paths.filter((path) => path.endsWith('.html')).length;
  const [now, before] = [pages(Object.keys(files)), pages(Object.keys(old.files))];
  if (now * 10 < before * 7) throw new DeployError('deploy/removal-guard', `${now}/${before}`);
}

/**
 * Runs `task` on every item, PARALLEL at a time. After a failure no new task starts; the first failure is
 * thrown once the running tasks have ended.
 */
async function inParallel(items, task) {
  const queue = [...items];
  const failures = [];
  const worker = async () => {
    while (queue.length > 0 && failures.length === 0) {
      await task(queue.shift()).catch((error) => failures.push(error));
    }
  };
  await Promise.all(Array.from({ length: PARALLEL }, worker));
  if (failures.length > 0) throw failures[0];
}

/** Up to TRIES tries per operation, `delay` × tries apart; the last failure becomes deploy/ftps-upload for `ref`. */
const retrying = (delay, log) => async (ref, operation) => {
  for (let tries = 1; ; tries += 1) {
    try {
      return await operation();
    } catch (error) {
      log(`${ref}: try ${tries} of ${TRIES} failed (${error.code ?? error.message})`);
      if (tries === TRIES) throw new DeployError('deploy/ftps-upload', ref);
      await setTimeout(delay * tries);
    }
  }
};

const probeFiles = (run) => [`.deploy/probe-new.part-${run}`, `.deploy/probe-old.part-${run}`];

/**
 * Whether a rename (RNFR/RNTO) replaces an existing file on this server; where it doesn't, the deploy deletes
 * the old file first. Writes, renames and deletes two files in .deploy/. The answer comes from the file, not from
 * an error: a refusing server fails every try, a dropped connection only some.
 * @param {Remote} remote
 * @param {string} run
 * @returns {Promise<boolean>}
 */
export async function probeRenameOverwrite(remote, run) {
  const [from, to] = probeFiles(run);
  await remote.write(to, Buffer.from('old'));
  await remote.write(from, Buffer.from('new'));
  for (let tries = 1; tries <= TRIES; tries += 1) {
    const renamed = await remote.rename(from, to).then(
      () => true,
      () => false,
    );
    if (renamed) break;
  }
  const overwrites = String(await remote.read(to)) === 'new';
  await remote.remove(from);
  await remote.remove(to);
  return overwrites;
}

/** Every file on the server outside the untouched folders. */
async function serverFiles(remote, attempt, dir = '') {
  const found = [];
  for (const entry of await attempt(dir || '.', () => remote.list(dir))) {
    if (dir === '' && UNTOUCHED.includes(entry.name)) continue;
    const path = dir === '' ? entry.name : `${dir}/${entry.name}`;
    if (entry.dir) found.push(...(await serverFiles(remote, attempt, path)));
    else found.push(path);
  }
  return found;
}

/**
 * @param {object} options
 * @param {string} options.dist  the live build
 * @param {Remote} options.remote
 * @param {string} options.run  names this run's temporary files, `<path>.part-<run>`
 * @param {string} [options.publishId]  when set, build.json must carry it
 * @param {boolean} [options.allowLargeRemoval]
 * @param {string} [options.siteUrl]
 * @param {number} [options.retryDelay]  milliseconds
 * @param {(line: string) => void} [options.log]
 * @returns {Promise<string[]>} the URLs of the pages added, changed or removed
 */
export async function sync({
  dist,
  remote,
  run,
  publishId = '',
  allowLargeRemoval = false,
  siteUrl = SITE_URL,
  retryDelay = 1000,
  log = console.log,
}) {
  const files = await localFiles(dist);
  await checkBuild(dist, files, publishId);
  const attempt = retrying(retryDelay, log);
  const old = await readManifest(remote, attempt, log);
  if (old && !allowLargeRemoval) guardRemoval(files, old);

  const leftover = await attempt(PENDING, () => remote.read(PENDING));
  if (leftover) {
    const pending = parseJson(leftover);
    const readable = typeof pending?.run === 'string' && /^[\w-]+$/.test(pending.run) && Array.isArray(pending.parts);
    const parts = readable
      ? pending.parts.filter((path) => typeof path === 'string' && safe(path) && path.endsWith(`.part-${pending.run}`))
      : [];
    await inParallel(parts, (path) => attempt(path, () => remote.remove(path)));
    await attempt(PENDING, () => remote.remove(PENDING));
    log(`removed ${parts.length} temporary files of an interrupted run`);
  }

  const paths = Object.keys(files);
  const isNew = (path) => !old?.files[path];
  const changed = paths.filter((path) => old?.files[path]?.sha256 !== files[path].sha256);
  const removed = old ? Object.keys(old.files).filter((path) => !files[path]) : [];
  const swapped = changed.filter((path) => SWAPPED.test(path));
  const assets = changed.filter((path) => !SWAPPED.test(path));
  const part = (path) => `${path}.part-${run}`;
  const added = changed.filter(isNew).length;
  const unchanged = paths.length - changed.length;
  log(`${added} new, ${changed.length - added} changed, ${removed.length} removed, ${unchanged} unchanged`);
  if (!old) {
    const unknown = (await serverFiles(remote, attempt)).filter((path) => !files[path]).length;
    log(`first run: every file is uploaded and nothing is deleted; ${unknown} files on the server are not in this build`);
  }

  await attempt(PENDING, () =>
    remote.write(PENDING, json({ run, parts: [...swapped, MANIFEST].map(part).concat(old ? [] : probeFiles(run)) })),
  );
  const overwrites = old ? old.renameOverwrites : await attempt('.deploy', () => probeRenameOverwrite(remote, run));
  if (!old) log(overwrites ? 'a rename replaces a file' : 'a rename cannot replace a file: old files are deleted first');
  const upload = (path, to) =>
    attempt(path, async () => {
      await remote.write(to, await readFile(join(dist, path)));
    });
  const swap = (path) =>
    attempt(path, async () => {
      if (!overwrites) await remote.remove(path);
      await remote.rename(part(path), path);
    });

  await inParallel(assets, (path) => upload(path, path));
  await inParallel(swapped, (path) => upload(path, part(path)));
  const pages = swapped.filter((path) => path.endsWith('.html'));
  for (const group of [
    pages.filter(isNew),
    pages.filter((path) => !isNew(path)),
    swapped.filter((path) => !path.endsWith('.html') && path !== '.htaccess' && path !== 'build.json'),
    swapped.filter((path) => path === '.htaccess'),
  ]) {
    await inParallel(group, swap);
  }
  await inParallel(removed, (path) => attempt(path, () => remote.remove(path)));
  if (swapped.includes('build.json')) await swap('build.json');
  const manifest = { schema: 'faraday.deploy-manifest', version: 1, run, renameOverwrites: overwrites, files };
  await attempt(MANIFEST, () => remote.write(part(MANIFEST), json(manifest)));
  await swap(MANIFEST);
  await attempt(PENDING, () => remote.remove(PENDING));

  return [...changed, ...removed]
    .filter(isPage)
    .map((path) => pageUrl(siteUrl, path))
    .sort();
}
