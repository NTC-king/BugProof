# Local release-quality pass — 0.3

Date: 2026-10-22. Based on local checkpoint `a129c44`; no deployment, public repository or submission was performed. No new provider request or billing change was made during this pass. The genuine 0.2 live-model artifacts remain unchanged.

## Changes

- Schema-3 evidence records the actual worker's Python version, implementation and Pyodide version. A passing comparison requires complete, matching policy and runtime records for both versions and the pinned Pyodide version.
- Revoking provider consent cancels a pending repair, without cancelling local verification. Cancellation cannot retract previously sent data or undo provider work.
- Oversized repair bodies now produce controlled HTTP 413 errors for both Content-Length and chunked requests. Header/request timeouts and shutdown cleanup are explicit.
- Truncated, blocked and malformed provider responses produce controlled errors; thought text is not treated as candidate output. No retries or paid fallback were added.
- Errors receive focus, results have a jump link, and stale elapsed time is hidden after invalidating evidence.
- The installer restores its temporary process environment on success and failure. Startup/install check Node 24+. Command Prompt has `start-local.cmd`.
- Unit-test files run sequentially to reduce peak memory. `tests/audit-evidence.mjs` recomputes the saved fixture sources, cases, hashes, outcomes, verdicts and policy/runtime consistency. `verify-local.ps1 -Evaluate` includes it.

## Failures found during verification

1. This Windows machine was low on available memory during a parallel unit run and normal type-check attempt; Node reported allocation failures. The guard test passed when repeated alone. Sequential unit tests and a constrained-memory type-check then passed; the final Command Prompt launcher also completed the ordinary type-check/build successfully. No unrelated processes were killed or machine-wide settings changed.
2. Windows PowerShell 5 removed quotes inside a Node `-p` version expression when launched from Command Prompt. Version checks now parse `node --version`; the actual CMD launcher subsequently rebuilt and started both local listeners, and health was checked.
3. The evaluation ending at `2026-10-22T17:49:38.465Z` reached all expected candidate verdicts, but the new evidence audit rejected it: `clamp/teaching_mutant` had an original-version runtime fetch failure. That is not a clean complete comparison. The browser evaluation now explicitly requires `comparisonConsistent === true` for every saved variant, not merely an expected candidate headline. A new full run is required before release verification is recorded as complete.

## Verification record

Completed already: 47 unit/server checks, strict TypeScript, production build, actual Command Prompt startup/health, formatting, and `npm audit` with zero known advisories. Installer environment restoration was exercised with synthetic success and failure; dependencies were not reinstalled unnecessarily. The audit is a point-in-time dependency check, not a security certification.

Final strict browser evaluation completed at **2026-10-22T17:56:05.399Z**, using Edge 155.0.4283.62: **26 browser checks passed**, with **42 complete candidate comparisons across 12 tasks**. All **30 deliberately faulty variants were rejected** and all **12 references passed their listed tests**, covering **211 candidate case checks**. Thirteen faulty variants passed visible examples but not the full suite. The subsequent saved-evidence audit passed for all 42 reports, including exact fixture sources/expectations, recomputed hashes/verdicts, the current harness hash, and complete matching runtime metadata. Observed runtime: Pyodide 314.0.7 / CPython 3.14.2.

Evidence: `artifacts/browser-results.json` and `artifacts/evaluation/`. The desktop/390px screenshots were inspected; the populated mobile layout has no horizontal page overflow. The updated reference map rendered offline with JavaScript disabled and zero HTTP requests; its app-panel opening was queued, not claimed as human review. Test-owned app/runner listeners were confirmed stopped after teardown. Historical live integration remains in `docs/LIVE_SMOKE_2026-10-22.md`; it is not relabeled as a 0.3 live test.

## Remaining boundaries

Listed-case success is not a correctness proof or model-accuracy benchmark. Runtime metadata and hashes are unsigned local evidence, not remote attestation. The browser has no portable hard worker-memory quota, and this is not a hardened hostile-code service. Entrant hands-on review, ownership/license selection, entrant-written submission materials and explicit publishing/submission authorization remain open. No hands-on learning reflection is invented.
