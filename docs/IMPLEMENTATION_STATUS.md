# Measured implementation status

Date: 2026-10-24. Local proof of concept; not submitted or published.

**Current 0.3.2 interface:** simpler verdicts, distinct original/fix editors and result cards, readable case previews with collapsed JSON editing, and a three-step guide. Passed 63 unit/server tests, 33 browser checks, all 42 candidate comparisons / 211 candidate cases and the saved-report audit. Final-build keyboard, malformed/deep-preview, desktop/mobile and offline-map review passed with zero page errors and zero repair attempts. See `docs/UI_REFINEMENT_2026-10-24.md`. The configured local app was restored for use; final entrant retry/sign-off remains open.

**Previous 0.3.1 full check:** 63 unit/server tests, 30 browser checks, strict TypeScript, production build and actual Windows CMD startup passed. All 42 candidate comparisons (211 candidate cases) and the saved-report audit passed: 30 faulty variants rejected and 12 references passing listed cases. Fixed large-workspace editor bounds, malformed repair-response acceptance and incomplete prompt-input exclusion evidence. No new real model request; test servers stopped. See `docs/FULL_CHECK_2026-10-24.md` for exact timestamps, failed attempts, privacy checks and limits. The October 22 records below are historical.

## What works

The local UI runs the original and candidate through real browser Python, compares actual results with explicit expectations, separates visible examples from challenges, and exports a revision-bound JSON report. Input changes invalidate old evidence; cancellation and timeouts cannot create a passing verdict. Genuine model integration is now verified on one median fixture; see `docs/LIVE_SMOKE_2026-10-22.md` for the actual request, token counts, 6/6 result and limits.

## Completed checks

The earlier release-quality pass was version 0.3, with schema-3 observed runtime evidence, consent-revocation cancellation, bounded request handling, setup cleanup and result navigation. See `docs/RELEASE_0_3.md` for that verification record, including failures found during testing. The 0.1, 0.2 and October 22 results below are historical, not the current release label.

**0.3 quality checkpoint (`59e3f6a`):** 47 unit/server checks pass; strict TypeScript, production build and actual Command Prompt startup/health pass. The strict browser evaluation completed at `2026-10-22T17:56:05.399Z`: 26 browser checks, 42 complete candidate comparisons, 211 candidate case checks, all 30 known faulty variants rejected and all 12 references passing listed cases. The saved-report audit passed. No new live model request was made. Runtime observed: Pyodide 314.0.7 / CPython 3.14.2. A prior partial-original run was rejected by the audit and is documented in the release record.

**Acceptance-audit follow-up:** the index auditor now enforces exactly-once coverage of the complete fixture/variant set and correct aggregate metadata. Eight new regression checks bring the suite to **55 passing tests**. The actual Windows installer and full `verify-local.ps1` command passed after lockfile reinstallation, including a fresh 26-check browser smoke run completed at `2026-10-22T18:05:34.682Z`. Application source/bundle content was unchanged. `docs/ACCEPTANCE_AUDIT.md` maps the approved requirements to actual evidence and leaves entrant review/sign-off open.

The initial results below are the historical 0.1 baseline. **Historical 0.2:** production build and 43 unit/server tests pass; the 22-check browser run passed at 2026-10-22T16:57:05.459Z. Full 42-candidate rerun completed at 16:54:53 UTC with all 30 faulty variants rejected and all 12 references passing their listed cases. A separate genuine model request completed at 17:22:28 UTC, and its generated candidate passed all 6 listed median cases. See `docs/UPGRADE_0_2.md` and `docs/LIVE_SMOKE_2026-10-22.md` for exact evidence and limitations.

- Strict TypeScript check and Vite production build: passed.
- Documented Windows launcher `start-local.ps1`: executed successfully after stopping the owned development server; rebuilt and started both local listeners. Health endpoint checked after startup.
- Node unit/server tests: 25 passed, 0 failed. Provider tests explicitly use response doubles.
- Actual Edge 155.0.4283.62 browser run completed at **2026-10-22T14:43:46.475Z**: 14 checks passed, including separate-origin DOM isolation, worker CSP network blocking, supported-code rejection, watchdog/cancellation, stale edit protection, export consistency, missing-key handling and 390px layout overflow.
- Evaluation: **12 self-authored tasks, 42 candidates, 211 candidate case checks**. All **30 deliberately faulty variants** failed declared checks; all **12 hand-authored references** passed their listed cases.
- **13 of the 30 faulty variants passed the visible examples** but were rejected by the complete listed suite. This illustrates the app's intended distinction. It is not a statistical estimate of live AI error rates.
- `npm audit --omit=dev`: zero known production dependency advisories at the implementation check. This is not a security certification.

Evidence: `artifacts/browser-results.json` and the 42 reports under `artifacts/evaluation/`. Sources, expectations, actual outcomes and runtime/policy hashes are included. They are unsigned development evidence; an editable local report is not third-party attestation. Initial reports identify the source revision as `working-tree`; a later Git checkpoint does not retroactively turn them into commit-bound results.

## Problems found and corrected

1. Browser test completion race: an intermediate original verdict could be read before the candidate finished. The test now waits for the run to finish.
2. Sorted-list fixture used a generator expression outside the declared subset. Replaced it with a supported list comprehension; policy was not relaxed.
3. Custom-Host boundary test used a fetch behavior that did not exercise its intended header. It now uses Node HTTP directly; server Host validation was retained.
4. Added explicit syntax-depth blocking, reset/edit invalidation checks, and challenge-exposure basis tests. Regression suite and full fixture evaluation passed afterward.

## Remaining gates

- Ongoing account/quota/data-handling checks for future live use. The first genuine model smoke test passed after user-confirmed Free Tier/billing-off status; no billing/account settings were changed. A successful request does not independently audit an account's billing configuration.
- Entrant hands-on review and actual feedback. Agent tests do not substitute for user review.
- Learning wrap-up/app-map walkthrough, without inventing a learner reflection.
- Public licensing/ownership review and explicit publication authorization. Dependency/upstream notices are retained; a project license is not selected automatically.
- Entrant-written submission details/narration, accessible demo video, public repository and actual contest submission. None has been performed.

## Limits

Only a bounded Python subset and finite JSON inputs/outputs are supported. No arbitrary repositories, packages, files, network access, recursion or host execution. This is local opt-in code execution, not an adversarial multi-tenant sandbox. A browser memory limit is not enforced; resource-exhaustion risk remains. A pass means only the listed cases passed, not that a function is universally correct. These public, hand-authored development fixtures are not a held-out benchmark and do not show that a model fixes bugs reliably or that a competition prize is likely.
