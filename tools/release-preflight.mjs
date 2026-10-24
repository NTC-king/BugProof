import { execFileSync } from 'node:child_process';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';

const git = (args, options = {}) =>
  execFileSync('git', args, { maxBuffer: 80 * 1024 * 1024, ...options });
const text = (args) => git(args, { encoding: 'utf8' }).trim();
const findings = [];
const credential = process.env.BUGPROOF_GEMINI_KEY;
const patterns = [
  ['private-key', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ['google-key', /\bAIza[0-9A-Za-z_-]{35}\b/],
  ['google-aq-key', /\bAQ\.[A-Za-z0-9_-]{32,}\b/],
  ['github-token', /\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})\b/],
  ['aws-access-key', /\bAKIA[0-9A-Z]{16}\b/],
];
function scan(content, location) {
  if (credential && content.includes(Buffer.from(credential)))
    findings.push({ kind: 'configured-credential', location });
  const value = content.toString('utf8');
  for (const [kind, pattern] of patterns)
    if (pattern.test(value)) findings.push({ kind, location });
}
function privatePath(path) {
  path = path.toLowerCase();
  return (
    path === 'devpost/learner-profile.md' ||
    (/(^|\/)\.env(?:\..*)?$/.test(path) &&
      !path.endsWith('/.env.example') &&
      path !== '.env.example') ||
    /^(?:node_modules|\.cache|dist|artifacts\/private)\//.test(path)
  );
}
const positiveControls = [
  ['-----BEGIN', 'PRIVATE KEY-----'].join(' '),
  'AIza' + '0'.repeat(35),
  'AQ.' + 'x'.repeat(40),
  'ghp_' + 'x'.repeat(36),
  'AKIA' + '1'.repeat(16),
];
for (let index = 0; index < patterns.length; index++) {
  assert.equal(patterns[index][1].test(positiveControls[index]), true);
  assert.equal(patterns[index][1].test('ordinary project source, no credential'), false);
}
for (const path of [
  '.env',
  '.env.production',
  'devpost/learner-profile.md',
  'artifacts/private/demo/video.webm',
])
  assert.equal(privatePath(path), true);
for (const path of ['.env.example', 'src/App.tsx', 'README.md'])
  assert.equal(privatePath(path), false);
const objects = text(['rev-list', '--objects', '--all']).split('\n').filter(Boolean);
const objectIds = objects.map((line) => line.split(' ')[0]);
for (const line of objects) {
  const path = line.slice(line.indexOf(' ') + 1);
  if (line.includes(' ') && privatePath(path))
    findings.push({ kind: 'private-path-in-history', location: path });
}
const metadata = git(['cat-file', '--batch-check'], {
  input: objectIds.join('\n') + '\n',
  encoding: 'utf8',
});
const blobs = metadata
  .trim()
  .split('\n')
  .map((line) => line.split(' '))
  .filter((parts) => parts[1] === 'blob')
  .map((parts) => parts[0]);
const batch = git(['cat-file', '--batch'], { input: blobs.join('\n') + '\n' });
let offset = 0;
for (const id of blobs) {
  const headerEnd = batch.indexOf(10, offset);
  const header = batch.subarray(offset, headerEnd).toString('utf8').split(' ');
  const size = Number(header[2]);
  if (header[0] !== id || header[1] !== 'blob' || !Number.isSafeInteger(size))
    throw new Error('History batch parsing failed.');
  scan(batch.subarray(headerEnd + 1, headerEnd + 1 + size), `history:${id.slice(0, 12)}`);
  offset = headerEnd + 1 + size + 1;
}
assert.equal(offset, batch.length, 'Every history blob must be consumed.');
const paths = git(['ls-files', '--cached', '--others', '--exclude-standard', '-z'])
  .toString('utf8')
  .split('\0')
  .filter(Boolean);
for (const path of paths) {
  if (privatePath(path)) findings.push({ kind: 'private-worktree-path', location: path });
  scan(await readFile(path), path);
}
const trackedPrivate = text(['ls-files', '--', '.env', 'devpost/learner-profile.md']);
if (trackedPrivate)
  findings.push({ kind: 'tracked-private-file', location: 'private configuration/profile' });
for (const path of ['.env', 'devpost/learner-profile.md']) {
  try {
    git(['check-ignore', '--quiet', path]);
  } catch {
    findings.push({ kind: 'missing-ignore-rule', location: path });
  }
}
for (const path of ['devpost/scope.md', 'devpost/prd.md', 'devpost/spec.md']) {
  if (!/^status: approved$/m.test(await readFile(path, 'utf8')))
    findings.push({ kind: 'unapproved-plan', location: path });
}
const result = {
  generatedAt: new Date().toISOString(),
  sourceCheckpoint: text(['rev-parse', 'HEAD']),
  historyCommits: Number(text(['rev-list', '--all', '--count'])),
  distinctHistoryBlobs: blobs.length,
  currentFilesScanned: paths.length,
  configuredCredentialChecked: Boolean(credential),
  detectorSelfTestsPassed: true,
  findings,
  result: findings.length ? 'blocked' : 'checks_passed',
  limits:
    'Exact configured-key and selected credential-pattern/path checks, not an exhaustive secret/IP/privacy certification. Human review and authorization remain required before publication. No file contents or credentials are emitted.',
};
await mkdir('artifacts', { recursive: true });
if (!process.argv.includes('--check-only'))
  await writeFile('artifacts/release-preflight.json', JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
if (findings.length) process.exitCode = 1;
