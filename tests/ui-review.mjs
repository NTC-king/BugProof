import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { APP_VERSION } from '../src/domain.mjs';

// Requires the existing local launcher. No provider request is allowed by this review.
const origin = 'http://127.0.0.1:4100';
const session = await fetch(origin + '/api/session').then((response) => response.json());
assert.equal(session.version, APP_VERSION);
const findings = [];
const errors = [];
let repairAttempts = 0;
const browser = await chromium.launch({
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: true,
});
try {
  await mkdir('.cache', { recursive: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 1000 } });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route('**/api/repair', (route) => {
    repairAttempts++;
    return route.abort();
  });
  await page.goto(origin, { waitUntil: 'networkidle' });
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(() => document.activeElement?.textContent), 'Skip to workbench');
  const edit = page.getByText('Edit examples · JSON', { exact: true });
  await edit.focus();
  await page.keyboard.press('Enter');
  assert.equal(await page.getByLabel('Visible examples JSON').isVisible(), true);
  findings.push('Keyboard focus and native JSON disclosure work.');

  const editor = page.getByLabel('Visible examples JSON');
  await editor.fill('[');
  assert.match(
    await page.getByRole('region', { name: 'Example tests', exact: true }).innerText(),
    /Cannot preview/,
  );
  await editor.fill('[null, 1, {"id":{},"expect":{"kind":"raises","type":{}}}]');
  assert.equal(await page.locator('.suite-examples .preview-row').count(), 3);
  await editor.fill('[]');
  assert.match(await page.locator('.suite-examples').innerText(), /No tests here yet/);
  await editor.fill(
    '[{"id":"deep","args":' +
      '['.repeat(12000) +
      '1' +
      ']'.repeat(12000) +
      ',"expect":{"kind":"value","value":1}}]',
  );
  assert.ok(
    (await page.locator('.suite-examples .preview-row code').first().innerText()).length <= 100,
  );
  await page.getByRole('button', { name: /Verify both versions/ }).click();
  await page.getByRole('alert').waitFor();
  assert.match(await page.getByRole('alert').innerText(), /nesting|depth/i);
  assert.equal(await page.getByTestId('verdict').count(), 0);
  const longCases = Array.from({ length: 5 }, (_, index) => ({
    id: 'wide_' + index,
    args: ['界'.repeat(160)],
    expect: { kind: 'value', value: '<img src=x onerror=alert(1)>' },
  }));
  await editor.fill(JSON.stringify(longCases));
  assert.equal(await page.locator('.suite-examples .preview-row').count(), 4);
  assert.match(await page.locator('.suite-examples').innerText(), /First 4 of 5 shown/);
  assert.equal(await page.locator('.suite-examples img').count(), 0);
  assert.deepEqual(JSON.parse(await editor.inputValue()), longCases);
  assert.equal(await page.getByTestId('verdict').count(), 0);
  findings.push(
    'Malformed, empty, unusual and long previews remain safe; preview truncation preserves all JSON.',
  );

  await page.getByRole('button', { name: 'Reset example', exact: true }).click();
  await edit.click();
  assert.equal(await page.locator('.case-json[open]').count(), 0);
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  await page.screenshot({ path: '.cache/ui-0.3.2-desktop.png', fullPage: true });
  findings.push('Fresh compact desktop layout has no horizontal page overflow.');

  await page.getByRole('button', { name: /Verify both versions/ }).click();
  await page.waitForFunction(
    () =>
      document.querySelector('[data-testid="verdict"]') &&
      ![...document.querySelectorAll('button')].some(
        (button) => button.textContent === 'Cancel run',
      ),
    null,
    { timeout: 125000 },
  );
  assert.match(await page.getByTestId('verdict').innerText(), /Some tests failed/);
  await page.evaluate(() => document.getElementById('evidence').scrollIntoView({ block: 'start' }));
  await page.screenshot({ path: '.cache/ui-0.3.2-results.png' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({ path: '.cache/ui-0.3.2-mobile-top.png' });
  await page.evaluate(() => document.getElementById('evidence').scrollIntoView({ block: 'start' }));
  await page.screenshot({ path: '.cache/ui-0.3.2-mobile-results.png' });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  assert.equal(await page.locator('.table-hint').isVisible(), true);
  await page.getByRole('button', { name: /Load reference candidate/ }).click();
  await page.getByRole('button', { name: /Verify both versions/ }).click();
  await page.waitForFunction(
    () =>
      document.querySelector('[data-testid="verdict"]') &&
      ![...document.querySelectorAll('button')].some(
        (button) => button.textContent === 'Cancel run',
      ),
    null,
    { timeout: 125000 },
  );
  assert.match(await page.getByTestId('verdict').innerText(), /All listed tests passed/);
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  findings.push(
    '390px failed and passing results retain readable separate scores with no horizontal page overflow.',
  );

  const offline = await browser.newPage({ javaScriptEnabled: false });
  let requests = 0;
  offline.on('request', (request) => {
    if (request.url().startsWith('http')) requests++;
  });
  await offline.goto('file:///F:/BugProof/devpost/app-map.html');
  assert.match(await offline.locator('body').innerText(), /CaseSuite/);
  assert.equal(requests, 0);
  await offline.close();
  findings.push(
    'Updated reference map works offline with JavaScript disabled and zero HTTP requests.',
  );
  assert.deepEqual(errors, []);
  assert.equal(repairAttempts, 0);
  const result = {
    generatedAt: new Date().toISOString(),
    appVersion: APP_VERSION,
    browser: await browser.version(),
    findings,
    pageErrors: errors,
    repairAttempts,
    limits:
      'Local UI checks and public fixtures; not a live-model benchmark or proof of correctness.',
  };
  await writeFile('artifacts/ui-review-results.json', JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
} finally {
  await browser.close();
}
