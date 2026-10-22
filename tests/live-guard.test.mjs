import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

test('live script refuses missing explicit consent flags before starting work', () => {
  for (const flags of [[], ['--allow-live'], ['--free-tier-confirmed']]) {
    const result = spawnSync(process.execPath, ['tests/live-repair.mjs', ...flags], {
      encoding: 'utf8',
      windowsHide: true,
      timeout: 10000,
      env: { ...process.env, BUGPROOF_GEMINI_KEY: 'local-test-placeholder-never-sent' },
    });
    assert.equal(result.status, 2);
    assert.match(result.stderr, /Live test is disabled/);
    assert.equal(result.stdout, '');
  }
});
test('live script refuses missing credentials even with consent flags', () => {
  const result = spawnSync(
    process.execPath,
    ['tests/live-repair.mjs', '--allow-live', '--free-tier-confirmed'],
    {
      encoding: 'utf8',
      windowsHide: true,
      timeout: 10000,
      env: { ...process.env, BUGPROOF_GEMINI_KEY: '' },
    },
  );
  assert.equal(result.status, 2);
  assert.match(result.stderr, /Configure a valid replacement key/);
  assert.equal(result.stdout, '');
});
