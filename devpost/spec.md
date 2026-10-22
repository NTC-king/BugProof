---
doc: spec
status: approved
---
# BugProof — Technical Spec

## How This Works, In Plain Language
The model proposes text. Python runs in a separate browser origin, never in the laptop's Python process. The main app compares outputs against explicit expectations and exports the evidence.

## The Core Journey Through the System
React input -> validated immutable task -> cross-origin frame -> disposable Pyodide module worker -> actual JSON outcomes -> trusted comparison -> evidence export. An optional local API proxy sends only the original, contract, and visible examples to a configured model. Implements `prd.md > The Core Journey`.

## Stack
React/TypeScript with [Vite](https://vite.dev/guide/); Node HTTP server; [Pyodide 314.0.7](https://pyodide.org/en/stable/usage/webworker.html); Node built-in unit tests and real-browser tests with Playwright. Exact dependencies are lockfile-pinned. This preserves the displayed architecture.

## Where It Runs and How Someone Tries It
`npm ci`, `npm run build`, `npm start`; open `http://127.0.0.1:4100`. Runner assets served only at port 4101. Node 24 is available. No hosting/billing. Live repair requires an explicitly configured server-side key; no-key verification still runs.

## Look and Feel
Custom CSS with readable monospaced editors, warm neutral surfaces, ink text, strong focus, accessible status labels. Implements `prd.md > Look and Feel`.

## Components
### Workbench
Task/candidate/case editors and revision/cancellation state; implements Task Input and Cancellation and Editing.
### Runner
Separate static origin, own worker CSP, no credentials, disposable runtime, supported AST subset and parent watchdog. Implements Execution and Verification. Worker isolation is not by itself a security guarantee; memory DoS and adversarial soundness remain limitations.
### Domain and Reports
Schema validation, finite JSON comparisons, verdict aggregation and SHA-256 revision evidence. Implements Evidence and Export.

The 0.2 refinement uses canonical JSON for semantic input-overlap detection, binds live provenance to the exact generated candidate, and validates all returned JSON before scoring. Bounded line comparison and portable workspace parsing live in small pure modules. Explicit workspace imports reset candidate provenance; no browser storage is added.
### Model Proxy
Fixed provider endpoint, strict Origin/Host/session token checks, bounded payload/rate/output, no secrets sent to client. Implements Candidate Repair. [Provider documentation](https://ai.google.dev/gemini-api/docs/structured-output).

Client disconnection aborts the upstream fetch where supported; cancellation cannot undo provider work/charges already incurred. Streamed provider replies have a byte cap and one combined timeout/abort signal. No automatic retry is added.

## Data Model
Task source/name/contract plus examples/challenges; cases with args/kwargs and value-or-exception expectation; candidate with provenance/model; case outcomes with actual value/status; report with frozen hashes and exact evidence. Memory-only; explicit JSON export. Expectations never enter the Python worker.

## File Structure
`src/App.tsx`, `src/main.tsx`, `src/styles.css`: workbench.
`src/domain.mjs`, `src/fixtures.mjs`, `src/runner.ts`: validation, examples, bridge.
`server/main.mjs`, `server/repair.mjs`: local serving and optional model proxy.
`runner/frame.html`, `frame.mjs`, `worker.mjs`, `harness.py`: restricted execution.
`tests/`: unit/server/browser/evaluation evidence.
`devpost/`: planning, actual progress, and pending review.

## External Services and Dependencies
Optional Gemini adapter, exact model ID configured server-side. No provider request until a key is configured; no paid fallback. Exclude challenges from payloads. No package downloads by candidate Python. Pyodide assets served from the installed pinned package, not a runtime CDN.

## Important Failure Modes
Invalid code/data -> useful error; initialization/execution timeout -> terminate worker/inconclusive; provider missing/unavailable -> preserve work and show honest no-key/error state. Do not switch to host execution.

## Decisions and Open Issues
The entrant approved implementation of the displayed plan and requested no routine pauses. Record fast mode, but leave final hands-on review unperformed. The runtime/CSP uncertainty was resolved by actual browser tests. Genuine live-provider integration was verified on one median fixture on 2026-10-22 after the entrant confirmed a replacement key and Free Tier/billing-off status. See `docs/LIVE_SMOKE_2026-10-22.md`. Final user review and public submission remain unperformed.
