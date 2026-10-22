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
- [ ] **3. Live model repair adapter and honest failure handling exist**
  Becomes usable: A configured provider proposes a candidate; an unconfigured provider gives a useful error.
  Why now: Add model integration only after deterministic verification works.
  PRD ref: `prd.md > Candidate Repair`
  Spec ref: `spec.md > Model Proxy`
  Build: Bounded fixed-endpoint adapter, provenance, no-key mode, parser and request security tests.
  Verify (mechanical): Mocked adapter/error tests plus genuine live smoke test only if an authorized key becomes available. Do not tick complete while live behavior remains unverified.
  Learner check: Configure a key outside chat and request a non-confidential repair.
  Commit: `Add bounded model repair integration`
- [ ] **4. Evaluation and release documentation are ready**
  Becomes usable: Reproducible fixtures, measured outcomes, truthful setup and limitations.
  Why now: Final evidence follows the working app.
  PRD ref: `prd.md > The Core Journey`
  Spec ref: `spec.md > Where It Runs and How Someone Tries It`
  Build: Browser/evaluation tests, runbook, notices and final fixes.
  Verify (mechanical): Clean build, test suites, saved actual results and privacy audit.
  Learner check: Explore the app and report issues; confirm readiness only after trying it.
  Commit: `Document tested application and evaluation limits`

## Hands-on Checkpoints
- [ ] Early usable behavior explored by entrant
- [ ] Final kick-the-tires feedback completed

## Final Review
- [ ] Feedback resolved and entrant confirms ready to ship

## Code Tour and App Map
- [ ] Learning wrap-up based on actual implementation
- [ ] Optional reflection offered, not invented
- [ ] App map generated and shown

## Revisions
- 2026-10-22: Explicit instruction to code without routine pausing takes precedence over default per-checkpoint interview cadence. Mechanical completion does not imply that the entrant has performed a hands-on check. Those boxes stay open.
- The first integrated checkpoint includes the already verified implementations of slices 1 and 2, model-adapter code and evaluation tools. No earlier commits are fabricated. Slice 3 remains unchecked until a genuine authorized live model request succeeds; slice 4 remains unchecked pending final entrant review/release checks.
- Slice 1 verification: production build, domain/server tests and real browser execution/CSP checks pass. Slice 2 verification: editing, cancellation, malformed JSON, stale-result prevention and exported evidence pass. Full measured results are in `docs/IMPLEMENTATION_STATUS.md`.
- The npm helper failed on the local Windows launcher/path; direct use of the installed npm CLI succeeded. Startup/install scripts document that fallback without changing the stack.
- Browser tests initially sampled an intermediate original verdict. They now wait for both-version completion. The sorted fixture initially used an unsupported generator; it was corrected to a list comprehension rather than weakening the policy.
- Added an explicit AST depth limit and basis-bound challenge-exclusion evidence. These preserve the approved behavior and make incomplete/changed inputs harder to mistake for verified evidence.
