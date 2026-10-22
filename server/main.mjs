import http from 'node:http';
import { readFile, readdir } from 'node:fs/promises';
import { resolve, join, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
import { generateRepair, MODEL } from './repair.mjs';
import { APP_VERSION } from '../src/domain.mjs';
import { readRequestBody } from './body.mjs';
const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
export const APP_ORIGIN = 'http://127.0.0.1:4100',
  RUNNER_ORIGIN = 'http://127.0.0.1:4101';
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.wasm': 'application/wasm',
  '.zip': 'application/zip',
  '.py': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
};
async function filesUnder(root, prefix = '') {
  const result = new Map();
  for (const d of await readdir(join(root, prefix), { withFileTypes: true })) {
    const p = join(prefix, d.name);
    if (d.isDirectory()) for (const [k, v] of await filesUnder(root, p)) result.set(k, v);
    else if (d.isFile() && !d.name.startsWith('.') && !p.endsWith('.map'))
      result.set('/' + p.split(sep).join('/'), join(root, p));
  }
  return result;
}
function json(res, status, value) {
  res.writeHead(status, {
    'content-type': 'application/json',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
  });
  res.end(JSON.stringify(value));
}
export async function createServers({ repair = generateRepair } = {}) {
  const appFiles = await filesUnder(join(ROOT, 'dist'));
  appFiles.set('/', join(ROOT, 'dist', 'index.html'));
  const runnerFiles = new Map(
    ['frame.html', 'frame.mjs', 'worker.mjs', 'harness.py'].map((p) => [
      '/' + p,
      join(ROOT, 'runner', p),
    ]),
  );
  for (const name of await readdir(join(ROOT, 'node_modules', 'pyodide')))
    if (/^[A-Za-z0-9_.-]+\.(mjs|js|wasm|zip|json)$/.test(name) && !['package.json'].includes(name))
      runnerFiles.set('/vendor/' + name, join(ROOT, 'node_modules', 'pyodide', name));
  const token = randomBytes(32).toString('hex');
  let calls = [];
  const makeHandler = (runner) => async (req, res) => {
    try {
      const expectedHost = runner ? '127.0.0.1:4101' : '127.0.0.1:4100';
      if (req.headers.host !== expectedHost) return json(res, 403, { error: 'Host not allowed.' });
      let url;
      try {
        url = new URL(req.url, runner ? RUNNER_ORIGIN : APP_ORIGIN);
      } catch {
        return json(res, 400, { error: 'Invalid URL.' });
      }
      if (runner && url.search)
        return json(res, 400, { error: 'Runner query parameters are not supported.' });
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Cache-Control', 'no-store');
      res.setHeader('Referrer-Policy', 'no-referrer');
      res.setHeader(
        'Permissions-Policy',
        'camera=(), microphone=(), geolocation=(), clipboard-read=(), clipboard-write=(), usb=()',
      );
      const csp = runner
        ? `default-src 'none'; script-src 'self' 'wasm-unsafe-eval'; connect-src 'self'; worker-src ${url.pathname === '/frame.html' ? "'self'" : "'none'"}; style-src 'none'; object-src 'none'; base-uri 'none'; frame-ancestors ${APP_ORIGIN}`
        : `default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-src ${RUNNER_ORIGIN}; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'`;
      res.setHeader('Content-Security-Policy', csp);
      if (!runner && req.method === 'GET' && url.pathname === '/api/session')
        return json(res, 200, {
          token,
          modelAvailable: Boolean(process.env.BUGPROOF_GEMINI_KEY),
          model: MODEL,
          version: APP_VERSION,
        });
      if (!runner && req.method === 'GET' && url.pathname === '/api/health')
        return json(res, 200, { ok: true, localOnly: true, project: 'bugproof-local' });
      if (!runner && req.method === 'POST' && url.pathname === '/api/repair') {
        if (
          req.headers.origin !== APP_ORIGIN ||
          req.headers['x-bugproof-session'] !== token ||
          (req.headers['content-type'] ?? '').split(';')[0] !== 'application/json'
        )
          return json(res, 403, { error: 'Origin, session, or content type not allowed.' });
        let bytes;
        try {
          bytes = await readRequestBody(req);
        } catch (error) {
          if (res.destroyed) return;
          res.setHeader('Connection', 'close');
          return json(res, error.status === 413 ? 413 : 400, {
            error: error.status === 413 ? error.message : 'Request body could not be read.',
          });
        }
        let body;
        try {
          body = JSON.parse(bytes.toString());
        } catch {
          return json(res, 400, { error: 'Invalid JSON.' });
        }
        calls = calls.filter((t) => Date.now() - t < 60000);
        if (calls.length >= 3) {
          res.setHeader('Retry-After', '60');
          return json(res, 429, { error: 'Limit: three repair requests per minute; retry later.' });
        }
        calls.push(Date.now());
        const upstream = new AbortController();
        const disconnected = () => {
          if (!res.writableEnded)
            upstream.abort(new DOMException('Client disconnected.', 'AbortError'));
        };
        res.once('close', disconnected);
        try {
          return json(
            res,
            200,
            await repair(body, { key: process.env.BUGPROOF_GEMINI_KEY, signal: upstream.signal }),
          );
        } catch (e) {
          if (res.destroyed) return;
          if (e.name === 'TimeoutError')
            return json(res, 504, {
              error: 'Model request timed out. No automatic retry was used.',
            });
          return json(res, e.status ?? 400, { error: e.message });
        } finally {
          res.removeListener('close', disconnected);
        }
      }
      if (!['GET', 'HEAD'].includes(req.method))
        return json(res, 405, { error: 'Method not allowed.' });
      const file = (runner ? runnerFiles : appFiles).get(url.pathname);
      if (!file) return json(res, 404, { error: 'Not found.' });
      const data = await readFile(file);
      res.setHeader('Content-Type', mime[extname(file)] ?? 'application/octet-stream');
      res.writeHead(200);
      res.end(req.method === 'HEAD' ? undefined : data);
    } catch {
      if (!res.headersSent)
        json(res, 500, {
          error: 'Local server error. No submitted code was executed on the server.',
        });
      else res.end();
    }
  };
  return {
    app: http.createServer(
      { requestTimeout: 15000, headersTimeout: 10000, maxHeaderSize: 8192 },
      makeHandler(false),
    ),
    runner: http.createServer(
      { requestTimeout: 15000, headersTimeout: 10000, maxHeaderSize: 8192 },
      makeHandler(true),
    ),
  };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const servers = await createServers();
  for (const [name, server, port] of [
    ['app', servers.app, 4100],
    ['runner', servers.runner, 4101],
  ]) {
    server.on('error', (e) => {
      console.error(`${name}: ${e.message}`);
      process.exitCode = 1;
      Object.values(servers).forEach((s) => {
        s.close();
        s.closeAllConnections();
      });
    });
    server.listen(port, '127.0.0.1', () => console.log(`${name}: http://127.0.0.1:${port}`));
  }
  const stop = () => {
    Object.values(servers).forEach((s) => {
      s.close();
      s.closeAllConnections();
    });
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
}
