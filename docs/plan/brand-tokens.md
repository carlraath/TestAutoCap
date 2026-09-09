# Brand token sheet - derived from https://www.avecglobal.com

Extracted 2026-09-09 from the published Webflow stylesheet `avecglobal.webflow.shared.6130a16fc.min.css` and the homepage markup. Everything below is served locally from `public/brand` and `public/fonts`; nothing is hotlinked at runtime.

## Colours (swatches as the site defines them)

| Token | Hex | Source | Use in this app |
|---|---|---|---|
| brand-500 | #7237B8 | `--swatch--brand-500` | Primary: buttons, links, focus rings, progress, answered tiles, table header rows |
| brand-600 | #5B2C93 | `--swatch--brand-600` = brand-500 mixed 20% black | Hover and pressed states |
| brand-400 | #8E5FC6 | `--swatch--brand-400` = brand-500 mixed 20% white | Secondary accents |
| brand-300 | #AA87D4 | `--swatch--brand-300` = brand-500 mixed 40% white (also literal in the CSS) | Borders on muted surfaces, secondary button border |
| ink-900 | #1D2436 | `--swatch--dark-900`, also `--swatch--brand-text` | Body text, headings, inverse surfaces |
| ink-800 | #252D41 | `--swatch--dark-800` | Dark surface variant |
| tint-200 | #EEE1FE | `--swatch--light-200` | Muted surface background, hover on light buttons |
| light-100 | #FFFFFF | `--swatch--light-100` | Cards and page base |
| surface | #FAFAFA | Present in the site CSS | Quiet page background behind assessment surfaces |
| brand-o20, brand-o40 | brand-500 at 20% and 40% alpha | `--swatch--brand-o20`, `--swatch--brand-o40` | Card border and drop shadow colour |
| gradient palette | #8831F2, #E1BAFF, #4B9FFF, #00FFBB | Favicon SVG gradient stops | Reference for gradient crops only |

Functional colours the brand lacks (docs/05): success #2E7D32, attention amber #B26A00, error #B3261E.

Contrast: brand-500 on white 7.1:1, ink-900 on white 15.6:1, white on brand-500 7.1:1. All pass AA for normal text.

## Typography

- Family: Inter. The site loads Inter 300, 400, 500, 600 and 700 through Google Fonts. Self-hosted here as the Inter v20 variable font, latin and latin-ext subsets, in `public/fonts/`.
- Weights as the site names them: regular 300, medium 400, bold 700. Headings 700 with letter-spacing -0.06em and line-height 1 to 1.1; body 300 to 400 with line-height 1.5.
- Sizes (site clamps): display 3 to 7rem, h1 2.75 to 5rem, h2 2.5 to 4rem, h3 2.25 to 3rem, h4 1.75 to 2rem, h5 1.375 to 1.5rem, h6 1 to 1.125rem, text-large 1.125 to 1.3rem, text-main 1 to 1.125rem, text-small 0.875 to 1rem. The app uses the lower end because assessment screens favour restraint.

## Shape and spacing

- Radius tokens: small 0.5rem (8px), main 1rem, large 2rem, round. Cards in this app use 8px per docs/05.
- Spacing: the site uses a clamped 8-step scale; the app uses the 4/8/16/24 rhythm docs/05 asks for.
- Surfaces: primary white with a 1px brand-o40 border and a soft brand-o20 shadow; muted tint-200 with a brand-300 border; inverse ink-900 with white text.

## Logo and marks

- Wordmark: inline SVG, viewBox 0 0 139 35, five paths, `fill="currentColor"` so it takes the text colour. Vendored as `public/brand/avec-logo.svg` and as a React component.
- Favicon: `public/brand/favicon.svg` (rounded square with the brand gradient). Web clip: `public/brand/webclip.svg`.
- Title device: the site titles itself "Avec / Home". This app is "Avec / Capability Placement" (browser tab and footer).

## Gradient assets

- `public/brand/avec-gradient-3.webp` and `avec-gradient-4.webp` (800 x 792, alpha), the two gradient images the site uses as hero and section backgrounds. Used on the login backdrop and the Training Plan header only; assessment screens stay on the quiet surface.

## Voice

Positioning: delivering technology in a way that is refreshingly direct, human-centred and focused on what matters. Microcopy in the app is plain, warm and confident. UK English. No emojis.
