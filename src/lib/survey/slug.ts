const SLUG_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
export const SLUG_LENGTH = 7;

export function randomSlug(random: () => number = Math.random): string {
  let slug = "";
  for (let i = 0; i < SLUG_LENGTH; i += 1) {
    slug += SLUG_ALPHABET[Math.floor(random() * SLUG_ALPHABET.length)];
  }
  return slug;
}

/** Generates a slug that is not in `taken`. Throws after too many collisions. */
export function generateUniqueSlug(
  taken: ReadonlySet<string>,
  random: () => number = Math.random,
  maxAttempts = 50,
): string {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const slug = randomSlug(random);
    if (!taken.has(slug)) return slug;
  }
  throw new Error("Could not generate a unique slug");
}
