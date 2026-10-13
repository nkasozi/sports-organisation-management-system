import { describe, expect, it } from "vitest";

import { build_bulk_player_assignment_auth_snapshot } from "./bulkPlayerAssignmentAuthState";

describe("build_bulk_player_assignment_auth_snapshot", () => {
  it("maps present profile and token states", () => {
    const profile = { id: "profile-1", organization_id: "org-1" };
    expect(
      build_bulk_player_assignment_auth_snapshot({
        current_profile: { status: "present", profile },
        current_token: { status: "present", token: { raw_token: "raw-1" } },
      } as never),
    ).toEqual({
      current_profile_state: { status: "present", profile },
      current_token_state: { status: "present", raw_token: "raw-1" },
    });
  });

  it("maps missing profile and token states", () => {
    expect(
      build_bulk_player_assignment_auth_snapshot({
        current_profile: { status: "missing" },
        current_token: { status: "missing" },
      }),
    ).toEqual({
      current_profile_state: { status: "missing" },
      current_token_state: { status: "missing" },
    });
  });
});
