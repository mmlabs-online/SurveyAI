# SurveyAI — MVP Feature List (Phase 1: Idea → Survey)

| Field | Value |
|---|---|
| Status | Draft for review |
| Owner | Ming (feature definition, FE) |
| Audience | Ming, BE/AI owner |
| Based on | PRD v1.0 (29/09/2026), decisions in chat 30/09/2026 |
| Working name | "SurveyAI" (PRD placeholder) |

---

## 1. Scope and assumptions

### Decisions
- **Target segment:** SMEs — F&B, spa, retail, clinics (PRD §3.1, persona "chị Lan").
- **Phase 1 focus:** turn a plain-language idea into a ready-to-use survey, publish it, and collect responses.
- **Editor:** basic only. Natural-language editing (PRD B2) is deferred.
- **Analysis** (stats, theming, sentiment, AI report, CSV import) is **Phase 2**. Phase 1 surveys must be *analysis-ready* (§5) so Phase 2 adds analysis without reworking survey data.
- Project is independent: own auth (email + Google), no shared platform services.

### Assumptions (to be confirmed)
- Phase 1 generates surveys in Vietnamese; English UI is available but English survey generation is optional (see §8).
- Survey owners use phone first, desktop second (persona chị Lan).
- Prices and plan limits are not final (PRD §9); Phase 1 only needs the mechanism to enforce limits, with values configurable.

### Priority labels in this document
- **Must** — Phase 1 does not ship without it.
- **Should** — in Phase 1 if capacity allows; first to cut.
- **Phase 2 / Later** — listed in §6.

Owner column: **FE** (Ming), **BE** (BE/AI owner), **FE+BE** (both sides build parts).

---

## 2. Phase 1 user journey

```
[Sign up / log in]
   → [Describe idea]  (+ optional industry, survey type, idea starters)
   → [AI clarifying questions, 2–4, or "Skip"]
   → [AI generates survey]  → [AI review warnings]
   → [Basic edit + preview + test answer]
   → [Publish: short link, QR, share to Zalo/Facebook]
   → [Respondents answer on mobile, no login]
   → [Owner sees response count + raw responses, exports CSV]
```

Phase 1 success moment: a new user goes from sign-up to a shareable survey link in under 5 minutes (PRD §6 target), with most AI-generated questions kept as generated.

---

## 3. Feature list

### 3.1 Account (ACC)

| ID | Feature | Description | Priority | Owner | Depends on | PRD |
|---|---|---|---|---|---|---|
| ACC-01 | Email sign-up / login | Register with email + password, log in, log out | Must | FE+BE | — | F1 |
| ACC-02 | Google login | Sign in with Google | Must | FE+BE | — | F1 |
| ACC-03 | Email verification, forgot/reset password | Standard account recovery flows | Must | FE+BE | ACC-01 | F1 |
| ACC-04 | Delete account and all data | User-initiated, irreversible, with confirmation | Must | FE+BE | — | F1, F3 |
| ACC-05 | Plan limits | Enforce configurable limits (open surveys, responses per month, AI generations); show usage to user | Should | FE+BE | ADM-01 | F2, §9 |

### 3.2 Idea → Survey (GEN)

| ID | Feature | Description | Priority | Owner | Depends on | PRD |
|---|---|---|---|---|---|---|
| GEN-01 | Idea input | Free-text description of what the user wants to learn; optional quick picks for industry and survey type | Must | FE+BE | — | A1 |
| GEN-02 | Idea starters by industry | Clickable example ideas per SME industry (e.g. "why customers don't come back") that prefill GEN-01 | Should | FE | GEN-01 | A1 examples; replaces template library for Phase 1 |
| GEN-03 | AI clarifying questions | 2–4 quick-pick questions (goal, audience, length, answer channel); "Skip, generate now" | Must | FE+BE | GEN-01 | A2 |
| GEN-04 | AI survey generation | Full survey: title, intro, questions, thank-you, with progress shown while waiting | Must | FE+BE | GEN-03 | A3 |
| GEN-05 | AI quality review | Separate AI pass flags leading, double-barreled, ambiguous questions; missing/overlapping/unbalanced options; sensitive questions without skip; over-length. Per-warning "Apply" / "Dismiss"; "Re-check" button after edits | Must | FE+BE | GEN-04 | A4 |
| GEN-06 | Sensitive-domain notice | When the survey touches health, psychology or personal data, show a recommendation to consult an expert and a reminder about respondent consent | Must | FE+BE | GEN-04 | A7 |
| GEN-07 | Abuse check | Block surveys that ask for passwords, OTPs, card numbers or similar | Must | BE | GEN-04 | §10 (risk) |
| GEN-08 | Regenerate survey | Regenerate the whole survey from the same idea and clarify answers | Should | FE+BE | GEN-04 | new |

### 3.3 Basic editor (EDT)

| ID | Feature | Description | Priority | Owner | Depends on | PRD |
|---|---|---|---|---|---|---|
| EDT-01 | Add / delete / duplicate question | | Must | FE | GEN-04 | B1 |
| EDT-02 | Reorder questions | Drag and drop; must also work on mobile | Must | FE | EDT-01 | B1 |
| EDT-03 | Edit question content | Edit text, options, scale labels; change question type | Must | FE | EDT-01 | B1 |
| EDT-04 | Required / optional toggle | | Must | FE | EDT-01 | B1 |
| EDT-05 | Autosave | Save draft on every change; handle two-tab conflicts | Must | FE+BE | — | B1 |
| EDT-06 | Undo / redo | At least 20 steps | Must | FE | EDT-01 | B1 |
| EDT-07 | Edit intro and thank-you text | | Must | FE | GEN-04 | A3 |
| EDT-08 | Preview | Respondent view on phone and desktop | Must | FE | — | B3 |
| EDT-09 | Test-answer mode | Answer the survey without saving real data | Should | FE | EDT-08 | B3 |

### 3.4 Publish (PUB)

| ID | Feature | Description | Priority | Owner | Depends on | PRD |
|---|---|---|---|---|---|---|
| PUB-01 | Publish with short link | Creates an immutable published version and a short public link | Must | FE+BE | — | C1 |
| PUB-02 | QR code | Download QR as PNG/PDF | Must | FE+BE | PUB-01 | C1 |
| PUB-03 | Printable QR cards | Ready-to-print A5/A6 layouts with an invitation line | Should | FE | PUB-02 | C1 |
| PUB-04 | Quick share | Share to Zalo, Facebook; copy link | Must | FE | PUB-01 | C1 |

### 3.5 Respondent experience (RSP)

| ID | Feature | Description | Priority | Owner | Depends on | PRD |
|---|---|---|---|---|---|---|
| RSP-01 | Mobile-first respondent page | No login required; progress bar; all Phase 1 question types | Must | FE+BE | PUB-01 | C2 |
| RSP-02 | Consent screen | Shown first when the survey collects personal data; submission blocked without consent | Must | FE+BE | GEN-06 | C4 |
| RSP-03 | Answer validation | Required questions, max selections, "Other" text | Must | FE+BE | RSP-01 | C2 |
| RSP-04 | Closed / paused / full states | Clear message when the survey can't accept responses | Must | FE | COL-01 | C3 |
| RSP-05 | Referral footer | "Made with SurveyAI — try free" line on free-plan surveys | Should | FE | ACC-05 | C2 |

### 3.6 Collection management (COL)

| ID | Feature | Description | Priority | Owner | Depends on | PRD |
|---|---|---|---|---|---|---|
| COL-01 | Open / pause / close survey | Manual control | Must | FE+BE | PUB-01 | C3 |
| COL-02 | Auto-close | By end date and/or max response count | Must | FE+BE | COL-01 | C3 |
| COL-03 | Anonymous mode | No IP or device info stored | Must | BE | — | C3 |
| COL-04 | Duplicate prevention | Basic, cookie/device based; can be turned off | Must | FE+BE | — | C3 |
| COL-05 | Spam protection | Invisible captcha | Must | FE+BE | — | C3 |
| COL-06 | Response overview | Total responses, completion rate, list of raw responses | Must | FE+BE | RSP-01 | E2 (partial) |
| COL-07 | Per-question counts | Simple counts and percentages per option, computed in code; no charts or AI | Should | FE+BE | COL-06 | D1 (partial) — see §8 |
| COL-08 | CSV export | Raw data export | Must | FE+BE | COL-06 | E3 |
| COL-09 | Delete responses | Delete one response or all responses of a survey | Must | FE+BE | COL-06 | F3 |

### 3.7 Admin and operations (ADM)

| ID | Feature | Description | Priority | Owner | Depends on | PRD |
|---|---|---|---|---|---|---|
| ADM-01 | User and plan management | View users; upgrade plans manually | Must | FE+BE | — | F2, F6 |
| ADM-02 | AI usage and cost tracking | Tokens, duration and estimated cost by user, survey and task type | Must | FE+BE | — | F6 |
| ADM-03 | LLM status and fallback | Show self-hosted LLM health; switch to fallback provider | Must | FE+BE | — | F6 |
| ADM-04 | AI error log | Invalid JSON, timeouts | Must | FE+BE | — | F6 |
| ADM-05 | Product analytics events | Track the events needed for Phase 1 KPIs (§4.8) | Must | FE+BE | — | §2.2 KPIs |
| ADM-06 | Privacy policy and terms pages | Static pages; content requires legal review | Must | FE | — | F3 |

---

## 4. Acceptance criteria (Must features)

Numbers marked *(PRD)* are PRD initial proposals and may change after testing.

### 4.1 Account
- **ACC-01/02/03:** A user can register, verify email, log in with email or Google, reset a forgotten password, and log out. Unverified users can create drafts but cannot publish. *[proposal — confirm]*
- **ACC-04:** After confirmation, the account, surveys and all responses are deleted; the user is logged out; the email can register again.

### 4.2 Idea → Survey
- **GEN-01:** Accepts 10–2,000 characters, Vietnamese with or without diacritics *(PRD)*. Under 10 characters shows a request for more detail.
- **GEN-03:** 2–4 questions, quick-pick format; does not ask about information already in the idea; "Skip" uses sensible defaults.
- **GEN-04:**
  - Output validates against the survey schema; on invalid output BE retries up to 2 times *(PRD)*, then shows a retry option.
  - Question count matches the chosen length.
  - Standard scales (NPS, CSAT, CES) used when appropriate, with the source noted.
  - Progress is shown during generation; target ≤ 60 s self-hosted, ≤ 20 s provider *(PRD)*.
  - Output meets all analysis-ready requirements in §5.
- **GEN-05:** Each warning is shown next to its question with reason and suggested fix; "Apply" changes only that question; "Dismiss" hides the warning; "Re-check" runs the review again on the edited survey.
- **GEN-06:** Notice appears for health, psychology or personal-data surveys and automatically turns on the consent screen (RSP-02).
- **GEN-07:** Surveys asking for passwords, OTPs or card numbers cannot be published; the user sees why.

### 4.3 Editor
- **EDT-01–04, 07:** All edits are reflected immediately in preview.
- **EDT-02:** Reordering works by touch on mobile browsers.
- **EDT-03:** Changing question type keeps the question text; options are kept when the new type supports them.
- **EDT-05:** No change is lost on refresh; editing the same survey in two tabs shows a conflict message instead of silently overwriting.
- **EDT-06:** At least 20 undo/redo steps *(PRD)* within a session.
- **EDT-08:** Preview matches the real respondent page.

### 4.4 Publish
- **PUB-01:** Publishing produces a short link that works immediately. Responses are tied to the published version.
- **PUB-02:** QR scans correctly from a printed A6 card.
- **PUB-04:** Zalo and Facebook share open the respective app/share dialog on mobile.

### 4.5 Respondent
- **RSP-01:** Loads in ≤ 2 s on 4G *(PRD)*; no login; progress bar visible; keyboard navigable and WCAG AA contrast *(PRD §7)*.
- **RSP-02:** No answers are stored without consent when consent is required.
- **RSP-03:** Missing required answers are highlighted before submission.
- **RSP-04:** Closed, paused or full surveys show a clear message and accept no submissions.

### 4.6 Collection
- **COL-01/02:** Status changes take effect immediately on the respondent page.
- **COL-03:** With anonymous mode on, stored responses contain no IP or device data.
- **COL-04:** A second submission from the same device is blocked when enabled; can be turned off per survey.
- **COL-05:** Captcha is invisible to normal respondents.
- **COL-06:** Response count updates without a page reload.
- **COL-08:** CSV has one row per response, one column per question, with option labels (not IDs) and Vietnamese characters displayed correctly when opened in Excel.
- **COL-09:** Deleted responses are removed from the overview and exports.

### 4.7 Admin
- **ADM-02:** Every AI call is logged with user, survey, task type, model, tokens in/out, duration, estimated cost, status.
- **ADM-03:** When the self-hosted LLM is down, AI tasks either route to the fallback provider or queue, and the user sees that results may be slower.
- **ADM-04:** Every invalid-JSON and timeout event appears in the log.

### 4.8 Analytics (ADM-05)
Minimum events to measure Phase 1 KPIs from PRD §2.2:

| KPI | Events needed |
|---|---|
| Activation (sign-up → first survey created) | `user_signed_up`, `survey_generated`, `survey_published` |
| Time to shareable link (< 5 min) | timestamps of `user_signed_up` and first `survey_published` |
| AI survey acceptance (≥ 70% questions kept or lightly edited) | per question at publish time: `kept`, `edited`, `deleted`, `added_manually` |
| Return rate (second survey within 30 days) | `survey_published` per user |
| Referral | `signup_source = survey_footer` |

"Lightly edited" needs a definition before measurement (see §8).

---

## 5. Analysis-ready requirements

Phase 1 surveys must be generated and stored so Phase 2 analysis can use them without migration.

| ID | Requirement | Why |
|---|---|---|
| AR-01 | Store the original idea text and clarify answers with the survey | Phase 2 report generation needs the survey's purpose as context |
| AR-02 | Each question carries an `objective` tag linking it to the survey goal chosen in GEN-03 | Report can group findings by goal |
| AR-03 | Standard scales stored with `standard_scale` (NPS, CSAT, CES) and standard wording | Scores computed correctly and comparably |
| AR-04 | Open-ended questions flagged `analyze: true` | Phase 2 theming knows which answers to process |
| AR-05 | When the goal is "find causes", the survey includes at least one open-ended question | Without it there is nothing to analyse for causes |
| AR-06 | Segment questions (branch, age group, visit frequency) tagged as `segment` dimensions | Phase 2 cross-group comparison (PRD D3) |
| AR-07 | Stable question and option IDs; edits never reuse IDs | Answers stay valid when labels change |
| AR-08 | Responses stored raw and tied to the published version | Re-analysis is always possible |

AR-02, AR-04, AR-05 and AR-06 add fields to the survey schema in Interface Contract v1 (§7).

---

## 6. Deferred features

| PRD item | Moved to | Reason |
|---|---|---|
| D1 Quantitative analysis, charts, filters | Phase 2 | Analysis phase; COL-07 covers basic counts |
| D2 Open-answer theming and sentiment | Phase 2 | Analysis phase |
| E1 AI summary report | Phase 2 | Depends on D1/D2 |
| E2 Real-time dashboard (charts) | Phase 2 | COL-06 covers counts only |
| CSV / Google Forms import | Phase 2 | Analysis entry point |
| B2 Natural-language editing | Later | Decided: basic editor only in Phase 1 |
| A5 Template library (30+ templates, SEO pages) | Later | GEN-02 idea starters cover Phase 1 |
| A6 Convert existing questionnaires | Later | PRD P2 |
| B4 Branching logic | Later | PRD P1 |
| B5 Branding | Later | PRD P1 |
| C1 iframe embed | Later | PRD P1 |
| C2 Save progress on device | Later | PRD P1 |
| C5 Voice answers | Later | PRD P2 |
| D3–D5, E3 PDF/Excel/PPT/SPSS, E4 | Later | Depend on Phase 2 |
| F1 Zalo login | Later | PRD P1 |
| F2 Online payment | Later | Manual upgrade via ADM-01 |
| F3 Data access log | Later | PRD P1 |
| F4 Teams, F5 Integrations | Later | PRD P2 |

---

## 7. Impact on Interface Contract v1

| Contract section | Change |
|---|---|
| §2 Survey schema | Add `objective`, `analyze`, `segment` fields (AR-02, AR-04, AR-06); add survey-level `source` (idea + clarify answers, AR-01) |
| §4.1 Auth | Unchanged |
| §4.2 AI creation | Unchanged; add regenerate (GEN-08) and abuse-check error (GEN-07) |
| §4.3 Editing | Remove `nl-edit` (B2 deferred) |
| §4.4–4.5 Publish, respondent | Unchanged |
| §4.6 Results | Reduce to response list, count, completion rate, CSV export, delete. Optional simple counts (COL-07). Charts and filters move to Phase 2 |
| §4.7 Theming, §4.8 Reports | Move to Phase 2 |
| §4.9 Admin | Unchanged; add analytics events (ADM-05) if tracked server-side |
| §6 AI acceptance criteria | Phase 1 applies criteria 1–5 and 12 (generation only). Criterion 6 (NL edit) and 7–11 (analysis) move to Phase 2 |

Contract v2 will be issued after this feature list is approved.

---

## 8. Open questions

| # | Question | Owner |
|---|---|---|
| 1 | Include COL-07 simple per-question counts in Phase 1? Recommended: yes — cheap, no AI, and owners otherwise only see raw rows | Ming |
| 2 | Allow editing after publish? (Contract v1 §2.5; recommended: block once responses exist) | Ming |
| 3 | Can unverified users publish? (proposed: no) | Ming |
| 4 | Survey generation in English in Phase 1, or Vietnamese only? | Ming |
| 5 | Clinics are in the SME segment but trigger the sensitive-domain notice (health). Keep in Phase 1 target industries? | Ming |
| 6 | Definition of "lightly edited" for the AI acceptance KPI (e.g. text change under a set threshold, type unchanged) | Ming |
| 7 | Plan limit values for ACC-05 | Ming |
| 8 | Legal review of privacy policy, terms and consent wording before public launch | Ming |