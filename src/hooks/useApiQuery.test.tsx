import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ApiError, setApiClient } from "@/lib/api";
import { makeClient } from "@/test/helpers";
import { useApiQuery } from "./useApiQuery";

afterEach(() => setApiClient(null));

describe("useApiQuery", () => {
  it("keeps the last successful data when a background refresh fails", async () => {
    setApiClient(makeClient());
    let calls = 0;
    const fetcher = async (): Promise<string> => {
      calls += 1;
      if (calls === 1) return "dữ liệu";
      throw new ApiError("not_found", "mất kết nối");
    };
    const { result } = renderHook(() => useApiQuery(fetcher, { pollMs: 10 }));
    await waitFor(() => expect(result.current.refreshError).toBe("mất kết nối"));
    expect(result.current.state).toEqual({ status: "success", data: "dữ liệu" });
  });

  it("clears the refresh error after the next success", async () => {
    setApiClient(makeClient());
    let release: (value: number) => void = () => undefined;
    let calls = 0;
    const fetcher = (): Promise<number> => {
      calls += 1;
      if (calls === 1) return Promise.resolve(1);
      if (calls === 2) return Promise.reject(new Error("boom"));
      return new Promise<number>((resolve) => {
        release = resolve;
      });
    };
    const { result } = renderHook(() => useApiQuery(fetcher, { pollMs: 10 }));
    await waitFor(() => expect(result.current.refreshError).not.toBeNull());
    await act(async () => release(2));
    await waitFor(() => expect(result.current.refreshError).toBeNull());
    expect(result.current.state).toEqual({ status: "success", data: 2 });
  });

  it("exposes a typed error code and shows loading again on manual reload after an error", async () => {
    setApiClient(makeClient());
    let release: (value: string) => void = () => undefined;
    let calls = 0;
    const fetcher = (): Promise<string> => {
      calls += 1;
      if (calls === 1) return Promise.reject(new ApiError("not_found", "không thấy"));
      return new Promise<string>((resolve) => {
        release = resolve;
      });
    };
    const { result } = renderHook(() => useApiQuery(fetcher));
    await waitFor(() =>
      expect(result.current.state).toEqual({ status: "error", message: "không thấy", code: "not_found" }),
    );
    act(() => result.current.reload());
    expect(result.current.state).toEqual({ status: "loading" });
    await act(async () => release("ok"));
    await waitFor(() => expect(result.current.state).toEqual({ status: "success", data: "ok" }));
  });

  it("maps non-API errors to the generic message with a null code", async () => {
    setApiClient(makeClient());
    const fetcher = (): Promise<string> => Promise.reject(new Error("x"));
    const { result } = renderHook(() => useApiQuery(fetcher));
    await waitFor(() => expect(result.current.state.status).toBe("error"));
    expect(result.current.state).toMatchObject({ code: null });
  });
});
