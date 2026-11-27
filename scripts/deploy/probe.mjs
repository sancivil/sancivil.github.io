// Proves FTPS from a GitHub runner before the first deploy (.github/workflows/ftps-probe.yml, temporary): connects,
// lists the site root, then writes, renames, reads and deletes files in .deploy/.
//   FTPS_HOST, FTPS_USER, FTPS_PASSWORD, FTPS_PORT  as for ftps-sync.mjs
import { ftpsRemote } from './ftps.mjs';
import { fail, probeRenameOverwrite } from './sync.mjs';

try {
  const remote = await ftpsRemote(process.env);
  try {
    console.log(`FTPS probe: ${(await remote.list('')).length} entries in the site root`);
    const overwrites = await probeRenameOverwrite(remote, process.env.GITHUB_RUN_ID || 'local');
    const rename = overwrites ? 'replaces' : 'does not replace';
    console.log(`FTPS probe: write, rename and delete work; a rename ${rename} an existing file`);
  } finally {
    await remote.close();
  }
} catch (error) {
  fail(error, 'deploy/ftps-upload');
}
