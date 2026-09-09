# Evidence

Everything the build produced as proof, in the order docs/06 asks for it.

| Phase | Evidence | Where |
|---|---|---|
| 0 Scaffold | Branded hello page served over HTTPS | `phase0-hello-https.png` |
| 3 Participant experience | Every participant screen, both drag-and-drop types by mouse and by keyboard, the timer's amber state, the review screen with a mixed paper, the Training Plan on screen and printed to A4, and tablet widths | `phase3-*.png`, `phase3-plan-a4.pdf` |
| 4 Admin reporting | Overview, results expanded, statistics, module demand, item analysis with an outlier flagged, the audit log, a retirement refused by the slot-depth guard, and close and export | `phase4-*.png`, `exports/` |
| 5 Question bank | The pilot: two internal accounts through all three assessments, by mouse and by keyboard, then reset away | `pilot/` |
| 6 Hardening | Accessibility pass with per-screen axe output, cross-browser pass notes, load sanity numbers, and the no personal data verification | `phase6/` |
| 7 Documentation | The clean second deployment that proves the Hosting Guide, with screenshots | `second-deployment.md`, `second-deployment/` |
| 8 Go-live | The docs/06 checklist executed line by line against a production HTTPS deployment | `go-live/` |

## Reproducing any of it

The whole suite runs against a database built from nothing each time:

```bash
npm run check          # typecheck, lint, unit and integration tests
npx playwright test    # end to end, all four browsers
```

The passes that are skipped by default, because they are slow or change state:

```bash
LOAD_SANITY=1 npx playwright test --project=chromium tests/e2e/load-sanity.spec.ts
PILOT=1 npx playwright test --project=chromium tests/e2e/pilot.spec.ts
npx playwright test --project=chromium tests/e2e/accessibility.spec.ts
```

## A note on the screenshots

The Phase 3 and Phase 4 screenshots were taken against the development sample bank, whose items
describe their own answers so an automated run can complete them. Everything after that, including
the pilot, the second deployment and the go-live checklist, ran against the real frozen bank
version 1. The interface is identical either way; only the question text differs.
