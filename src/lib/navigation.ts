export const LOGIN_PATH = "/login";
export const SIGNUP_PATH = "/signup";
export const DASHBOARD_PATH = "/dashboard";

const PLACEHOLDER_ORIGIN = "http://x.invalid";
// Control chars, whitespace (incl. unicode), backslash.
const UNSAFE_CHARS = /[\u0000-\u001f\u007f-\u009f\s\\]/u;

function isUnsafe(value: string): boolean {
  if (UNSAFE_CHARS.test(value)) return true;
  try {
    return UNSAFE_CHARS.test(decodeURIComponent(value));
  } catch {
    return true;
  }
}

/** Only allow same-origin relative paths (not the auth pages) as post-login redirect targets. */
export function safeNextPath(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || isUnsafe(next)) {
    return DASHBOARD_PATH;
  }
  let url: URL;
  try {
    url = new URL(next, PLACEHOLDER_ORIGIN);
  } catch {
    return DASHBOARD_PATH;
  }
  if (url.origin !== PLACEHOLDER_ORIGIN) return DASHBOARD_PATH;
  if (url.pathname === LOGIN_PATH || url.pathname === SIGNUP_PATH) return DASHBOARD_PATH;
  return `${url.pathname}${url.search}${url.hash}`;
}

export function loginRedirectUrl(currentPath: string): string {
  return `${LOGIN_PATH}?next=${encodeURIComponent(currentPath)}`;
}
