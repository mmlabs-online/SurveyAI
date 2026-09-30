import { z } from "zod";
import { vi } from "@/i18n/vi";
import { ApiError } from "../errors";
import type { ApiClient, Credentials, User } from "../types";
import { findCurrentUser, nowIso, type MockDeps } from "./context";
import type { StoredUser } from "./state";

export const MIN_PASSWORD_LENGTH = 8;

const credentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(MIN_PASSWORD_LENGTH),
});

/** NOT secure: a stand-in so the mock store never holds plain-text passwords. */
export function mockHashPassword(email: string, password: string): string {
  let hash = 5381;
  const input = `${email}:${password}`;
  for (let i = 0; i < input.length; i += 1) {
    hash = ((hash << 5) + hash + input.charCodeAt(i)) >>> 0;
  }
  return `mock$${hash.toString(16)}`;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function toUser(stored: StoredUser): User {
  return {
    id: stored.id,
    email: stored.email,
    createdAt: stored.createdAt,
    emailVerified: true,
  };
}

function parseCredentials(input: Credentials): Credentials {
  const email = normalizeEmail(input.email);
  const parsed = credentialsSchema.safeParse({ email, password: input.password });
  if (parsed.success) return parsed.data;
  const field = parsed.error.issues[0]?.path[0] === "password" ? "password" : "email";
  throw new ApiError(
    "validation",
    field === "password" ? vi.errors.passwordShort : vi.errors.emailInvalid,
    { field },
  );
}

type AuthApi = Pick<ApiClient, "signup" | "login" | "logout" | "getCurrentUser">;

export function createAuthApi(deps: MockDeps): AuthApi {
  return {
    async signup(input) {
      await deps.delay();
      const { email, password } = parseCredentials(input);
      if (deps.store.read().users.some((u) => u.email === email)) {
        throw new ApiError("email_taken", vi.errors.emailTaken, { field: "email" });
      }
      const created = nowIso(deps);
      const next = deps.store.update((state, ids) => {
        const stored: StoredUser = {
          id: ids.next("usr"),
          email,
          mockPasswordHash: mockHashPassword(email, password),
          createdAt: created,
        };
        return { ...state, users: [...state.users, stored], sessionUserId: stored.id };
      });
      const user = next.users.find((u) => u.id === next.sessionUserId);
      if (!user) throw new ApiError("validation", vi.errors.unknown);
      return toUser(user);
    },

    async login(input) {
      await deps.delay();
      const email = normalizeEmail(input.email);
      const state = deps.store.read();
      const found = state.users.find((u) => u.email === email);
      if (!found || found.mockPasswordHash !== mockHashPassword(email, input.password)) {
        throw new ApiError("invalid_credentials", vi.errors.invalidCredentials);
      }
      deps.store.update((s) => ({ ...s, sessionUserId: found.id }));
      return toUser(found);
    },

    async logout() {
      await deps.delay();
      deps.store.update((state) => ({ ...state, sessionUserId: null }));
    },

    async getCurrentUser() {
      await deps.delay();
      const user = findCurrentUser(deps.store.read());
      return user ? toUser(user) : null;
    },
  };
}
