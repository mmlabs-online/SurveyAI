"use client";

import { useCallback, useEffect, useState } from "react";
import { vi } from "@/i18n/vi";
import { getApiClient, isApiError, type ApiClient, type ApiErrorCode } from "@/lib/api";

export type QueryState<T> =
  | { status: "loading" }
  | { status: "error"; message: string; code: ApiErrorCode | null }
  | { status: "success"; data: T };

interface QueryOptions {
  /** Re-fetch whenever the store changes (also across tabs). */
  live?: boolean;
  /** Extra polling interval in ms. */
  pollMs?: number;
}

interface QueryResult<T> {
  state: QueryState<T>;
  /** Set when a background refresh failed but earlier data is still shown. */
  refreshError: string | null;
  reload: () => void;
}

/**
 * Loads data through the ApiClient. `fetcher` must be referentially stable
 * (wrap it in useCallback) or the query re-runs on every render.
 * A failed background refresh keeps the last successful data.
 */
export function useApiQuery<T>(
  fetcher: (api: ApiClient) => Promise<T>,
  { live = false, pollMs }: QueryOptions = {},
): QueryResult<T> {
  const [state, setState] = useState<QueryState<T>>({ status: "loading" });
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const api = getApiClient();
    const load = (): void => {
      fetcher(api).then(
        (data) => {
          if (cancelled) return;
          setRefreshError(null);
          setState({ status: "success", data });
        },
        (error: unknown) => {
          if (cancelled) return;
          const message = isApiError(error) ? error.message : vi.errors.unknown;
          setState((prev) =>
            prev.status === "success"
              ? prev
              : {
                  status: "error",
                  message,
                  code: isApiError(error) ? error.code : null,
                },
          );
          setRefreshError(message);
        },
      );
    };
    load();
    const unsubscribe = live ? api.subscribe(load) : undefined;
    const timer = pollMs ? setInterval(load, pollMs) : undefined;
    return () => {
      cancelled = true;
      unsubscribe?.();
      if (timer) clearInterval(timer);
    };
  }, [fetcher, live, pollMs, tick]);

  const reload = useCallback(() => {
    setState((prev) => (prev.status === "error" ? { status: "loading" } : prev));
    setRefreshError(null);
    setTick((t) => t + 1);
  }, []);
  return { state, refreshError, reload };
}
