export const IDEA_MIN_CHARS = 10;
export const IDEA_MAX_CHARS = 2000;

export type IdeaCheck = "ok" | "too_short" | "too_long";

/**
 * Counts Unicode characters (code points) after NFC normalization, so Vietnamese text
 * counts the same whether diacritics are precomposed or decomposed.
 */
export function countChars(text: string): number {
  return Array.from(text.trim().normalize("NFC")).length;
}

export function checkIdea(text: string): IdeaCheck {
  const count = countChars(text);
  if (count < IDEA_MIN_CHARS) return "too_short";
  if (count > IDEA_MAX_CHARS) return "too_long";
  return "ok";
}
