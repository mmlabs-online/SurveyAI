# Design Evaluation - Iteration 002

Mode: real Chromium screenshots (390x844, 1280x800), prod build on :3100 (mock), saved to gan-harness/design/screenshots/iter-002/. Desktop generation captured (d-07-generating-a.png).
Commands: typecheck pass, lint pass, npm test 375/375, build pass. Full flow works; no overflow at 390 on any screen; only sr-only labels under 44px.

| Criterion | Score | Weight | Weighted |
|---|---|---|---|
| Design Quality | 8.0 | 0.35 | 2.80 |
| Originality | 7.8 | 0.30 | 2.34 |
| Craft | 7.6 | 0.25 | 1.90 |
| Functionality | 9.0 | 0.10 | 0.90 |

**Weighted total: 7.9 / 10**

## Fix verification (iteration-1 top 6)
| # | Item | Status | Observed |
|---|---|---|---|
| 1 | Owner nav | Fixed | One row on desktop, width matches content, outlined inactive tabs. Mobile: even 2-col tabs. Nav is still full-white slab, slightly heavy. |
| 2 | Review layout | Mostly fixed | Two-column with sticky publish card, mint header when published, outlined sticker tags, butter objective note. Published header: "Đang hoạt động" pill is cramped beside the mascot and wraps on desktop (d-10-published). |
| 3 | Mascot | Fixed | Outlined mitts, orange feet, clipboard prop in all moods; reads as own character. Clipboard is small and slightly detached from the arm in cheer pose. |
| 4 | Respondent hero/progress | Fixed | Smaller title, mascot on card edge, translucent bar (no hard shadow). Bar text over content 10.2-13.5:1. |
| 5 | Rating/NPS | Fixed | Star stickers (with digits) and 6+5 NPS grid, no orphan. Selected state not screenshotted; digits inside stars are small. |
| 6 | Empty dashboard | Fixed | Single CTA, tighter card. |

## Contrast (numeric)
mint-ink on mint-soft chips 5.59; pink-ink on pink-soft tags 5.59; brand-ink on brand-soft 8.01; muted on cream 6.63; muted on sun-soft 6.20; muted on brand-soft 5.94; ink on sun 9.52; white on brand 6.30; danger on danger-soft 5.60; progress bar (card/85 blur) over cream 13.47, over brand-soft 13.27, worst-case over dark content 10.18; control border edge on white 3.16 (non-text >=3). No AA failures. Reduced-motion block still present.

## Regressions
- Idea page (/surveys/new) during generation: two mascots on screen at once (small one in the header card, big thinking one in the progress card) - redundant and crowds the header (d-07).
- Review page: question cards animate in with staggered opacity; second card looked washed out in a screenshot at ~0.7s (d-09-review). Low severity, but shorten stagger.
- Published panel header pill overlaps/crowds mascot.

## Remaining prioritized changes
1. Publish panel header (review, desktop+mobile): stack the "Đang hoạt động: phiên bản 1" pill below the title instead of beside it; give mascot a fixed box so pill never touches it.
2. Idea page: hide the header mascot while generating (or drop it from the header entirely) so the thinking mascot is the single focal point; add a stage prop (magnifier/pencil/tick) per stage.
3. Respondent: give answered/selected state a stronger celebratory moment (bigger star pop, mascot happy on progress bar at each answer) and bump digit size in star stickers; make the choice cards' checked state more distinct than the butter fill alone.
4. Auth/landing: `/` is still just a redirect; mobile auth hero is only a mascot with no brand tagline - add the tagline under the mascot on mobile.
5. Owner nav: lighten the nav slab (thinner shadow, less white mass) and show active tab on review/responses pages (currently none highlighted).
6. Responses: add a subtle mascot moment in the populated state and a chart-style bar for completion; the stat cards are strong, the list below is still text-dense.

## Screenshots
Most representative: d-10-published.png, d-07-generating-a.png, m-13b-errors-full.png, d-15-thanks.png.
