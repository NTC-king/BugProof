# 0.2 upgrade record

Requested by the entrant on 2026-10-22: improve the existing local prototype. The kernel/stack and local-only boundary are preserved. No trading files, public hosting, accounts, billing or submission actions were added.

Local code/evidence checkpoint: `519ee38`. Later documentation-only checkpoints may follow it; this is not a public repository or release.

## Usability

- Explicit save/open workspace JSON with size/schema checks, preserved work on malformed imports, reset consent and untrusted imported-candidate provenance. No automatic storage.
- True bounded ordered line diff, including repeated/moved lines and original/candidate line numbers.
- First failing/incomplete check explained with exact input/expectation/outcome; original-to-candidate changed-check counts; independent table filters that cannot change the verdict.
- JSON formatting controls, supported-code/case-format help, explicit function/contract labels, skip link, reduced-motion support, runner handshake/reconnect and elapsed/phase status.
- Readably formatted source with a pinned formatter and an extracted evidence component; one-command Windows verification launcher.

## Reliability

- Canonical hashes remove object-key-order loopholes in overlap checks. Overlap compares call inputs, not expected answers. Exact generated candidate and normalized prompt basis are bound to live provenance.
- Report schema v2 records execution-policy consistency. Matching expected outputs alone cannot produce a passing comparison when policy hashes are missing or differ between versions.
- Return values are checked before Python JSON encoding to prevent lossy dictionary-key coercion, tuple conversion, non-finite or unsupported data from counting as valid evidence.
- Nested/helper function definitions are explicitly blocked; they could previously shadow approved built-in names inside a function.
- Bounded streamed provider responses, refused redirects and propagated client aborts. Real HTTP-disconnection test uses an explicitly labeled adapter double. Cancellation cannot reverse provider processing/cost already incurred.

## Verification state

The production build and **41 unit/server tests pass**. The Windows `verify-local.ps1` launcher was executed end to end; its final **22-check browser run passed at 2026-10-22T16:57:05.459Z**, including a controlled harness-response mutation proving that changed policy versions prevent a passing comparison. That mutation is a labeled test technique, not a live-model result.

The full evaluation completed at **2026-10-22T16:54:53.490Z**: 21 browser checks plus **42 candidates across 12 tasks / 211 candidate case checks**. All 30 deliberately faulty variants were rejected; all 12 references passed their listed cases. Thirteen faulty variants passed the visible examples but not the complete suite. The later browser run adds the changed-policy UI regression check and relocates its warning into the verdict banner; the execution harness, scoring and fixture sources are unchanged from the full run.

All 42 full-run reports were subsequently audited: schema v2, app version 0.2.0, matching original/candidate/case hashes and consistent recorded policy hash `f3acae592b51a0497a451847cf6612c159559fca1b0250222a9a44938d2bfca4`, matching the current `runner/harness.py`. The source-revision marker is still working-tree evidence, not a signed commit attestation. The previous 0.1 evidence remains recoverable from Git checkpoint `98e16b4`.

Source formatting checks pass. A fresh production-dependency advisory check reported zero known vulnerabilities; this is not a security guarantee. Git attributes keep Python/source line endings stable for reproducible policy hashes.

Development-test corrections: an imported provenance label is visually uppercased, so its test uses a case-insensitive match. An exact contract-label query exposed an ambiguous wrapped-textarea label; an explicit accessible label fixes it. These failures were not counted as successful complete browser runs.

## Still not established

At the upgrade checkpoint no real model request had been verified. Subsequently, one genuine median repair passed all 6 listed cases; see `docs/LIVE_SMOKE_2026-10-22.md`. These fixtures are public hand-authored development tests, not held-out AI repair scores. User hands-on review, final licensing/publishing decisions, demo video and human-written submission remain open. Memory exhaustion and adversarial browser/runtime risks remain; this is not a hardened public execution service.
