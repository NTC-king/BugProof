import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const manifest = JSON.parse(await readFile('artifacts/demo-recording.json', 'utf8'));
const path = resolve(manifest.localFile);
const browser = await chromium.launch({
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: true,
});
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(pathToFileURL(path).href, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => {
    const video = document.querySelector('video');
    return video && video.readyState >= 2 && Number.isFinite(video.duration);
  });
  const media = await page.evaluate(() => {
    const video = document.querySelector('video');
    video.pause();
    return { durationSeconds: video.duration, width: video.videoWidth, height: video.videoHeight };
  });
  assert.ok(media.durationSeconds >= 60 && media.durationSeconds < 180);
  assert.equal(media.width, 1440);
  assert.equal(media.height, 900);
  const samples = [];
  for (const index of [1, 3, 7]) {
    const phase = manifest.phases[index];
    const at = Math.min(phase.secondsFromStart + 2, media.durationSeconds - 1);
    await page.evaluate(async (time) => {
      const video = document.querySelector('video');
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Video seek timed out.')), 10000);
        video.addEventListener(
          'seeked',
          () => {
            clearTimeout(timeout);
            resolve();
          },
          { once: true },
        );
        video.currentTime = time;
      });
    }, at);
    await page.waitForTimeout(150);
    await page
      .locator('video')
      .screenshot({ path: `artifacts/private/demo/frames/decoded-${index}.png` });
    samples.push({ phase: phase.name, atSeconds: at });
  }
  const data = await readFile(path);
  const result = {
    generatedAt: new Date().toISOString(),
    ...media,
    bytes: data.length,
    sha256: createHash('sha256').update(data).digest('hex'),
    decodedSamples: samples,
    result: 'video_decodes_and_duration_resolution_checks_passed',
    limits:
      'Silent local raw footage. Narration, public upload/link access and entrant review remain separate requirements.',
  };
  await writeFile('artifacts/demo-verification.json', JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
} finally {
  await browser.close();
}
