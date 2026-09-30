# Eval rubric — S0 + S1 (eval-mode: code-only)

Evaluator does **not** use a browser. It scores from the repo: runs `npm run typecheck`, `npm run lint`, `npm run build`, `npm run test:coverage`, and reads code against `gan-harness/spec.md`.

**Hard gates (score capped at 4/10 if any fails):** typecheck, lint, build, tests all green.

| Criterion | Weight | 10 = |
|---|---|---|
| Spec coverage (S0 + S1 items 1–10) | 30% | Every numbered item implemented; nothing out-of-scope built |
| Analysis-ready schema & generator rules (AR-01…08) | 20% | Zod schema has all fields; generator provably satisfies AR-02/03/04/05/06/07; published snapshot immutable |
| Tests & coverage | 20% | ≥ 80% lines on `src/lib/**`; tests assert behavior listed in Definition of done, including retry-then-fail and abuse check VI+EN |
| Architecture / swap-ability | 15% | UI only talks to `ApiClient`; mock isolated in `src/lib/api/mock`; no `localStorage` access outside the storage adapter; strings in `src/i18n/vi.ts` |
| Code quality & a11y-in-code | 15% | Strict TS, no `any`, small files (< 400 lines), labeled inputs, keyboard-operable controls, no console noise, immutable data updates |

**Pass threshold: 7.5 / 10.** Max iterations: 5. Stop early on plateau (< 0.3 gain over 2 iterations).

Evaluator output per iteration: score per criterion, failing commands with output excerpts, and a prioritized fix list for the generator.
