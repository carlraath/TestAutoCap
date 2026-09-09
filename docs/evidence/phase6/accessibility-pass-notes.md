# Accessibility pass

Date: 2026-09-10. axe-core via @axe-core/playwright, tags wcag2a, wcag2aa, wcag21a, wcag21aa. Chromium.

20 screens audited, 0 violations.

| Screen | Violations |
|---|---|
| participant-01-login | none |
| participant-02-dashboard | none |
| participant-03-instructions | none |
| participant-04-attempt-single | none |
| participant-04-attempt-multi | none |
| participant-04-attempt-ordering | none |
| participant-04-attempt-matching | none |
| participant-05-review | none |
| participant-06-submitted | none |
| participant-07-training-plan | none |
| admin-01-overview | none |
| admin-02-participants | none |
| admin-03-results | none |
| admin-04-statistics | none |
| admin-05-demand | none |
| admin-06-items | none |
| admin-07-audit | none |
| admin-08-export | none |
| admin-09-account | none |
| admin-10-results-detail | none |

Per-screen axe output is in this directory as one JSON file per screen.

Also verified: a keyboard-only pass over the ordering and matching questions (tests/e2e/keyboard.spec.ts),
and that every visible focusable control on a dense administrator screen changes appearance when focused.
