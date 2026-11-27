// Uploads a live build to the web host (sync.mjs): node scripts/deploy/ftps-sync.mjs dist-live
//   FTPS_HOST, FTPS_USER, FTPS_PASSWORD, FTPS_PORT  the server; DEPLOY_DIR=<folder> deploys to a local folder instead
//   PUBLISH_ID           when set, the build must be this publish
//   ALLOW_LARGE_REMOVAL  yes lets a deploy remove more than 30% of the pages
//   SITE_URL             the site's address, https://faradayiq.com when empty
// Writes the URLs of the pages it added, changed or removed to .deploy-out/changed-urls.txt.
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { folderRemote } from './folder.mjs';
import { ftpsRemote } from './ftps.mjs';
import { CHANGED_URLS, SITE_URL, fail, sync } from './sync.mjs';

const { env } = process;
try {
  const [dist] = process.argv.slice(2);
  if (!dist) throw new Error('usage: node scripts/deploy/ftps-sync.mjs <dist>');
  const remote = env.DEPLOY_DIR ? folderRemote(env.DEPLOY_DIR) : await ftpsRemote(env);
  try {
    const urls = await sync({
      dist,
      remote,
      run: env.GITHUB_RUN_ID || 'local',
      publishId: env.PUBLISH_ID ?? '',
      allowLargeRemoval: env.ALLOW_LARGE_REMOVAL === 'yes',
      siteUrl: env.SITE_URL || SITE_URL,
    });
    await mkdir(dirname(CHANGED_URLS), { recursive: true });
    await writeFile(CHANGED_URLS, urls.map((url) => `${url}\n`).join(''));
    console.log(`deployed; ${urls.length} page URLs added, changed or removed`);
  } finally {
    await remote.close();
  }
} catch (error) {
  fail(error, 'deploy/ftps-upload');
}
