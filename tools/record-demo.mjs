import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { APP_VERSION } from '../src/domain.mjs';

// Silent technical footage only. The entrant supplies their own narration and public copy.
const origin = 'http://127.0.0.1:4100';
const version = await fetch(origin + '/api/session').then((response) => response.json());
assert.equal(version.version, APP_VERSION);
const directory = 'artifacts/private/demo';
await mkdir(directory + '/frames', { recursive: true });
const browser = await chromium.launch({
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: true,
});
let context;
const errors = [],
  phases = [];
let repairAttempts = 0,
  externalRequests = 0;
const started = Date.now();
try {
  context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: '.cache/demo-video', size: { width: 1440, height: 900 } },
    acceptDownloads: true,
  });
  await context.route('**/*', (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === '/api/repair') {
      repairAttempts++;
      return route.abort();
    }
    if (
      ['http:', 'https:'].includes(url.protocol) &&
      !['http://127.0.0.1:4100', 'http://127.0.0.1:4101'].includes(url.origin)
    ) {
      externalRequests++;
      return route.abort();
    }
    return route.continue();
  });
  const page = await context.newPage();
  const video = page.video();
  page.on('pageerror', (error) => errors.push(error.message));
  const hold = async (name, seconds) => {
    phases.push({ name, secondsFromStart: Number(((Date.now() - started) / 1000).toFixed(2)) });
    await page.screenshot({
      path: `${directory}/frames/${String(phases.length).padStart(2, '0')}.png`,
    });
    console.log(`Recorded phase: ${name}`);
    await page.waitForTimeout(seconds * 1000);
  };
  const show = (selector) =>
    page.locator(selector).evaluate((element) => element.scrollIntoView({ block: 'start' }));
  const done = () =>
    page.waitForFunction(
      () =>
        document.querySelector('[data-testid="verdict"]') &&
        ![...document.querySelectorAll('button')].some(
          (button) => button.textContent === 'Cancel run',
        ),
      null,
      { timeout: 125000 },
    );
  await page.goto(origin, { waitUntil: 'networkidle' });
  await hold('Purpose and three-step guide', 6);
  await show('.editors');
  await hold('Original code and hand-authored teaching candidate', 7);
  await show('#test-cases');
  await hold('Visible examples and excluded extra tests', 7);
  await page.getByRole('button', { name: /Verify both versions/ }).click();
  await show('#evidence');
  await done();
  assert.match(await page.getByTestId('verdict').innerText(), /Some tests failed/);
  assert.match(await page.locator('.version-score').last().innerText(), /4\s*\/\s*6 tests passed/);
  await hold('Actual failed run: original 2/6, teaching candidate 4/6', 8);
  await show('.first-issue');
  await hold('Exact mismatch: four-number median expected 6, actual 8', 7);
  await page.getByRole('button', { name: /Load reference candidate/ }).scrollIntoViewIfNeeded();
  await hold('Reference candidate control, not a live AI repair', 4);
  await page.getByRole('button', { name: /Load reference candidate/ }).click();
  assert.equal(await page.getByTestId('verdict').count(), 0);
  await show('.editor-candidate');
  await hold('Hand-authored reference loaded; old verdict invalidated', 6);
  await page.getByRole('button', { name: /Verify both versions/ }).click();
  await show('#evidence');
  await done();
  assert.match(await page.getByTestId('verdict').innerText(), /All listed tests passed/);
  assert.match(await page.locator('.version-score').last().innerText(), /6\s*\/\s*6 tests passed/);
  await hold('Actual reference run: all six listed tests passed', 9);
  await show('.suite-counts');
  await hold('Examples and extra-test counts; actual output table', 7);
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: /Export evidence JSON/ }).click();
  await (await download).saveAs(directory + '/recorded-reference-evidence.json');
  await page.locator('.report-details > summary').click();
  await show('.report-details');
  await hold('Export and recorded runtime/provenance evidence', 6);
  await show('footer');
  await hold('Limitations: listed cases, not universal correctness', 6);
  assert.deepEqual(errors, []);
  assert.equal(repairAttempts, 0);
  assert.equal(externalRequests, 0);
  await context.close();
  context = null;
  await video.saveAs(directory + '/BugProof-raw.webm');
  const manifest = {
    generatedAt: new Date().toISOString(),
    appVersion: APP_VERSION,
    browser: await browser.version(),
    width: 1440,
    height: 900,
    captureWallSeconds: Number(((Date.now() - started) / 1000).toFixed(2)),
    phases,
    pageErrors: errors,
    repairAttempts,
    externalRequests,
    liveModelUsed: false,
    candidates:
      'Newly hand-authored median teaching/reference fixtures, visibly labeled in the app.',
    status: 'silent_raw_footage_not_uploaded_or_final_submission',
    narration: 'Not supplied. Entrant must supply their own narration/submission wording.',
    localFile: directory + '/BugProof-raw.webm',
  };
  await writeFile('artifacts/demo-recording.json', JSON.stringify(manifest, null, 2));
  console.log(JSON.stringify(manifest, null, 2));
} finally {
  if (context) await context.close();
  await browser.close();
}
