# Measured implementation status

Date: 2026-10-22. Local proof of concept; not submitted or published.

## What works

The local UI runs the original and candidate through real browser Python, compares actual results with explicit expectations, separates visible examples from challenges, and exports a revision-bound JSON report. Input changes invalidate old evidence; cancellation and timeouts cannot create a passing verdict. The model adapter is implemented, but its real external behavior remains unverified without an authorized key.

## Completed checks

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

- Genuine model call: configure an authorized key locally, restart, consent and test a non-confidential fixture. No secret belongs in chat. Confirm provider/model compatibility and quota/cost behavior; mocks cannot establish these.
- Entrant hands-on review and actual feedback. Agent tests do not substitute for user review.
- Learning wrap-up/app-map walkthrough, without inventing a learner reflection.
- Public licensing/ownership review and explicit publication authorization. Dependency/upstream notices are retained; a project license is not selected automatically.
- Entrant-written submission details/narration, accessible demo video, public repository and actual contest submission. None has been performed.

## Limits

Only a bounded Python subset and finite JSON inputs/outputs are supported. No arbitrary repositories, packages, files, network access, recursion or host execution. This is local opt-in code execution, not an adversarial multi-tenant sandbox. A browser memory limit is not enforced; resource-exhaustion risk remains. A pass means only the listed cases passed, not that a function is universally correct. These public, hand-authored development fixtures are not a held-out benchmark and do not show that a model fixes bugs reliably or that a competition prize is likely.
