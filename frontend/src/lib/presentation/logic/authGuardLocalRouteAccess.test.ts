import { describe, expect, it, vi } from "vitest";

import { is_route_allowed_for_role_locally } from "./authGuardLocalRouteAccess";

describe("is_route_allowed_for_role_locally", () => {
  it("allows a route that is in the role's local menu", () => {
    expect(is_route_allowed_for_role_locally("/players", "player")).toBe(true);
  });

  it("denies a route the role's local menu does not include", () => {
    expect(is_route_allowed_for_role_locally("/audit-logs", "player")).toBe(
      false,
    );
    expect(is_route_allowed_for_role_locally("/players", "public_viewer")).toBe(
      false,
    );
  });

  it("allows public routes for an anonymous public viewer", () => {
    expect(
      is_route_allowed_for_role_locally("/calendar", "public_viewer"),
    ).toBe(true);
    expect(
      is_route_allowed_for_role_locally(
        "/profile/ada-lovelace",
        "public_viewer",
      ),
    ).toBe(true);
    expect(
      is_route_allowed_for_role_locally(
        "/team-profile/kampala-lions",
        "public_viewer",
      ),
    ).toBe(true);
  });

  it("denies an action subpath the role cannot perform even when the base route is allowed", () => {
    expect(
      is_route_allowed_for_role_locally("/venues/create", "org_admin"),
    ).toBe(true);
    expect(is_route_allowed_for_role_locally("/players/create", "player")).toBe(
      false,
    );
  });

  it("denies every guarded route for an unknown role", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(
      is_route_allowed_for_role_locally("/players", "intruder" as never),
    ).toBe(false);
  });
});
