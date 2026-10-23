# Completion audit — local BugProof proof of concept

Historical October 22 snapshot. Version 0.3.1 subsequently changes application behavior to fix demonstrated edge cases; see `docs/FULL_CHECK_2026-10-24.md` for that separate full-check record. This document is not relabeled as a new user review or live-provider test.

Date: 2026-10-22. Requirements come from the approved `devpost/scope.md`, `prd.md`, `spec.md` and `checklist.md`, not from whichever tests happen to pass. Application source is the `59e3f6a` checkpoint; this follow-up changes the evidence auditor/tests and documentation only.

## Conclusion

The bounded local application has mechanical evidence for its approved core journey. The overall build workflow is **not signed off**: entrant hands-on feedback and the final readiness confirmation are absent. Automated checks cannot establish those facts. Publication, license selection and competition submission also remain unperformed and unauthorized; they are not silently folded into a coding instruction.

## Requirement-by-requirement evidence

| Requirement | Inspected evidence | Result and boundary |
| --- | --- | --- |
| PRD journey 1: choose an owned example or enter a function/name/contract/cases | `src/App.tsx`, `src/fixtures.mjs`, `src/domain.mjs`; domain and browser tests | Met for the declared bounded synchronous-function/JSON subset. Not arbitrary Python. |
| Task Input: bounded finite JSON, unique IDs, explicit expectations | `validateTask`, `validateCases`, `jsonValue`; domain/editing tests | Met for tested source, depth, size, duplicate, non-finite and tolerance cases. Expected answers are not generated from model output. |
| PRD journey 2: execute the original and inspect actual versus expected | `src/runner.ts`, `runner/frame.mjs`, `runner/worker.mjs`; saved original rows in all 42 reports | Real Pyodide execution; observed CPython 3.14.2 / Pyodide 314.0.7, not a simulated result. |
| PRD journey 3: genuine optional repair or clearly labeled pasted/reference candidate | `server/repair.mjs`, `src/App.tsx`; provider response-double tests; `artifacts/live/summary.json` and median evidence | One genuine integration request passed at 17:22 UTC on version 0.2. Current parser/error behavior has offline regressions. No new live request is claimed for 0.3. Teaching/reference/imported sources remain labeled separately. |
| Missing provider must be an honest error | Provider unit tests; browser no-key check | Met without a fallback candidate or real model call. |
| PRD journey 4: compare both versions against the same frozen suites | `run`, `makeReport`; report audit compares exact fixture task/source/cases and outcomes | Met for 42 complete comparisons. Evidence is invalidated by relevant edits. |
| Unique kernel: visible success must not conceal challenge failure | Full evaluation and median browser journey | 13 known faulty variants pass visible examples but fail the full suite. This demonstrates the mechanism, not a model error-rate estimate. |
| Independent challenges excluded from repair request | `repairPayload`, `prepareRepair`, basis hashes; provenance and server tests | Payload exclusion and unchanged-basis checks are covered. Owner-visible cases are not secret; canonical overlap checks do not prove statistical independence. |
| No passing comparison on partial, changed-policy or changed-runtime evidence | `makeReport`; domain tests and controlled browser response mutations | Met in covered cases. Both complete policy/runtime records are required; unsigned metadata is not remote attestation. |
| Cancellation, timeouts and stale-response prevention | App/bridge/frame code; manual cancel, long-computation watchdog, edit-during-run browser checks | Covered without awarding a new passing verdict. No portable hard worker-RAM quota is claimed. |
| Provider consent and cancellation | App repair operation state; intercepted pending-request browser check; upstream abort tests | Consent revocation aborts a pending repair. It cannot retract data already sent or undo provider work. |
| PRD journey 5: diff, suite counts, outcomes, provenance, limitations and explicit evidence export | `EvidenceView`, line-diff tests, actual downloaded browser reports | Covered. Filters do not change the full verdict; a pass means listed tests only. |
| Explicit workspace save/open; memory-only default | `src/workspace.mjs`, App import/export; roundtrip and browser checks | Covered. Import does not execute code, call a provider or restore trusted model provenance. Invalid imports preserve work. |
| Supported-code execution stays off the host and away from app credentials | Static allowlists/CSP; AST policy; actual worker network and frame DOM rejection checks | Defense-in-depth controls verified in covered cases, not a hardened hostile-code sandbox certification. No host Python fallback exists. |
| Model proxy bounded payload/rate/reply/deadline; no retry or paid fallback | `server/main.mjs`, `server/body.mjs`, `server/repair.mjs`; HTTP/parser/abort tests | Covered with explicit test doubles. Request limits are not account-wide monetary caps. |
| Responsive workbench, usable status/error/result navigation | Current 26-check browser journey, 390px screenshots, focus and results-link assertions | Covered at the tested desktop/mobile sizes. Not a comprehensive accessibility certification. |
| All expected evaluation candidates, not just a count of rows | `tests/audit-evidence.mjs`, eight `evaluation-index` regression tests | Auditor now rejects duplicates, missing/unknown variants, incorrect paths, labels, verdicts and case counts; cross-checks aggregate suite statistics against report rows. |
| Run/install/verification instructions and release evidence | README, runbook, lockfile, launch/install/verify scripts; actual Windows command runs | Installation and verification are exercised on this Windows/Node 24 machine. Cross-platform setup is not claimed. See command record below. |
| Private key/profile excluded; no unrelated project changes | Ignore rules, tracked/staged-file and credential-value checks; scoped Git diff | Checked before committing. Ignore rules do not erase history. Existing trading projects remain outside this project. |
| Final entrant exploration, feedback and readiness sign-off | Unchecked hands-on and final-review items in `devpost/checklist.md` | **Missing.** No agent test or generic instruction is substituted for actual user review. |
| Learning/reference map | `devpost/app-map.html`, offline no-JavaScript render record, prepared source route | Map and evidence-based recap exist; an interactive entrant walkthrough/reflection is not claimed. |
| Publication, ownership/license choice, video, entrant-written submission and contest entry | No performed/authorized external release actions | **Not done.** These need entrant participation/authorization; no public submission prose or legal choice is invented. |

## Command record

- `powershell.exe -NoProfile -File install-local.ps1`: passed, lockfile-based installation completed with 28 applicable packages; installer cache/temp stayed under the project and extra Playwright browser downloading was disabled.
- `node --test --test-concurrency=1 tests/*.test.mjs`: 55 tests passed after the audit-coverage changes.
- `node tests/audit-evidence.mjs`: passed against the current 42 distinct expected reports / 211 candidate checks, using exact sources, cases and current harness hash.
- Strict TypeScript and Vite build passed; generated application bundle names remained `index-CZeW90oM.css` / `index-C6hjt2X3.js`, consistent with no application changes in this follow-up.
- `powershell.exe -NoProfile -File verify-local.ps1`: passed after installation, including strict TypeScript, production build, all 55 unit/server checks and all 26 real-browser checks. The new smoke summary completed at `2026-10-22T18:05:34.682Z`. No live model request was made.
- The last full 42-candidate run remains `artifacts/browser-results.json`, timestamp `2026-10-22T17:56:05.399Z`. Smaller runs use `artifacts/browser-smoke-results.json` and cannot replace it.
- Actual CMD launcher startup/health, offline reference-map rendering and the zero-known-advisory dependency snapshot are recorded in `docs/RELEASE_0_3.md`.

## Next action

Run `F:\BugProof\start-local.cmd` and open `http://127.0.0.1:4100`. In the median example, **Verify both versions** should show the inadequate candidate passing visible examples but failing challenges. **Load reference candidate**, then verify again, should pass all six listed checks. Edit an input and confirm the old evidence disappears. These are user review steps, not a record that the user has performed them.

Under the saved build skill/checklist, final workflow completion waits for that actual review and feedback. No more implementation should be invented solely to avoid this remaining gate.
