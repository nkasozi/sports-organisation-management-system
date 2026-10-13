import { describe, expect, it } from "vitest";

import {
  can_role_change_verification,
  is_verification_change_permitted,
} from "./shared_verification_policy";

const UNVERIFIED = { is_verified: false };
const VERIFIED = { is_verified: true };

describe("can_role_change_verification", () => {
  it("allows only administrators and officials managers", () => {
    for (const role of ["super_admin", "org_admin", "officials_manager"])
      expect(can_role_change_verification(role)).toBe(true);
    for (const role of ["team_manager", "official", "player", "intruder"])
      expect(can_role_change_verification(role)).toBe(false);
  });
});

describe("is_verification_change_permitted", () => {
  it("blocks a player from verifying or unverifying a record", () => {
    expect(
      is_verification_change_permitted("player", VERIFIED, UNVERIFIED),
    ).toBe(false);
    expect(
      is_verification_change_permitted("player", UNVERIFIED, VERIFIED),
    ).toBe(false);
    expect(is_verification_change_permitted("player", VERIFIED, {})).toBe(
      false,
    );
  });

  it("lets a player save without touching verification", () => {
    expect(
      is_verification_change_permitted("player", { notes: "x" }, VERIFIED),
    ).toBe(true);
    expect(is_verification_change_permitted("player", VERIFIED, VERIFIED)).toBe(
      true,
    );
    expect(is_verification_change_permitted("player", UNVERIFIED, {})).toBe(
      true,
    );
  });

  it("lets verifying roles change verification", () => {
    expect(
      is_verification_change_permitted("org_admin", VERIFIED, UNVERIFIED),
    ).toBe(true);
    expect(
      is_verification_change_permitted(
        "officials_manager",
        UNVERIFIED,
        VERIFIED,
      ),
    ).toBe(true);
  });
});
