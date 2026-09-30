# Design Evaluation - Iteration 001

Evaluation mode: real Chromium screenshots (Playwright script, system Chrome) at 390x844 and 1280x800, prod build on :3100, mock API. Screenshots: gan-harness/design/screenshots/iter-001/

Commands: typecheck pass, lint pass, npm test 375/375 pass, build pass. Flow works end to end (signup, generate, review, publish, respondent validation, submit, thank-you, responses, not-found). No horizontal overflow at 390px on any screen. Touch targets under 44px: only sr-only labels (false positive). Reduced-motion: global animation:none + ~0 transitions present.

| Criterion | Score | Weight | Weighted |
|---|---|---|---|
| Design Quality | 7.5 | 0.35 | 2.63 |
| Originality | 7.5 | 0.30 | 2.25 |
| Craft | 7.0 | 0.25 | 1.75 |
| Functionality | 9.0 | 0.10 | 0.90 |

**Weighted total: 7.5 / 10**

## What works
- Cohesive sticker system: plum outlines, offset pop shadows, polka-dot cream, grape primary, butter/pink/mint accents. Baloo 2 renders Vietnamese diacritics cleanly.
- Bong mascot is consistent and used with real mood variety (wink login, cheer signup, sleepy empty, thinking generating, sad not-found, happy thank-you with confetti). Progress bar rider on respondent page is a nice touch.
- Respondent page: choice cards are large, error cards get pink border + inline message + summary, thank-you and not-found are charming.
- Responses stat cards (lavender/butter/mint) are the strongest desktop screen.

## Problems (prioritized visual changes)
1. Owner nav (OwnerShell), all owner screens: nav pill is wider (~895px) than the content column (~865px) on desktop and misaligned with hero cards; the tab row wraps onto a second line even on 1280 with lots of empty space, and on 390 the inactive tab "Tạo khảo sát" is tiny, low-emphasis and unbalanced against the Logout button. Put logo, tabs and logout on one row at >=md, align nav width to content, give inactive tabs a visible pill hover/border.
2. Review page (/surveys/[id]), desktop: page is text-heavy and flat below the hero. Publish panel is a large empty butter block with one line and a button; question cards are plain white with tiny tags. Add sticker-style tags, mascot state on the panel that changes when published, and a two-column layout (questions + sticky publish panel) at >=lg.
3. Mascot art: arms read as flat yellow rectangles/stubs behind the body (cheer pose at signup and thank-you); feet barely visible. Redraw arms as rounded, outlined mitts with the same 2px plum stroke; add a distinct detail (e.g. tiny scarf/apron) so it feels like SurveyAI's own brand rather than a generic fruit emoji.
4. Respondent page hero (mobile): title in big grape Baloo wraps to 3 lines with the mascot crowding the top-right corner; sticky progress bar overlaps content on scroll with a hard shadow. Reduce hero title size at 390, move the mascot to sit on the card edge, and drop the progress bar shadow (or make it translucent) when stuck.
5. Rating and NPS options (respondent): plain outlined circles with no emoji/face cues; scale 0-10 wraps to 3 rows with an orphan "10". Use 6-per-row grid for NPS or a horizontal scroll-free 2-row layout, and add face/star stickers for 1-5 rating with selected pop state.
6. Empty dashboard (mobile): dashed card is very tall with generous dead space; hero + empty card both promote "create" (duplicate CTAs). Remove the hero CTA when empty or shorten the empty card.
7. Generating screen: fast in mock so hard to see; ensure a minimum display time in visual only via animation of stages (no logic change) and add a per-stage mascot prop (magnifier/pencil/checkmark) for delight.
8. Landing: `/` is only a redirect, so there is no branded landing; the spec listed `/` as a screen. If routing behavior must stay, at least give the login/signup hero a stronger brand statement on mobile (currently only the mascot, tagline hidden below lg).
9. Minor: muted body text on lavender/butter hero is small (14-15px) and light; bump weight/size. Focus ring on primary button is a light grape halo, visible but low contrast against the grape button; use a plum/sun double ring.
10. Minor: responses list rows are visually plain vs the rest of the system (thin pink left rule only); wrap each answer in a sticker card.

## Contrast
Generator's ratios (ink on cream 12.8, muted on white 7.0, white on grape 6.3, pink-ink 6.4) are consistent with what was seen; no visible failing pairs. Edge border 3.2:1 acceptable for controls.
