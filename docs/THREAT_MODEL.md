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
- Provider redirects are refused, response streams are capped at 64 KiB, and disconnects/cancellation propagate to the upstream fetch. This does not reverse work or charges already incurred. Provider-returned raw errors are not echoed into the UI.
- Nested/helper function definitions cannot replace names on the approved direct-call list. Returned values are checked before JSON encoding: non-string object keys, tuples and unsupported/non-finite values are incomplete evidence rather than silently coerced successful returns.
- Explicit workspace files are bounded, schema-validated data. Import does not execute source or accept saved reports/live-model provenance, and resets provider consent. Nothing is persisted automatically. Invalid imports preserve the current workspace/evidence.

## Residual risks
No portable hard per-worker RAM quota; pathological allocation may crash a tab or cause memory pressure. Do not intentionally exhaust memory during tests. Browser/runtime vulnerabilities, local malware/extensions and privileged processes are not covered. AST tests cannot prove adversarial soundness. Incorrect expectations, overfitting and missing cases remain possible.

Challenges are excluded from this app's repair payload, not secret from the owner. Changed/exposed cases and changed repair bases invalidate independence claims. Model-service quota/data handling/billing need separate checks; request limits are not account-wide spend caps.

Canonical input-overlap hashes ignore JSON object-key order and expected outcomes, and the recorded basis includes the exact candidate. They do not detect every equivalent positional/keyword call or prove statistical independence. A passing comparison requires one matching recorded policy hash for every case in both versions; hashes are not interpreter/runtime attestation.

## Evidence
Server tests cover routing and request guards. Real-browser tests exercise worker-to-app network rejection, cross-origin DOM rejection, import blocking, long-computation watchdog, cancellation, export and viewport overflow. Read actual completed `artifacts/browser-results.json`; a test's existence is not proof it passed.
