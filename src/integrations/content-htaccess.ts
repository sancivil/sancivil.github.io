/*
  After the build, writes the owner's redirects into dist/.htaccess at the # CONTENT-REDIRECTS marker: 302 for a
  page the owner hid, 301 for one renamed or retired. Rules are made only from slugs and fixed route patterns,
  so no owner text ever reaches the server configuration.
*/
import { readFileSync, writeFileSync } from 'node:fs';
import type { AstroIntegration } from 'astro';
import type { Redirect, SiteSnapshotV1 } from '../content/contract.ts';
import { LINE_PATHS } from '../content/reference.ts';

export const MARKER = '  # CONTENT-REDIRECTS';
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const FOLDERS: Record<Redirect['kind'], string> = { series: 'modules', family: 'inverters', battery: 'storage', item: 'items' };

/** The RewriteRule lines for a snapshot's redirects, in all three languages. */
export function redirectRules(redirects: readonly Redirect[]): string[] {
  return redirects.map(({ kind, from, to, line, permanent }) => {
    if (!SLUG.test(from) || (to !== null && !SLUG.test(to))) throw new Error(`Redirect ${kind}:${from} has a slug outside the contract`);
    const folder = FOLDERS[kind];
    const target = to === null ? LINE_PATHS[line] : `/products/${folder}/${to}/`;
    return `  RewriteRule ^((?:ar|ku)/)?products/${folder}/${from}/?$ /$1${target.slice(1)} [L,R=${permanent ? 301 : 302}]`;
  });
}

export default function contentHtaccess(): AstroIntegration {
  let root: URL;
  return {
    name: 'content-htaccess',
    hooks: {
      'astro:config:done': ({ config }) => {
        root = config.root;
      },
      'astro:build:done': ({ dir }) => {
        const { redirects }: Pick<SiteSnapshotV1, 'redirects'> = JSON.parse(
          readFileSync(new URL('src/content/generated/snapshot.json', root), 'utf8'),
        );
        const file = new URL('.htaccess', dir);
        const htaccess = readFileSync(file, 'utf8');
        if (!htaccess.includes(MARKER)) throw new Error('dist/.htaccess has no # CONTENT-REDIRECTS marker');
        writeFileSync(file, htaccess.replace(MARKER, [MARKER, ...redirectRules(redirects)].join('\n')));
      },
    },
  };
}
