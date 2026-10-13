import { describe, expect, it } from "vitest";

import { get_allowed_roles_for_creator } from "./systemUserFormLogic";

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
