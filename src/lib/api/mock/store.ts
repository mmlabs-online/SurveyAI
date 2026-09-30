import { createIdGenerator, type IdGenerator } from "@/lib/schema/ids";
import { EMPTY_STATE, mockStateSchema, type MockState } from "./state";
import type { StorageAdapter } from "./storage";

export const STORAGE_KEY = "surveyai.mock.v1";
export const CORRUPT_KEY_PREFIX = `${STORAGE_KEY}.corrupt-`;

export interface MockStore {
  read(): MockState;
  /** Applies an immutable update. `ids` continues the persisted id counter. */
  update(updater: (state: MockState, ids: IdGenerator) => MockState): MockState;
  subscribe(listener: () => void): () => void;
}

interface ReadResult {
  state: MockState;
  /** Raw persisted value that could not be parsed, if any. */
  corruptRaw: string | null;
}

export function createMockStore(
  storage: StorageAdapter,
  random: () => number = Math.random,
  now: () => number = Date.now,
): MockStore {
  function load(): ReadResult {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return { state: EMPTY_STATE, corruptRaw: null };
    try {
      const parsed = mockStateSchema.safeParse(JSON.parse(raw));
      if (parsed.success) return { state: parsed.data, corruptRaw: null };
    } catch {
      // fall through: unparseable JSON is treated like a schema mismatch
    }
    return { state: EMPTY_STATE, corruptRaw: raw };
  }

  return {
    read: () => load().state,
    update(updater) {
      const { state: current, corruptRaw } = load();
      if (corruptRaw !== null) {
        // Never destroy data we could not read: keep a backup before starting fresh.
        storage.setItem(`${CORRUPT_KEY_PREFIX}${now()}`, corruptRaw);
      }
      const ids = createIdGenerator(current.idCounter, random);
      const next: MockState = { ...updater(current, ids), idCounter: ids.current() };
      storage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    },
    subscribe: (listener) => storage.subscribe(listener),
  };
}
