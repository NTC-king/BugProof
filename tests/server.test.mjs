import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createServers } from '../server/main.mjs';
test('static/runner boundary and API request guards', async (t) => {
  const servers = await createServers();
  await Promise.all(
    Object.values(servers).map((s) => new Promise((resolve) => s.listen(0, '127.0.0.1', resolve))),
  );
  t.after(() =>
    Promise.all(Object.values(servers).map((s) => new Promise((resolve) => s.close(resolve)))),
  );
  const get = (which, path, options = {}) =>
    new Promise((resolve, reject) => {
      const req = http.request(
        {
          hostname: '127.0.0.1',
          port: servers[which].address().port,
          path,
          method: options.method ?? 'GET',
          headers: { host: `127.0.0.1:${which === 'app' ? '4100' : '4101'}`, ...options.headers },
        },
        (res) => {
          const chunks = [];
          res.on('data', (c) => chunks.push(c));
          res.on('end', () =>
            resolve({
              status: res.statusCode,
              headers: { get: (key) => res.headers[key] },
              json: async () => JSON.parse(Buffer.concat(chunks).toString()),
            }),
          );
        },
      );
      req.on('error', reject);
      if (options.body) req.write(options.body);
      req.end();
    });
  assert.equal((await get('app', '/')).status, 200);
  assert.equal((await get('app', '/.env')).status, 404);
  assert.equal((await get('runner', '/api/session')).status, 404);
  assert.equal((await get('runner', '/frame.mjs?query=1')).status, 400);
  const worker = await get('runner', '/worker.mjs');
  assert.equal(worker.status, 200);
  assert.match(worker.headers.get('content-security-policy'), /connect-src 'self'/);
  assert.match(worker.headers.get('content-security-policy'), /worker-src 'none'/);
  assert.equal((await get('runner', '/frame.html')).status, 200);
  const session = await (await get('app', '/api/session')).json();
  assert.equal(typeof session.token, 'string');
  assert.equal(Object.hasOwn(session, 'key'), false);
  assert.equal(
    (
      await get('app', '/api/repair', {
        method: 'POST',
        headers: {
          origin: 'http://127.0.0.1:4101',
          'content-type': 'application/json',
          'x-bugproof-session': session.token,
        },
        body: '{}',
      })
    ).status,
    403,
  );
  assert.equal((await get('app', '/', { headers: { host: 'evil.invalid' } })).status, 403);
  assert.equal((await get('runner', '/worker.mjs', { method: 'POST' })).status, 405);
  const headers = {
    origin: 'http://127.0.0.1:4100',
    'content-type': 'application/json',
    'x-bugproof-session': session.token,
  };
  for (const extraHeaders of [{ 'content-length': '70000' }, {}]) {
    const oversized = await get('app', '/api/repair', {
      method: 'POST',
      headers: { ...headers, ...extraHeaders },
      body: 'x'.repeat(70000),
    });
    assert.equal(oversized.status, 413);
    assert.match((await oversized.json()).error, /64 KiB/);
  }
  const invalid = await get('app', '/api/repair', { method: 'POST', headers, body: '{' });
  assert.equal(invalid.status, 400);
  assert.match((await invalid.json()).error, /Invalid JSON/);
});

test(
  'closing a repair HTTP request aborts the adapter (explicit test double)',
  { timeout: 5000 },
  async (t) => {
    let startedResolve, abortedResolve;
    const started = new Promise((resolve) => {
      startedResolve = resolve;
    });
    const aborted = new Promise((resolve) => {
      abortedResolve = resolve;
    });
    const servers = await createServers({
      repair: async (_body, { signal }) => {
        startedResolve();
        return new Promise((_resolve, reject) =>
          signal.addEventListener(
            'abort',
            () => {
              abortedResolve();
              reject(signal.reason);
            },
            { once: true },
          ),
        );
      },
    });
    await new Promise((resolve) => servers.app.listen(0, '127.0.0.1', resolve));
    t.after(() => new Promise((resolve) => servers.app.close(resolve)));
    const port = servers.app.address().port;
    const session = await new Promise((resolve, reject) => {
      const request = http.get(
        { hostname: '127.0.0.1', port, path: '/api/session', headers: { host: '127.0.0.1:4100' } },
        (response) => {
          let data = '';
          response.on('data', (chunk) => {
            data += chunk;
          });
          response.on('end', () => resolve(JSON.parse(data)));
        },
      );
      request.on('error', reject);
    });
    const request = http.request({
      hostname: '127.0.0.1',
      port,
      path: '/api/repair',
      method: 'POST',
      headers: {
        host: '127.0.0.1:4100',
        origin: 'http://127.0.0.1:4100',
        'content-type': 'application/json',
        'x-bugproof-session': session.token,
      },
    });
    request.on('error', () => {});
    request.end('{}');
    await started;
    request.destroy();
    await aborted;
    assert.ok(true, 'Upstream abort was observed after actual HTTP disconnection.');
  },
);
