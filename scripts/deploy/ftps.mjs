// The web host over explicit FTPS (basic-ftp, which CI installs on its own: npm ci --prefix scripts/deploy).
// TLS 1.2 or newer with the certificate checked against FTPS_HOST, passive mode, up to PARALLEL connections.
import { posix } from 'node:path';
import { Readable, Writable } from 'node:stream';
import { setTimeout } from 'node:timers/promises';
import { DeployError, PARALLEL, TRIES } from './sync.mjs';

/**
 * The server named by FTPS_HOST, FTPS_USER, FTPS_PASSWORD and FTPS_PORT (21 when empty). The FTP account's home
 * folder is the site root.
 * @param {Record<string, string | undefined>} env
 * @returns {Promise<import('./sync.mjs').Remote>}
 */
export async function ftpsRemote(env) {
  for (const name of ['FTPS_HOST', 'FTPS_USER', 'FTPS_PASSWORD']) {
    if (!env[name]) throw new DeployError('deploy/ftps-connect', name);
  }
  const { Client, FTPError } = await import('basic-ftp');
  const login = (client) =>
    client.access({
      host: env.FTPS_HOST,
      port: Number(env.FTPS_PORT || 21),
      user: env.FTPS_USER,
      password: env.FTPS_PASSWORD,
      secure: true,
      secureOptions: { servername: env.FTPS_HOST, minVersion: 'TLSv1.2' },
    });

  /** A refusal (FTPError: wrong password, too many connections) is not tried again: cPanel locks out failed logins. */
  const first = async () => {
    for (let tries = 1; ; tries += 1) {
      const client = new Client();
      try {
        await login(client);
        return { client, root: await client.pwd() };
      } catch (error) {
        client.close();
        if (error instanceof FTPError || tries === TRIES) {
          throw new DeployError('deploy/ftps-connect', String(error.code ?? error.message));
        }
        await setTimeout(1000 * tries);
      }
    }
  };
  const { client: primary, root } = await first();
  const clients = [primary];
  while (clients.length < PARALLEL) {
    const extra = new Client();
    const joined = await login(extra).then(
      () => true,
      () => false, // the server allows fewer connections per account
    );
    if (!joined) {
      extra.close();
      break;
    }
    clients.push(extra);
  }
  console.log(`FTPS: ${clients.length} connections over TLS 1.2 or newer`);

  const idle = [...clients];
  const waiting = [];
  /** One operation per connection at a time; a connection that dropped logs in again. */
  const use = async (operation) => {
    const client = idle.pop() ?? (await new Promise((resolve) => waiting.push(resolve)));
    try {
      if (client.closed) await login(client);
      return await operation(client);
    } finally {
      const next = waiting.shift();
      if (next) next(client);
      else idle.push(client);
    }
  };
  const at = (path) => posix.join(root, path);
  const parent = (path) => (path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : '');
  /** FTP answers 550 for a file that does not exist (and for some other refusals). */
  const missing = (error) => error instanceof FTPError && error.code === 550;
  const exists = (client, path) =>
    client.size(path).then(
      () => true,
      (error) => {
        if (missing(error)) return false;
        throw error;
      },
    );
  /** MKD once per folder and run, parents first; the error MKD gives for an existing folder is ignored. */
  const folders = new Map([['', Promise.resolve()]]);
  const ensureFolder = (folder) => {
    if (!folders.has(folder)) {
      const made = ensureFolder(parent(folder))
        .then(() => use((client) => client.sendIgnoringError(`MKD ${at(folder)}`)))
        .catch((error) => {
          folders.delete(folder);
          throw error;
        });
      folders.set(folder, made);
    }
    return folders.get(folder);
  };

  return {
    read: (path) =>
      use(async (client) => {
        const chunks = [];
        const sink = new Writable({
          write(chunk, _encoding, done) {
            chunks.push(chunk);
            done();
          },
        });
        try {
          await client.downloadTo(sink, at(path));
        } catch (error) {
          if (missing(error)) return null;
          throw error;
        }
        return Buffer.concat(chunks);
      }),
    write: async (path, data) => {
      await ensureFolder(parent(path));
      await use((client) => client.uploadFrom(Readable.from(data), at(path)));
    },
    rename: async (from, to) => {
      await use((client) => client.rename(at(from), at(to)));
    },
    remove: (path) =>
      use(async (client) => {
        try {
          await client.remove(at(path));
        } catch (error) {
          if (!missing(error) || (await exists(client, at(path)))) throw error;
        }
      }),
    list: (dir) =>
      use(async (client) =>
        (await client.list(at(dir)))
          .filter((file) => file.name !== '.' && file.name !== '..')
          .map((file) => ({ name: file.name, dir: file.isDirectory })),
      ),
    close: async () => {
      for (const client of clients) client.close();
    },
  };
}
