import { beforeEach, describe, expect, it, vi } from "vitest";

import { AUTH_GUARD_EVENTS, AUTH_GUARD_MESSAGES } from "./authGuardConstants";
import {
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

describe("authGuardRouteAccessCache", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    route_cache_mocks.get_accessible_routes_for_role.mockReset();
    route_cache_mocks.get_accessible_routes_for_role.mockResolvedValue({
      success: true,
      data: ["/teams"],
    });
    invalidate_route_access_cache();
  });

  it("reports no cached routes before loading", () => {
    expect(is_pathname_in_route_access_cache("/teams")).toBe(false);
    expect(invalidate_route_access_cache()).toBe(false);
  });

  it("loads routes once per role while the cache is valid", async () => {
    expect(await refresh_route_access_cache_for_role("org_admin")).toEqual({
      success: true,
      data: true,
    });
    expect(await refresh_route_access_cache_for_role("org_admin")).toEqual({
      success: true,
      data: false,
    });
    expect(is_pathname_in_route_access_cache("/teams/1")).toBe(true);
    expect(
      route_cache_mocks.get_accessible_routes_for_role,
    ).toHaveBeenCalledTimes(1);

    expect(await refresh_route_access_cache_for_role("player")).toEqual({
      success: true,
      data: true,
    });
    expect(invalidate_route_access_cache()).toBe(true);
  });

  it("only allows always-allowed routes when loading fails", async () => {
    route_cache_mocks.get_accessible_routes_for_role.mockResolvedValue({
      success: false,
      error: "offline",
    });

    const refresh_result = await refresh_route_access_cache_for_role("player");

    expect(refresh_result).toEqual({
      success: false,
      error: AUTH_GUARD_MESSAGES.ROUTE_ACCESS_UNAVAILABLE,
    });
    expect(is_pathname_in_route_access_cache("/teams")).toBe(false);
    expect(is_pathname_in_route_access_cache("/calendar")).toBe(true);
    expect(console.error).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        event: AUTH_GUARD_EVENTS.ROUTE_ACCESS_LOAD_FAILED,
        role: "player",
      }),
    );
  });

  it("retries loading on the next refresh after a failure", async () => {
    route_cache_mocks.get_accessible_routes_for_role.mockResolvedValueOnce({
      success: false,
      error: "offline",
    });

    const failed_result = await refresh_route_access_cache_for_role("player");
    const retry_result = await refresh_route_access_cache_for_role("player");

    expect(failed_result.success).toBe(false);
    expect(retry_result).toEqual({ success: true, data: true });
    expect(is_pathname_in_route_access_cache("/teams")).toBe(true);
    expect(
      route_cache_mocks.get_accessible_routes_for_role,
    ).toHaveBeenCalledTimes(2);
  });
});
