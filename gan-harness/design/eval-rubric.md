# Design eval rubric — SurveyAI "cute hơn" redesign

Evaluator runs the app (`npm run build` then `npm run start -- -p 3100`, or `npm run dev -- -p 3100`) and takes **real screenshots** with Playwright at **390×844 (mobile)** and **1280×800 (desktop)** of every screen in `spec.md`, walking the real flow: sign up → create survey from an idea → review → publish → open `/s/<slug>` → trigger a validation error → submit → thank-you → responses page → an unknown slug. Screenshots go to `gan-harness/design/screenshots/iter-NNN/`. Also run `npm run typecheck`, `npm run lint`, `npm test`.

Ask: **"Would this win a design award for a friendly consumer product?"** Be a tough judge; 7 is good, 9 is exceptional.

### Design Quality (weight: 0.35)
Cohesive cute visual system: palette, type, shape language, spacing, hierarchy. Looks deliberate on both mobile and desktop. Vietnamese text renders well.

### Originality (weight: 0.30)
Memorable personality: mascot/illustration quality and consistency, distinctive details, not a generic template. Does it feel like *SurveyAI's* own brand?

### Craft (weight: 0.25)
Polish: alignment, consistent radii/shadows, states (hover, focus, pressed, disabled, error, loading, empty), motion quality and reduced-motion support, AA contrast (check key pairs numerically), touch targets ≥ 44px, no layout overflow at 390px.

### Functionality (weight: 0.10)
Flow still works end to end; typecheck, lint, tests all pass. **Any failing command or broken flow caps the total at 5.0.**

**Pass threshold: 7.5 / 10.** Max iterations: 5. Stop on plateau (< 0.3 gain over 2 iterations).

Feedback file per iteration: `gan-harness/design/feedback/feedback-NNN.md` with per-criterion scores, a line formatted exactly `**Weighted total: X.X / 10**`, screenshot paths, what works, and a prioritized list of concrete visual changes (screen + element + what to do).
