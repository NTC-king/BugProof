import test from 'node:test';
import assert from 'node:assert/strict';
import { fixtures } from '../src/fixtures.mjs';
import { validateTask, validateRepairResult } from '../src/domain.mjs';
import { workspaceDocument, parseWorkspace, WORKSPACE_LIMIT } from '../src/workspace.mjs';
import { CASE_TEXT_LIMIT, parseCaseText, formatCaseText } from '../src/case-text.mjs';

const largeCases = () =>
  Array.from({ length: 32 }, (_, index) => ({
    id: `large_${index}`,
    args: [Array(200).fill(1000000000)],
    expect: { kind: 'value', value: 1000000000 },
  }));

test('workspace import and formatting keep large valid suites usable without dropping data', () => {
  const task = validateTask({ ...fixtures[0], examples: largeCases(), challenges: [] });
  assert.ok(Buffer.byteLength(JSON.stringify(task.examples, null, 2)) > CASE_TEXT_LIMIT);
  const document = workspaceDocument(task, fixtures[0].correct);
  const loaded = parseWorkspace(JSON.stringify(document));
  const formatted = formatCaseText(loaded.task.examples);
  assert.equal(formatted.compact, true);
  assert.ok(Buffer.byteLength(formatted.text) <= CASE_TEXT_LIMIT);
  assert.deepEqual(parseCaseText(formatted.text), task.examples);
  assert.deepEqual(formatCaseText(parseCaseText(formatted.text)), formatted);
});

test('workspace with an unrepresentable normalized suite is rejected rather than loaded unusably', () => {
  const data = {
    format: 'bugproof-workspace',
    version: 1,
    candidate: fixtures[0].correct,
    task: {
      ...fixtures[0],
      examples: Array.from({ length: 16 }, (_, i) => ({
        id: `wide_${i}`,
        args: ['x'.repeat(3000), 'y'.repeat(3000), 'z'.repeat(3000)],
        expect: { kind: 'value', value: 0 },
      })),
      challenges: [],
    },
  };
  const text = JSON.stringify(data);
  assert.ok(Buffer.byteLength(text) < WORKSPACE_LIMIT);
  assert.throws(() => parseWorkspace(text), /editor's 128 KiB limit/);
});

test('case text uses UTF-8 limits, preserves normal indentation and rejects invalid JSON/shape', () => {
  const normal = [{ id: 'one', args: [], expect: { kind: 'value', value: 1 } }];
  const result = formatCaseText(normal);
  assert.equal(result.compact, false);
  assert.match(result.text, /\n/);
  assert.deepEqual(parseCaseText(result.text), normal);
  assert.throws(() => formatCaseText({}), /array/);
  assert.throws(() => parseCaseText('['), /invalid JSON/);
  assert.throws(() => parseCaseText(JSON.stringify(['界'.repeat(50000)])), /128 KiB/);
});

function validRepair() {
  return {
    source: fixtures[0].correct,
    explanation: 'Explicit unit response double.',
    provenance: {
      kind: 'live_model',
      model: 'unit-test-model',
      generatedAt: '2026-10-24T10:00:00.000Z',
      usage: null,
      challengeExposure: 'excluded_from_request',
      basis: {
        sourceHash: 'a'.repeat(64),
        candidateHash: 'b'.repeat(64),
        contractHash: 'c'.repeat(64),
        examplesHash: 'd'.repeat(64),
        promptInputHashes: ['e'.repeat(64)],
      },
    },
  };
}

test('repair UI boundary accepts a complete response without sharing mutable references', () => {
  const data = validRepair();
  const accepted = validateRepairResult(data);
  assert.deepEqual(accepted, data);
  data.provenance.model = 'changed';
  assert.equal(accepted.provenance.model, 'unit-test-model');
});

test('repair UI boundary rejects missing or malformed metadata before changing the candidate', () => {
  const malformed = [
    { source: fixtures[0].correct },
    { ...validRepair(), explanation: {} },
    { ...validRepair(), provenance: null },
  ];
  for (const mutate of [
    (p) => {
      p.kind = 'teaching_fixture';
    },
    (p) => {
      p.model = 'bad/model';
    },
    (p) => {
      p.generatedAt = 'not-a-date';
    },
    (p) => {
      p.basis.candidateHash = 'not-a-hash';
    },
    (p) => {
      p.basis.promptInputHashes = [];
    },
    (p) => {
      p.usage = { totalTokenCount: -1 };
    },
  ]) {
    const data = validRepair();
    mutate(data.provenance);
    malformed.push(data);
  }
  for (const data of malformed)
    assert.throws(() => validateRepairResult(data), /invalid candidate metadata/);
});
