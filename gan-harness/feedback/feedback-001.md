# Evaluation - Iteration 001 (mode: code-only)

## Command results (run independently)
- `npm run typecheck`: PASS (no output)
- `npm run lint`: PASS (0 problems)
- `npm run build`: PASS (Next 16.3.7 Turbopack, 8 static pages, routes /, /dashboard, /login, /signup, /s/[slug], /signup, /surveys/[id], /surveys/[id]/responses, /surveys/new)
- `npm run test:coverage`: PASS, 17 files / 299 tests. src/lib/** Lines 100%, Stmts 99.41%, Branch 97.25%, Funcs 99.3% (threshold 80% lines)
- Hard gates all green, so no cap applies.

## Scores
| Criterion | Weight | Score |
|---|---|---|
| Spec coverage (S0+S1 1-10) | 30% | 8.5 |
| Analysis-ready schema and generator (AR-01..08) | 20% | 8.5 |
| Tests and coverage | 20% | 8.0 |
| Architecture / swap-ability | 15% | 8.5 |
| Code quality and a11y-in-code | 15% | 8.0 |

**Weighted total: 8.3 / 10**

Verdict: PASS (threshold 7.5).

## Verification notes (what I checked in code, not claims)
- AR-01: `source` {idea, clarifyAnswers, industry?, surveyType?} in schema (survey.ts:96) and populated by generator (generator.ts:233).
- AR-02: `objective` required, min(1) (survey.ts:46); every template spec supplies one.
- AR-03: NPS question always included with standardScale NPS; CSAT on rating. Schema refinement enforces NPS<->nps type coupling (survey.ts:78-89).
- AR-04: `analyze` required boolean; refinement forces true for open_text (survey.ts:90); buildQuestion sets `analyze = type === "open_text"` (generator.ts:94).
- AR-05: root_cause template contains two open_text questions (generator.ts:142,150).
- AR-06: every template ends with frequency (segment `visit_frequency`) and age (`age_group`).
- AR-07: stable q/o ids from never-reusing generator with persisted counter; unique-id refinements present.
- Retry-then-fail: generation.ts:89-116 loops 3 attempts (1+2 retries), validates with surveySchema.safeParse, logs each attempt, throws `generation_failed`; IdeaForm shows the message plus a "Thu lai" button that re-invokes generate (IdeaForm.tsx:76-83), idea state preserved. Works.
- Abuse: `checkSurveyAbuse` diacritic-insensitive, covers title/intro/thankYou/question/option; publish throws `abuse_blocked` with `vi.errors.abuseBlocked(questionText)` naming the question (surveys.ts:56-62); nothing stored on block.
- Immutability: publish does `deepFreeze(structuredClone(published))` (surveys.ts:74); re-publish appends a new version and reuses the slug; earlier responses are pinned by `version` and resolved against their own snapshot (respond.ts:87, 140). getPublicSurvey clones and freezes. Tests exist for each.
- Respondent validation: required / maxSelections / other-text / unknown-id / shape / range enforced client-side and re-enforced in submitResponse (nothing stored until valid). Session `started` created on first answer (RespondentForm.tsx:60-69).
- Completion rate = completed/started via `computeCompletionRate`; overview rows use `describeResponse` with labels.
- Protected routes: RequireAuth redirects via `router.replace(loginRedirectUrl(pathname))`.
- Architecture: `localStorage` only in storage.ts (grep confirmed); UI imports only `@/lib/api`; only 2 test files import from mock (acceptable). No `any`, no console, all files < 400 lines, Vietnamese text confined to i18n (+ abuse.ts regexes).
- SSR: storage is touched only inside effects/handlers; `createBrowserStorage` falls back to memory when `window` is absent; build passes; no hydration mismatch spotted.
- Out-of-scope features: none found (no editor, QR, share buttons, CSV, delete).

## Fix list (prioritized)

### CRITICAL
- None.

### HIGH
1. Generated draft trusts generator-supplied `status` / `ownerId` / `id`. `generation.ts:56-58,110-112` stores `parsed.data` as-is; a faulty or future real generator returning `status: "published"` (or another surveyId/ownerId) is saved verbatim without a PublishedVersion. Overwrite `id`, `ownerId`, `status: "draft"`, timestamps after validation, and add a test.
2. `store.read()` silently returns EMPTY_STATE when the persisted JSON fails Zod (`store.ts:19-26`). Any schema change (or one corrupt record) wipes all users/surveys/responses on the next write (update() persists the empty state over it). Add a version/migration path or at least refuse to overwrite an unparseable payload; test it.
3. Lint does not enforce the architecture rules (eslint.config.mjs is the stock config): rules live only in `src/architecture.test.ts` regex greps, which are weak (e.g. `:\s*any` misses `Array<any>`, `as unknown as any` variants; localStorage grep would miss `globalThis["local"+...]`). Add `no-restricted-globals`/`no-restricted-imports`/`@typescript-eslint/no-explicit-any` to eslint (already in next/typescript for any) or document the blocker; the generator noted a hook prevented this.

### MEDIUM
4. Abuse pattern `/\bso the\b/` (abuse.ts:24) matches normalized "số thế ..."/"so the" and gives false-positive blocks (e.g. "Bạn thấy số thế nào?"). Restrict to "so the" followed by non-letter-context or "so the (tin dung|ngan hang|atm|visa)"; add negative tests. There are no false-positive tests at all.
5. Abuse detection covers only literal keywords; obfuscation ("m.a.t k.h.a.u", zero-width chars) passes. Strip non-alphanumerics before matching, or add a test documenting the limit.
6. Spec asks default length 6-8 questions but neither the schema nor the generation path validates it (survey.ts:110 `min(1).max(30)`); the guarantee is only implicit in templates. Add a generator-level check (6-8) in the AR tests or validate in generation.ts.
7. `getResponseOverview` recomputes `started = max(sessions, responses)` (respond.ts:135); responses whose version snapshot is missing are silently dropped from the list while `total` still counts them (respond.ts:139-141), so total and list length can diverge. Make consistent.
8. `useApiQuery` swallows the previous data on reload/poll errors (sets error state, replacing successful data with an error) - a transient failure during 4s polling blanks the overview. Keep last data on refresh errors.
9. `startResponse` ignores the client-supplied `sessionId` when unknown and returns a new id; RespondentForm calls `startResponse(slug)` with no id, so a page reload counts as a new "started" session (inflating starts, deflating completion rate). Persist sessionId per slug or dedupe.

### LOW
10. Component tests are the only UI evidence; UI coverage is not measured (`vitest.config.mts` include is `src/lib/**`). Include `src/components/**` in reporting.
11. `mockHashPassword` is a djb2 stand-in; fine for a mock but keep the docs prominent, and consider timing/constant-compare irrelevant.
12. 4 uses of weak `toBeTruthy()/toBeDefined()` assertions in tests; tighten to concrete values.
13. Draft surveys accumulate (no delete, out of scope) - and generation runs `store.update` just to allocate an id (generation.ts:83-86), causing a needless storage write/subscribe emit per generation; allocate the id inside the final update instead.
14. `describeResponse`/overview and generator branches at ~92-97% branch coverage: uncovered lines auth.ts:71, generation.ts:55, responseView.ts:42, answerValidation.ts:96,100-105 (unreachable defensive branches) - remove dead code or test it.
