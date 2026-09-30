# Evaluation - Iteration 002 (mode: code-only, fix verification)

## Command results (run independently)
- `npm run typecheck`: PASS
- `npm run lint`: PASS (0 problems; config is still stock)
- `npm run build`: PASS (Next 16.3.7, 8 static pages, same route set)
- `npm run test:coverage`: PASS, 23 files / 375 tests. src/lib/** Lines 99.8%, Stmts 99.14%, Branch 98.19%, Funcs 99.35%.
- Hard gates green, no cap.

## Fix verification
| Fix | Verdict | Evidence |
|---|---|---|
| generation.ts forces status/id/ownerId | FIXED | generation.ts:56-62 overrides after safeParse; hardening.test.ts:8 uses a hostile generator (published, foreign id/owner) and asserts draft, server id, no versions |
| store schemaVersion + corrupt backup | FIXED | store.ts:31-46 backs up raw under `.corrupt-<ts>` before first write; read never writes; tests cover bad JSON, old schema, no backup when valid |
| API mode gating, demo notice, mockPasswordHash | FIXED | api/index.ts resolveApiMode throws in production without `mock`, and on unknown modes; mode.test.ts; AuthForm.tsx:63 notice + test; auth.ts:65,80 mockPasswordHash |
| safeNextPath hardening | FIXED | navigation.ts rejects control/whitespace/backslash (also after decodeURIComponent), `//`, absolute URLs, and /login and /signup targets; parametrized tests present |
| next.config.ts headers, poweredByHeader | FIXED | nosniff, referrer, XFO, CSP (frame-ancestors, object-src, base-uri), permissions-policy; poweredByHeader false. Full script-src CSP deferred (documented) |
| abuse.ts hardening | FIXED | NFKC, `\p{Cf}` strip, separator collapse, squashed terms, plurals, VI terms, contextual `so the`; objective/segment scanned (abuse.ts:98-125); negative tests in abuse.hardening.test.ts |
| Respondent session reuse on reload | FIXED | respond.ts startResponse uses per-slug+version key in a session-scoped adapter; completed sessions are not reused; tests |
| useApiQuery keeps data, ApiErrorCode typing | FIXED | useApiQuery.ts keeps success state and sets `refreshError`; code typed as ApiErrorCode |
| respond.ts total == rows | FIXED | describeOrphanResponse placeholder rows; total = responses.length |
| Blank open text = no answer; cleanAnswers | FIXED | answerValidation.ts:128 cleanAnswers, used at RespondentForm.tsx:96; clean.test.ts |
| RequireAuth subscribes to session | FIXED | RequireAuth.tsx:53 api.subscribe(check), cleanup on unmount |
| AbortSignal / no navigation after unmount | FIXED | generation.ts throwIfAborted between attempts; IdeaForm aborts on unmount and guards on signal.aborted; tests |
| RespondentForm clears serverErrors on change | FIXED | RespondentForm.tsx:71-74 |
| PublicSurvey strips fields, SLUG_PATTERN | FIXED | respond.ts:37-50 whitelists id/type/text/required/options/maxSelections/allowOther; slug pattern in schema with test |
| ESLint architecture rules (item 3) | NOT FIXED (accepted) | eslint.config.mjs stock; architecture.test.ts regex checks substitute |

## Scores
| Criterion | Weight | Score |
|---|---|---|
| Spec coverage (S0+S1 1-10) | 30% | 8.5 |
| Analysis-ready schema and generator | 20% | 9.0 |
| Tests and coverage | 20% | 8.5 |
| Architecture / swap-ability | 15% | 8.0 |
| Code quality and a11y-in-code | 15% | 8.5 |

**Weighted total: 8.5 / 10**

Verdict: PASS (threshold 7.5). Iteration 1 was 8.3, gain 0.2.

## Regressions / new bugs
- None blocking. Minor items below.

## Remaining issues
### CRITICAL
- None.
### HIGH
- None.
### MEDIUM
1. ESLint does not enforce architecture rules (eslint.config.mjs stock). Regex greps in src/architecture.test.ts are bypassable and only run in tests. Needs the user to allow editing the config (no-restricted-globals for localStorage/sessionStorage with a storage.ts override, no-restricted-imports of `@/lib/api/mock*` from src/app and src/components).
2. getApiClient() (api/index.ts:37-41) throws at runtime in the browser if a production deploy lacks NEXT_PUBLIC_API_MODE=mock. This is intended, but the build passes and the failure only appears when the page loads. Consider failing the build via next.config.ts or an env check.
### LOW
3. navigation.ts:32 blocks only exact `/login` and `/signup`. `/login/` or `/LOGIN` pass through (harmless, framework redirect). Normalize the trailing slash and case.
4. generation.ts:83-86 still runs a store.update only to allocate an id, causing a needless write and subscribe emit per generation. Allocate the id inside the final update.
5. Coverage is measured on src/lib/** only. UI components are not in the coverage report.
6. Uncovered defensive branches: navigation.ts:27, auth.ts:71, generation.ts:59, responseView.ts:42, answerValidation.ts:96, context.ts:27. Remove or test.
7. abuse.ts intentionally blocks "reset your password" style copy (false positive by design). Keep it documented.
8. Spec's default 6-8 questions is still not enforced in generation.ts or the schema (survey.ts max is 30). It holds only implicitly through templates.
