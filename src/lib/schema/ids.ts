export interface IdGenerator {
  /** Returns a fresh id. Ids are never reused: the counter only moves forward. */
  next(prefix: string): string;
  /** Current counter value; persist it and pass back to `createIdGenerator` to continue. */
  current(): number;
}

const RANDOM_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

function randomSuffix(random: () => number, length: number): string {
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += RANDOM_ALPHABET[Math.floor(random() * RANDOM_ALPHABET.length)];
  }
  return out;
}

export function createIdGenerator(
  start = 0,
  random: () => number = Math.random,
): IdGenerator {
  let counter = start;
  return {
    next(prefix: string): string {
      counter += 1;
      return `${prefix}_${counter.toString(36)}${randomSuffix(random, 4)}`;
    },
    current(): number {
      return counter;
    },
  };
}
