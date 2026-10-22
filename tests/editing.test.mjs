import test from 'node:test';
import assert from 'node:assert/strict';
import { fixtures } from '../src/fixtures.mjs';
import { lineDiff } from '../src/diff.mjs';
import { workspaceDocument, parseWorkspace } from '../src/workspace.mjs';
import { assess, verdict, repairPayload, validateTask, hash, makeReport } from '../src/domain.mjs';

test('true line diff reconstructs both versions including moved/repeated lines', () => {
  const before = 'one\ntwo\none\nthree',
    after = 'two\none\nthree\none';
  const diff = lineDiff(before, after);
  assert.equal(diff.limited, false);
  assert.equal(
    diff.rows
      .filter((r) => r.kind !== 'added')
      .map((r) => r.text)
      .join('\n'),
    before,
  );
  assert.equal(
    diff.rows
      .filter((r) => r.kind !== 'removed')
      .map((r) => r.text)
      .join('\n'),
    after,
  );
  assert.ok(diff.rows.some((r) => r.kind === 'removed'));
  assert.ok(diff.rows.some((r) => r.kind === 'added'));
});
test('large line diff is bounded rather than using an unbounded matrix', () => {
  assert.equal(lineDiff('\n'.repeat(401), 'one').limited, true);
});
test('workspace roundtrip retains task/candidate but no reports or model provenance', () => {
  const document = workspaceDocument(fixtures[0], fixtures[0].correct);
  assert.deepEqual(parseWorkspace(JSON.stringify(document)), document);
  assert.equal(Object.hasOwn(document, 'provenance'), false);
  assert.equal(Object.hasOwn(document, 'report'), false);
});
test('workspace rejects oversized malformed foreign or forged data', () => {
  for (const text of [
    '{',
    'x'.repeat(262145),
    JSON.stringify({ format: 'report', version: 1 }),
    JSON.stringify({
      ...workspaceDocument(fixtures[0], fixtures[0].correct),
      provenance: { kind: 'live_model' },
    }),
  ])
    assert.throws(() => parseWorkspace(text));
});
test('unvalidated return data cannot become a passing verdict', () => {
  const t = validateTask(fixtures[0]);
  for (const value of [undefined, Infinity, { constructor: 1 }, Array(201).fill(0)]) {
    const rows = assess([t.examples[0]], [{ caseId: t.examples[0].id, status: 'returned', value }]);
    assert.equal(verdict(rows), 'inconclusive');
  }
});
test('repair payload strips unexpected expectation metadata', () => {
  const f = structuredClone(fixtures[0]);
  f.examples[0].expect.privateMetadata = 'should not reach provider';
  assert.equal(JSON.stringify(repairPayload(f)).includes('privateMetadata'), false);
});
test('canonical hashing preserves array order but ignores object key order', async () => {
  assert.equal(await hash({ a: 1, b: 2 }), await hash({ b: 2, a: 1 }));
  assert.notEqual(await hash([1, 2]), await hash([2, 1]));
});

test('matching expected outputs cannot pass a comparison with changed or missing policy evidence', async () => {
  const t = validateTask(fixtures[0]);
  const outcomes = [...t.examples, ...t.challenges].map((c) => ({
    caseId: c.id,
    policyHash: 'a'.repeat(64),
    ...(c.expect.kind === 'raises'
      ? { status: 'raised', exceptionType: c.expect.type }
      : { status: 'returned', value: c.expect.value }),
  }));
  const valid = await makeReport(
    t,
    fixtures[0].correct,
    outcomes,
    outcomes,
    { kind: 'teaching_fixture' },
    'unit-test',
  );
  assert.equal(valid.proposed.verdict, 'pass_on_listed_tests');
  for (const policyHash of ['b'.repeat(64), undefined]) {
    const invalid = await makeReport(
      t,
      fixtures[0].correct,
      outcomes,
      outcomes.map((o) => ({ ...o, policyHash })),
      { kind: 'teaching_fixture' },
      'unit-test',
    );
    assert.equal(invalid.proposed.verdict, 'inconclusive');
    assert.equal(invalid.executionIntegrity.policyConsistent, false);
  }
});
