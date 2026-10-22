# Local execution threat model

## Scope
Local opt-in execution of a supported Python subset. Not a multi-tenant hostile-code service, formal verifier, or arbitrary-Python security guarantee. Do not expose the ports through public interfaces/tunnels.

## Boundaries and controls
- Trusted app/comparison: port 4100. Static runner: separate origin on 4101, with no API, credentials or sensitive files. Different ports isolate origins, not cookies; these servers use no authentication cookies.
- Disposable Pyodide module worker with its own HTTP CSP. Worker networking/scripts are restricted to static runner assets and child workers are prohibited. The cross-origin iframe is sandboxed with the permissions required to load its worker.
- Python receives inputs, not expected results. The main app determines pass/fail. AST restrictions, fresh per-case globals, no imports/attributes/bridges/dynamic evaluation and bounded built-ins are defense in depth, not a proof against interpreter abuse.
- The frame owns initialization/per-case watchdogs and worker termination. No candidate Python executes in host Python, Node, a shell or package installer.
- Static paths are allowlisted; no arbitrary proxy, query parameters, write API or workspace-file serving on the runner. Model proxy requires trusted Host/Origin/session token, explicit consent, JSON/size/rate limits and a fixed endpoint.
- Candidate/output text is not HTML. Secrets remain server-side. Explicit evidence exports include code/cases and need review before sharing. Hashes are unsigned, not tamper-proof attestations.

## Residual risks
No portable hard per-worker RAM quota; pathological allocation may crash a tab or cause memory pressure. Do not intentionally exhaust memory during tests. Browser/runtime vulnerabilities, local malware/extensions and privileged processes are not covered. AST tests cannot prove adversarial soundness. Incorrect expectations, overfitting and missing cases remain possible.

Challenges are excluded from this app's repair payload, not secret from the owner. Changed/exposed cases and changed repair bases invalidate independence claims. Model-service quota/data handling/billing need separate checks; request limits are not account-wide spend caps.

## Evidence
Server tests cover routing and request guards. Real-browser tests exercise worker-to-app network rejection, cross-origin DOM rejection, import blocking, long-computation watchdog, cancellation, export and viewport overflow. Read actual completed `artifacts/browser-results.json`; a test's existence is not proof it passed.
