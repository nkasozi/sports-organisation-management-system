import { describe, expect, it } from "vitest";

import type { UserRole } from "../../core/interfaces/ports";
import {
  build_user_role_state,
  filter_enum_values_by_creator_role,
  get_allowed_roles_for_creator,
  get_visible_fields_for_role,
  is_system_user_field_visible_for_role,
  should_field_be_required_for_role,
} from "./systemUserFormLogic";

describe("get_allowed_roles_for_creator", () => {
  it("super_admin can create all roles", () => {
    const allowed = get_allowed_roles_for_creator("super_admin");
    expect(allowed).toEqual([
      "super_admin",
      "org_admin",
      "officials_manager",
      "team_manager",
      "official",
      "player",
    ]);
  });

  it("org_admin cannot create super_admin", () => {
    const allowed = get_allowed_roles_for_creator("org_admin");
    expect(allowed).not.toContain("super_admin");
    expect(allowed).toContain("org_admin");
    expect(allowed).toContain("officials_manager");
    expect(allowed).toContain("team_manager");
    expect(allowed).toContain("official");
    expect(allowed).toContain("player");
  });

  it("officials_manager can only create official", () => {
    const allowed = get_allowed_roles_for_creator("officials_manager");
    expect(allowed).toEqual(["official"]);
  });

  it("team_manager can only create player", () => {
    const allowed = get_allowed_roles_for_creator("team_manager");
    expect(allowed).toEqual(["player"]);
  });

  it("official cannot create any roles", () => {
    const allowed = get_allowed_roles_for_creator("official");
    expect(allowed).toEqual([]);
  });

  it("player cannot create any roles", () => {
    const allowed = get_allowed_roles_for_creator("player");
    expect(allowed).toEqual([]);
  });
});

describe("get_visible_fields_for_role", () => {
  it("super_admin hides organization, team, player, and official", () => {
    const visible = get_visible_fields_for_role("super_admin");
    expect(visible).not.toContain("organization_id");
    expect(visible).not.toContain("team_id");
    expect(visible).not.toContain("player_id");
    expect(visible).not.toContain("official_id");
  });

  it("org_admin shows organization but hides player and official", () => {
    const visible = get_visible_fields_for_role("org_admin");
    expect(visible).toContain("organization_id");
    expect(visible).not.toContain("player_id");
    expect(visible).not.toContain("official_id");
  });

  it("officials_manager shows organization but hides player and official", () => {
    const visible = get_visible_fields_for_role("officials_manager");
    expect(visible).toContain("organization_id");
    expect(visible).not.toContain("player_id");
    expect(visible).not.toContain("official_id");
  });

  it("team_manager shows organization and team but hides player and official", () => {
    const visible = get_visible_fields_for_role("team_manager");
    expect(visible).toContain("organization_id");
    expect(visible).toContain("team_id");
    expect(visible).not.toContain("player_id");
    expect(visible).not.toContain("official_id");
  });

  it("official shows organization and official but hides player", () => {
    const visible = get_visible_fields_for_role("official");
    expect(visible).toContain("organization_id");
    expect(visible).toContain("official_id");
    expect(visible).not.toContain("player_id");
  });

  it("player shows organization and player but hides official", () => {
    const visible = get_visible_fields_for_role("player");
    expect(visible).toContain("organization_id");
    expect(visible).toContain("player_id");
    expect(visible).not.toContain("official_id");
  });
});

describe("is_system_user_field_visible_for_role", () => {
  it("returns false for organization_id when role is super_admin", () => {
    expect(
      is_system_user_field_visible_for_role("organization_id", "super_admin"),
    ).toBe(false);
  });

  it("returns true for organization_id when role is org_admin", () => {
    expect(
      is_system_user_field_visible_for_role("organization_id", "org_admin"),
    ).toBe(true);
  });

  it("returns true for non-conditional fields regardless of role", () => {
    const roles = [
      "super_admin",
      "org_admin",
      "officials_manager",
      "team_manager",
      "official",
      "player",
      "public_viewer",
    ] as UserRole[];
    for (const role of roles) {
      expect(is_system_user_field_visible_for_role("email", role)).toBe(true);
      expect(is_system_user_field_visible_for_role("first_name", role)).toBe(
        true,
      );
      expect(is_system_user_field_visible_for_role("last_name", role)).toBe(
        true,
      );
      expect(is_system_user_field_visible_for_role("status", role)).toBe(true);
    }
  });

  it("returns false for any field when no role is selected", () => {
    const missing_role_state = build_user_role_state();

    expect(
      is_system_user_field_visible_for_role(
        "organization_id",
        missing_role_state,
      ),
    ).toBe(false);
    expect(
      is_system_user_field_visible_for_role("player_id", missing_role_state),
    ).toBe(false);
    expect(
      is_system_user_field_visible_for_role("official_id", missing_role_state),
    ).toBe(false);
    expect(
      is_system_user_field_visible_for_role("team_id", missing_role_state),
    ).toBe(false);
  });

  it("returns true for always-visible fields even when no role is selected", () => {
    const missing_role_state = build_user_role_state();

    expect(
      is_system_user_field_visible_for_role("email", missing_role_state),
    ).toBe(true);
    expect(
      is_system_user_field_visible_for_role("first_name", missing_role_state),
    ).toBe(true);
    expect(
      is_system_user_field_visible_for_role("role", missing_role_state),
    ).toBe(true);
  });
});

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
