# Demo recording mechanics

Use the approved median journey. This is a technical shot list, not a narration script or submission description.

1. Show the purpose and three-step guide.
2. Show original code beside the labeled hand-authored teaching candidate.
3. Show the two example tests and four extra tests.
4. Run both versions. Show original 2/6 and teaching candidate 4/6, then the four-item mismatch: expected 6, actual 8.
5. Load the hand-authored reference candidate. Old evidence must disappear.
6. Verify again. Show reference 6/6, separate suite counts and actual outputs.
7. Export the evidence and show recorded runtime/provenance.
8. Show the finite-test limitations.

`node tools/record-demo.mjs` uses the existing local launcher and Edge to capture silent 1440×900 raw footage under ignored `artifacts/private/demo/`. It blocks repair requests and external network requests. It does not record the desktop, credentials, unrelated windows or a real model call. Recording metadata is saved in `artifacts/demo-recording.json`. The browser's actual Python runs, not screenshots or fabricated results, are recorded.

Recording also needs Playwright's matching FFmpeg helper. If it is missing, `node node_modules/playwright/cli.js install ffmpeg` downloads only that small video component, not another browser. The first recording attempt here stopped before creating a page because the helper revision was missing; the matching 1.6 MiB helper was then installed. Existing Edge is still used.

Any narration and the public submission answers must be the entrant's own. Narration is optional, not an additional official requirement. Do not describe the teaching/reference fixture as AI output. A genuine historical model integration example exists separately under `artifacts/live/`, but this recording does not repeat it. No new real model request is necessary for this demo.

The current raw file is `artifacts/private/demo/BugProof-raw.webm`: 113.04 seconds at 1440×900, about 10.5 MB. It decoded successfully and three actual encoded frames were visually inspected; metadata/hash are in `artifacts/demo-verification.json`. Review it and optionally add your own narration or make your own recording. Keep the final video within the official limit (under three minutes; overview suggests 1–3). Use English or supply an English translation. Upload publicly to YouTube/Vimeo, then test the final link signed out. The local raw file is not a public video URL and is not a completed submission.
