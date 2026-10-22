import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { fixtures } from '../src/fixtures.mjs';
import { APP_VERSION } from '../src/domain.mjs';
import { readFile } from 'node:fs/promises';
const origin = 'http://127.0.0.1:4100';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let server = null,
  browser = null;
const findings = [],
  consoleErrors = [];
async function ensureServer() {
  try {
    const h = await fetch(origin + '/api/health').then((r) => r.json());
    if (h.ok && h.localOnly && h.project === 'bugproof-local') {
      const capability = await fetch(origin + '/api/session').then((r) => r.json());
      if (capability.version !== APP_VERSION)
        throw new Error('Unexpected app version; restart the owned local launcher before testing.');
      return;
    }
    throw new Error('Unexpected service on port 4100');
  } catch (e) {
    if (e.message.includes('Unexpected')) throw e;
  }
  server = spawn(process.execPath, ['server/main.mjs'], {
    cwd: process.cwd(),
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });
  let errors = '';
  server.stderr.on('data', (d) => {
    errors += d;
  });
  for (let i = 0; i < 80; i++) {
    if (server.exitCode !== null) throw new Error('Server stopped: ' + errors);
    try {
      if ((await fetch(origin + '/api/health')).ok) return;
    } catch {}
    await sleep(250);
  }
  throw new Error('Local server did not become ready: ' + errors);
}
async function waitDone(page) {
  await page.waitForFunction(
    () =>
      document.querySelector('[data-testid="verdict"]') &&
      ![...document.querySelectorAll('button')].some((b) => b.textContent === 'Cancel run'),
    null,
    { timeout: 125000 },
  );
}
try {
  await ensureServer();
  browser = await chromium.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true,
  });
  const page = await browser.newPage({
    viewport: { width: 1366, height: 1000 },
    acceptDownloads: true,
  });
  page.on('pageerror', (e) => consoleErrors.push(e.message));
  await page.goto(origin, { waitUntil: 'networkidle' });
  await page.waitForFunction(
    () =>
      [...document.querySelectorAll('button')].some(
        (b) => b.textContent.includes('Verify both') && !b.disabled,
      ),
    null,
    { timeout: 15000 },
  );
  const workerPromise = page.waitForEvent('worker');
  await page.getByRole('button', { name: /Verify both versions/ }).click();
  const worker = await workerPromise;
  const networkProbe = await worker.evaluate(async () => {
    try {
      await fetch('http://127.0.0.1:4100/api/session');
      return 'unexpected_access';
    } catch {
      return 'blocked';
    }
  });
  assert.equal(networkProbe, 'blocked');
  findings.push({ check: 'worker cannot fetch trusted API under own CSP', status: 'pass' });
  await waitDone(page);
  assert.match(await page.getByTestId('verdict').innerText(), /Failed a declared check/);
  assert.match(await page.locator('.suite-counts').innerText(), /2\s*\/\s*2 passed/);
  findings.push({
    check: 'median teaching candidate passes visible examples but fails independent challenge',
    status: 'pass',
  });
  await page.screenshot({ path: '.cache/bugproof-desktop.png', fullPage: true });
  await page.getByRole('button', { name: /Load reference candidate/ }).click();
  assert.equal(await page.getByTestId('verdict').count(), 0);
  await page.getByRole('button', { name: /Verify both versions/ }).click();
  await waitDone(page);
  assert.match(await page.getByTestId('verdict').innerText(), /Pass on listed tests/);
  findings.push({ check: 'reference candidate passes all listed median cases', status: 'pass' });
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /Export evidence JSON/ }).click();
  const download = await downloadPromise;
  const reportPath = '.cache/exported-evidence.json';
  await download.saveAs(reportPath);
  const report = JSON.parse(await (await import('node:fs/promises')).readFile(reportPath, 'utf8'));
  assert.equal(report.proposed.verdict, 'pass_on_listed_tests');
  assert.equal(report.candidate.provenance.kind, 'teaching_fixture');
  assert.equal(report.proposed.rows.length, 6);
  assert.equal(report.schemaVersion, 3);
  assert.equal(report.executionIntegrity.comparisonConsistent, true);
  assert.equal(report.runtime.expectedVersion, '314.0.7');
  assert.equal(report.runtime.observed.length, 1);
  assert.equal(report.runtime.observed[0].pyodide, '314.0.7');
  assert.match(report.runtime.observed[0].python, /3\.14\./);
  assert.equal(report.runtime.observed[0].implementation, 'cpython');
  findings.push({ check: 'downloaded evidence matches actual displayed run', status: 'pass' });
  findings.push({
    check: 'evidence records the actual browser Python and pinned Pyodide runtime',
    status: 'pass',
  });
  await page.getByRole('link', { name: 'View results' }).click();
  assert.equal(new URL(page.url()).hash, '#evidence');
  findings.push({ check: 'results shortcut navigates to the current evidence', status: 'pass' });
  const frame = page.frames().find((f) => f.url().includes(':4101/frame.html'));
  assert.ok(frame);
  const domProbe = await frame.evaluate(() => {
    try {
      return parent.document.title;
    } catch {
      return 'blocked';
    }
  });
  assert.equal(domProbe, 'blocked');
  findings.push({ check: 'runner frame cannot access parent DOM', status: 'pass' });
  await page
    .getByLabel('Candidate Python function')
    .fill('def median(values):\n    import os\n    return 2\n');
  assert.equal(await page.getByTestId('verdict').count(), 0);
  await page.getByRole('button', { name: /Verify both versions/ }).click();
  await waitDone(page);
  assert.match(await page.getByTestId('verdict').innerText(), /Unsupported code blocked/);
  findings.push({
    check: 'imports rejected by real Python AST policy; edits invalidate evidence',
    status: 'pass',
  });
  await page
    .getByLabel('Candidate Python function')
    .fill('def median(values):\n    def sum(items):\n        return 2\n    return sum(values)\n');
  await page.getByRole('button', { name: /Verify both versions/ }).click();
  await waitDone(page);
  assert.match(await page.getByTestId('verdict').innerText(), /Unsupported code blocked/);
  findings.push({
    check: 'nested helper definitions cannot shadow approved built-in call names',
    status: 'pass',
  });
  await page
    .getByLabel('Candidate Python function')
    .fill(
      'def median(values):\n    total = 0\n    for a in range(10000):\n        for b in range(10000):\n            total += a + b\n    return total\n',
    );
  await page.getByRole('button', { name: /Verify both versions/ }).click();
  await waitDone(page);
  assert.match(await page.getByTestId('verdict').innerText(), /Incomplete/);
  findings.push({
    check: 'parent watchdog terminates policy-accepted long computation without a passing verdict',
    status: 'pass',
  });
  await page.getByRole('button', { name: /Load reference candidate/ }).click();
  await page.getByRole('button', { name: /Verify both versions/ }).click();
  await page.getByRole('button', { name: 'Cancel run', exact: true }).click();
  await page.waitForFunction(
    () => ![...document.querySelectorAll('button')].some((b) => b.textContent === 'Cancel run'),
  );
  assert.equal(await page.getByTestId('verdict').count(), 0);
  findings.push({ check: 'manual cancellation awards no verdict', status: 'pass' });
  const deeplyNested =
    'def median(values):\n' +
    Array.from({ length: 45 }, (_, i) => '    '.repeat(i + 1) + 'if True:\n').join('') +
    '    '.repeat(46) +
    'return 2\n';
  await page.getByLabel('Candidate Python function').fill(deeplyNested);
  await page.getByRole('button', { name: /Verify both versions/ }).click();
  await waitDone(page);
  assert.match(await page.getByTestId('verdict').innerText(), /Unsupported code blocked/);
  findings.push({
    check: 'deep Python syntax rejected by explicit AST depth limit',
    status: 'pass',
  });
  await page.getByRole('button', { name: 'Reset example', exact: true }).click();
  assert.equal(await page.getByTestId('verdict').count(), 0);
  assert.equal(
    await page.getByLabel('Candidate Python function').inputValue(),
    fixtures[0].inadequate,
  );
  findings.push({
    check: 'explicit reset restores selected example and invalidates evidence',
    status: 'pass',
  });
  const pendingWorker = page.waitForEvent('worker');
  await page.getByRole('button', { name: /Verify both versions/ }).click();
  await pendingWorker;
  await page.getByLabel('Candidate Python function').fill('def median(values):\n    return 0\n');
  await page.waitForFunction(
    () => ![...document.querySelectorAll('button')].some((b) => b.textContent === 'Cancel run'),
  );
  await page.waitForTimeout(300);
  assert.equal(await page.getByTestId('verdict').count(), 0);
  findings.push({
    check: 'editing during execution cancels the old revision and stale results do not return',
    status: 'pass',
  });
  await page.getByRole('button', { name: 'Reset example', exact: true }).click();
  await page.getByLabel('Visible examples JSON').fill('[');
  await page.getByRole('button', { name: /Verify both versions/ }).click();
  await page.getByRole('alert').waitFor();
  assert.equal(await page.getByTestId('verdict').count(), 0);
  await page.waitForFunction(() => document.activeElement?.getAttribute('role') === 'alert');
  findings.push({
    check: 'malformed case JSON gives an error without execution or a passing verdict',
    status: 'pass',
  });
  await page.getByRole('button', { name: 'Reset example', exact: true }).click();
  const capability = await page.evaluate(() => fetch('/api/session').then((r) => r.json()));
  if (!capability.modelAvailable) {
    await page.getByLabel(/Allow sending this non-confidential/).check();
    await page.getByRole('button', { name: /Request live repair/ }).click();
    await page.getByRole('alert').waitFor();
    assert.match(await page.getByRole('alert').innerText(), /not configured/);
    findings.push({
      check:
        'unconfigured live-repair UI reports an honest no-key error without an external model call',
      status: 'pass',
    });
  }
  await page.getByRole('button', { name: 'Reset example', exact: true }).click();
  let releaseRepair;
  const heldRepair = new Promise((resolve) => {
    releaseRepair = resolve;
  });
  let repairEntered;
  const enteredRepair = new Promise((resolve) => {
    repairEntered = resolve;
  });
  const repairURL = origin + '/api/repair';
  const holdRepair = async (route) => {
    repairEntered();
    await heldRepair;
    try {
      await route.abort();
    } catch {}
  };
  await page.route(repairURL, holdRepair);
  try {
    await page.getByLabel(/Allow sending this non-confidential/).check();
    await page.getByRole('button', { name: /Request live repair/ }).click();
    await enteredRepair;
    await page.getByLabel(/Allow sending this non-confidential/).uncheck();
    await page
      .getByRole('button', { name: 'Cancel run', exact: true })
      .waitFor({ state: 'detached' });
    assert.equal(await page.getByTestId('verdict').count(), 0);
    findings.push({
      check: 'revoking consent cancels a pending repair (intercepted request; no provider call)',
      status: 'pass',
    });
  } finally {
    releaseRepair();
    await page.unroute(repairURL, holdRepair);
  }
  const evaluation = [];
  // Portable workspaces are data only. Opening one must not execute code or call a model.
  await page.getByRole('button', { name: 'Reset example', exact: true }).click();
  let repairRequests = 0;
  const observeRequests = (request) => {
    if (request.url().endsWith('/api/repair')) repairRequests++;
  };
  page.on('request', observeRequests);
  const savedPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Save workspace JSON', exact: true }).click();
  const saved = await savedPromise;
  await saved.saveAs('.cache/saved-workspace.json');
  const workspace = JSON.parse(await readFile('.cache/saved-workspace.json', 'utf8'));
  assert.equal(workspace.format, 'bugproof-workspace');
  await page.getByLabel('Candidate Python function').fill('def median(values):\n    return 0\n');
  await page
    .getByLabel('Workspace JSON file', { exact: true })
    .setInputFiles('.cache/saved-workspace.json');
  await page.waitForFunction(() =>
    document.querySelector('[role="status"]').textContent.includes('Workspace opened locally'),
  );
  assert.equal(
    await page.getByLabel('Candidate Python function').inputValue(),
    workspace.candidate,
  );
  assert.match(await page.getByTestId('provenance').innerText(), /user imported/i);
  assert.equal(await page.getByTestId('verdict').count(), 0);
  assert.equal(await page.getByLabel(/Allow sending this non-confidential/).isChecked(), false);
  assert.equal(repairRequests, 0);
  assert.equal(page.workers().length, 0);
  page.off('request', observeRequests);
  findings.push({
    check:
      'workspace download/import preserves source and cases without execution, provider calls or trusted provenance',
    status: 'pass',
  });
  await page.getByRole('button', { name: /Verify both versions/ }).click();
  await waitDone(page);
  await page.getByRole('region', { name: 'First issue explained' }).waitFor();
  const unfilteredVerdict = await page.getByTestId('verdict').innerText();
  await page.getByLabel('Filter case results', { exact: true }).selectOption('issues');
  await page.getByLabel('Filter case suite', { exact: true }).selectOption('challenge');
  assert.equal(await page.locator('tbody tr').count(), 2);
  assert.equal(await page.getByTestId('verdict').innerText(), unfilteredVerdict);
  await page.getByLabel('Filter case results', { exact: true }).selectOption('blocked');
  assert.match(await page.locator('tbody').innerText(), /No cases match/);
  findings.push({
    check: 'first failing check is explained and table filters never change the full verdict',
    status: 'pass',
  });
  await page.locator('.diff-details > summary').click();
  assert.ok((await page.locator('.diff-lines .line-number').count()) > 0);
  findings.push({
    check: 'ordered source diff renders original/candidate line numbers',
    status: 'pass',
  });
  await page
    .getByLabel('Workspace JSON file', { exact: true })
    .setInputFiles({ name: 'broken.json', mimeType: 'application/json', buffer: Buffer.from('{') });
  await page.getByRole('alert').waitFor();
  assert.match(await page.getByRole('alert').innerText(), /not valid JSON/);
  assert.equal(
    await page.getByLabel('Candidate Python function').inputValue(),
    workspace.candidate,
  );
  assert.equal(await page.getByTestId('verdict').innerText(), unfilteredVerdict);
  findings.push({
    check: 'malformed workspace import preserves the current code and valid evidence',
    status: 'pass',
  });
  await page.getByLabel('Teaching example').selectOption('median');
  await page.getByLabel('Visible examples JSON').fill(JSON.stringify(fixtures[0].examples));
  await page.getByRole('button', { name: 'Format examples JSON', exact: true }).click();
  assert.deepEqual(
    JSON.parse(await page.getByLabel('Visible examples JSON').inputValue()),
    fixtures[0].examples,
  );
  assert.match(await page.getByLabel('Visible examples JSON').inputValue(), /\n/);
  findings.push({
    check: 'case JSON formatting retains data and invalidates old evidence',
    status: 'pass',
  });
  await page.getByLabel('Function name', { exact: true }).fill('output_test');
  await page
    .getByLabel('Behavior contract', { exact: true })
    .fill('Return supported finite JSON without coercing dictionary keys or tuple types.');
  await page.getByLabel('Original Python function').fill('def output_test():\n    return None\n');
  for (const [source, expected] of [
    ['def output_test():\n    return {1: "one"}\n', { 1: 'one' }],
    ['def output_test():\n    return (1, 2)\n', [1, 2]],
  ]) {
    await page.getByLabel('Candidate Python function').fill(source);
    const testCase = { id: 'output', args: [], expect: { kind: 'value', value: expected } };
    await page.getByLabel('Visible examples JSON').fill(JSON.stringify([testCase]));
    await page
      .getByLabel('Independent challenges JSON')
      .fill(JSON.stringify([{ ...testCase, id: 'challenge_output' }]));
    await page.getByRole('button', { name: /Verify both versions/ }).click();
    await waitDone(page);
    assert.match(await page.getByTestId('verdict').innerText(), /Incomplete/);
  }
  findings.push({
    check: 'actual Python dictionary-key coercion and tuple returns cannot earn a JSON pass',
    status: 'pass',
  });
  await page.getByLabel('Teaching example').selectOption('median');
  await page.getByRole('button', { name: /Load reference candidate/ }).click();
  let policyFetches = 0;
  const harnessURL = 'http://127.0.0.1:4101/harness.py';
  // A controlled response mutation changes only the policy hash, not the expected function outputs.
  const mutatePolicyResponse = async (route) => {
    const response = await route.fetch();
    const body = await response.text();
    policyFetches++;
    await route.fulfill({
      response,
      body: body + (policyFetches === 2 ? '\n# Explicit browser test policy-version marker\n' : ''),
    });
  };
  await page.context().route(harnessURL, mutatePolicyResponse);
  try {
    await page.getByRole('button', { name: /Verify both versions/ }).click();
    await waitDone(page);
    assert.equal(policyFetches, 2);
    assert.match(await page.getByTestId('verdict').innerText(), /Incomplete/);
    assert.match(await page.locator('.integrity-warning').innerText(), /matching policy hash/);
    findings.push({
      check:
        'matching outputs cannot pass when executed policy versions differ (controlled harness-response mutation)',
      status: 'pass',
    });
  } finally {
    await page.context().unroute(harnessURL, mutatePolicyResponse);
  }
  let runtimeFetches = 0;
  const workerURL = 'http://127.0.0.1:4101/worker.mjs';
  const mutateRuntimeResponse = async (route) => {
    const response = await route.fetch();
    let body = await response.text();
    runtimeFetches++;
    if (runtimeFetches === 2) {
      assert.ok(body.includes('pyodide: String(py.version)'));
      body = body.replace('pyodide: String(py.version)', "pyodide: 'controlled-test-runtime'");
    }
    await route.fulfill({ response, body });
  };
  await page.context().route(workerURL, mutateRuntimeResponse);
  try {
    await page.getByRole('button', { name: /Verify both versions/ }).click();
    await waitDone(page);
    assert.equal(runtimeFetches, 2);
    assert.match(await page.getByTestId('verdict').innerText(), /Incomplete/);
    assert.match(await page.locator('.integrity-warning').innerText(), /runtime/i);
    findings.push({
      check:
        'matching outputs cannot pass with mismatched runtime metadata (controlled worker-response mutation)',
      status: 'pass',
    });
  } finally {
    await page.context().unroute(workerURL, mutateRuntimeResponse);
  }
  await page.getByLabel('Teaching example').selectOption('median');
  await page.getByRole('button', { name: 'Reset example', exact: true }).click();
  if (process.argv.includes('--evaluate')) {
    await mkdir('artifacts/evaluation', { recursive: true });
    for (const f of fixtures) {
      await page.getByLabel('Teaching example').selectOption(f.id);
      const variants = [
        { name: 'original_mutant', source: f.source, correct: false },
        { name: 'teaching_mutant', source: f.inadequate, correct: false },
        ...(f.extraMutants ?? []).map((source, i) => ({
          name: `extra_mutant_${i + 1}`,
          source,
          correct: false,
        })),
        { name: 'reference', source: f.correct, correct: true },
      ];
      for (const variant of variants) {
        await page.getByLabel('Candidate Python function').fill(variant.source);
        await page.getByRole('button', { name: /Verify both versions/ }).click();
        await waitDone(page);
        const verdictText = await page.getByTestId('verdict').innerText();
        assert.match(
          verdictText,
          variant.correct ? /Pass on listed tests/ : /Failed a declared check/,
        );
        const promise = page.waitForEvent('download');
        await page.getByRole('button', { name: /Export evidence JSON/ }).click();
        const d = await promise;
        const path = `artifacts/evaluation/${f.id}-${variant.name}.json`;
        await d.saveAs(path);
        const evidence = JSON.parse(await readFile(path, 'utf8'));
        assert.equal(
          evidence.executionIntegrity.comparisonConsistent,
          true,
          `${f.id}/${variant.name}: both versions must complete under matching policy/runtime metadata`,
        );
        const exampleRows = evidence.proposed.rows.filter((r) => r.suite === 'example');
        evaluation.push({
          fixture: f.id,
          variant: variant.name,
          expectedCorrect: variant.correct,
          verdict: evidence.proposed.verdict,
          examplesPass: exampleRows.every((r) => r.result === 'pass'),
          challengeFailures: evidence.proposed.rows.filter(
            (r) => r.suite === 'challenge' && r.result === 'fail',
          ).length,
          cases: evidence.proposed.rows.length,
          report: path,
        });
      }
      console.log(
        `Evaluated ${f.id}: ${variants.length} hand-authored candidates with actual browser Python.`,
      );
    }
    assert.equal(evaluation.filter((x) => !x.expectedCorrect).length, 30);
    assert.equal(evaluation.filter((x) => x.expectedCorrect).length, 12);
  }
  await page.getByLabel('Teaching example').selectOption('median');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: /Verify both versions/ }).click();
  await waitDone(page);
  await page.screenshot({ path: '.cache/bugproof-mobile.png', fullPage: true });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  findings.push({
    check: '390px populated evidence layout has no horizontal page overflow',
    status: 'pass',
  });
  assert.deepEqual(consoleErrors, []);
  const output = {
    generatedAt: new Date().toISOString(),
    browser: await browser.version(),
    findings,
    evaluation,
    modelTests:
      'No live model request was made by these tests. Provider unit/HTTP tests use explicit response doubles.',
    limits: 'These checks do not prove adversarial sandbox soundness or broad repair accuracy.',
  };
  await mkdir('artifacts', { recursive: true });
  const outputPath = process.argv.includes('--evaluate')
    ? 'artifacts/browser-results.json'
    : 'artifacts/browser-smoke-results.json';
  await writeFile(outputPath, JSON.stringify(output, null, 2));
  console.log(
    JSON.stringify(
      {
        generatedAt: output.generatedAt,
        checks: findings.length,
        candidates: evaluation.length,
        outputPath,
      },
      null,
      2,
    ),
  );
} catch (error) {
  console.error(error);
  if (consoleErrors.length) console.error(consoleErrors);
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  if (server) {
    server.kill();
    await new Promise((resolve) => {
      server.once('exit', resolve);
      setTimeout(resolve, 3000);
    });
  }
}
