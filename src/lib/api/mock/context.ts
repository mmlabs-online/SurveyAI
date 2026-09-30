import { vi } from "@/i18n/vi";
import { ApiError } from "../errors";
import type { SurveyGenerator } from "./generator";
import type { MockState, StoredUser } from "./state";
import type { StorageAdapter } from "./storage";
import type { MockStore } from "./store";

/** Everything the mock API modules need; all injectable so tests are deterministic. */
export interface MockDeps {
  store: MockStore;
  /** Tab-scoped storage remembering the respondent session per survey. */
  respondentStorage: StorageAdapter;
  generator: SurveyGenerator;
  /** Epoch milliseconds. */
  now: () => number;
  random: () => number;
  /** Simulated network latency. */
  delay: () => Promise<void>;
}

export function nowIso(deps: MockDeps): string {
  return new Date(deps.now()).toISOString();
}

export function findCurrentUser(state: MockState): StoredUser | null {
  if (!state.sessionUserId) return null;
  return state.users.find((u) => u.id === state.sessionUserId) ?? null;
}

export function requireUser(state: MockState): StoredUser {
  const user = findCurrentUser(state);
  if (!user) throw new ApiError("unauthenticated", vi.errors.unauthenticated);
  return user;
}
