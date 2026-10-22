# BugProof — local Python repair evidence

A local workbench that executes one supported Python function, compares an original and candidate, and checks explicit examples and independent challenges. A pass means only the listed cases passed under the recorded runtime.

## Run on this Windows machine

```powershell
cd F:\BugProof
.\start-local.ps1
```

Open **http://127.0.0.1:4100**. The launcher type-checks/builds first, then starts the trusted app on port 4100 and the separate static Python runner on 4101. Both bind to 127.0.0.1 only. Keep the terminal running; stop it with Ctrl+C.

For a fresh installation, run `install-local.ps1` first. It uses the installed npm CLI directly because the generic installer hit a Windows launcher/path error here. Dependencies are pinned in package-lock.json, cache/temp files stay on F:, and no extra browser binary is downloaded. Node 24 and an existing Edge browser were used. With a working npm launcher, standard commands are `npm ci`, `npm run build`, and `npm start`.

Setup needs network access to obtain packages. Normal verification uses locally served pinned Pyodide assets, not a runtime CDN. No VPS, hosting, billing, or trading-project files are required.

## Try it

1. Select the median teaching example; click **Verify both versions**.
2. Inspect the inadequate candidate: it passes visible examples but fails a four-item median challenge.
3. Load the hand-authored reference candidate and verify again.
4. Edit a case/source: previous evidence is invalidated. Cancellation/timeouts do not award a new pass.
5. Export JSON evidence containing sources, cases, actual outcomes, runtime/policy hashes and provenance. Exports may contain sensitive code.

All teaching/reference/mutant candidates are hand-authored, not live model samples. The source diff is a simple line-presence comparison, not an automatically applied patch.

## Optional live repair

Verification and pasted candidates need no key. For live repair, create an ignored `.env` from `.env.example`, configure your own authorized `BUGPROOF_GEMINI_KEY` locally, restart, review provider data handling/costs, and check the UI consent box. **Never paste credentials into chat or commit them.**

The default model is `gemini-3.5-flash-lite`. The proxy uses a fixed provider endpoint, exact Host/Origin/session checks, bounded JSON/output and three requests per minute. No paid fallback or automatic retry exists. A key's presence does not establish a free quota or monetary cap.

Only source, contract and visible examples are sent; challenges are excluded. Recorded basis hashes invalidate independence claims if inputs are subsequently changed. Independence is unknown for pasted/teaching candidates and is not secrecy against the app owner.

**No live provider request has been verified during initial implementation.** Provider tests use explicit response doubles. Do not confuse their passing count with AI repair performance.

## Supported Python and safety

One synchronous function with finite JSON arguments/results; approved direct built-ins, arithmetic, conditions, indexing, bounded for loops and list/set/dict comprehensions. Imports, attributes/methods, classes, decorators, annotations, defaults, recursion, generators, dynamic evaluation, files/network/processes and candidate package installation are unsupported.

The AST policy is in `runner/harness.py`. Python executes only in browser Pyodide, never through host Python, Node or a shell. A worker alone is not a secure sandbox. See [docs/THREAT_MODEL.md](docs/THREAT_MODEL.md) for controls and residual memory/adversarial risks. Do not expose either local port publicly.

## Checks

```powershell
node node_modules/typescript/bin/tsc --noEmit
node node_modules/vite/bin/vite.js build
node --test tests/*.test.mjs
node tests/browser.mjs --evaluate
```

Browser tests use the explicit existing Edge path; adjust it for another environment. They start/stop their own server if needed. Latest completed results are in `artifacts/browser-results.json`, with exact candidate reports in `artifacts/evaluation`. Private screenshots/sample exports are under ignored `.cache`. See [docs/EVALUATION_PROTOCOL.md](docs/EVALUATION_PROTOCOL.md) before interpreting counts.

## Project and competition state

This is separate from every trading project. The entrant explicitly approved implementing the displayed detailed proposal and requested fast execution; planning files retain that basis. No separate interview, hands-on final review, public repository, registration or submission is invented. Public name, license selection, submission prose, narration, legal/account actions and publishing remain entrant decisions/release gates.

The official Learn pack is pinned under `.agents/skills` to commit `a0f065781873e8a7ed9a9a705a8dafa6a0810439`; its MIT notice is retained. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). The personal learner profile, credentials, caches and private evidence are ignored, but ignore rules do not erase Git history. The original research proposal remains in the separate research_reports directory recorded in the project setup documents.
