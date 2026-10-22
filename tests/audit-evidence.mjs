// Recompute saved development evidence; this does not execute Python or call a provider.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { APP_VERSION, hash, makeReport, validateTask } from '../src/domain.mjs';
import { fixtures } from '../src/fixtures.mjs';

const aggregate = JSON.parse(await readFile('artifacts/browser-results.json', 'utf8'));
assert.equal(aggregate.evaluation.length, 42);
const policyHash = await hash(await readFile('runner/harness.py', 'utf8'));
let candidateCases = 0;
for (const entry of aggregate.evaluation) {
  assert.match(entry.report, /^artifacts\/evaluation\/[a-z_]+-[a-z_0-9]+\.json$/);
  const report = JSON.parse(await readFile(entry.report, 'utf8'));
  const fixture = fixtures.find((value) => value.id === entry.fixture);
  assert.ok(fixture, entry.fixture);
  const variants = {
    original_mutant: fixture.source,
    teaching_mutant: fixture.inadequate,
    reference: fixture.correct,
    ...Object.fromEntries(
      (fixture.extraMutants ?? []).map((source, index) => [`extra_mutant_${index + 1}`, source]),
    ),
  };
  assert.equal(report.schemaVersion, 3);
  assert.equal(report.app.version, APP_VERSION);
  assert.deepEqual(report.task, validateTask(fixture));
  assert.equal(report.candidate.source, variants[entry.variant]);
  const originalOutcomes = report.original.rows.map((row) => row.outcome);
  const candidateOutcomes = report.proposed.rows.map((row) => row.outcome);
  for (const outcome of [...originalOutcomes, ...candidateOutcomes]) {
    assert.equal(
      outcome.policyHash,
      policyHash,
      `${entry.report}: incomplete or mismatched policy evidence`,
    );
  }
  const recomputed = await makeReport(
    report.task,
    report.candidate.source,
    originalOutcomes,
    candidateOutcomes,
    report.candidate.provenance,
    report.runId,
  );
  for (const field of [
    'hashes',
    'original',
    'proposed',
    'executionIntegrity',
    'runtime',
    'challengesExcludedFromRepairPrompt',
  ]) {
    assert.deepEqual(report[field], recomputed[field], `${entry.report}: ${field}`);
  }
  assert.equal(report.executionIntegrity.comparisonConsistent, true);
  assert.equal(report.proposed.verdict, entry.verdict);
  assert.equal(report.proposed.rows.length, entry.cases);
  candidateCases += entry.cases;
}
assert.equal(candidateCases, 211);
console.log(
  `Audited 42 saved reports / ${candidateCases} candidate cases: fixture sources, expectations, hashes, outcomes, verdicts and runtime/policy consistency match. Unsigned local evidence is not third-party attestation.`,
);
