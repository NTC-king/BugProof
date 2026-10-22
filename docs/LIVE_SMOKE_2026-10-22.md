# Genuine live-repair integration check

Completed: 2026-10-22 at 17:22:28 UTC (19:22:28 Europe/Warsaw).

## Authorization and boundaries

The entrant configured a replacement key in ignored `.env`, confirmed Free Tier with billing off, and explicitly authorized the test. This account status is their confirmation, not a billing-API audit. No billing, hosting, publication or account settings were changed. The previously exposed credential was not entered into source or tool arguments. No private trading code was used.

## Actual end-to-end result

- One browser-triggered repair request through the real local proxy to `gemini-3.5-flash-lite`; HTTP 200; no retry and no provider fallback.
- Model round trip: 18,989 ms. Reported usage: 297 prompt tokens, 120 candidate tokens, 417 total tokens.
- Task: the existing public hand-authored median example. The model received only source, contract and 2 visible examples; 4 challenge cases were excluded from the repair payload.
- Before execution, the app showed a live candidate with no verdict. Original and candidate then ran in real browser Pyodide under the same recorded policy.
- Original: 2/6 passed, 4 failed. AI candidate: **6/6 passed**, 0 failed/blocked/incomplete, verdict `pass_on_listed_tests`.
- The recorded prompt basis and exact candidate match; challenge-exclusion evidence is true. This does not prove statistical independence or detect every semantically equivalent call.
- Exported original/candidate/case hashes were recomputed and checked. The policy hash matches the current `runner/harness.py`: `f3acae592b51a0497a451847cf6612c159559fca1b0250222a9a44938d2bfca4`.
- Key values were not printed or included in browser capability data, page content or exported evidence. Test-owned server/browser processes were stopped afterward; `.env` remains ignored and untracked.
- Production build and all 43 unit/server tests passed after adding the opt-in runner, including guard tests that refuse absent consent flags/credentials without calling a provider. No application/runtime changes were needed for the successful genuine model response.

Evidence: `artifacts/live/summary.json` and `artifacts/live/median-evidence.json`. The screenshot and temporary export are private ignored files under `.cache/`.

## Repeating deliberately

Ordinary tests never invoke a live model. After confirming a replacement key and Free Tier/billing-off status, run `test-live.ps1 -FreeTierConfirmed` from PowerShell. It requires the installed dependencies and an existing production build, and refuses an occupied app port. The script permits only one repair request per invocation; it does not automatically retry a failure. Repeated invocations consume quota and replace the local latest-run artifacts; Git retains checkpointed evidence.

## Interpretation

This verifies the genuine integration on **one public development fixture**, not overall AI repair accuracy, security soundness, a held-out benchmark or competition-winning probability. No learning reflection or entrant hands-on app review is invented. Publishing/licensing, demo recording and human-written submission work remain separate and unauthorized.
