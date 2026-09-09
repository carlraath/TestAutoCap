# Cross-browser pass

Date: 2026-09-10. Build: production (`npm run build`), served by `scripts/e2e-server.ts` on a
database created from nothing for each run, with the real question bank (version 1) loaded and
frozen and the fifteen-participant sample cohort seeded.

docs/06 asks for current Chrome, Edge and Safari. Firefox was included as well.

| Browser | Engine | Result |
|---|---|---|
| Chromium | Blink | 13 passed, 0 failed |
| Microsoft Edge | Blink, installed channel `msedge` | 13 passed, 0 failed |
| Firefox | Gecko | 13 passed, 0 failed |
| WebKit (Safari engine) | WebKit | 12 passed, 0 failed, 1 skipped |

Each run covers the whole suite: the participant happy path across all four question types with a
mid-attempt reload, a run by a participant who meets every threshold so the Training Plan shows
Credited and Evidence review rows, the timer's amber state, an ordering and a matching question
operated by keyboard alone and again by mouse drag, the administrator's overview, results,
statistics, module demand, item analysis with an outlier, the audit log, a reset with a typed
reason, a retirement refused by the slot-depth guard, and close and export with all four files
checked for personal data.

## The one skip

WebKit skips "the timer chip turns amber under two minutes". Playwright's clock emulation advances
`Date` in WebKit but does not drive the page's own `setInterval`, so the countdown cannot be
stepped forward there. The same code ticks correctly in Chromium, Edge and Firefox, and the amber
state is asserted in those three. This is a limitation of the test harness, not of the application.

## Two defects the pass found, both fixed

1. **WebKit could not hold a session against the test server.** The session cookie was marked
   Secure whenever `NODE_ENV` was production, even when the site was served over plain HTTP.
   Chromium and Firefox treat localhost as trustworthy and accepted it; WebKit stored the cookie
   but never sent it back, so every page bounced to the sign-in screen. The Secure flag now follows
   `APP_URL`, which is the address people actually use, and falls back to the production assumption
   only when `APP_URL` is not set. A deployment behind a TLS-terminating proxy now works too.

2. **The personal-data scan reported two false positives** on the export files, found on Chromium
   and Firefox respectively: a Python decorator in a question stem (`\n@pytest.mark.parametrize`
   once escaped into the JSON archive) read as an email address, and a ten-digit run inside a
   SHA-256 seed read as a telephone number. The scan now refuses to start a match inside a longer
   alphanumeric run. Unit tests cover both false positives and real addresses and numbers, so the
   check has not been weakened.

## Responsive check

The participant screens were also exercised at 1024x768 and 820x1180 (tablet widths). Measured
horizontal overflow was zero at both. Evidence: `docs/evidence/phase3-tablet-dashboard.png` and
`docs/evidence/phase3-tablet-attempt.png`.
