import test from 'node:test';
import assert from 'node:assert/strict';
import { fixtures } from '../src/fixtures.mjs';
import { hash, makeReport, validateTask, repairPayload, caseInputHash } from '../src/domain.mjs';
async function provenance(t) {
  return {
    kind: 'live_model',
    basis: {
      sourceHash: await hash(t.source),
      candidateHash: await hash(fixtures[0].correct),
      contractHash: await hash(t.contract),
      examplesHash: await hash(repairPayload(t).examples),
      promptInputHashes: await Promise.all(t.examples.map(caseInputHash)),
    },
  };
}
test('unchanged live repair basis supports the recorded challenge exclusion claim', async () => {
  const t = validateTask(fixtures[0]);
  const r = await makeReport(t, fixtures[0].correct, [], [], await provenance(t), 'test');
  assert.equal(r.challengesExcludedFromRepairPrompt, true);
});
test('changed contract invalidates prompt independence claim', async () => {
  const t = validateTask(fixtures[0]);
  const p = await provenance(t);
  const r = await makeReport(
    { ...t, contract: t.contract + ' Changed.' },
    fixtures[0].correct,
    [],
    [],
    p,
    'test',
  );
  assert.equal(r.challengesExcludedFromRepairPrompt, false);
});
test('a challenge duplicating a visible example cannot be claimed independent', async () => {
  const t = validateTask(fixtures[0]);
  const p = await provenance(t);
  const r = await makeReport(
    { ...t, challenges: [{ ...t.examples[0], id: 'duplicate_content' }] },
    fixtures[0].correct,
    [],
    [],
    p,
    'test',
  );
  assert.equal(r.challengesExcludedFromRepairPrompt, false);
});
test('unrecorded live provenance is unknown rather than asserted', async () => {
  const t = validateTask(fixtures[0]);
  const r = await makeReport(t, fixtures[0].correct, [], [], { kind: 'live_model' }, 'test');
  assert.equal(r.challengesExcludedFromRepairPrompt, false);
});

test('changing candidate source invalidates live provenance basis', async () => {
  const t = validateTask(fixtures[0]);
  const r = await makeReport(t, fixtures[0].inadequate, [], [], await provenance(t), 'test');
  assert.equal(r.challengesExcludedFromRepairPrompt, false);
});

test('input overlap ignores object key order and changed expected answer', async () => {
  const t = validateTask({
    ...fixtures[0],
    examples: [{ id: 'e', args: [{ a: 1, b: 2 }], expect: { kind: 'value', value: 1 } }],
    challenges: [{ id: 'c', args: [{ b: 2, a: 1 }], expect: { kind: 'value', value: 2 } }],
  });
  const r = await makeReport(t, fixtures[0].correct, [], [], await provenance(t), 'test');
  assert.equal(r.challengesExcludedFromRepairPrompt, false);
});

test('no challenges does not earn an independence claim', async () => {
  const t = validateTask({ ...fixtures[0], challenges: [] });
  const r = await makeReport(t, fixtures[0].correct, [], [], await provenance(t), 'test');
  assert.equal(r.challengesExcludedFromRepairPrompt, false);
});

for (const [name, hashes] of [
  ['empty', []],
  ['incomplete', ['a'.repeat(64)]],
  ['incorrect', ['b'.repeat(64), 'c'.repeat(64)]],
]) {
  test(`${name} recorded prompt inputs cannot support an exclusion claim`, async () => {
    const t = validateTask({
      ...fixtures[0],
      challenges: [{ ...fixtures[0].examples[0], id: 'overlap' }],
    });
    const p = await provenance(t);
    p.basis.promptInputHashes = hashes;
    const r = await makeReport(t, fixtures[0].correct, [], [], p, 'test');
    assert.equal(r.challengesExcludedFromRepairPrompt, false);
  });
}
