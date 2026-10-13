import { describe, expect, it } from "vitest";

import type { UserRole } from "$lib/core/interfaces/ports";

import { can_role_access_route } from "./LocalAuthorizationAdapter";

describe("can_role_access_route", () => {
  it("should allow super_admin to access admin routes", () => {
    const result = can_role_access_route("super_admin", "/system-users");
    expect(result.allowed).toBe(true);

    const result2 = can_role_access_route("super_admin", "/teams");
    expect(result2.allowed).toBe(true);

    const result3 = can_role_access_route("super_admin", "/organizations");
    expect(result3.allowed).toBe(true);
  });

  it("should allow org_admin to access settings", () => {
    const result = can_role_access_route("org_admin", "/settings");
    expect(result.allowed).toBe(true);
  });

  it("should deny player access to settings", () => {
    const result = can_role_access_route("player", "/settings");
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("does not have access");
  });

  it("should allow player to access their own routes", () => {
    const result = can_role_access_route("player", "/players");
    expect(result.allowed).toBe(true);

    const result2 = can_role_access_route("player", "/player-profiles");
    expect(result2.allowed).toBe(false);
  });

  it("should always allow access to home route", () => {
    const roles = [
      "super_admin",
      "org_admin",
      "team_manager",
      "player",
      "official",
      "public_viewer",
    ] as UserRole[];

    for (const role of roles) {
      const result = can_role_access_route(role, "/");
      expect(result.allowed).toBe(true);
    }
  });

  it("should allow team_manager to access teams route", () => {
    const result = can_role_access_route("team_manager", "/teams");
    expect(result.allowed).toBe(true);
  });

  it("should deny team_manager access to organizations route", () => {
    const result = can_role_access_route("team_manager", "/organizations");
    expect(result.allowed).toBe(false);
  });

  it("should allow public_viewer to access competition-results", () => {
    const result = can_role_access_route(
      "public_viewer",
      "/competition-results",
    );
    expect(result.allowed).toBe(true);
  });

  it("should allow public_viewer to access calendar", () => {
    const result = can_role_access_route("public_viewer", "/calendar");
    expect(result.allowed).toBe(true);
  });

  it("should allow public_viewer to access match-report", () => {
    const result = can_role_access_route("public_viewer", "/match-report/123");
    expect(result.allowed).toBe(true);
  });

  it("should deny public_viewer access to admin routes", () => {
    const denied_routes = [
      "/system-users",
      "/settings",
      "/organizations",
      "/teams",
      "/players",
      "/officials",
      "/fixtures",
      "/audit-logs",
    ];

    for (const route of denied_routes) {
      const result = can_role_access_route("public_viewer", route);
      expect(result.allowed).toBe(false);
    }
  });
});
