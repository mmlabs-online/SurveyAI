import { createMockApiClient } from "./mock/client";
import type { ApiClient } from "./types";

export type * from "./types";
export { ApiError, isApiError } from "./errors";
export type { ApiErrorCode } from "./errors";

export interface ApiModeEnv {
  NODE_ENV?: string | undefined;
  NEXT_PUBLIC_API_MODE?: string | undefined;
}

/**
 * Chooses the client implementation. The mock has fake auth and stores everything in the
 * browser, so a production build must opt in explicitly with NEXT_PUBLIC_API_MODE=mock.
 */
export function resolveApiMode(env: ApiModeEnv): "mock" {
  const mode = env.NEXT_PUBLIC_API_MODE;
  if (mode === "mock") return "mock";
  if (mode) {
    throw new Error(
      `NEXT_PUBLIC_API_MODE="${mode}" is not supported yet. Only "mock" exists in this build.`,
    );
  }
  if (env.NODE_ENV === "production") {
    throw new Error(
      "No real API client is configured. The mock API (fake auth, browser-only data) is disabled " +
        'in production unless you set NEXT_PUBLIC_API_MODE="mock" explicitly (demo builds only).',
    );
  }
  return "mock";
}

let activeClient: ApiClient | null = null;

/**
 * The active client. Swap the implementation here (e.g. an HTTP client) and no UI code
 * has to change.
 */
export function getApiClient(): ApiClient {
  if (!activeClient) {
    resolveApiMode({
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PUBLIC_API_MODE: process.env.NEXT_PUBLIC_API_MODE,
    });
    activeClient = createMockApiClient();
  }
  return activeClient;
}

/** Test hook: replace (or reset with null) the active client. */
export function setApiClient(client: ApiClient | null): void {
  activeClient = client;
}
