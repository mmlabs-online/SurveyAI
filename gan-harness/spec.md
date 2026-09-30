# SurveyAI — MVP build spec (S0 + S1, frontend only, mock API)

Source: `spec/feature-mvp.md` (Phase 1 feature list). This spec covers **only** slices S0 and S1.

## Locked decisions

- **Frontend only.** No real backend. All server behavior lives behind a typed `ApiClient` interface with a **mock implementation** (in-memory + `localStorage` persistence, simulated latency). A real HTTP client can be swapped in later without touching UI code.
- Stack: **Next.js (App Router) + TypeScript strict + Tailwind CSS + Zod + Vitest + React Testing Library**. npm. No other UI frameworks.
- UI language: **Vietnamese** (all user-facing strings in one `src/i18n/vi.ts` dictionary). Mobile-first layouts.
- Mock data only: no network calls, no real LLM, no real auth provider.

## S0 — Scaffold

1. Next.js app at repo root (`src/` layout), scripts: `dev`, `build`, `lint`, `typecheck` (`tsc --noEmit`), `test` (`vitest run`), `test:coverage`.
2. **Survey schema** `src/lib/schema/survey.ts` (Zod, types inferred) — analysis-ready from day one:
   - Survey: `id`, `title`, `intro`, `thankYou`, `questions[]`, `source` `{ idea, clarifyAnswers, industry?, surveyType? }` (AR-01), `goal`, `status` (`draft` | `published`), `createdAt`, `updatedAt`.
   - Question: stable `id` (AR-07), `type` (`single_choice` | `multiple_choice` | `rating` | `nps` | `open_text`), `text`, `required`, `options[]` with stable option `id` + `label` (AR-07), `maxSelections?`, `allowOther?`, `objective` (AR-02), `standardScale?` (`NPS` | `CSAT` | `CES`, AR-03), `analyze` (true for `open_text`, AR-04), `segment?` dimension string (AR-06).
   - PublishedVersion: `surveyId`, `version`, `slug`, `snapshot` (frozen survey), `publishedAt` (PUB-01, AR-08).
   - Response: `id`, `surveyId`, `version`, `answers` (keyed by question id, raw), `submittedAt` (AR-08).
   - Id generator that never reuses ids.
3. **ApiClient interface** `src/lib/api/types.ts` + `src/lib/api/mock/` implementation + `src/lib/api/index.ts` returning the active client. Mock store persists to `localStorage` behind a storage adapter that also works in-memory (tests, SSR).
4. **AI call log** (ADM-02/04 data side): every mock AI call records `{ userId, surveyId?, taskType, model: "mock-llm", tokensIn, tokensOut, durationMs, estimatedCost, status: ok|invalid_json|timeout|error }`.

## S1 — Idea → survey → publish → respond → see responses

User journey, all through the mock API:

1. **ACC-01 (mock auth):** `/signup`, `/login`, logout. Email + password (≥ 8 chars) validated; duplicate email rejected; session kept in the mock store. Protected owner routes redirect to `/login`. Mock users are auto-verified (ACC-03 later).
2. **GEN-01 Idea input** `/surveys/new`: textarea, 10–2,000 characters (count Unicode chars, Vietnamese with or without diacritics). Under 10 chars shows a message asking for more detail; over 2,000 blocked. Optional quick picks: industry (F&B, Spa, Bán lẻ, Phòng khám, Khác) and survey type (Hài lòng khách hàng, Tìm nguyên nhân, Ý tưởng sản phẩm mới, Khác).
3. **GEN-04 Generation ("Bỏ qua, tạo ngay" path; GEN-03 clarifying questions are S2):** mock generator builds a survey deterministically from idea + picks:
   - Default length 6–8 questions.
   - Includes an NPS question with `standardScale: "NPS"` and standard wording for satisfaction types; CSAT for satisfaction ratings.
   - Goal "Tìm nguyên nhân" → at least one `open_text` question with `analyze: true` (AR-05).
   - At least one segment question (e.g. visit frequency) tagged with `segment` (AR-06).
   - Every question has `objective` (AR-02). `source` stores idea + picks (AR-01).
   - Output is **validated with the Zod schema**; on invalid output retry up to 2 times, then show an error with a "Thử lại" button. (The mock must be injectable with a faulty generator so this path is testable.)
   - Progress UI shown while generating (simulated latency).
4. **GEN-07 Abuse check:** survey text (title/intro/questions/options) asking for passwords, OTP, card numbers, CVV, bank PINs (Vietnamese + English patterns: `mật khẩu`, `OTP`, `mã xác thực`, `số thẻ`, `CVV`, `password`, `card number`, …) → publish is blocked with a reason naming the offending question.
5. **Survey review page** `/surveys/[id]`: shows the generated survey (read-only in S1; editor is S3), with a "Xuất bản" button.
6. **PUB-01 Publish:** creates an immutable `PublishedVersion` snapshot and short slug (6–8 url-safe chars, unique). Shows the link `/s/[slug]` with a copy button. Re-publishing creates a new version; earlier responses stay tied to their version.
7. **RSP-01 Respondent page** `/s/[slug]`: no login, mobile-first, progress bar, renders all 5 question types, keyboard navigable, labeled inputs, WCAG-AA-friendly colors. Unknown slug → friendly not-found message.
8. **RSP-03 Validation:** required questions, `maxSelections` on multiple choice, "Khác" (other) requires text when chosen. Missing required answers highlighted before submission; nothing stored until valid. Thank-you screen after submit.
9. **COL-06 Response overview** `/surveys/[id]/responses`: total responses, completion rate (completed / started — track `started` when respondent answers the first question), raw response list showing option **labels** (not ids). Count refreshes without reload (poll mock store or subscribe to `storage` events).
10. **Dashboard** `/dashboard`: list of the owner's surveys with status and response count; link to create new.

## Out of scope (do not build)

Clarifying questions, AI quality review, sensitive notice/consent, editor, QR, share buttons, open/pause/close, CSV, delete, Google login, email verification, admin UI, analytics, real backend.

## Definition of done

- `npm run typecheck`, `npm run lint`, `npm run build`, `npm test` all pass.
- Coverage ≥ 80% lines on `src/lib/**`.
- Tests cover: schema validation, generator AR rules, retry-then-fail path, abuse check (VI + EN), publish immutability + slug uniqueness, respondent validation (required, maxSelections, other text), response overview labels + completion rate, auth (signup/login/duplicate/redirect).
