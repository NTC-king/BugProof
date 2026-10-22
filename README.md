# BugProof — local Python repair evidence

A local workbench that executes one supported Python function, compares an original and candidate, and checks explicit examples and independent challenges. A pass means only the listed cases passed under the recorded runtime.

## Run on this Windows machine

```powershell
cd F:\BugProof
.\start-local.ps1
```

Open **http://127.0.0.1:4100**. The launcher type-checks/builds first, then starts the trusted app on port 4100 and the separate static Python runner on 4101. Both bind to 127.0.0.1 only. Keep the terminal running; stop it with Ctrl+C.

From Command Prompt, you can also run `F:\BugProof\start-local.cmd`. Node 24 or newer is required. The installer restores its temporary process environment settings even if package installation fails.

For a fresh installation, run `install-local.ps1` first. It uses the installed npm CLI directly because the generic installer hit a Windows launcher/path error here. Dependencies are pinned in package-lock.json, cache/temp files stay on F:, and no extra browser binary is downloaded. Node 24 and an existing Edge browser were used. With a working npm launcher, standard commands are `npm ci`, `npm run build`, and `npm start`.

Setup needs network access to obtain packages. Normal verification uses locally served pinned Pyodide assets, not a runtime CDN. No VPS, hosting, billing, or trading-project files are required.

## Try it

1. Select the median teaching example; click **Verify both versions**.
2. Inspect the inadequate candidate: it passes visible examples but fails a four-item median challenge.
3. Load the hand-authored reference candidate and verify again.
4. Edit a case/source: previous evidence is invalidated. Cancellation/timeouts do not award a new pass.
5. Export JSON evidence containing sources, cases, actual outcomes, runtime/policy hashes and provenance. Exports may contain sensitive code.

All teaching/reference/mutant candidates are hand-authored, not live model samples. The source diff is an ordered line comparison with line numbers and a 400-line-per-version cap, not an automatically applied patch.

The first issue card shows the exact input, expected result and observed result. Table filters only change the displayed rows; they never change the full verdict. Original-to-candidate improvement/regression counts refer to the listed checks, not a general correctness score.

Use **Save workspace JSON** and **Open workspace JSON** to preserve a task/candidate explicitly. These are different from evidence reports: opening a workspace validates data, clears old evidence, resets provider consent and labels the candidate as imported. It does not execute code or call a model. No automatic browser storage is used. Files contain your source/cases; review them before sharing. Invalid imports leave current work unchanged.

## Optional live repair

Verification and pasted candidates need no key. For live repair, create an ignored `.env` from `.env.example`, configure your own authorized `BUGPROOF_GEMINI_KEY` locally, restart, review provider data handling/costs, and check the UI consent box. **Never paste credentials into chat or commit them.**

The default model is `gemini-3.5-flash-lite`. The proxy uses a fixed provider endpoint (redirects refused), exact Host/Origin/session checks, a 64 KiB streamed reply cap, a 45-second combined request/read deadline and three requests per minute. No paid fallback or automatic retry exists. Cancelling/disconnecting aborts the upstream connection, but cannot undo provider work or charges already incurred. A key's presence does not establish a free quota or monetary cap.

Only source, contract and normalized visible examples are sent; challenges and extra case metadata are excluded. Recorded basis hashes bind the original, contract, visible cases and exact generated candidate. Input-overlap checks use canonical JSON, independent of object-key order or expected answer. This does not detect every semantically equivalent Python call or prove secrecy/statistical independence. Exclusion is unknown for pasted/imported/teaching candidates. A comparison cannot receive a passing verdict without matching recorded execution-policy hashes for every case in both versions.

Version 0.3 evidence uses schema 3 and also records the observed Python version, implementation and Pyodide version from the actual worker. Missing, mismatched or unpinned runtime metadata prevents a passing comparison. These are unsigned local records, not remote runtime attestation. Unchecking provider consent cancels a pending repair; it does not cancel local verification or undo data already transmitted.

**Live integration verified on October 22, 2026:** one genuine Gemini request returned a median repair that passed all 6 listed cases (2 visible, 4 excluded challenges). The original passed 2/6. See [the live smoke record](docs/LIVE_SMOKE_2026-10-22.md) and `artifacts/live/`. This one public fixture is not a model-accuracy benchmark. Ordinary unit/browser tests still use no real model calls; provider unit tests use explicit response doubles.

For a deliberate repeat only, after confirming your replacement key and Free Tier/billing-off status, use `test-live.ps1 -FreeTierConfirmed`. It uses the existing production build and permits one model request with no retry. It is never run by the normal verification command.

## Supported Python and safety

One synchronous function with finite JSON arguments/results; approved direct built-ins, arithmetic, conditions, indexing, bounded for loops and list/set/dict comprehensions. Returned objects need string keys; tuples, non-finite numbers and implicit key conversions are not supported JSON evidence. Imports, attributes/methods, nested/helper functions, classes, decorators, annotations, defaults, recursion, generators, dynamic evaluation, files/network/processes and candidate package installation are unsupported.

The AST policy is in `runner/harness.py`. Python executes only in browser Pyodide, never through host Python, Node or a shell. A worker alone is not a secure sandbox. See [docs/THREAT_MODEL.md](docs/THREAT_MODEL.md) for controls and residual memory/adversarial risks. Do not expose either local port publicly.

## Checks

Run `verify-local.ps1` for build, unit/server tests and the browser journey, or `verify-local.ps1 -Evaluate` to include all 42 hand-authored candidates. The tests make no real model call. Node commands are also available directly:

```powershell
node node_modules/typescript/bin/tsc --noEmit
node node_modules/vite/bin/vite.js build
node --test --test-concurrency=1 tests/*.test.mjs
node tests/browser.mjs --evaluate
```

Browser tests use the explicit existing Edge path; adjust it for another environment. They start/stop their own server if needed. Full completed results are in `artifacts/browser-results.json`, with exact candidate reports in `artifacts/evaluation`; smaller smoke runs use `artifacts/browser-smoke-results.json` so they cannot overwrite the full evaluation summary. `node tests/audit-evidence.mjs` audits a completed full evaluation without calling a model. Private screenshots/sample exports are under ignored `.cache`. Source formatting is reproducible with `npm run format` / `npm run format:check`. See [docs/EVALUATION_PROTOCOL.md](docs/EVALUATION_PROTOCOL.md) before interpreting counts, [docs/RELEASE_0_3.md](docs/RELEASE_0_3.md) for this quality pass, and [docs/UPGRADE_0_2.md](docs/UPGRADE_0_2.md) for the historical upgrade record.

## Project and competition state

This is separate from every trading project. The entrant explicitly approved implementing the displayed detailed proposal and requested fast execution; planning files retain that basis. No separate interview, hands-on final review, public repository, registration or submission is invented. Public name, license selection, submission prose, narration, legal/account actions and publishing remain entrant decisions/release gates.

The official Learn pack is pinned under `.agents/skills` to commit `a0f065781873e8a7ed9a9a705a8dafa6a0810439`; its MIT notice is retained. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). The personal learner profile, credentials, caches and private evidence are ignored, but ignore rules do not erase Git history. The original research proposal remains in the separate research_reports directory recorded in the project setup documents.
