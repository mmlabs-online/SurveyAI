/**
 * Storage adapter: the ONLY place in the app that may touch `localStorage`.
 * Works in-memory for tests and SSR.
 */
export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  /** Fires on local writes and, in browsers, on writes from other tabs. */
  subscribe(listener: () => void): () => void;
}

class Listeners {
  private readonly set = new Set<() => void>();

  add(listener: () => void): () => void {
    this.set.add(listener);
    return () => {
      this.set.delete(listener);
    };
  }

  emit(): void {
    for (const listener of Array.from(this.set)) listener();
  }
}

export function createMemoryStorage(
  initial: Readonly<Record<string, string>> = {},
): StorageAdapter {
  const data = new Map<string, string>(Object.entries(initial));
  const listeners = new Listeners();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
      listeners.emit();
    },
    removeItem: (key) => {
      data.delete(key);
      listeners.emit();
    },
    subscribe: (listener) => listeners.add(listener),
  };
}

export type BrowserStorageKind = "local" | "session";

function getWebStorage(kind: BrowserStorageKind): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    return kind === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

/**
 * localStorage (default) or sessionStorage backed adapter; falls back to memory when
 * unavailable (SSR, blocked storage).
 */
export function createBrowserStorage(kind: BrowserStorageKind = "local"): StorageAdapter {
  const local = getWebStorage(kind);
  if (!local) return createMemoryStorage();
  const listeners = new Listeners();
  return {
    getItem: (key) => local.getItem(key),
    setItem: (key, value) => {
      local.setItem(key, value);
      listeners.emit();
    },
    removeItem: (key) => {
      local.removeItem(key);
      listeners.emit();
    },
    subscribe: (listener) => {
      const remove = listeners.add(listener);
      const onStorage = (): void => listener();
      window.addEventListener("storage", onStorage);
      return () => {
        remove();
        window.removeEventListener("storage", onStorage);
      };
    },
  };
}
