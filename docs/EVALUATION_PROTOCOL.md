# Evaluation protocol

This measures the verification application on self-authored supported functions. It does not measure live-model accuracy, real-world correctness, benchmark superiority, profitability or winning odds.

The extended set has 12 tasks, each with an original faulty function, inadequate teaching candidate, reference and explicit visible/challenge expectations. Six tasks add an extra inadequate candidate: 30 known faulty variants and 12 references. All are hand-authored, not observed model outputs.

Build, then run `node tests/browser.mjs --evaluate`. The script drives the actual UI and actual browser Python. Each candidate has a downloaded report. The aggregate separates expected-correct labels, observed verdicts, visible-example acceptance, challenge failures and exact report paths. Both versions use identical cases/policy. Do not edit expectations to make a candidate pass.

Count faulty variants separately from references. Policy-blocked or incomplete checks are not semantic successes. The script requires known faulty variants to fail declared behavior and references to pass listed cases. Visible-example acceptance can be compared with full-suite rejection using the same outcomes.

These public development fixtures are not a held-out model benchmark. A genuine model evaluation needs a separate uninspected frozen set, fixed prompt/model/budget, recorded unsuccessful attempts and exposure-aware retries.

## Actual development failures
- Initial browser testing exposed a wait that could read the original's intermediate verdict before candidate verification finished. The test now waits for completion; the first four-fixture browser suite subsequently passed.
- The first extended run stopped at the sorted-list fixture: its source used a generator expression outside the declared supported subset. Five preceding fixture groups completed. The fixture was rewritten with a list comprehension, preserving its intended behavior without loosening the execution policy. The failed run is not reported as a complete evaluation.

Latest completed results must be identified by their actual timestamp and source revision. Provider unit tests use response doubles; no live model request was performed in the initial implementation.
