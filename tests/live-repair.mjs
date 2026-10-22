// Explicit opt-in only. Ordinary test/verify commands never run this file.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { APP_VERSION } from '../src/domain.mjs';

if (!process.argv.includes('--allow-live') || !process.argv.includes('--free-tier-confirmed')) {
  console.error(
    'Live test is disabled. Confirm a replacement key and Free Tier/billing-off status before using --allow-live --free-tier-confirmed.',
  );
  process.exit(2);
}
const key = process.env.BUGPROOF_GEMINI_KEY ?? '';
if (!key.trim() || /\s/.test(key) || /YOUR_NEW|replacement_key/i.test(key)) {
  console.error('Configure a valid replacement key locally. The key value is never printed.');
  process.exit(2);
}
// Do not load browser tooling until both explicit opt-in and local credentials pass.
const { chromium } = await import('playwright');
const origin = 'http://127.0.0.1:4100';
const redact = (value) => String(value).replaceAll(key, '[REDACTED]');
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const directory = 'artifacts/live';
const record = {
  startedAt: new Date().toISOString(),
  integration: 'not_run',
  model: process.env.BUGPROOF_MODEL || 'gemini-3.5-flash-lite',
  fixture: 'median',
  requests: 0,
  accountCheck:
    'Operator confirmed a replacement key, Free Tier and billing off; no billing setting was changed or independently verified through this API.',
  evidence: null,
  limitations:
    'One public hand-authored fixture is an integration smoke test, not a held-out model benchmark or a correctness guarantee.',
};
let server, browser;
try {
  await mkdir(directory, { recursive: true });
  await mkdir('.cache', { recursive: true });
  let occupied = false;
  try {
    await fetch(origin + '/api/health', { signal: AbortSignal.timeout(1000) });
    occupied = true;
  } catch {}
  if (occupied)
    throw new Error(
      'Port 4100 is occupied. Stop the owned local launcher before this isolated live test. No existing process was stopped.',
    );
  server = spawn(process.execPath, ['--env-file=.env', 'server/main.mjs'], {
    cwd: process.cwd(),
    stdio: 'ignore',
    windowsHide: true,
  });
  let ready = false;
  for (let i = 0; i < 60; i++) {
    if (server.exitCode !== null)
      throw new Error(
        'The isolated local server stopped during startup. No provider retry was attempted.',
      );
    try {
      const health = await fetch(origin + '/api/health').then((r) => r.json());
      if (health.project === 'bugproof-local') {
        ready = true;
        break;
      }
    } catch {}
    await sleep(250);
  }
  if (!ready) throw new Error('Local server startup timed out.');
  const capability = await fetch(origin + '/api/session').then((r) => r.json());
  assert.equal(capability.version, APP_VERSION);
  assert.equal(capability.modelAvailable, true);
  assert.equal(
    JSON.stringify(capability).includes(key),
    false,
    'Credential must never enter the public capability response.',
  );
  browser = await chromium.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true,
  });
  const page = await browser.newPage({
    viewport: { width: 1366, height: 1000 },
    acceptDownloads: true,
  });
  await page.route(origin + '/api/repair', async (route) => {
    record.requests++;
    if (record.requests > 1) {
      await route.abort();
      return;
    }
    await route.continue(); // Real local proxy and real upstream model, not a response double.
  });
  await page.goto(origin, { waitUntil: 'networkidle' });
  await page.waitForFunction(
    () =>
      [...document.querySelectorAll('button')].some(
        (b) => b.textContent.includes('Verify both') && !b.disabled,
      ),
    null,
    { timeout: 15000 },
  );
  await page.getByLabel(/Allow sending this non-confidential/).check();
  const replyPromise = page.waitForResponse(
    (response) =>
      response.url() === origin + '/api/repair' && response.request().method() === 'POST',
    { timeout: 60000 },
  );
  const started = performance.now();
  await page.getByRole('button', { name: /Request live repair/ }).click();
  const reply = await replyPromise;
  record.responseHTTP = reply.status();
  record.providerRoundTripMs = Math.round(performance.now() - started);
  const request = reply.request().postDataJSON();
  assert.equal(Object.hasOwn(request, 'challenges'), false);
  const data = await reply.json();
  if (!reply.ok()) {
    record.integration = 'provider_error';
    throw new Error(data.error || `Repair proxy returned HTTP ${reply.status()}.`);
  }
  assert.equal(data.provenance.kind, 'live_model');
  await page.waitForFunction(
    () => document.querySelector('[role="status"]').textContent.includes('Live candidate received'),
    null,
    { timeout: 10000 },
  );
  assert.equal(await page.getByLabel('Candidate Python function').inputValue(), data.source);
  assert.equal(
    await page.getByTestId('verdict').count(),
    0,
    'AI text alone must not create a verdict.',
  );
  await page.getByRole('button', { name: /Verify both versions/ }).click();
  await page.waitForFunction(
    () =>
      document.querySelector('[data-testid="verdict"]') &&
      ![...document.querySelectorAll('button')].some((b) => b.textContent === 'Cancel run'),
    null,
    { timeout: 125000 },
  );
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /Export evidence JSON/ }).click();
  const download = await downloadPromise;
  const path = directory + '/median-evidence.json';
  const privatePath = '.cache/live-evidence.json';
  await download.saveAs(privatePath);
  const text = await readFile(privatePath, 'utf8');
  assert.equal(text.includes(key), false);
  const evidence = JSON.parse(text);
  assert.equal(evidence.candidate.provenance.kind, 'live_model');
  assert.equal(evidence.candidate.source, data.source);
  assert.equal(evidence.challengesExcludedFromRepairPrompt, true);
  assert.equal(evidence.executionIntegrity.policyConsistent, true);
  assert.equal(evidence.executionIntegrity.comparisonConsistent, true);
  assert.equal(evidence.schemaVersion, 3);
  assert.equal(evidence.runtime.observed.length, 1);
  assert.equal(record.requests, 1);
  await writeFile(path, text);
  assert.equal((await page.content()).includes(key), false);
  await page.screenshot({ path: '.cache/live-repair.png', fullPage: true });
  record.integration = 'passed';
  record.evidence = path;
  record.candidateVerdict = evidence.proposed.verdict;
  record.candidateCounts = evidence.proposed.summary;
  record.usage = data.provenance.usage;
  record.promptChallengeExclusion = evidence.challengesExcludedFromRepairPrompt;
} catch (error) {
  record.integration = record.integration === 'not_run' ? 'failed' : record.integration;
  record.error = redact(error.message);
  process.exitCode = 1;
} finally {
  record.completedAt = new Date().toISOString();
  await mkdir(directory, { recursive: true });
  await writeFile(directory + '/summary.json', JSON.stringify(record, null, 2));
  if (browser) await browser.close();
  if (server && server.exitCode === null) {
    server.kill();
    await new Promise((resolve) => {
      server.once('exit', resolve);
      const timer = setTimeout(resolve, 3000);
      timer.unref();
    });
  }
  console.log(JSON.stringify(record, null, 2));
}
