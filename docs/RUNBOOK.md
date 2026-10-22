# Runbook

Start with `start-local.ps1`; open http://127.0.0.1:4100. Both 4100 and 4101 are needed. Inspect any port conflict rather than killing an unknown process. Do not bind this prototype publicly.

Use `verify-local.ps1` for the build, unit/server tests and browser journey; add `-Evaluate` for the full fixture set. The tests make no real model call. If an older BugProof server is already running, stop its owned terminal normally and restart the launcher; the browser tests reject an unexpected app version rather than killing an unknown process.

If initialization fails, check both listeners and browser diagnostics. Never bypass it by running submitted code on the host. A timeout is incomplete evidence, not a pass. Cancel terminates the worker; rerun for new evidence.

Edits invalidate results. Compare exported source/case/policy hashes when diagnosing stale evidence. Exports/logs may include code; review files and Git history before sharing.

For live repair, configure your authorized key outside chat in ignored `.env`, restart and consent in the UI. Review data handling and billing. No-key mode remains useful and honest. Do not call manually exposed challenge cases independent afterward.

Starting the app does not authorize public publication or competition entry. Confirm current rules, user-authored submission wording, video/repository accessibility, ownership and licensing before entry.
