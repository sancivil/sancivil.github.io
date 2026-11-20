// Minimal static file server for previewing a build: node scripts/serve-static.mjs <dir> [port] [idleMinutes]
// Binds to 127.0.0.1 only and exits after the idle timeout.
import { createServer } from 'node:http';
import { stat, readFile } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';

const root = resolve(process.argv[2] ?? 'dist');
const port = Number(process.argv[3] ?? 4321);
const idleMs = Number(process.argv[4] ?? 20) * 60_000;

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
  '.pdf': 'application/pdf',
};

let timer;
const armIdle = () => {
  clearTimeout(timer);
  timer = setTimeout(() => {
    console.log(`idle for ${idleMs / 60_000} min, exiting`);
    process.exit(0);
  }, idleMs);
};

async function resolveFile(urlPath) {
  const clean = normalize(decodeURIComponent(urlPath.split('?')[0])).replace(/^(\.\.[/\\])+/, '');
  let file = join(root, clean);
  if (!file.startsWith(root)) return null;
  try {
    const s = await stat(file);
    if (s.isDirectory()) file = join(file, 'index.html');
    await stat(file);
    return file;
  } catch {
    return null;
  }
}

createServer(async (req, res) => {
  armIdle();
  const file = await resolveFile(req.url ?? '/');
  if (!file) {
    const notFound = await resolveFile('/404.html');
    res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
    res.end(notFound ? await readFile(notFound) : 'Not found');
    return;
  }
  res.writeHead(200, { 'content-type': types[extname(file).toLowerCase()] ?? 'application/octet-stream' });
  res.end(await readFile(file));
}).listen(port, '127.0.0.1', () => {
  armIdle();
  console.log(`serving ${root} at http://127.0.0.1:${port}/`);
});
