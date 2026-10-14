import { describe, expect, it, type Mock, vi } from "vitest";

import {
  guard_completed_navigation,
  should_cancel_navigation,
} from "./layoutNavigationGuard";

interface BeforeNavigationDependenciesUnderTest {
  is_app_ready: () => boolean;
  read_current_role: () =>
    | { status: "some"; value: string }
    | { status: "none" };
  evaluate_cached_route_access: (pathname: string, role: string) => string;
  evaluate_local_route_access: (pathname: string, role: string) => boolean;
  record_denial: Mock;
}

function create_before_navigation_dependencies(
  overrides: Partial<{
    is_app_ready: () => boolean;
    read_current_role: () =>
      | { status: "some"; value: string }
      | { status: "none" };
    evaluate_cached_route_access: (pathname: string, role: string) => string;
    evaluate_local_route_access: (pathname: string, role: string) => boolean;
  }> = {},
): BeforeNavigationDependenciesUnderTest {
  return {
    is_app_ready: () => true,
    read_current_role: () => ({ status: "some", value: "player" }) as const,
    evaluate_cached_route_access: vi.fn(() => "denied"),
    evaluate_local_route_access: vi.fn(() => true),
    record_denial: vi.fn(() => true),
    ...overrides,
  };
}

describe("should_cancel_navigation", () => {
  it("cancels an in-app navigation the cached role access already denies", () => {
    const warn_spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const dependencies = create_before_navigation_dependencies();

    expect(
      should_cancel_navigation(dependencies as never, "/competitions/create"),
    ).toBe(true);
    expect(dependencies.record_denial).toHaveBeenCalledWith(
      "/competitions/create",
      "player",
    );
    expect(warn_spy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        event: "layout_navigation_cancelled_by_guard",
      }),
    );
  });

  it("lets the navigation proceed when cached access is allowed", () => {
    const dependencies = create_before_navigation_dependencies({
      evaluate_cached_route_access: vi.fn(() => "allowed"),
      evaluate_local_route_access: vi.fn(() => false),
    });

    expect(should_cancel_navigation(dependencies as never, "/teams")).toBe(
      false,
    );
    expect(dependencies.record_denial).not.toHaveBeenCalled();
  });

  it("computes access locally when the cached decision is unknown and lets an allowed route proceed", () => {
    const evaluate_local_route_access = vi.fn(() => true);
    const dependencies = create_before_navigation_dependencies({
      evaluate_cached_route_access: vi.fn(() => "unknown"),
      evaluate_local_route_access,
    });

    expect(should_cancel_navigation(dependencies as never, "/teams")).toBe(
      false,
    );
    expect(evaluate_local_route_access).toHaveBeenCalledWith(
      "/teams",
      "player",
    );
    expect(dependencies.record_denial).not.toHaveBeenCalled();
  });

  it("cancels the navigation when the cached decision is unknown and the local role permissions deny it", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const dependencies = create_before_navigation_dependencies({
      evaluate_cached_route_access: vi.fn(() => "unknown"),
      evaluate_local_route_access: vi.fn(() => false),
    });

    expect(should_cancel_navigation(dependencies as never, "/audit-logs")).toBe(
      true,
    );
    expect(dependencies.record_denial).toHaveBeenCalledWith(
      "/audit-logs",
      "player",
    );
  });

  it.each(["/profile/ada-lovelace", "/team-profile/kampala-lions"])(
    "never cancels navigation to the public profile page %s",
    (pathname: string) => {
      const dependencies = create_before_navigation_dependencies({
        read_current_role: () => ({ status: "some", value: "public_viewer" }),
        evaluate_local_route_access: vi.fn(() => false),
      });

      expect(should_cancel_navigation(dependencies as never, pathname)).toBe(
        false,
      );
    },
  );

  it("never cancels navigation to guard-exempt routes or before the app is ready", () => {
    const exempt = create_before_navigation_dependencies();
    const not_ready = create_before_navigation_dependencies({
      is_app_ready: () => false,
    });

    expect(should_cancel_navigation(exempt as never, "/sign-in")).toBe(false);
    expect(should_cancel_navigation(not_ready as never, "/teams")).toBe(false);
  });

  it("lets the post-navigation guard decide when no profile is active", () => {
    const dependencies = create_before_navigation_dependencies({
      read_current_role: () => ({ status: "none" }),
    });

    expect(should_cancel_navigation(dependencies as never, "/teams")).toBe(
      false,
    );
  });
});

describe("guard_completed_navigation", () => {
  it.each(["link", "goto", "popstate", "enter"])(
    "checks route access after %s navigation",
    async () => {
      const ensure_route_access = vi.fn(async () => true);

      const result = await guard_completed_navigation(
        { is_app_ready: () => true, ensure_route_access },
        "/teams",
      );

      expect(result).toBe(true);
      expect(ensure_route_access).toHaveBeenCalledWith("/teams");
    },
  );

  it("skips exempt routes and an app that is not ready", async () => {
    const ensure_route_access = vi.fn(async () => true);

    await guard_completed_navigation(
      { is_app_ready: () => true, ensure_route_access },
      "/privacy",
    );
    await guard_completed_navigation(
      { is_app_ready: () => false, ensure_route_access },
      "/teams",
    );

    expect(ensure_route_access).not.toHaveBeenCalled();
  });

  it("reports a denied navigation", async () => {
    const result = await guard_completed_navigation(
      { is_app_ready: () => true, ensure_route_access: async () => false },
      "/audit-logs",
    );

    expect(result).toBe(false);
  });
});
