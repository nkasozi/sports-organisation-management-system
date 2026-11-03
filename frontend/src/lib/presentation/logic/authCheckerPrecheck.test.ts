import { describe, expect, it } from "vitest";

import {
  AUTH_CHECKER_PRECHECK,
  build_access_denied_redirect_path,
  build_identity_unavailable_redirect_path,
  build_missing_email_redirect_path,
  decide_auth_checker_precheck,
} from "./authCheckerPrecheck";

const ready_input = {
  in_browser: true,
  clerk_ready: true,
  is_signed_in: true,
  already_checked: false,
  is_auth_page: false,
  is_user_loaded: true,
  has_saved_identity_for_session: false,
  has_email: true,
  convex_configured: true,
};

describe("decide_auth_checker_precheck", () => {
  it("verifies access for a signed-in user with an email", () => {
    expect(decide_auth_checker_precheck(ready_input)).toBe(
      AUTH_CHECKER_PRECHECK.VERIFY_ACCESS,
    );
  });

  it.each([
    ["in_browser", false],
    ["clerk_ready", false],
    ["is_signed_in", false],
    ["already_checked", true],
    ["is_auth_page", true],
  ] as const)("skips when %s is %s", (field, value) => {
    expect(
      decide_auth_checker_precheck({ ...ready_input, [field]: value }),
    ).toBe(AUTH_CHECKER_PRECHECK.SKIP);
  });

  it("reports the sign-in service when a signed-in user's details could not be loaded", () => {
    expect(
      decide_auth_checker_precheck({
        ...ready_input,
        is_user_loaded: false,
        has_email: false,
      }),
    ).toBe(AUTH_CHECKER_PRECHECK.IDENTITY_UNAVAILABLE);
    expect(build_identity_unavailable_redirect_path()).toBe(
      "/unauthorized?reason=identity_unavailable",
    );
  });

  it("trusts the saved identity for this session when Clerk cannot load the user", () => {
    expect(
      decide_auth_checker_precheck({
        ...ready_input,
        is_user_loaded: false,
        has_saved_identity_for_session: true,
        has_email: false,
      }),
    ).toBe(AUTH_CHECKER_PRECHECK.TRUST_SAVED_IDENTITY);
  });

  it("rejects a signed-in user without an email", () => {
    expect(
      decide_auth_checker_precheck({ ...ready_input, has_email: false }),
    ).toBe(AUTH_CHECKER_PRECHECK.MISSING_EMAIL);
  });

  it("marks the check done but skips verification when Convex is not configured", () => {
    expect(
      decide_auth_checker_precheck({
        ...ready_input,
        convex_configured: false,
      }),
    ).toBe(AUTH_CHECKER_PRECHECK.CONVEX_NOT_CONFIGURED);
  });
});

describe("build_missing_email_redirect_path", () => {
  it("sends only the missing email reason code to the unauthorized page", () => {
    expect(build_missing_email_redirect_path()).toBe(
      "/unauthorized?reason=missing_email",
    );
  });
});

describe("build_access_denied_redirect_path", () => {
  it("sends only the access denied reason code to the unauthorized page", () => {
    expect(build_access_denied_redirect_path()).toBe(
      "/unauthorized?reason=access_denied",
    );
  });
});
