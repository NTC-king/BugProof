export const LIMITS = Object.freeze({ source: 12288, cases: 32, input: 16384, depth: 8, array: 200 });
export const RUNTIME_VERSION = '314.0.7';
export function jsonValue(value, depth = 0) {
  if (depth > LIMITS.depth) throw new Error('JSON nesting exceeds 8 levels.');
  if (value === null || typeof value === 'boolean') return;
  if (typeof value === 'number' && Number.isFinite(value) && Math.abs(value) <= 1e9) return;
  if (typeof value === 'string' && value.length <= 4096) return;
  if (Array.isArray(value) && value.length <= LIMITS.array) { value.forEach(v => jsonValue(v, depth + 1)); return; }
  if (typeof value === 'object' && value !== null && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype && Object.keys(value).length <= 200) {
    for (const [key, v] of Object.entries(value)) { if (['__proto__', 'constructor', 'prototype'].includes(key)) throw new Error('Reserved object key.'); jsonValue(v, depth + 1); } return;
  }
  throw new Error('Use bounded, finite JSON values (numbers within ±1 billion).');
}
export function validateSource(source) {
  if (typeof source !== 'string' || !source.trim() || new TextEncoder().encode(source).length > LIMITS.source) throw new Error('Enter Python source, at most 12 KiB.');
  return source;
}
export function validateCases(cases, suite, ids = new Set()) {
  if (!Array.isArray(cases)) throw new Error(`${suite} must be a JSON array.`);
  return cases.map((c, i) => {
    if (!c || typeof c !== 'object' || typeof c.id !== 'string' || !/^[A-Za-z0-9_-]{1,64}$/.test(c.id)) throw new Error(`${suite} case ${i + 1}: add a short unique id.`);
    if (ids.has(c.id)) throw new Error(`Duplicate case id: ${c.id}`); ids.add(c.id);
    if (!Array.isArray(c.args)) throw new Error(`${c.id}: args must be an array.`);
    const kwargs = c.kwargs ?? {}; if (!kwargs || typeof kwargs !== 'object' || Array.isArray(kwargs)) throw new Error(`${c.id}: kwargs must be an object.`);
    jsonValue(c.args); jsonValue(kwargs);
    if (JSON.stringify({ args: c.args, kwargs }).length > LIMITS.input) throw new Error(`${c.id}: input exceeds 16 KiB.`);
    const e = c.expect;
    if (!e || !['value', 'raises'].includes(e.kind)) throw new Error(`${c.id}: expect must specify kind value or raises.`);
    if (e.kind === 'value') { if (!Object.hasOwn(e, 'value')) throw new Error(`${c.id}: missing expected value.`); jsonValue(e.value); }
    if (e.kind === 'raises' && !['ValueError', 'TypeError', 'ZeroDivisionError', 'IndexError', 'KeyError'].includes(e.type)) throw new Error(`${c.id}: unsupported expected exception.`);
    if (e.tolerance !== undefined && (typeof e.tolerance !== 'number' || !Number.isFinite(e.tolerance) || e.tolerance < 0 || e.tolerance > 1)) throw new Error(`${c.id}: invalid explicit numeric tolerance.`);
    return { id: c.id, suite, args: c.args, kwargs, expect: e, provenance: c.provenance ?? 'user' };
  });
}
export function validateTask(task) {
  if (!task || typeof task !== 'object') throw new Error('Invalid task.');
  validateSource(task.source);
  if (typeof task.functionName !== 'string' || !/^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(task.functionName) || task.functionName.includes('__')) throw new Error('Use an ordinary Python function name.');
  if (typeof task.contract !== 'string' || !task.contract.trim() || task.contract.length > 6000) throw new Error('Describe the expected behavior explicitly (up to 6,000 characters).');
  const ids = new Set(); const examples = validateCases(task.examples, 'example', ids); const challenges = validateCases(task.challenges, 'challenge', ids);
  if (!examples.length || examples.length + challenges.length > LIMITS.cases) throw new Error('Supply at least one example and no more than 32 total cases.');
  return structuredClone({ functionName: task.functionName, source: task.source, contract: task.contract, examples, challenges });
}
export function equalJSON(a, b, tolerance = 0) {
  if (typeof a !== typeof b || a === null || b === null) return a === b;
  if (typeof a === 'number') return Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= tolerance;
  if (typeof a !== 'object') return a === b;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const ak = Object.keys(a).sort(), bk = Object.keys(b).sort();
  return ak.length === bk.length && ak.every((k, i) => k === bk[i] && equalJSON(a[k], b[k], tolerance));
}
export function assess(cases, outcomes) {
  const seen = new Set(); const mapped = new Map();
  for (const o of outcomes) { if (!o || typeof o.caseId !== 'string' || seen.has(o.caseId) || !cases.some(c => c.id === o.caseId)) throw new Error('Malformed, duplicate, or unexpected runner outcome.'); seen.add(o.caseId); mapped.set(o.caseId, o); }
  return cases.map(c => {
    const outcome = mapped.get(c.id) ?? { caseId: c.id, status: 'missing' };
    let result = 'incomplete';
    if (outcome.status === 'blocked') result = 'blocked';
    else if (outcome.status === 'returned') result = c.expect.kind === 'value' && equalJSON(outcome.value, c.expect.value, c.expect.tolerance ?? 0) ? 'pass' : 'fail';
    else if (outcome.status === 'raised') result = c.expect.kind === 'raises' && outcome.exceptionType === c.expect.type ? 'pass' : 'fail';
    return { ...c, outcome, result };
  });
}
export function summary(rows) {
  return { total: rows.length, passed: rows.filter(r => r.result === 'pass').length, failed: rows.filter(r => r.result === 'fail').length, blocked: rows.filter(r => r.result === 'blocked').length, incomplete: rows.filter(r => r.result === 'incomplete').length };
}
export function verdict(rows) {
  const s = summary(rows);
  if (s.failed) return 'failed'; if (s.blocked) return 'blocked';
  if (!s.total || s.incomplete) return 'inconclusive';
  return rows.some(r => r.suite === 'challenge') ? 'pass_on_listed_tests' : 'examples_only';
}
export function repairPayload(task) {
  const t = validateTask(task);
  return { functionName: t.functionName, source: t.source, contract: t.contract, examples: t.examples };
}
export async function hash(value) {
  const bytes = new TextEncoder().encode(typeof value === 'string' ? value : JSON.stringify(value));
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), b => b.toString(16).padStart(2, '0')).join('');
}
export async function makeReport(task, candidate, originalOutcomes, candidateOutcomes, provenance, runId) {
  const t = validateTask(task); validateSource(candidate);
  const cases = [...t.examples, ...t.challenges]; const original = assess(cases, originalOutcomes); const proposed = assess(cases, candidateOutcomes);
  const hashes = { original: await hash(t.source), candidate: await hash(candidate), contract: await hash(t.contract), cases: await hash(cases) };
  let independent = null;
  if (provenance.kind === 'live_model') {
    const basis = provenance.basis;
    const challengeHashes = await Promise.all(t.challenges.map(c => hash({ args: c.args, kwargs: c.kwargs, expect: c.expect })));
    independent = Boolean(basis && basis.sourceHash === hashes.original && basis.contractHash === hashes.contract && basis.examplesHash === await hash(t.examples) && Array.isArray(basis.promptCaseHashes) && challengeHashes.every(h => !basis.promptCaseHashes.includes(h)));
  }
  return { schemaVersion: 1, runId, createdAt: new Date().toISOString(), app: { version: '0.1.0', sourceRevision: 'working-tree; see repository and release record', policyHashes: [...new Set([...originalOutcomes, ...candidateOutcomes].map(o => o.policyHash).filter(Boolean))] }, runtime: { name: 'Pyodide', version: RUNTIME_VERSION }, task: t, candidate: { source: candidate, provenance }, hashes, original: { rows: original, summary: summary(original), verdict: verdict(original) }, proposed: { rows: proposed, summary: summary(proposed), verdict: verdict(proposed) }, challengesExcludedFromRepairPrompt: independent, limitations: ['Passing listed tests is not proof of correctness.', 'Local supported-subset execution; not a hardened public sandbox.', 'Challenge independence is only supported for an unchanged recorded repair basis; it is unknown for pasted/teaching candidates.', 'Unsigned report hashes detect changes but are not cryptographic attestation.'] };
}
