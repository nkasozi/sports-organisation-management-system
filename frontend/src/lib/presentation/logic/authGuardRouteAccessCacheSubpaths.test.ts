import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  CACHED_ROUTE_ACCESS_STATUS,
  evaluate_cached_route_access,
  invalidate_route_access_cache,
  is_pathname_in_route_access_cache,
  refresh_route_access_cache_for_role,
} from "./authGuardRouteAccessCache";

const route_cache_mocks = vi.hoisted(() => ({
  get_accessible_routes_for_role: vi.fn(),
}));

vi.mock("$lib/infrastructure/AuthorizationProvider", () => ({
  get_authorization_adapter: () => ({
    get_accessible_routes_for_role:
      route_cache_mocks.get_accessible_routes_for_role,
  }),
}));

describe("authGuardRouteAccessCache action subpaths", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    route_cache_mocks.get_accessible_routes_for_role.mockReset();
    route_cache_mocks.get_accessible_routes_for_role.mockResolvedValue({
      success: true,
      data: ["/competitions"],
    });
    invalidate_route_access_cache();
  });

  it("does not let list access grant the create page to a role without create permission", async () => {
    expect((await refresh_route_access_cache_for_role("player")).success).toBe(
      true,
    );

    expect(is_pathname_in_route_access_cache("/competitions")).toBe(true);
    expect(is_pathname_in_route_access_cache("/competitions/c-1")).toBe(true);
    expect(is_pathname_in_route_access_cache("/competitions/create")).toBe(
      false,
    );
  });

  it("grants the create page to a role with create permission", async () => {
    expect(
      (await refresh_route_access_cache_for_role("org_admin")).success,
    ).toBe(true);

    expect(is_pathname_in_route_access_cache("/competitions/create")).toBe(
      true,
    );
  });
});

describe("evaluate_cached_route_access", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    route_cache_mocks.get_accessible_routes_for_role.mockReset();
    route_cache_mocks.get_accessible_routes_for_role.mockResolvedValue({
      success: true,
      data: ["/teams"],
    });
    invalidate_route_access_cache();
  });

  it("is unknown before the cache has been loaded", () => {
    expect(evaluate_cached_route_access("/teams", "player")).toBe(
      CACHED_ROUTE_ACCESS_STATUS.UNKNOWN,
    );
  });

  it("answers allowed or denied from a fresh cache for the same role", async () => {
    expect((await refresh_route_access_cache_for_role("player")).success).toBe(
      true,
    );

    expect(evaluate_cached_route_access("/teams/t-1", "player")).toBe(
      CACHED_ROUTE_ACCESS_STATUS.ALLOWED,
    );
    expect(evaluate_cached_route_access("/venues", "player")).toBe(
      CACHED_ROUTE_ACCESS_STATUS.DENIED,
    );
  });

  it("is unknown when the cache belongs to a different role", async () => {
    expect((await refresh_route_access_cache_for_role("player")).success).toBe(
      true,
    );

    expect(evaluate_cached_route_access("/venues", "org_admin")).toBe(
      CACHED_ROUTE_ACCESS_STATUS.UNKNOWN,
    );
  });
});
