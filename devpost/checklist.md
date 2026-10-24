---
doc: checklist
status: approved
---
# Build Checklist

Build mode: fast, per explicit user instruction to code without routine stopping/pausing. The already displayed detailed build order is accepted by the start-coding instruction. Do not fabricate later user reviews.

## Slices
- [x] **1. Real original-versus-candidate evidence runs locally**
  Becomes usable: Load an owned fixture, execute real Python and see the inadequate candidate fail a challenge.
  Why now: Proves the kernel and the execution/CSP risk first.
  PRD ref: `prd.md > Execution and Verification`
  Spec ref: `spec.md > Runner`, `spec.md > Workbench`
  Build: Scaffold React, server, runner and core domain with explicit limits.
  Verify (mechanical): Build, unit/server checks, and real browser execution/isolation checks.
  Learner check: Open the fixture, run it, inspect the specific failing challenge. Await actual user feedback before recording this as performed.
  Commit: `Implement real browser Python verification loop`
- [x] **2. Editable tasks, cancellation, and evidence export work**
  Becomes usable: Edit inputs/candidate, rerun without stale evidence, and download the report.
  Why now: Makes the kernel usable for user-supplied supported functions.
  PRD ref: `prd.md > Task Input`, `prd.md > Evidence and Export`, `prd.md > Cancellation and Editing`
  Spec ref: `spec.md > Domain and Reports`
  Build: Validation, hashes, revision binding, timeout/cancellation and export.
  Verify (mechanical): Malformed inputs, incomplete verdicts, stale edits, export and browser journeys.
  Learner check: Edit a case, rerun, and inspect exported JSON.
  Commit: `Add editable cases cancellation and evidence reports`
- [x] **3. Live model repair adapter and honest failure handling exist**
  Becomes usable: A configured provider proposes a candidate; an unconfigured provider gives a useful error.
  Why now: Add model integration only after deterministic verification works.
  PRD ref: `prd.md > Candidate Repair`
  Spec ref: `spec.md > Model Proxy`
  Build: Bounded fixed-endpoint adapter, provenance, no-key mode, parser and request security tests.
  Verify (mechanical): Mocked adapter/error tests plus genuine live smoke test only if an authorized key becomes available. Do not tick complete while live behavior remains unverified.
  Learner check: Configure a key outside chat and request a non-confidential repair.
  Commit: `Add bounded model repair integration`
- [x] **4. Evaluation and release documentation are ready**
  Becomes usable: Reproducible fixtures, measured outcomes, truthful setup and limitations.
  Why now: Final evidence follows the working app.
  PRD ref: `prd.md > The Core Journey`
  Spec ref: `spec.md > Where It Runs and How Someone Tries It`
  Build: Browser/evaluation tests, runbook, notices and final fixes.
  Verify (mechanical): Clean build, test suites, saved actual results and privacy audit.
  Learner check: Explore the app and report issues; confirm readiness only after trying it.
  Commit: `Document tested application and evaluation limits`

## Hands-on Checkpoints
- [x] Entrant app exploration and visual feedback received; the original early checkpoint was completed in the final-review session rather than inventing a separate earlier review.
- [x] Final kick-the-tires feedback completed: entrant requested clearer labels/layout, then confirmed everything checks out after the verified 0.3.2 refinement.

## Final Review
- [x] 2026-10-24 visual-simplification implementation and mechanical check: plain verdict explanations, original/fix comparison, readable case previews with collapsed JSON editing, three-step guide and mobile table guidance. Passed 63 unit/server tests, 33 full-run browser checks, all 42 candidate comparisons / 211 candidate cases, saved-report audit and final-build UI review. Exact evidence and run boundaries: `docs/UI_REFINEMENT_2026-10-24.md`. No new real model call.
- [x] Entrant confirmed the simplified screen checks out and requested progression to the next task on October 24. This is user-reported readiness, separate from agent tests.
- [x] 2026-10-24 full local check: compact-safe large workspaces, client repair-result validation and exact prompt-input records. Passed 63 unit/server tests, 30 browser checks, all 42 candidate comparisons / 211 candidate cases, saved-report audit, TypeScript/build, actual CMD startup and mobile/offline-map checks. Full run `2026-10-23T23:27:37.600Z` (October 24 locally). No new real model request; test servers stopped. Mechanical item only; entrant review stays separate.
- [x] Feedback resolved and entrant confirms ready to move into shipping preparation. This is not authorization to publish, select a license, upload a video or submit an entry.
- [x] 0.3 release-quality pass: observed runtime consistency, cancellation-on-consent-revocation, reliable request limits, setup cleanup, result navigation and complete regression evidence. Mechanical verification only; final entrant review remains open.
- [x] Upgrade implementation/mechanical verification requested 2026-10-22: reliable prompt-exposure checks, server cancellation/output bounds, true source diff, clearer failures, portable workspaces, and regression verification. This does not mark entrant feedback/review complete.

## Code Tour and App Map
- [x] Evidence-based recap provided: expected answers precede execution; App.run freezes the task, domain assessment compares actual results, and EvidenceView explains them. Recorded as an agent recap, not a completed interactive code tour or proof of learning.
- [x] Optional reflection offered without requiring a response; no personal reflection was supplied or invented. No further learning exercise required under the saved concise/no-routine-questions preference.
- [x] App map generated, offline-tested and provided as a clickable reference. Opening its editor was queued; no claim is made that the entrant viewed the map or completed its source route.

The 0.3.2 reference map was rendered in Edge with JavaScript disabled and no HTTP requests. The final recap connects the actual incomplete-original-run finding to the stricter completion assertion and report audit: a green headline must match the complete evidence. Application readiness is now user-confirmed; the optional reference route remains a reference, not an invented interactive activity.

## Revisions
- 2026-10-24 public-release authorization: in direct response to the specific question about a public BugProof repository, included Git history and MIT license, the entrant authorized proceeding without more routine questions. This authorizes those technical publication steps, not invented narration, personal form answers or acceptance/submission on the entrant's behalf.
- 2026-10-24 shipping handoff: entrant explicitly confirmed everything checks out and directed continuation to the next task. Closed final app-review gates and supplied a concise recap/map reference. Keep public repository, license, video upload, entrant-authored copy and actual submission as separate shipping gates.
- 2026-10-24 visual feedback: entrant requested simpler presentation and clearer visual differences. Preserve verification, supported Python limits, explicit expectations, local-only execution and provider consent. Refine presentation only; do not add publication, storage or new model calls. This is actual feedback, not a completed final user review.
- 2026-10-24: User requested a full test/upgrade pass and authorized restarting the old BugProof server without further routine questions. Three concrete correctness/robustness gaps were identified: pretty-printing beyond editor limits, accepting malformed repair metadata, and incomplete recorded prompt inputs supporting an exclusion claim. Preserve all approved boundaries, add regressions, and record completed results in `docs/FULL_CHECK_2026-10-24.md`. No new provider request or publication is planned.
- 2026-10-22 acceptance audit: all approved core requirements mapped to current evidence in `docs/ACCEPTANCE_AUDIT.md`. Hardened the report auditor against duplicate/missing candidates and incorrect aggregate metadata; eight regressions added. The actual installer and complete Windows verification command passed after lockfile reinstallation: 55 unit/server tests and 26 browser checks, smoke timestamp `2026-10-22T18:05:34.682Z`. All 42 distinct expected reports pass the stronger audit. Application source unchanged; no new model request. Final hands-on feedback/sign-off remains genuinely missing and must not be replaced with further invented implementation work.
- 2026-10-22: 0.3 mechanical pass complete: 47 unit/server checks, 26 browser checks, 42 complete candidate comparisons and saved-evidence audit. Final browser timestamp: `2026-10-22T17:56:05.399Z`. The audit exposed one incomplete original run in an earlier evaluation; the browser assertion was tightened and a fresh full run passed. Actual CMD launch/health and offline reference-map rendering passed. See `docs/RELEASE_0_3.md`. No new model request, publication or user-review claim.
- 2026-10-22: User authorized a broad perfection/release-quality pass, with no more questions. Preserve the existing kernel/local-only boundary. Tighten observed runtime evidence and failure handling, restore setup process environment, and improve result navigation. No new model request is planned; the genuine 0.2 live evidence stays historical and unchanged.
- 2026-10-22: User configured a replacement key and explicitly confirmed Free Tier with billing off, then authorized a genuine sample test without further questions. One real browser/proxy/model request succeeded; the generated median passed 6/6 listed cases under matching policy hashes. Exact record: `docs/LIVE_SMOKE_2026-10-22.md`. This closes slice 3's mechanical integration gate, not the final human app-review gate.
- Upgrade verification completed: 41 unit/server checks; final 22 browser checks; 42-candidate full rerun; all saved report source/case/policy hashes audited. See `docs/UPGRADE_0_2.md` for separate run timestamps and the explicit test-only policy-response mutation. The runner's nested-helper loophole and lossy output conversion were closed without expanding Python permissions.
- 2026-10-22 upgrade authorization: entrant asked to improve/upgrade the existing project as much as feasible. Preserve the kernel, stack, memory-only default and local-only boundary; add bounded editing/evidence refinements without adding hosting, accounts, automatic storage or model billing. Live-provider/user-review gates remain open.
- 2026-10-22: Explicit instruction to code without routine pausing takes precedence over default per-checkpoint interview cadence. Mechanical completion does not imply that the entrant has performed a hands-on check. Those boxes stay open.
- The first integrated checkpoint includes the already verified implementations of slices 1 and 2, model-adapter code and evaluation tools. No earlier commits are fabricated. Slice 3 remains unchecked until a genuine authorized live model request succeeds; slice 4 remains unchecked pending final entrant review/release checks.
- Slice 1 verification: production build, domain/server tests and real browser execution/CSP checks pass. Slice 2 verification: editing, cancellation, malformed JSON, stale-result prevention and exported evidence pass. Full measured results are in `docs/IMPLEMENTATION_STATUS.md`.
- The npm helper failed on the local Windows launcher/path; direct use of the installed npm CLI succeeded. Startup/install scripts document that fallback without changing the stack.
- Browser tests initially sampled an intermediate original verdict. They now wait for both-version completion. The sorted fixture initially used an unsupported generator; it was corrected to a list comprehension rather than weakening the policy.
- Added an explicit AST depth limit and basis-bound challenge-exclusion evidence. These preserve the approved behavior and make incomplete/changed inputs harder to mistake for verified evidence.
