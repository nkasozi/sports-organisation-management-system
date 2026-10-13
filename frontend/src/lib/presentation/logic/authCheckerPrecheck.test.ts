import { describe, expect, it } from "vitest";

import {
  AUTH_CHECKER_PRECHECK,
  build_missing_email_redirect_path,
  decide_auth_checker_precheck,
} from "./authCheckerPrecheck";

const ready_input = {
  in_browser: true,
  clerk_ready: true,
  is_signed_in: true,
  already_checked: false,
  is_auth_page: false,
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
  it("encodes the explanation into the unauthorized page", () => {
    expect(build_missing_email_redirect_path()).toMatch(
      /^\/unauthorized\?message=Your%20account%20has%20no%20email/,
    );
  });
});
