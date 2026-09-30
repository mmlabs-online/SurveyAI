import type { Survey } from "@/lib/schema/survey";

/**
 * Lowercases and strips Vietnamese diacritics so "Mật khẩu" matches "mat khau". Also applies
 * NFKC (fullwidth/compat forms), drops invisible format characters (zero-width joiners...)
 * and collapses separators so "m.a.t-k.h.a.u"-style spacing tricks with dots/dashes/underscores
 * become plain word gaps.
 */
export function normalizeText(text: string): string {
  return text
    .normalize("NFKC")
    .replace(/\p{Cf}/gu, "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .replace(/[\s\-_.]+/g, " ")
    .trim();
}

const REQUEST_VERB = "(nhap|cung cap|cho biet|gui|ghi|dien|enter|provide|share|give|send|type)";

/**
 * Patterns run against normalized (diacritic-free, lowercase, single-spaced) text.
 * Bare "so the" (số thẻ) is NOT flagged on its own: it needs card context or a request verb,
 * otherwise "số thẻ thành viên" or "so the staff" would be false positives.
 */
const SENSITIVE_PATTERNS: ReadonlyArray<RegExp> = [
  /\bmat (khau|ma)\b/,
  /\bpass ?words?\b/,
  /\bpass ?codes?\b/,
  /\bpasswds?\b/,
  /\botps?\b/,
  /\bone time (password|code|pin)s?\b/,
  /\bma xac (thuc|minh)\b/,
  /\bma bao mat\b/,
  /\bso the (ngan hang|tin dung|ghi no|atm|visa|mastercard)\b/,
  new RegExp(`\\b${REQUEST_VERB}\\b.{0,30}\\bso the\\b`),
  /\bso the cua ban\b/,
  /\b(so )?the (tin dung|ghi no|atm)\b.{0,20}\bso\b/,
  /\bma (so )?the\b(?! (thanh vien|tich diem|qua tang|giam gia|uu dai|hoi vien))/,
  /\bcard (numbers?|nos?|details)\b/,
  new RegExp(`\\b(enter|provide|share|give|send|type)\\b.{0,30}\\b(credit|debit|atm) cards?\\b`),
  /\bcvv2?\b/,
  /\bcvc2?\b/,
  /\bccv\b/,
  /\bma pin\b/,
  /\bpin (ngan hang|atm|the)\b/,
  /\b(bank|atm|card|debit|credit|your|enter|provide|share|nhap) pins?\b/,
  /\bsecurity codes?\b/,
  /\bngay het han (cua )?the\b/,
  /\bcard\b.{0,25}\bexpir(y|ation) dates?\b/,
  /\bexpir(y|ation) dates?\b.{0,25}\bcard\b/,
];

export type AbuseLocation =
  | "title"
  | "intro"
  | "thankYou"
  | "question"
  | "option"
  | "objective"
  | "segment";

export interface AbuseViolation {
  location: AbuseLocation;
  questionId?: string;
  /** Text of the question the violation belongs to (or the offending field text). */
  questionText: string;
  offendingText: string;
}

/** Long terms also checked with every separator removed, to catch "m.a.t k.h.a.u". */
const SQUASHED_TERMS: ReadonlyArray<string> = [
  "matkhau",
  "password",
  "passcode",
  "maxacthuc",
  "maxacminh",
  "cardnumber",
  "sothetindung",
  "sothenganhang",
];

export function containsSensitiveRequest(text: string): boolean {
  const normalized = normalizeText(text);
  if (SENSITIVE_PATTERNS.some((pattern) => pattern.test(normalized))) return true;
  const squashed = normalized.replace(/[^a-z0-9]/g, "");
  return SQUASHED_TERMS.some((term) => squashed.includes(term));
}

/** GEN-07: finds text that asks respondents for passwords, OTPs, card numbers, PINs... */
export function checkSurveyAbuse(
  survey: Pick<Survey, "title" | "intro" | "thankYou" | "questions">,
): AbuseViolation[] {
  const violations: AbuseViolation[] = [];
  const fields: ReadonlyArray<readonly [AbuseLocation, string]> = [
    ["title", survey.title],
    ["intro", survey.intro],
    ["thankYou", survey.thankYou],
  ];
  for (const [location, text] of fields) {
    if (containsSensitiveRequest(text)) {
      violations.push({ location, questionText: text, offendingText: text });
    }
  }
  for (const question of survey.questions) {
    const inQuestion: ReadonlyArray<readonly [AbuseLocation, string | undefined]> = [
      ["question", question.text],
      ["objective", question.objective],
      ["segment", question.segment],
      ...question.options.map((o) => ["option", o.label] as const),
    ];
    for (const [location, text] of inQuestion) {
      if (text && containsSensitiveRequest(text)) {
        violations.push({
          location,
          questionId: question.id,
          questionText: question.text,
          offendingText: text,
        });
      }
    }
  }
  return violations;
}
