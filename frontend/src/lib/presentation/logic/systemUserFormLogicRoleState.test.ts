import { describe, expect, it } from "vitest";

import {
  build_user_role_state,
  filter_enum_values_by_creator_role,
  should_field_be_required_for_role,
} from "./systemUserFormLogic";

describe("build_user_role_state", () => {
  it("builds an explicit missing state for absent and invalid roles", () => {
    expect(build_user_role_state()).toEqual({ status: "missing" });
    expect(build_user_role_state("not-a-role")).toEqual({
      status: "missing",
    });
  });

  it("builds a present state for known user roles", () => {
    expect(build_user_role_state("org_admin")).toEqual({
      status: "present",
      role: "org_admin",
    });
  });
});

describe("should_field_be_required_for_role", () => {
  it("organization_id is required for org_admin", () => {
    expect(
      should_field_be_required_for_role("organization_id", "org_admin"),
    ).toBe(true);
  });

  it("organization_id is not required for super_admin", () => {
    expect(
      should_field_be_required_for_role("organization_id", "super_admin"),
    ).toBe(false);
  });

  it("official_id is required for official", () => {
    expect(should_field_be_required_for_role("official_id", "official")).toBe(
      true,
    );
  });

  it("player_id is required for player", () => {
    expect(should_field_be_required_for_role("player_id", "player")).toBe(true);
  });

  it("player_id is not required for org_admin", () => {
    expect(should_field_be_required_for_role("player_id", "org_admin")).toBe(
      false,
    );
  });

  it("official_id is not required for player", () => {
    expect(should_field_be_required_for_role("official_id", "player")).toBe(
      false,
    );
  });
});

describe("filter_enum_values_by_creator_role", () => {
  it("returns only assignable roles for the current creator role state", () => {
    expect(
      filter_enum_values_by_creator_role(
        "role",
        ["super_admin", "org_admin", "player"],
        build_user_role_state(),
      ),
    ).toEqual([]);
    expect(
      filter_enum_values_by_creator_role(
        "role",
        ["super_admin", "org_admin", "player"],
        build_user_role_state("org_admin"),
      ),
    ).toEqual(["org_admin", "player"]);
  });
});
