import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';

const name = 'NTC-king/BugProof';
const expectedHead = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const get = async (path) => {
  // Deliberately no Authorization header, cookies, gh credential helper or account session.
  const response = await fetch(`https://api.github.com/repos/${name}${path}`, {
    headers: {
      'User-Agent': 'BugProof-public-access-check',
      Accept: 'application/vnd.github+json',
    },
    credentials: 'omit',
  });
  if (!response.ok) throw new Error(`Anonymous GitHub check returned HTTP ${response.status}.`);
  return response.json();
};
const repository = await get('');
assert.equal(repository.private, false);
assert.equal(repository.full_name, name);
assert.equal(repository.license?.spdx_id, 'MIT');
const commit = await get(`/commits/${repository.default_branch}`);
assert.equal(commit.sha, expectedHead);
const tree = await get(`/git/trees/${commit.sha}?recursive=1`);
assert.equal(tree.truncated, false);
const paths = tree.tree.filter((entry) => entry.type === 'blob').map((entry) => entry.path);
const required = [
  'LICENSE',
  'README.md',
  'package-lock.json',
  '.env.example',
  'devpost/scope.md',
  'devpost/prd.md',
  'devpost/spec.md',
  'src/App.tsx',
  'runner/harness.py',
  'server/main.mjs',
  'start-local.cmd',
];
for (const path of required)
  assert.ok(paths.includes(path), `Required public file absent: ${path}`);
assert.equal(
  paths.some(
    (path) =>
      path === '.env' ||
      path === 'devpost/learner-profile.md' ||
      /^(?:\.cache|node_modules|dist|artifacts\/private)\//.test(path),
  ),
  false,
);
const response = await fetch(repository.html_url, { credentials: 'omit' });
assert.equal(response.status, 200);
const result = {
  generatedAt: new Date().toISOString(),
  repository: repository.html_url,
  authenticated: false,
  public: true,
  verifiedCheckpoint: commit.sha,
  defaultBranch: repository.default_branch,
  detectedLicense: repository.license.spdx_id,
  publicFiles: paths.length,
  requiredFilesPresent: required,
  privatePathsAbsent: true,
  htmlStatus: response.status,
  limits:
    'Verifies public source access and the named checkpoint, not contest registration, a video URL, submission or prize eligibility.',
};
if (!process.argv.includes('--check-only'))
  await writeFile('artifacts/public-release-verification.json', JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
