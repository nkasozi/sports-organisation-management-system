import { describe, expect, it } from "vitest";

import {
  ALWAYS_ALLOWED_ROUTE_BASES,
  extract_route_base,
  format_route_as_page_name,
  get_role_display_name,
  is_route_in_accessible_set,
} from "./authGuardRoutes";

describe("authGuardRoutes", () => {
  it("extracts the first path segment as the route base", () => {
    expect(extract_route_base("")).toBe("/");
    expect(extract_route_base("/teams/123/edit")).toBe("/teams");
  });

  it("always allows public route bases", () => {
    expect([...ALWAYS_ALLOWED_ROUTE_BASES]).toEqual([
      "/",
      "/match-report",
      "/competition-results",
      "/calendar",
    ]);
    expect(is_route_in_accessible_set("/calendar/2025", new Set())).toBe(true);
    expect(is_route_in_accessible_set("/teams", new Set())).toBe(false);
    expect(is_route_in_accessible_set("/teams/1", new Set(["/teams"]))).toBe(
      true,
    );
  });

  it("maps roles to display names", () => {
    expect(get_role_display_name("org_admin")).toBe("Organisation Admin");
    expect(get_role_display_name("public_viewer")).toBe("Public Viewer");
  });

  it("formats route slugs as page names", () => {
    expect(format_route_as_page_name("/")).toBe("Dashboard");
    expect(format_route_as_page_name("/player-profiles/1")).toBe(
      "Player Profiles",
    );
  });
});
