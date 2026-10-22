import test from 'node:test';
import assert from 'node:assert/strict';
import { fixtures } from '../src/fixtures.mjs';
import { hash, makeReport, validateTask } from '../src/domain.mjs';
async function provenance(t) { return { kind: 'live_model', basis: { sourceHash: await hash(t.source), contractHash: await hash(t.contract), examplesHash: await hash(t.examples), promptCaseHashes: await Promise.all(t.examples.map(c => hash({ args: c.args, kwargs: c.kwargs, expect: c.expect }))) } }; }
test('unchanged live repair basis supports the recorded challenge exclusion claim', async () => { const t = validateTask(fixtures[0]); const r = await makeReport(t, fixtures[0].correct, [], [], await provenance(t), 'test'); assert.equal(r.challengesExcludedFromRepairPrompt, true); });
test('changed contract invalidates prompt independence claim', async () => { const t = validateTask(fixtures[0]); const p = await provenance(t); const r = await makeReport({ ...t, contract: t.contract + ' Changed.' }, fixtures[0].correct, [], [], p, 'test'); assert.equal(r.challengesExcludedFromRepairPrompt, false); });
test('a challenge duplicating a visible example cannot be claimed independent', async () => { const t = validateTask(fixtures[0]); const p = await provenance(t); const r = await makeReport({ ...t, challenges: [{ ...t.examples[0], id: 'duplicate_content' }] }, fixtures[0].correct, [], [], p, 'test'); assert.equal(r.challengesExcludedFromRepairPrompt, false); });
test('unrecorded live provenance is unknown rather than asserted', async () => { const t = validateTask(fixtures[0]); const r = await makeReport(t, fixtures[0].correct, [], [], { kind: 'live_model' }, 'test'); assert.equal(r.challengesExcludedFromRepairPrompt, false); });
