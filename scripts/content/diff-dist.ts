// Identity diff between two builds (day-one migration gates A = B, A = C, live = A):
//   node scripts/content/diff-dist.ts <dist-a> <dist-b>
// Compares every file byte for byte, with only these allowances:
// - /_astro/<name>.<hash>.<ext> names are masked; CSS and every other asset must keep its content, JS may change.
// - build.json, data/site-reference.v1.json and .deploy/ are new in B and not compared.
// - .htaccess may differ only by the reviewed template lines (TEMPLATE below), with an empty redirect block.
// - The logo's clip-path ids are masked: builds before the deterministic ids had random ones.
// - The © year and the years of experience are masked only when the two builds straddle New Year.
// Prints one line per difference and exits 1 if there is any.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const [a, b] = process.argv.slice(2).map((dir) => resolve(dir));
if (!a || !b || !existsSync(a) || !existsSync(b)) {
  console.error('usage: node scripts/content/diff-dist.ts <dist-a> <dist-b>');
  process.exit(2);
}

const IGNORED = /^(?:build\.json|data\/site-reference\.v1\.json|\.deploy\/.*)$/;
const ASSET = /^_astro\/(.+)\.[A-Za-z0-9_-]{8}\.(\w+)$/;
const ASSET_REF = /\/_astro\/([^"'\s()]+?)\.[A-Za-z0-9_-]{8}\.(\w+)/g;
const TEXT = /\.(?:html|css|js|json|xml|txt|webmanifest|svg)$|(?:^|\/)(?:\.htaccess|_headers)$/;

/** The reviewed .htaccess template lines (src/integrations/content-htaccess.ts writes rules after the marker). */
const TEMPLATE: [added: string, before: string][] = [
  ["\n  # The deploy's own records\n  RewriteRule ^\\.deploy(/|$) - [F,L]\n", ''],
  ['\n  RewriteRule ^((?:ar|ku)/)?products/items/?$ /$1products/ [L,R=301]\n', '\n'],
  [
    '\n\n  # Product pages the owner hid (302) or renamed (301), written at build time by src/integrations/content-htaccess.ts\n  # CONTENT-REDIRECTS\n',
    '\n',
  ],
  ['"\\.(html|xml|txt|webmanifest|json)$"', '"\\.(html|xml|txt|webmanifest)$"'],
  [
    '\n  # /build.json and /data/: build facts for the ERP, not pages for search engines\n  <FilesMatch "\\.json$">\n    Header set X-Robots-Tag "noindex"\n  </FilesMatch>\n',
    '\n',
  ],
];

function files(dir: string): string[] {
  return readdirSync(dir, { recursive: true, encoding: 'utf8' })
    .map((path) => path.replaceAll('\\', '/'))
    .filter((path) => statSync(join(dir, path)).isFile() && !IGNORED.test(path))
    .sort();
}

const year = (dir: string) => readFileSync(join(dir, 'index.html'), 'utf8').match(/© <span class="num">(\d{4})<\/span>/)?.[1];
const straddle = year(a) !== year(b);

function masked(path: string, bytes: Buffer): string {
  let text = bytes.toString('utf8').replace(ASSET_REF, '/_astro/$1.$2').replace(/fw-cap-[a-z0-9]{1,6}/g, 'fw-cap');
  if (straddle && path.endsWith('.html')) {
    text = text.replace(/© <span class="num">\d{4}<\/span>/g, '© <span class="num">YEAR</span>').replace(/<span class="num">\d+\+<\/span>/g, '<span class="num">N+</span>');
  }
  return text;
}

const differences: string[] = [];

/** B's .htaccess with the reviewed template taken out; each template part must be there exactly once. */
function untemplated(text: string): string {
  let out = text;
  for (const [added, before] of TEMPLATE) {
    if (out.split(added).length !== 2) differences.push(`.htaccess: template part missing or repeated: ${JSON.stringify(added.trim().split('\n')[0])}`);
    out = out.replace(added, before);
  }
  return out;
}

const filesA = files(a);
const filesB = files(b);
const sha = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');

/* Hashed assets: same masked names with the same multiplicity; every one but JS with the same contents. */
const assets = (dir: string, list: string[]) => {
  const byName = new Map<string, string[]>();
  for (const path of list) {
    const m = path.match(ASSET);
    if (!m) continue;
    const key = `_astro/${m[1]}.${m[2]}`;
    const bytes = readFileSync(join(dir, path));
    byName.set(key, [...(byName.get(key) ?? []), m[2] === 'js' ? 'js' : sha(TEXT.test(path) ? Buffer.from(masked(path, bytes)) : bytes)].sort());
  }
  return byName;
};
const assetsA = assets(a, filesA);
const assetsB = assets(b, filesB);
for (const key of [...new Set([...assetsA.keys(), ...assetsB.keys()])].sort()) {
  const [inA, inB] = [assetsA.get(key) ?? [], assetsB.get(key) ?? []];
  if (inA.length !== inB.length) differences.push(`${key}: ${inA.length} in A, ${inB.length} in B`);
  else if (inA.join() !== inB.join()) differences.push(`${key}: content differs`);
}

/* Every other file. */
const others = (list: string[]) => list.filter((path) => !ASSET.test(path));
const otherA = others(filesA);
const otherB = new Set(others(filesB));
for (const path of otherA) {
  if (!otherB.has(path)) {
    differences.push(`only in A: ${path}`);
    continue;
  }
  otherB.delete(path);
  const [bytesA, bytesB] = [readFileSync(join(a, path)), readFileSync(join(b, path))];
  if (!TEXT.test(path)) {
    if (!bytesA.equals(bytesB)) differences.push(`differs: ${path}`);
    continue;
  }
  const textA = masked(path, bytesA);
  const textB = path === '.htaccess' ? untemplated(masked(path, bytesB)) : masked(path, bytesB);
  if (textA !== textB) {
    let at = 0;
    while (textA[at] === textB[at]) at++;
    differences.push(`differs: ${path} (from character ${at})`);
  }
}
for (const path of otherB) differences.push(`only in B: ${path}`);

for (const line of differences) console.log(line);
console.log(
  `diff-dist ${relative(process.cwd(), a) || a} vs ${relative(process.cwd(), b) || b}: ${filesA.length} and ${filesB.length} files compared` +
    `${straddle ? ' (New Year masked)' : ''}, ${differences.length} differences`,
);
process.exit(differences.length ? 1 : 0);
