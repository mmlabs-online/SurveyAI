import { afterEach, describe, expect, it, vi as vitest } from "vitest";
import { createBrowserStorage, createMemoryStorage } from "./storage";
import { createMockStore, STORAGE_KEY } from "./store";
import { EMPTY_STATE } from "./state";

describe("memory storage adapter", () => {
  it("stores, reads, removes and notifies", () => {
    const storage = createMemoryStorage({ a: "1" });
    const listener = vitest.fn();
    const off = storage.subscribe(listener);
    expect(storage.getItem("a")).toBe("1");
    expect(storage.getItem("missing")).toBeNull();
    storage.setItem("b", "2");
    storage.removeItem("a");
    expect(storage.getItem("a")).toBeNull();
    expect(listener).toHaveBeenCalledTimes(2);
    off();
    storage.setItem("c", "3");
    expect(listener).toHaveBeenCalledTimes(2);
  });
});

describe("browser storage adapter", () => {
  afterEach(() => {
    vitest.unstubAllGlobals();
    window.localStorage.clear();
  });

  it("persists to localStorage and notifies local and cross-tab writes", () => {
    const storage = createBrowserStorage();
    const listener = vitest.fn();
    const off = storage.subscribe(listener);
    storage.setItem("k", "v");
    expect(window.localStorage.getItem("k")).toBe("v");
    expect(storage.getItem("k")).toBe("v");
    expect(listener).toHaveBeenCalledTimes(1);
    window.dispatchEvent(new StorageEvent("storage", { key: "k" }));
    expect(listener).toHaveBeenCalledTimes(2);
    storage.removeItem("k");
    expect(window.localStorage.getItem("k")).toBeNull();
    expect(listener).toHaveBeenCalledTimes(3);
    off();
    window.dispatchEvent(new StorageEvent("storage", { key: "k" }));
    expect(listener).toHaveBeenCalledTimes(3);
  });

  it("falls back to memory when localStorage is unavailable", () => {
    vitest.stubGlobal("window", undefined);
    const storage = createBrowserStorage();
    storage.setItem("x", "y");
    expect(storage.getItem("x")).toBe("y");
  });

  it("falls back to memory when accessing localStorage throws", () => {
    const original = Object.getOwnPropertyDescriptor(window, "localStorage");
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get() {
        throw new Error("blocked");
      },
    });
    try {
      const storage = createBrowserStorage();
      storage.setItem("x", "y");
      expect(storage.getItem("x")).toBe("y");
    } finally {
      if (original) Object.defineProperty(window, "localStorage", original);
    }
  });
});

describe("mock store", () => {
  it("starts empty, persists updates and survives a reload", () => {
    const storage = createMemoryStorage();
    const store = createMockStore(storage);
    expect(store.read()).toEqual(EMPTY_STATE);
    store.update((state, ids) => ({ ...state, sessionUserId: ids.next("usr") }));
    const reloaded = createMockStore(storage).read();
    expect(reloaded.sessionUserId).toMatch(/^usr_/);
    expect(reloaded.idCounter).toBe(1);
  });

  it("continues the id counter across updates so ids are never reused", () => {
    const store = createMockStore(createMemoryStorage());
    const ids: string[] = [];
    for (let i = 0; i < 20; i += 1) {
      store.update((state, gen) => {
        ids.push(gen.next("x"));
        return state;
      });
    }
    expect(new Set(ids).size).toBe(20);
  });

  it("recovers from corrupt or invalid stored data", () => {
    const storage = createMemoryStorage({ [STORAGE_KEY]: "{not json" });
    expect(createMockStore(storage).read()).toEqual(EMPTY_STATE);
    storage.setItem(STORAGE_KEY, JSON.stringify({ users: "nope" }));
    expect(createMockStore(storage).read()).toEqual(EMPTY_STATE);
  });

  it("forwards storage notifications to subscribers", () => {
    const storage = createMemoryStorage();
    const store = createMockStore(storage);
    const listener = vitest.fn();
    store.subscribe(listener);
    store.update((s) => s);
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
