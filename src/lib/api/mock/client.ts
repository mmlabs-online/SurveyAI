import type { ApiClient } from "../types";
import { createAuthApi } from "./auth";
import type { MockDeps } from "./context";
import { defaultGenerator, type SurveyGenerator } from "./generator";
import { createRespondApi } from "./respond";
import { createMockStore, type MockStore } from "./store";
import { createBrowserStorage, type StorageAdapter } from "./storage";
import { createSurveysApi } from "./surveys";

export interface MockClientOptions {
  storage?: StorageAdapter;
  /** Tab-scoped storage for respondent sessions (default: session-scoped adapter). */
  respondentStorage?: StorageAdapter;
  generator?: SurveyGenerator;
  /** Simulated latency per call in ms (default 250). */
  latencyMs?: number;
  now?: () => number;
  random?: () => number;
}

export interface MockApiClient extends ApiClient {
  /** Exposed for tests only. */
  readonly store: MockStore;
  readonly storage: StorageAdapter;
}

export function createMockApiClient(options: MockClientOptions = {}): MockApiClient {
  const random = options.random ?? Math.random;
  const latencyMs = options.latencyMs ?? 250;
  const storage = options.storage ?? createBrowserStorage();
  const now = options.now ?? Date.now;
  const store = createMockStore(storage, random, now);
  const deps: MockDeps = {
    store,
    respondentStorage: options.respondentStorage ?? createBrowserStorage("session"),
    generator: options.generator ?? defaultGenerator,
    now,
    random,
    delay: () =>
      latencyMs > 0
        ? new Promise<void>((resolve) => {
            setTimeout(resolve, latencyMs);
          })
        : Promise.resolve(),
  };
  return {
    ...createAuthApi(deps),
    ...createSurveysApi(deps),
    ...createRespondApi(deps),
    subscribe: (listener) => store.subscribe(listener),
    store,
    storage,
  };
}
