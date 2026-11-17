import http from 'node:http';
import { readFile, realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const MIME = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.wgsl':'text/plain; charset=utf-8','.png':'image/png','.svg':'image/svg+xml'};

export function createStaticServer(root = ROOT) {
  const base = path.resolve(root);
  return http.createServer(async (request, response) => {
    try {
      if (!['GET', 'HEAD'].includes(request.method)) {
        response.writeHead(405, {Allow:'GET, HEAD'}).end('Method not allowed'); return;
      }
      const url = new URL(request.url, 'http://localhost');
      let pathname;
      try { pathname = decodeURIComponent(url.pathname); }
      catch { response.writeHead(400).end('Bad URL'); return; }
      if (pathname.includes(String.fromCharCode(0))) { response.writeHead(400).end('Bad URL'); return; }
      const candidate = path.resolve(base, '.' + (pathname === '/' ? '/index.html' : pathname));
      if (candidate !== base && !candidate.startsWith(base + path.sep)) {
        response.writeHead(403).end('Forbidden'); return;
      }
      const [resolved, resolvedBase] = await Promise.all([realpath(candidate), realpath(base)]);
      if (resolved !== resolvedBase && !resolved.startsWith(resolvedBase + path.sep)) {
        response.writeHead(403).end('Forbidden'); return;
      }
      if (!(await stat(resolved)).isFile()) { response.writeHead(404).end('Not found'); return; }
      const body = await readFile(resolved);
      response.writeHead(200, {
        'Content-Type': MIME[path.extname(resolved)] || 'application/octet-stream',
        'Content-Length': body.length, 'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      });
      response.end(request.method === 'HEAD' ? undefined : body);
    } catch (error) {
      response.writeHead(error.code === 'ENOENT' || error.code === 'ENOTDIR' ? 404 : 500).end('Unable to serve file');
    }
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 4173);
  const server = createStaticServer();
  server.listen(port, '127.0.0.1', () => console.log('STILLWATER: http://localhost:' + port));
  server.on('error', error => { console.error(error.message); process.exitCode = 1; });
  const close = () => server.close(() => { process.exitCode = 0; });
  process.once('SIGINT', close);
  process.once('SIGTERM', close);
}
