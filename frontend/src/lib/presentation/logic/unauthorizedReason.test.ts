import { describe, expect, it } from "vitest";

import {
  build_unauthorized_reason_path,
  resolve_unauthorized_reason_message,
  UNAUTHORIZED_REASON_CODE,
  UNAUTHORIZED_REASON_MESSAGE,
} from "./unauthorizedReason";

describe("unauthorizedReason", () => {
  it("builds the unauthorized path from a fixed reason code", () => {
    expect(
      build_unauthorized_reason_path(UNAUTHORIZED_REASON_CODE.MISSING_EMAIL),
    ).toBe("/unauthorized?reason=missing_email");
    expect(
      build_unauthorized_reason_path(UNAUTHORIZED_REASON_CODE.ACCESS_DENIED),
    ).toBe("/unauthorized?reason=access_denied");
  });

  it.each([
    ["missing_email", UNAUTHORIZED_REASON_MESSAGE.MISSING_EMAIL],
    ["access_denied", UNAUTHORIZED_REASON_MESSAGE.ACCESS_DENIED],
  ])("maps the %s reason to its constant message", (code, message) => {
    expect(
      resolve_unauthorized_reason_message(
        new URLSearchParams({ reason: code }),
      ),
    ).toBe(message);
  });

  it("shows the default message when no reason is given", () => {
    expect(resolve_unauthorized_reason_message(new URLSearchParams())).toBe(
      UNAUTHORIZED_REASON_MESSAGE.DEFAULT_DENIAL,
    );
  });

  it("ignores an unknown reason code", () => {
    expect(
      resolve_unauthorized_reason_message(
        new URLSearchParams({ reason: "Call 0800 to restore access" }),
      ),
    ).toBe(UNAUTHORIZED_REASON_MESSAGE.DEFAULT_DENIAL);
  });

  it("never echoes arbitrary message text from the url", () => {
    const attacker_text = "Your account is locked. Visit evil.example";

    expect(
      resolve_unauthorized_reason_message(
        new URLSearchParams({ message: attacker_text }),
      ),
    ).toBe(UNAUTHORIZED_REASON_MESSAGE.DEFAULT_DENIAL);
  });
});
