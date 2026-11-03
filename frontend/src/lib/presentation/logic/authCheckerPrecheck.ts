import {
  build_unauthorized_reason_path,
  UNAUTHORIZED_REASON_CODE,
} from "./unauthorizedReason";

export const AUTH_CHECKER_PRECHECK = {
  SKIP: "skip",
  MISSING_EMAIL: "missing_email",
  IDENTITY_UNAVAILABLE: "identity_unavailable",
  TRUST_SAVED_IDENTITY: "trust_saved_identity",
  CONVEX_NOT_CONFIGURED: "convex_not_configured",
  VERIFY_ACCESS: "verify_access",
} as const;

const AUTH_PAGE_PREFIX = "/sign-in";
const UNAUTHORIZED_PATH = "/unauthorized";

type AuthCheckerPrecheck =
  (typeof AUTH_CHECKER_PRECHECK)[keyof typeof AUTH_CHECKER_PRECHECK];

interface AuthCheckerPrecheckInput {
  in_browser: boolean;
  clerk_ready: boolean;
  is_signed_in: boolean;
  already_checked: boolean;
  is_auth_page: boolean;
  is_user_loaded: boolean;
  has_saved_identity_for_session: boolean;
  has_email: boolean;
  convex_configured: boolean;
}

export function decide_auth_checker_precheck(
  input: AuthCheckerPrecheckInput,
): AuthCheckerPrecheck {
  if (!input.in_browser || !input.clerk_ready)
    return AUTH_CHECKER_PRECHECK.SKIP;
  if (!input.is_signed_in || input.already_checked || input.is_auth_page)
    return AUTH_CHECKER_PRECHECK.SKIP;
  if (!input.is_user_loaded)
    return input.has_saved_identity_for_session
      ? AUTH_CHECKER_PRECHECK.TRUST_SAVED_IDENTITY
      : AUTH_CHECKER_PRECHECK.IDENTITY_UNAVAILABLE;
  if (!input.has_email) return AUTH_CHECKER_PRECHECK.MISSING_EMAIL;
  return input.convex_configured
    ? AUTH_CHECKER_PRECHECK.VERIFY_ACCESS
    : AUTH_CHECKER_PRECHECK.CONVEX_NOT_CONFIGURED;
}

export function build_missing_email_redirect_path(): string {
  return build_unauthorized_reason_path(UNAUTHORIZED_REASON_CODE.MISSING_EMAIL);
}

export function build_identity_unavailable_redirect_path(): string {
  return build_unauthorized_reason_path(
    UNAUTHORIZED_REASON_CODE.IDENTITY_UNAVAILABLE,
  );
}

export function build_access_denied_redirect_path(): string {
  return build_unauthorized_reason_path(UNAUTHORIZED_REASON_CODE.ACCESS_DENIED);
}

export function is_auth_checker_exempt_page(pathname: string): boolean {
  return (
    pathname.startsWith(AUTH_PAGE_PREFIX) || pathname === UNAUTHORIZED_PATH
  );
}
