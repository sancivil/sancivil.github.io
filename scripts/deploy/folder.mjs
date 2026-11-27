// A local folder as the deploy target, for dry runs and tests:
//   DEPLOY_DIR=<folder> node scripts/deploy/ftps-sync.mjs dist-live
import { mkdir, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

/**
 * @param {string} root
 * @returns {import('./sync.mjs').Remote}
 */
export function folderRemote(root) {
  const at = (path) => join(root, path);
  return {
    read: (path) =>
      readFile(at(path)).catch((error) => {
        if (error.code === 'ENOENT') return null;
        throw error;
      }),
    write: async (path, data) => {
      await mkdir(dirname(at(path)), { recursive: true });
      await writeFile(at(path), data);
    },
    rename: (from, to) => rename(at(from), at(to)),
    remove: (path) => rm(at(path), { force: true }),
    list: async (dir) =>
      (await readdir(at(dir), { withFileTypes: true })).map((entry) => ({ name: entry.name, dir: entry.isDirectory() })),
    close: async () => {},
  };
}
