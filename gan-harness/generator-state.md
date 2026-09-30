# Generator State — Iteration 001

## What Was Built
Frontend-only Next.js 16 (App Router, TS strict, Tailwind 4, `src/` layout) app covering S0 + S1 against a mock `ApiClient`.

S0: scaffold + scripts (`dev build lint typecheck test test:coverage`); Zod survey schema with AR-01..08 fields and cross-field refinements; never-reusing id generator (persisted counter); `ApiClient` interface + mock (in-memory / `localStorage` behind a storage adapter, simulated latency); AI call log per generation attempt.
S1: mock auth (signup/login/logout/protected routes), idea input with 10-2000 Unicode-char rule and quick picks, deterministic generator (goal-based templates) with Zod validation + 2 retries + injectable faulty generator + "Thử lại", progress UI, abuse check (VI + EN, diacritic-insensitive) blocking publish and naming the question, review page, publish (immutable frozen snapshot, unique 7-char slug, same slug across re-publish, new version), respondent page (all 5 types, progress bar, validation, thank-you, not-found), response overview (total, started, completion rate, labels, live refresh via store subscribe + storage event + 4s poll), dashboard.

## File Map
- `src/lib/schema/` survey.ts (Zod + types), ids.ts, aiLog.ts
- `src/lib/api/` types.ts (ApiClient), errors.ts, index.ts (`getApiClient`/`setApiClient`)
- `src/lib/api/mock/` storage.ts (only place touching localStorage), store.ts, state.ts, client.ts, auth.ts, surveys.ts, respond.ts, generation.ts (retry/log), generator.ts, queries.ts, context.ts
- `src/lib/survey/` idea.ts, abuse.ts, answerValidation.ts, responseView.ts, slug.ts, freeze.ts
- `src/lib/navigation.ts`, `src/lib/format.ts`
- `src/i18n/vi.ts` (all UI strings) + `gen.vi.ts` (generator templates, re-exported as `vi.gen`)
- `src/components/{ui,auth,survey,respondent}/`, `src/hooks/useApiQuery.ts`
- `src/app/`: `/` (redirect), `/login`, `/signup`, `(owner)/dashboard`, `(owner)/surveys/new`, `(owner)/surveys/[id]`, `(owner)/surveys/[id]/responses`, `/s/[slug]`
- Tests: colocated `*.test.ts(x)` in `src/lib/**` and `src/components/**`, `src/architecture.test.ts` (localStorage confined to adapter, UI never imports mock, no `any`, files < 400 lines, no console, Vietnamese strings only in i18n), helpers in `src/test/helpers.ts`.

## Fix Pass After Review (iteration 1 feedback)
Done: 1 (generator id/ownerId/status forced after validation), 2 (schemaVersion + corrupt-value backup key `surveyai.mock.v1.corrupt-<ts>` before any reset), 4 (`resolveApiMode`: production without NEXT_PUBLIC_API_MODE=mock throws; demo notice on auth forms; `mockPasswordHash`; `.env.example`), 5 (safeNextPath hardened), 6 (next.config.ts headers, poweredByHeader off), 7 (abuse: NFKC, Cf strip, separator collapse, plurals, new terms, contextual `số thẻ`, objective/segment scanned, squashed check for letter-spaced text; "reset your password" is deliberately blocked), 8 (respondent session remembered per slug+version in a session-scoped storage adapter, reused on reload), 9 (useApiQuery keeps last data, `refreshError`, typed code, reload after error shows loading), 10 (placeholder rows keep total == list length), 11 (blank text = no answer; `cleanAnswers` trims/drops empties before submit), 12 (RequireAuth subscribes to store), 13 (AbortSignal in GenerateOptions, checked between attempts; IdeaForm aborts on unmount), 14 (server error cleared per question on change), 15 (PublicSurvey questions carry only id/type/text/required/options/maxSelections/allowOther; SLUG_PATTERN was already enforced in publishedVersionSchema and is covered by a test).

NOT done: item 3 (ESLint rules). The config-protection hook refused two writes to `eslint.config.mjs` (message: "Modifying eslint.config.mjs is not allowed ... disable the config-protection hook temporarily"); it did not ask for facts, only for the hook to be disabled, which I did not do. The intended rule set (no-restricted-globals/properties for localStorage/sessionStorage with a storage.ts override, no-restricted-imports of `@/lib/api/mock*` in src/app and src/components, no-explicit-any error, no-console) needs the user to allow the edit; until then `src/architecture.test.ts` enforces them. (`no-explicit-any` is already an error via next/typescript.)

## Command Results (after fix pass)
- `npm run typecheck`: pass
- `npm run lint`: pass
- `npm run build`: pass
- `npm run test:coverage`: 23 files, 375 tests pass; `src/lib/**` lines 99.8%, statements 99.1%, branches 98.2%

## Known Gaps / Notes
- `eslint.config.mjs` is still the stock config (hook-blocked, see above).
- Mock password hashing is a non-secure stand-in (documented in code).
- Component tests cover the main UI flows; coverage is measured on `src/lib/**` only.
- No git commit made (gated). `npm run dev` not started (code-only eval).
- Survey `ownerId` was added to the Survey schema (needed for owner scoping); `goal`/`surveyType`/`industry` are enums (keys), labels live in `vi.ts`.
- Unpublished draft surveys stay in the store when the user leaves the review page (no delete: out of scope).
