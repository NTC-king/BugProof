import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

test(
  'Windows installer environment scope restores existing and absent values on success/failure',
  { skip: process.platform !== 'win32' },
  () => {
    const result = spawnSync(
      'powershell.exe',
      ['-NoProfile', '-File', 'tests/setup-environment.ps1'],
      { encoding: 'utf8', windowsHide: true, timeout: 30000 },
    );
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /restoration passed/);
  },
);
