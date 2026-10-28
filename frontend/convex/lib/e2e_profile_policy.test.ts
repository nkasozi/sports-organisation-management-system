import { describe, expect, it } from "vitest";

import { decide_e2e_profile, E2eProfileRejection } from "./e2e_profile_policy";

const TEST_EMAIL = "e2e-official+clerk_test@example.com";

describe("decide_e2e_profile", () => {
  it("refuses everything unless the deployment turned e2e profiles on", () => {
    expect(
      decide_e2e_profile({
        enabled_flag: "",
        email: TEST_EMAIL,
        role: "official",
      }),
    ).toEqual({ allowed: false, reason: E2eProfileRejection.DISABLED });
  });

  it("only accepts Clerk test email addresses", () => {
    expect(
      decide_e2e_profile({
        enabled_flag: "true",
        email: "someone@gmail.com",
        role: "super_admin",
      }),
    ).toEqual({ allowed: false, reason: E2eProfileRejection.EMAIL_NOT_TEST });
  });

  it("rejects roles the app doesn't know", () => {
    expect(
      decide_e2e_profile({
        enabled_flag: "true",
        email: TEST_EMAIL,
        role: "owner",
      }),
    ).toEqual({ allowed: false, reason: E2eProfileRejection.ROLE_UNKNOWN });
  });

  it("allows a known role on a test address and normalizes the email", () => {
    expect(
      decide_e2e_profile({
        enabled_flag: "true",
        email: " E2E-Official+clerk_test@example.com ",
        role: "official",
      }),
    ).toEqual({ allowed: true, email: TEST_EMAIL, role: "official" });
  });
});
