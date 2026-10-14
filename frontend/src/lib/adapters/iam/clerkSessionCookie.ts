const CLERK_SESSION_COOKIE_NAME = "__session";
const CLERK_SESSION_COOKIE_SUFFIX_SEPARATOR = "__session_";
const COOKIE_PAIR_SEPARATOR = ";";
const COOKIE_NAME_VALUE_SEPARATOR = "=";
const COOKIE_EXPIRY_ATTRIBUTES = "; Max-Age=0; path=/; SameSite=Lax";
const DOCUMENT_GLOBAL_TYPE_UNDEFINED = "undefined";
const SESSION_COOKIE_CLEARED_EVENT = "clerk_session_cookie_cleared";
const SESSION_COOKIE_CLEAR_FAILED_EVENT = "clerk_session_cookie_clear_failed";

function is_clerk_session_cookie_name(cookie_name: string): boolean {
  return (
    cookie_name === CLERK_SESSION_COOKIE_NAME ||
    cookie_name.startsWith(CLERK_SESSION_COOKIE_SUFFIX_SEPARATOR)
  );
}

function list_clerk_session_cookie_names(cookie_header: string): string[] {
  return cookie_header
    .split(COOKIE_PAIR_SEPARATOR)
    .map((cookie_pair) =>
      cookie_pair.split(COOKIE_NAME_VALUE_SEPARATOR)[0].trim(),
    )
    .filter(is_clerk_session_cookie_name);
}

export function expire_clerk_session_cookies(): number {
  if (typeof document === DOCUMENT_GLOBAL_TYPE_UNDEFINED) return 0;
  try {
    const cookie_names = list_clerk_session_cookie_names(document.cookie);
    cookie_names.forEach((cookie_name) => {
      document.cookie = `${cookie_name}=${COOKIE_EXPIRY_ATTRIBUTES}`;
    });
    console.log("[Clerk] App session cookie cleared", {
      event: SESSION_COOKIE_CLEARED_EVENT,
      cleared_count: cookie_names.length,
    });
    return cookie_names.length;
  } catch (error) {
    console.warn("[Clerk] App session cookie could not be cleared", {
      event: SESSION_COOKIE_CLEAR_FAILED_EVENT,
      error: String(error),
    });
    return 0;
  }
}
