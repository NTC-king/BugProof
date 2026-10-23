export const LIMITS = Object.freeze({
  source: 12288,
  cases: 32,
  input: 16384,
  depth: 8,
  array: 200,
});
export const RUNTIME_VERSION = '314.0.7';
export const APP_VERSION = '0.3.2';
export function jsonValue(value, depth = 0) {
  if (depth > LIMITS.depth) throw new Error('JSON nesting exceeds 8 levels.');
  if (value === null || typeof value === 'boolean') return;
  if (typeof value === 'number' && Number.isFinite(value) && Math.abs(value) <= 1e9) return;
  if (typeof value === 'string' && value.length <= 4096) return;
  if (Array.isArray(value) && value.length <= LIMITS.array) {
    value.forEach((v) => jsonValue(v, depth + 1));
    return;
  }
  if (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype &&
    Object.keys(value).length <= 200
  ) {
    for (const [key, v] of Object.entries(value)) {
      if (['__proto__', 'constructor', 'prototype'].includes(key))
        throw new Error('Reserved object key.');
      jsonValue(v, depth + 1);
    }
    return;
  }
  throw new Error('Use bounded, finite JSON values (numbers within ±1 billion).');
}
export function validateSource(source) {
  if (
    typeof source !== 'string' ||
    !source.trim() ||
    new TextEncoder().encode(source).length > LIMITS.source
  )
    throw new Error('Enter Python source, at most 12 KiB.');
  return source;
}
export function validateCases(cases, suite, ids = new Set()) {
  if (!Array.isArray(cases) || cases.length > LIMITS.cases)
    throw new Error(`${suite} must be a JSON array with at most 32 cases.`);
  return cases.map((c, i) => {
    if (
      !c ||
      typeof c !== 'object' ||
      typeof c.id !== 'string' ||
      !/^[A-Za-z0-9_-]{1,64}$/.test(c.id)
    )
      throw new Error(`${suite} case ${i + 1}: add a short unique id.`);
    if (ids.has(c.id)) throw new Error(`Duplicate case id: ${c.id}`);
    ids.add(c.id);
    if (!Array.isArray(c.args)) throw new Error(`${c.id}: args must be an array.`);
    const kwargs = c.kwargs ?? {};
    if (!kwargs || typeof kwargs !== 'object' || Array.isArray(kwargs))
      throw new Error(`${c.id}: kwargs must be an object.`);
    jsonValue(c.args);
    jsonValue(kwargs);
    if (new TextEncoder().encode(JSON.stringify({ args: c.args, kwargs })).length > LIMITS.input)
      throw new Error(`${c.id}: input exceeds 16 KiB.`);
    const e = c.expect;
    if (!e || !['value', 'raises'].includes(e.kind))
      throw new Error(`${c.id}: expect must specify kind value or raises.`);
    if (e.kind === 'value') {
      if (!Object.hasOwn(e, 'value')) throw new Error(`${c.id}: missing expected value.`);
      jsonValue(e.value);
    }
    if (
      e.kind === 'raises' &&
      !['ValueError', 'TypeError', 'ZeroDivisionError', 'IndexError', 'KeyError'].includes(e.type)
    )
      throw new Error(`${c.id}: unsupported expected exception.`);
    if (
      e.tolerance !== undefined &&
      (typeof e.tolerance !== 'number' ||
        !Number.isFinite(e.tolerance) ||
        e.tolerance < 0 ||
        e.tolerance > 1)
    )
      throw new Error(`${c.id}: invalid explicit numeric tolerance.`);
    if (
      c.provenance !== undefined &&
      (typeof c.provenance !== 'string' || c.provenance.length > 200)
    )
      throw new Error(`${c.id}: provenance must be a short text label.`);
    const expect =
      e.kind === 'raises'
        ? { kind: 'raises', type: e.type }
        : {
            kind: 'value',
            value: e.value,
            ...(e.tolerance === undefined ? {} : { tolerance: e.tolerance }),
          };
    return { id: c.id, suite, args: c.args, kwargs, expect, provenance: c.provenance ?? 'user' };
  });
}
export function validateTask(task) {
  if (!task || typeof task !== 'object') throw new Error('Invalid task.');
  validateSource(task.source);
  if (
    typeof task.functionName !== 'string' ||
    !/^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(task.functionName) ||
    task.functionName.includes('__')
  )
    throw new Error('Use an ordinary Python function name.');
  if (typeof task.contract !== 'string' || !task.contract.trim() || task.contract.length > 6000)
    throw new Error('Describe the expected behavior explicitly (up to 6,000 characters).');
  const ids = new Set();
  const examples = validateCases(task.examples, 'example', ids);
  const challenges = validateCases(task.challenges, 'challenge', ids);
  if (!examples.length || examples.length + challenges.length > LIMITS.cases)
    throw new Error('Supply at least one example and no more than 32 total cases.');
  return structuredClone({
    functionName: task.functionName,
    source: task.source,
    contract: task.contract,
    examples,
    challenges,
  });
}
export function equalJSON(a, b, tolerance = 0) {
  if (typeof a !== typeof b || a === null || b === null) return a === b;
  if (typeof a === 'number')
    return Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= tolerance;
  if (typeof a !== 'object') return a === b;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const ak = Object.keys(a).sort(),
    bk = Object.keys(b).sort();
  return (
    ak.length === bk.length && ak.every((k, i) => k === bk[i] && equalJSON(a[k], b[k], tolerance))
  );
}
export function assess(cases, outcomes) {
  const seen = new Set();
  const mapped = new Map();
  for (const o of outcomes) {
    if (
      !o ||
      typeof o.caseId !== 'string' ||
      seen.has(o.caseId) ||
      !cases.some((c) => c.id === o.caseId)
    )
      throw new Error('Malformed, duplicate, or unexpected runner outcome.');
    seen.add(o.caseId);
    mapped.set(o.caseId, o);
  }
  return cases.map((c) => {
    const outcome = mapped.get(c.id) ?? { caseId: c.id, status: 'missing' };
    let result = 'incomplete';
    if (outcome.status === 'blocked') result = 'blocked';
    else if (outcome.status === 'returned') {
      try {
        jsonValue(outcome.value);
        result =
          c.expect.kind === 'value' &&
          equalJSON(outcome.value, c.expect.value, c.expect.tolerance ?? 0)
            ? 'pass'
            : 'fail';
      } catch {
        return {
          ...c,
          outcome: {
            ...outcome,
            status: 'runtime_error',
            message: 'Runner returned unsupported JSON; no passing verdict is possible.',
          },
          result: 'incomplete',
        };
      }
    } else if (outcome.status === 'raised')
      result =
        c.expect.kind === 'raises' && outcome.exceptionType === c.expect.type ? 'pass' : 'fail';
    return { ...c, outcome, result };
  });
}
export function summary(rows) {
  return {
    total: rows.length,
    passed: rows.filter((r) => r.result === 'pass').length,
    failed: rows.filter((r) => r.result === 'fail').length,
    blocked: rows.filter((r) => r.result === 'blocked').length,
    incomplete: rows.filter((r) => r.result === 'incomplete').length,
  };
}
export function verdict(rows) {
  const s = summary(rows);
  if (s.failed) return 'failed';
  if (s.blocked) return 'blocked';
  if (!s.total || s.incomplete) return 'inconclusive';
  return rows.some((r) => r.suite === 'challenge') ? 'pass_on_listed_tests' : 'examples_only';
}
export function repairPayload(task) {
  const t = validateTask(task);
  return {
    functionName: t.functionName,
    source: t.source,
    contract: t.contract,
    examples: t.examples.map(({ id, args, kwargs, expect }) => ({ id, args, kwargs, expect })),
  };
}
export function validateRepairResult(data) {
  const invalid = () => {
    throw new Error(
      'Local repair service returned invalid candidate metadata. No candidate was accepted.',
    );
  };
  if (!data || typeof data !== 'object' || Array.isArray(data)) invalid();
  validateSource(data.source);
  const p = data.provenance;
  const validHash = (value) => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
  if (
    typeof data.explanation !== 'string' ||
    data.explanation.length > 6000 ||
    !p ||
    p.kind !== 'live_model' ||
    typeof p.model !== 'string' ||
    !/^[a-z0-9.-]{1,80}$/.test(p.model) ||
    typeof p.generatedAt !== 'string' ||
    p.generatedAt.length > 40 ||
    !Number.isFinite(Date.parse(p.generatedAt)) ||
    p.challengeExposure !== 'excluded_from_request' ||
    !p.basis ||
    !['sourceHash', 'candidateHash', 'contractHash', 'examplesHash'].every((key) =>
      validHash(p.basis[key]),
    ) ||
    !Array.isArray(p.basis.promptInputHashes) ||
    !p.basis.promptInputHashes.length ||
    p.basis.promptInputHashes.length > LIMITS.cases ||
    !p.basis.promptInputHashes.every(validHash)
  )
    invalid();
  if (
    p.usage !== null &&
    (!p.usage ||
      typeof p.usage !== 'object' ||
      Array.isArray(p.usage) ||
      Object.entries(p.usage).some(
        ([key, value]) =>
          !['promptTokenCount', 'candidatesTokenCount', 'totalTokenCount'].includes(key) ||
          !Number.isSafeInteger(value) ||
          value < 0 ||
          value > 1e9,
      ))
  )
    invalid();
  return structuredClone({ source: data.source, explanation: data.explanation, provenance: p });
}
// Stable object-key order; arrays retain order. Callers provide validated finite JSON.
export function canonicalJSON(value) {
  if (Array.isArray(value)) return '[' + value.map(canonicalJSON).join(',') + ']';
  if (value !== null && typeof value === 'object')
    return (
      '{' +
      Object.keys(value)
        .sort()
        .map((k) => JSON.stringify(k) + ':' + canonicalJSON(value[k]))
        .join(',') +
      '}'
    );
  return JSON.stringify(value);
}
export function caseInputHash(c) {
  return hash({ args: c.args, kwargs: c.kwargs ?? {} });
}
export async function hash(value) {
  const bytes = new TextEncoder().encode(typeof value === 'string' ? value : canonicalJSON(value));
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), (b) =>
    b.toString(16).padStart(2, '0'),
  ).join('');
}
export async function makeReport(
  task,
  candidate,
  originalOutcomes,
  candidateOutcomes,
  provenance,
  runId,
) {
  const t = validateTask(task);
  validateSource(candidate);
  const cases = [...t.examples, ...t.challenges];
  const original = assess(cases, originalOutcomes);
  const proposed = assess(cases, candidateOutcomes);
  const hashes = {
    original: await hash(t.source),
    candidate: await hash(candidate),
    contract: await hash(t.contract),
    cases: await hash(cases),
  };
  const executed = [...originalOutcomes, ...candidateOutcomes];
  const policyHashes = [...new Set(executed.map((o) => o.policyHash).filter(Boolean))];
  const policyConsistent =
    originalOutcomes.length === cases.length &&
    candidateOutcomes.length === cases.length &&
    policyHashes.length === 1 &&
    /^[a-f0-9]{64}$/.test(policyHashes[0]) &&
    executed.every((o) => o.policyHash === policyHashes[0]);
  const proposedVerdict = verdict(proposed);
  const runtimeRecords = executed.map((o) => o.runtime);
  const validRuntime = (value) =>
    value &&
    typeof value.pyodide === 'string' &&
    typeof value.python === 'string' &&
    value.python.length > 0 &&
    value.python.length <= 512 &&
    value.implementation === 'cpython';
  const observedRuntimes = [
    ...new Map(
      runtimeRecords.filter(validRuntime).map((value) => [canonicalJSON(value), value]),
    ).values(),
  ];
  const runtimeConsistent =
    originalOutcomes.length === cases.length &&
    candidateOutcomes.length === cases.length &&
    observedRuntimes.length === 1 &&
    runtimeRecords.every(validRuntime) &&
    observedRuntimes[0].pyodide === RUNTIME_VERSION &&
    runtimeRecords.every((value) => canonicalJSON(value) === canonicalJSON(observedRuntimes[0]));
  const comparisonConsistent = policyConsistent && runtimeConsistent;
  let independent = null;
  if (provenance.kind === 'live_model') {
    const basis = provenance.basis;
    const challengeHashes = await Promise.all(t.challenges.map(caseInputHash));
    const visibleInputHashes = await Promise.all(t.examples.map(caseInputHash));
    independent = Boolean(
      t.challenges.length &&
        basis &&
        basis.sourceHash === hashes.original &&
        basis.candidateHash === hashes.candidate &&
        basis.contractHash === hashes.contract &&
        basis.examplesHash === (await hash(repairPayload(t).examples)) &&
        Array.isArray(basis.promptInputHashes) &&
        basis.promptInputHashes.length === visibleInputHashes.length &&
        visibleInputHashes.every((h, i) => basis.promptInputHashes[i] === h) &&
        challengeHashes.every((h) => !visibleInputHashes.includes(h)),
    );
  }
  return {
    schemaVersion: 3,
    runId,
    createdAt: new Date().toISOString(),
    app: {
      version: APP_VERSION,
      sourceRevision: 'working-tree; see repository and release record',
      policyHashes,
    },
    runtime: { name: 'Pyodide', expectedVersion: RUNTIME_VERSION, observed: observedRuntimes },
    task: t,
    candidate: { source: candidate, provenance },
    hashes,
    original: { rows: original, summary: summary(original), verdict: verdict(original) },
    proposed: {
      rows: proposed,
      summary: summary(proposed),
      verdict:
        !comparisonConsistent && ['pass_on_listed_tests', 'examples_only'].includes(proposedVerdict)
          ? 'inconclusive'
          : proposedVerdict,
    },
    executionIntegrity: {
      policyConsistent,
      runtimeConsistent,
      comparisonConsistent,
      reason: !policyConsistent
        ? 'A single matching policy hash was not received for every case in both versions. Do not award a passing comparison; rerun both versions.'
        : !runtimeConsistent
          ? 'Matching observed Python/Pyodide runtime metadata was not received for every case, or the runtime differs from the pin. Rerun both versions with the pinned runtime.'
          : 'Both versions completed under the same recorded policy and observed pinned runtime.',
    },
    challengesExcludedFromRepairPrompt: independent,
    limitations: [
      'Passing listed tests is not proof of correctness.',
      'Local supported-subset execution; not a hardened public sandbox.',
      'Challenge independence is only supported for an unchanged recorded repair basis; it is unknown for pasted/teaching candidates.',
      'Overlap checks compare canonical JSON call inputs, not all semantically equivalent Python calls; they do not prove secrecy or statistical independence.',
      'Unsigned report hashes detect changes but are not cryptographic attestation.',
    ],
  };
}
