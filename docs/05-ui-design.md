# 05 UI Design

## Design intent

Unmistakably Avec, and calm enough to sit a timed assessment in. This instrument feeds formal training prescriptions for professionals, so it should feel like a well-made Avec product, not a quiz app. Brand carries the frame (header, login, outcomes) while assessment surfaces stay quiet and highly readable. Polish comes from spacing, hierarchy, consistency and restraint. No confetti, no gamification, no emojis, no illustrations of people.

## Brand foundation - derive from the live site

The brand source of truth is https://www.avecglobal.com (a Webflow build, so a single published stylesheet is easy to read). Verified brand facts to honour:

- The brand presents as "Avec" with an "Avec / Page" title device (the site titles itself "Avec / Home"). Use "Avec / Capability Placement" as the product title convention, browser tab included.
- Positioning line "Delivery is our superpower" and a voice that is refreshingly direct and human-centred. Microcopy matches that voice: plain, warm, confident, never cute.
- Branded gradient backgrounds are a core visual device. Assets observed: https://cdn.prod.website-files.com/69605160cce2f09b823ca31c/6965d66aa353e6e9296770c8_Avec%20Gradient%203.webp and https://cdn.prod.website-files.com/69605160cce2f09b823ca31c/6965d66ac5e0be103ab1ddeb_Avec%20Gradient%204.webp

At Phase 0, fetch the site and its published stylesheet, extract the exact brand tokens (primary and secondary colours, gradient definitions, heading and body font families and weights), and download the logo and gradient assets into the repo as local files. Produce a one-page brand token sheet (swatches with hex values, fonts, logo usage, gradient crops) and present it with the implementation plan for owner approval. All assets serve locally, nothing hotlinks at runtime.

## Visual system

- Palette: the extracted Avec tokens are the palette. Add only the functional states the brand lacks: success green #2E7D32, attention amber #B26A00, error red #B3261E, used sparingly. Fallback if extraction fails: primary navy #1F3864, ink #1A1A1A, background #F7F8FA, flagged to the owner.
- Brand application: Avec logo top left on every screen. The login page and the Training Plan header carry the Avec gradient treatment. Buttons, links, focus states and progress elements in brand primary. Footer reads "Avec / Capability Placement".
- Assessment readability rule: question screens sit on quiet neutral surfaces with brand in the header and accents only. Nobody sits a timed test on a gradient.
- Typography: the fonts the site uses, self-hosted locally. No runtime font CDNs. Generous line height, restrained sizes, weight for hierarchy.
- Components via Tailwind. Cards with soft borders and subtle shadow, 8px radius, consistent 4/8/16/24 spacing rhythm.
- Data tables styled with a brand-primary header row and clean thin borders. Code in a light monospace block with a faint border. Small inline SVG diagrams only, drawn with the palette, no external images and no external chart libraries.

## Interaction standards for ordering and matching

- Ordering: elements render as draggable cards in a vertical list with a clear grab affordance, generous hit areas, a visible drop indicator and smooth subtle motion. Every element also carries visible up and down controls, and the whole interaction is fully keyboard operable: focus an element, lift with space, move with arrow keys, drop with space. The stem states the ordering criterion above the list.
- Matching: tokens start in a tray and drag onto labelled bucket zones that highlight on approach. Each token also carries a bucket selector as the keyboard and precision alternative, and tokens can be returned to the tray. Buckets show their placed tokens as removable chips.
- Both types autosave every change, exactly like radio and checkbox answers. Touch, trackpad and mouse all work. If a drag is abandoned mid-gesture, the state simply remains as it was.

## Screens

- Login: centred card on the Avec gradient treatment, Avec logo, participant code, password, error state, nothing else.
- Participant dashboard: greeting by participant code, one line of purpose, three assessment cards showing title, 10 questions, 10 minutes, and status. Once all three are submitted the dashboard becomes the Training Plan.
- Instructions screen (per assessment), verbatim copy: "This assessment has 10 questions and a 10 minute timer. You have one attempt. Your answers save automatically as you go, and you can move between questions and change answers until you submit. Some questions ask you to drag items into order or onto categories, and every one of these can also be completed with the keyboard or the on-screen controls. Unanswered questions score zero. When the timer ends, the assessment submits itself with your saved answers. If anything goes wrong technically, stop and contact the administrator, who can reset your attempt." Button: "Start assessment. The timer begins now."
- Attempt screen: slim header with assessment name, progress (Question 4 of 10) as a segmented bar, timer chip top right turning amber under 2 minutes. Question stem, then the interaction: option tiles with clear selected states for single and multi ("Select all that apply." directly under the stem), or the ordering or matching component. Previous and Next, plus Review from the last question.
- Review screen: 10 numbered tiles, answered solid brand primary, unanswered outlined amber, jump on click, Submit with a confirm dialog stating unanswered questions score zero. Ordering items count as answered once moved, matching items once every token is placed.
- Per-assessment confirmation: a quiet confirmation that the assessment is submitted and a line that the Training Plan appears once all three are complete. No scores.
- Training Plan: gradient header with the Avec logo and "Your training plan". Modules in recommended sequence as rows or cards: Prescribed in solid brand primary with hours and the course name linked, Credited in green outline with a tick, Evidence review in amber outline captioned "Provisional, confirmed at review", GIT-1 neutral with "Confirmed at journey map issue". A totals line "Prescribed learning: N hours" and the closing line "Your journey map will be issued by delivery management." A Print button invokes the print stylesheet, which renders a clean branded A4 page.
- Admin: dense, functional, same system. Overview dashboard with stat cards and completion bars. Participants table with status pills, credentials and reset actions. Results table with expandable per-participant detail. Cohort statistics with inline SVG distribution bars. Module demand summary table. Item analysis table with outliers flagged. Audit log table. Export buttons. Confirmation dialogs for destructive actions, reset requiring a typed reason.

## Interaction quality bar

- Instant feedback on every selection or placement with a visible saved indicator that never lies.
- Keyboard operable throughout, including both drag and drop types, visible focus states, WCAG AA contrast.
- Empty, loading and error states designed, not defaulted. Error copy is calm and directs to the administrator.
- No layout shift during an attempt. The timer never obscures content.
