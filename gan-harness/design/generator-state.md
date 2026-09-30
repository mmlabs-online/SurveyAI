# Generator State (design) - Iteration 001

## Concept: "Bong" - sticker-cute
Warm cream paper with a faint pink polka-dot, plum ink outlines (2px) and chunky offset "pop" shadows on buttons, chips, hero cards and stickers. Softer 5px line-colored shadows on content cards. Radii are big (bubble 28px, pills, 36px hero panels).

### Palette (hex, key contrast ratios)
- cream #fff7f0 (bg), card #ffffff, ink #3a2647, muted #65526f, line #f0dfe6, edge #9a8ca3 (control border)
- brand grape #6741d9 (dark #5233b8, ink #4c2ba8, soft #efe9ff), bubblegum pink #ff8fb1 (soft #ffe3ec, ink #b3134f)
- butter sun #ffd43b (soft #fff1b8), mint #7ee0b5 (soft #d3f5e6, ink #0a6b4a), danger #b42323 (soft #ffe8e8)
- ink on cream 12.8, ink on white 13.6, muted on cream 6.6 / white 7.0 / brand-soft 5.9
- white on brand 6.3, white on brand-dark 8.3, brand-ink on brand-soft 8.0
- pink-ink on cream 6.4 / pink-soft 5.6, mint-ink on mint-soft 5.6
- danger on white 6.6 / danger-soft 5.6, ink on sun 9.5, ink on sun-soft 12.0
- edge border on white 3.2 (non-text 3:1)

### Type
Baloo 2 (display, 500-800) + Nunito (body, 400-800), both next/font/google with the `vietnamese` subset (verified in font-data.json).

### Mascot "Bong"
Original inline-SVG butter-yellow dumpling with a mint sprout, blush cheeks, outlined sticker style. Moods: happy, wink, cheer (arms up, sparkles), thinking (thought bubble), sad (tear), sleepy (zzz), wow. Used in auth hero, dashboard hero and rows (cheer = published, sleepy = draft), empty states, loading/error states, generation progress (thinking, wink, wow per stage), publish panel, respondent header, progress-bar rider (rides the fill end), thank-you (with confetti), not-found (sad). Mini logo badge.

### Motion (all off under prefers-reduced-motion: animations disabled, transitions ~0, confetti hidden)
Mascot float and blink, button squish (press translate/scale, hover lift, boing easing), chip and choice-card pop, animated star/spark twinkle, bouncy overshoot progress bars with moving stripes, rise-in for cards, shake on validation errors, bouncing-dots spinner, wiggle on logo hover.

## Files changed
- Design system: src/app/globals.css, src/app/layout.tsx, src/components/ui/{Button,Alert,Field,QueryState}.tsx; new ui/{Mascot,Sparkle,Logo,Confetti,Sticker}.tsx (Sticker exports Sticker, Tag, Card)
- Screens: auth/AuthForm.tsx, auth/OwnerShell.tsx (floating pill nav, aria-current tabs), survey/{DashboardView,IdeaForm,ChipGroup,GenerationProgress,PublishPanel,QuestionPreview,SurveyReview,ResponsesOverview}.tsx, respondent/{RespondentForm,QuestionFrame,ChoiceQuestion,ScaleQuestion,OpenTextQuestion}.tsx
- No changes to src/lib, ApiClient, routes, i18n strings, or tests. `/` still redirects to /dashboard (route behavior unchanged, so no separate landing page).

## Command results
- npm run typecheck: pass
- npm run lint: pass
- npm test: 23 files, 375 tests pass
- npm run build: pass
- Manual Playwright walk (390 and 1280, dev server): signup, dashboard, idea, generating, review, publish, respondent, errors, thank-you, not-found, responses all render and work.

## Notes / known issues
- A pre-existing `next dev` on port 3000 was already running (not started by me); I left it. My own prod server on 3210 was stopped.
- A production build needs NEXT_PUBLIC_API_MODE=mock to run (existing behavior).
- Full-page screenshots show the sticky progress bar mid-page (screenshot artifact).

# Iteration 002 changes
- OwnerShell: logo + tabs + logout on one row from md, width max-w-5xl matching content; inactive tabs have visible outlined pill; mobile tabs form an even 2-column row under logo/logout.
- Review page: lg two-column layout (questions left, sticky publish panel right); on mobile the panel comes first. Publish panel redone as white card with colored header band (butter -> mint when published), mascot wow while publishing / cheer once published, copy button + dashed URL box. Tags are now outlined stickers (Tag restyled), objective in a butter note.
- Mascot: arms redrawn as outlined mitts (raised arms end in round mitts), larger orange feet, signature prop = tiny survey clipboard (pink clip, green tick) in every mood and in the Logo.
- Respondent: title text-2xl on mobile, mascot seated on the header card edge, sticky progress bar translucent + backdrop blur with no hard shadow. NPS is a 6-column grid (6+5, no orphan), rating is 5 star stickers with pop/select state (still radio inputs, sr-only, focus outline). i18n has no low/high anchor labels, so none were added.
- Dashboard: hero CTA hidden when empty (single CTA in empty card), empty card tightened, subtitle larger.
- Buttons: focus ring is a plum (ink) outline with offset 4.
- Responses list: numbered tilted sticker, time and version chips, answers as mint chips.
- Commands: typecheck pass, lint pass, build pass, test 23 files / 375 tests pass. No servers started by me left running (a pre-existing dev server on :3000 was not mine).
