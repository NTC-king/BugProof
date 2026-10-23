# Full local check — 2026-10-24

Historical 0.3.1 record. The latest aggregate browser/evaluation artifacts have since been refreshed for 0.3.2; see `docs/UI_REFINEMENT_2026-10-24.md` for that run and the visual-feedback changes. The counts/timestamp below describe the earlier 0.3.1 run, not a second copy of the latest evidence.

Version: 0.3.1, based on checkpoint `8f13a6c`. User requested a full check and concrete upgrades where needed. Scope, stack, local-only execution and the Python policy were preserved. No publication, billing change or new real model request is part of this pass.

## Problems found and fixed

1. **Valid workspaces could become unusable after import/formatting.** A 74,995-byte valid workspace expanded its example editor to 134,584 bytes, beyond the editor's 131,072-byte limit. Import was accepted, but subsequent execution rejected the editor text. Case formatting now prefers readable indentation and falls back to compact JSON only when needed. It never drops cases. A workspace whose normalized suite cannot fit even compactly is rejected before changing the current work.
2. **Malformed repair metadata was not checked before changing UI state.** The client validated candidate source but immediately accepted provenance/explanation fields; a missing provenance object could cause a render error. The new UI boundary checks the complete expected response shape and clones accepted data before updating the candidate. Rejection preserves the existing source/provenance and creates no verdict. Browser response doubles test both rejection and valid acceptance without an actual provider request.
3. **Incomplete prompt-input records could support an incorrect exclusion claim.** A controlled domain probe supplied matching basis hashes but an empty recorded input-hash list and a challenge identical to a visible example. Version 0.3.0 reported exclusion as supported. The report now requires the recorded prompt-input list to match every current visible input exactly and tests overlap against the derived visible-input list. Empty, incomplete and incorrect lists have regression checks.

## Verification

- Baseline: 55 unit/server tests, strict TypeScript and production build passed before changes.
- Updated unit/server suite: 63 checks passed, including compact-format/import, repair-response contract and prompt-record regressions.
- Strict TypeScript and production build passed for 0.3.1. No dependency version was changed or added.
- `npm audit` reported zero known advisories across the lockfile on this check. This is a point-in-time advisory snapshot, not a security certification.
- A first browser attempt correctly refused to reuse an old 0.3.0 server. The user authorized its restart; only the identified local BugProof listener was stopped. A test-owned 0.3.1 server was used for the fresh browser/full-fixture run.
- The first new response-boundary browser check stopped on a case-sensitive assertion against a CSS-uppercase provenance label. The assertion was made case-insensitive; application logic/expectations were not loosened. That stopped attempt is not a completed browser run.
- The completed full run passed **30 browser checks and all 42 candidate comparisons**, with **211 candidate case checks**. All 30 deliberately faulty variants were rejected; all 12 reference fixes passed their listed cases. Thirteen faulty variants passed the visible examples but failed the complete listed suite. The added large-workspace check separately executed all 32 original cases without loss.
- Full-run timestamp: `2026-10-23T23:27:37.600Z`, which is **October 24 at 01:27:37 CEST** locally. Current evidence is `artifacts/browser-results.json` and the 42 reports in `artifacts/evaluation/`. The older smoke-only artifact remains a historical October 22 record.
- `node tests/audit-evidence.mjs` passed: exactly 42 distinct expected candidates, complete original/candidate outcomes, correct aggregate counts, source/basis hashes and consistent runtime/policy evidence.
- The actual Windows Command Prompt launcher rebuilt and started version 0.3.1 successfully. Its health response confirmed the configured key was available, without printing it or requesting a repair. No real model request was made anywhere in this pass; provider response doubles are not genuine AI evidence.
- A fresh 390-by-844 mobile check passed: no horizontal overflow or page errors, working original/candidate verification, visible keyboard skip-link focus, and zero repair requests. Desktop/mobile screenshots were visually inspected. The app map also rendered with JavaScript disabled and no HTTP requests; opening its tab was queued, not a claim that the entrant viewed it.
- Both browser-owned and final launcher-owned servers were stopped. No listeners remained on ports 4100/4101 after teardown. Formatting checks passed.
- The staged privacy audit passed: the configured credential was absent from the diff; `.env` and the private learner profile remained untracked; no cache, private or historical live-model artifacts were staged. Nothing was pushed or published.

## Interpretation and remaining gates

The full fixture set consists of 12 public hand-authored tasks / 42 candidates, not held-out live-model samples. The genuine 0.2 integration evidence under `artifacts/live/` remains unchanged and is not relabeled as a 0.3.1 provider run. Candidate Python still never executes on the host, and the AST policy is unchanged; browser memory exhaustion and interpreter vulnerabilities are not eliminated. Passing listed cases is not a proof of correctness.

Entrant hands-on review, final public naming/licensing, entrant-written submission material and authorization to publish/submit remain separate gates. Agent tests do not fabricate any of them.
