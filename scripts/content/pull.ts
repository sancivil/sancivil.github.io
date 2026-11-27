// Fetches the owner content (the private repo the ERP publishes to) into .content/ with your own git access:
//   node scripts/content/pull.ts [ref]          ref: a branch or commit of sancivil/faraday-site-content, default live
// Then build from it with CONTENT_DIR=.content npm run build.
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const REPO = 'git@github.com:sancivil/faraday-site-content.git';
const ref = process.argv[2] ?? 'live';
const dir = fileURLToPath(new URL('../../.content', import.meta.url));
const git = (...args: string[]) => execFileSync('git', args, { stdio: 'inherit' });

if (!existsSync(`${dir}/.git`)) git('clone', '--no-checkout', '--depth', '1', REPO, dir);
git('-C', dir, 'fetch', '--depth', '1', 'origin', ref);
git('-C', dir, 'checkout', '--detach', 'FETCH_HEAD');
