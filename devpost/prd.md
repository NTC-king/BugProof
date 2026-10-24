---
doc: prd
status: approved
---
# BugProof — Product Requirements

Source: `scope.md > The Core Loop` and `The Unique Kernel`.

## The Core Journey
1. Select a clearly labeled owned example, or enter a supported function, its name/contract, and JSON cases.
2. Run the original and inspect actual versus expected results.
3. Request a genuine live repair if a provider is configured, or paste/load a clearly labeled candidate.
4. Verify both against the same frozen examples and challenges.
5. Inspect a diff, separate suite counts, exact outcomes, provenance, and limitations; download JSON evidence.

## Screens and Layout
One responsive workbench: header/status, task/contract, side-by-side original/candidate editors, separate editable case suites, controls, and evidence table.

October 24 visual refinement: a three-step guide, clearly differentiated original/proposed-fix editors, readable input/expected-answer previews with JSON editing tucked into native details, and separate original/fix result scores. Use plain verdict labels and explain the limited meaning of a pass. Previews are not validation or execution and do not discard test data.

## Look and Feel
Carry forward `scope.md > Inspiration & Identity`: warm background, dark ink, monospaced code, accessible focus and text labels; color is not the sole status indicator.

## Features and Behavior
### Task Input
Validate supported JSON, unique IDs, finite bounded values and sizes. Do not invent expected values from model output.
### Execution and Verification
Actual Python, original/candidate separation, independent challenge data excluded from repair requests, locked source/case hashes, exact outcomes, explicit incomplete status. No pass on partial results.
### Candidate Repair
Configured server-side AI adapter; no key in the browser. Pasted, teaching, recorded, and live candidates have distinct provenance. Missing provider is an honest error, not a fake fix.
### Evidence and Export
Revision-bound results, case details, runtime/model metadata and source/suite hashes. Exports may contain source and must be an explicit user action.

Upgrade refinements authorized 2026-10-22: use a real bounded line diff, explain the first failing check and filter case rows by outcome. Allow explicit workspace JSON download/open to preserve work without automatic persistence. Imported candidates do not inherit a trusted live-model provenance claim.
### Cancellation and Editing
Cancel terminates active execution. Editing relevant input invalidates results and stale responses cannot replace a newer revision.

## States and Boundaries
Empty, validating, initializing, executing, requesting repair, completed, blocked, provider unavailable, runtime error, cancelled, and inconclusive. Session data is memory-only by default. Local opt-in supported-subset execution is not a hardened service for hostile code.

## Product Decisions
Implement the displayed proposal under the entrant's explicit start-coding instruction. Do not attribute assistant-selected fixture contracts or aesthetics to independently stated user preferences. Keep consequential external actions unperformed without authorization.

## What We're Building
The complete core journey, including live-provider code and honest no-key handling. The absence of a key may prevent live integration verification but must not stop implementation of the remaining behavior.

## Deferred From the POC
Deployment, accounts, arbitrary Python/repositories, model training, and extra editor frameworks do not prove this kernel.

## Open Questions
Future provider requests still require consent. Final app review was user-confirmed on October 24 after the 0.3.2 visual refinement. Public video, entrant-authored form fields and actual contest submission remain shipping gates, tracked separately in `ship-checklist.md`.
