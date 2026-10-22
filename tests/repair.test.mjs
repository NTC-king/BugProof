import test from 'node:test';
import assert from 'node:assert/strict';
import { fixtures } from '../src/fixtures.mjs';
import { repairPayload } from '../src/domain.mjs';
import { generateRepair, prepareRepair, readBoundedJSON } from '../server/repair.mjs';
const request = () => ({ ...repairPayload(fixtures[0]), consent: true });
test('consent required', () =>
  assert.throws(() => prepareRepair({ ...request(), consent: false })));
test('challenges refused at API boundary', () =>
  assert.throws(() => prepareRepair({ ...request(), challenges: [] })));
test('no key returns honest unconfigured error without calling provider', async () => {
  let called = false;
  await assert.rejects(
    generateRepair(request(), {
      key: '',
      fetchImpl: async () => {
        called = true;
      },
    }),
    /not configured/,
  );
  assert.equal(called, false);
});
test('bounded fixed-endpoint request and labeled live response', async () => {
  let captured;
  const out = await generateRepair(request(), {
    key: 'dummy-test-key',
    fetchImpl: async (url, init) => {
      captured = { url, init };
      return Response.json({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    source: fixtures[0].correct,
                    explanation: 'Example response double, not an actual model request.',
                  }),
                },
              ],
            },
          },
        ],
        usageMetadata: { totalTokenCount: 10 },
      });
    },
  });
  assert.match(
    captured.url,
    /^https:\/\/generativelanguage.googleapis.com\/v1beta\/models\/[a-z0-9.-]+:generateContent$/,
  );
  assert.equal(captured.init.headers['x-goog-api-key'], 'dummy-test-key');
  assert.equal(captured.init.body.includes('"four"'), false);
  assert.equal(out.provenance.kind, 'live_model');
  assert.equal(out.source, fixtures[0].correct);
});
test('malformed model JSON is rejected', async () => {
  await assert.rejects(
    generateRepair(request(), {
      key: 'dummy',
      fetchImpl: async () =>
        Response.json({ candidates: [{ content: { parts: [{ text: 'not JSON' }] } }] }),
    }),
    /invalid or incomplete JSON/,
  );
});
test('rate/HTTP failure is not retried', async () => {
  let calls = 0;
  await assert.rejects(
    generateRepair(request(), {
      key: 'dummy',
      fetchImpl: async () => {
        calls++;
        return { ok: false, status: 429 };
      },
    }),
    /HTTP 429/,
  );
  assert.equal(calls, 1);
});

test('provider reply is byte-bounded even without content-length', async () => {
  const response = new Response(
    new ReadableStream({
      start(c) {
        c.enqueue(new Uint8Array(70000));
        c.close();
      },
    }),
  );
  await assert.rejects(readBoundedJSON(response, new AbortController().signal), /64 KiB/);
});

test('cancel signal reaches upstream fetch and no retry is attempted', async () => {
  const controller = new AbortController();
  let calls = 0;
  const pending = generateRepair(request(), {
    key: 'dummy',
    signal: controller.signal,
    fetchImpl: async (_url, init) => {
      calls++;
      return new Promise((_resolve, reject) =>
        init.signal.addEventListener('abort', () => reject(init.signal.reason), { once: true }),
      );
    },
  });
  controller.abort(new DOMException('cancelled in test', 'AbortError'));
  await assert.rejects(pending, { name: 'AbortError' });
  assert.equal(calls, 1);
});

test('cancel stops a stalled provider response stream', async () => {
  let cancelled = false;
  const controller = new AbortController();
  const response = new Response(
    new ReadableStream({
      cancel() {
        cancelled = true;
      },
    }),
  );
  const pending = readBoundedJSON(response, controller.signal);
  controller.abort(new DOMException('cancelled in test', 'AbortError'));
  await assert.rejects(pending, { name: 'AbortError' });
  assert.equal(cancelled, true);
});

test('network errors do not echo raw provider/credential details', async () => {
  await assert.rejects(
    generateRepair(request(), {
      key: 'dummy',
      fetchImpl: async () => {
        throw new Error('secret provider details');
      },
    }),
    (error) => !error.message.includes('secret') && /reach the model service/.test(error.message),
  );
});
