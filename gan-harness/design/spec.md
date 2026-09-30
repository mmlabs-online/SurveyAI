# Design brief — SurveyAI "cute hơn" redesign

**Brief (user):** "Giao diện mới cho SurveyAI trong cute hơn" — a new, cuter look for SurveyAI.

## Context

- Existing app: Next.js 16 + Tailwind 4 frontend (S0 + S1), mock API. Current look is "warm paper, deep green ink, clay accent" with serif headings — calm and editorial, not cute.
- Users: Vietnamese SME owners (F&B, spa, retail, clinics; persona "chị Lan", phone-first) and their customers answering surveys on mobile with no login.
- Screens to redesign (all of them): `/` landing, `/signup`, `/login`, `/dashboard`, `/surveys/new` (idea input + generation progress), `/surveys/[id]` (review + publish panel), `/surveys/[id]/responses`, `/s/[slug]` respondent page (questions, progress bar, validation errors, thank-you, not-found).

## Direction

Cute = friendly, soft, playful, warm — but still trustworthy enough that a shop owner sends it to customers.

- Soft pastel palette with one confident primary color and cheerful accents. Every text/background pair must still meet **WCAG AA** (respondent page is a spec requirement).
- Rounded, bubbly shapes: big radii, pill buttons, chunky soft shadows, sticker/badge details.
- A small original **mascot or character** (inline SVG, no external images), used in empty states, the generation progress screen, the thank-you screen and the not-found page. Different expressions per moment are a plus.
- Playful micro-interactions: button squish on press, bouncy progress bar, confetti or a happy mascot on thank-you, gentle hover wiggles. All motion must respect `prefers-reduced-motion`.
- Friendly rounded display font from Google Fonts via `next/font/google` with full Vietnamese support (e.g. Baloo 2, Quicksand, Nunito — verify the `vietnamese` subset exists). Vietnamese diacritics must render well.
- Answer choices on the respondent page should feel like tappable cards/chips, large touch targets (≥ 44px), mobile-first.
- Distinctive and memorable, not a generic Tailwind template.

## Hard constraints (functionality)

- **Do not change behavior, routes, the ApiClient, or `src/lib/**` logic.** This is a visual redesign: styling, layout, markup structure, SVG art, fonts, animations.
- Keep all user-facing strings in `src/i18n/vi.ts`. Tone may become friendlier (Vietnamese), but keep meaning and keep strings that tests assert on unless you update the tests accordingly.
- Keep accessibility: labeled inputs, keyboard navigation, visible focus rings, semantic headings, AA contrast, decorative SVGs `aria-hidden`.
- `npm run typecheck`, `npm run lint`, `npm run build`, `npm test` must still pass. `src/architecture.test.ts` rules still apply (files < 400 lines, no `any`, no console, strings in i18n).
- No new runtime dependencies except fonts via `next/font`. No external image URLs.
- Do not commit.
