import test from 'node:test';
import assert from 'node:assert/strict';
import { fixtures } from '../src/fixtures.mjs';
import { validateEvaluationIndex } from './audit-evidence.mjs';

function completeIndex() {
  return fixtures.flatMap((fixture) =>
    [
      'original_mutant',
      'teaching_mutant',
      ...(fixture.extraMutants ?? []).map((_, index) => `extra_mutant_${index + 1}`),
      'reference',
    ].map((variant) => ({
      fixture: fixture.id,
      variant,
      report: `artifacts/evaluation/${fixture.id}-${variant}.json`,
      expectedCorrect: variant === 'reference',
      verdict: variant === 'reference' ? 'pass_on_listed_tests' : 'failed',
      cases: fixture.examples.length + fixture.challenges.length,
    })),
  );
}

test('evaluation index covers every distinct fixture/candidate exactly once', () => {
  const entries = completeIndex();
  assert.equal(entries.length, 42);
  assert.doesNotThrow(() => validateEvaluationIndex(entries));
});

for (const [name, mutate, message] of [
  [
    'duplicate replacing a candidate',
    (rows) => {
      rows[1] = { ...rows[0] };
    },
    /Duplicate/,
  ],
  [
    'missing candidate',
    (rows) => {
      rows.pop();
    },
    /missing/,
  ],
  [
    'unknown variant',
    (rows) => {
      rows[0].variant = 'unknown';
    },
    /Unexpected/,
  ],
  [
    'wrong report path',
    (rows) => {
      rows[0].report = rows[1].report;
    },
    /incorrect report/,
  ],
  [
    'false correctness label',
    (rows) => {
      rows[0].expectedCorrect = true;
    },
    /incorrect expectedCorrect/,
  ],
  [
    'wrong verdict',
    (rows) => {
      rows[0].verdict = 'pass_on_listed_tests';
    },
    /incorrect verdict/,
  ],
  [
    'wrong case count',
    (rows) => {
      rows[0].cases++;
    },
    /incorrect cases/,
  ],
]) {
  test(`evaluation index rejects ${name}`, () => {
    const entries = completeIndex();
    mutate(entries);
    assert.throws(() => validateEvaluationIndex(entries), message);
  });
}
