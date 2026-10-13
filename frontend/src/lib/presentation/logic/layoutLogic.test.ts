import { describe, expect, it } from "vitest";

import {
  get_is_auth_page,
  get_is_public_content_page,
  get_is_public_profile_page,
  is_route_guard_exempt,
} from "./layoutLogic";

describe("get_is_public_profile_page", () => {
  it("returns true for /profile/ paths", () => {
    expect(get_is_public_profile_page("/profile/john-doe")).toBe(true);
  });

  it("returns true for /team-profile/ paths", () => {
    expect(get_is_public_profile_page("/team-profile/red-bulls")).toBe(true);
  });

  it("returns false for /profile without trailing slash", () => {
    expect(get_is_public_profile_page("/profile")).toBe(false);
  });

  it("returns false for /team-profile without trailing slash", () => {
    expect(get_is_public_profile_page("/team-profile")).toBe(false);
  });

  it("returns false for unrelated paths", () => {
    expect(get_is_public_profile_page("/players")).toBe(false);
    expect(get_is_public_profile_page("/")).toBe(false);
    expect(get_is_public_profile_page("/sign-in")).toBe(false);
  });
});

describe("get_is_public_content_page", () => {
  it("returns true for /competition-results and sub-paths", () => {
    expect(get_is_public_content_page("/competition-results")).toBe(true);
    expect(get_is_public_content_page("/competition-results/league-1")).toBe(
      true,
    );
  });

  it("returns true for /calendar and sub-paths", () => {
    expect(get_is_public_content_page("/calendar")).toBe(true);
    expect(get_is_public_content_page("/calendar/2026-03")).toBe(true);
  });

  it("returns true for /match-report and sub-paths", () => {
    expect(get_is_public_content_page("/match-report")).toBe(true);
    expect(get_is_public_content_page("/match-report/fixture-99")).toBe(true);
  });

  it("returns false for protected pages", () => {
    expect(get_is_public_content_page("/competitions")).toBe(false);
    expect(get_is_public_content_page("/fixtures")).toBe(false);
    expect(get_is_public_content_page("/")).toBe(false);
  });
});

describe("get_is_auth_page", () => {
  it("returns true for /sign-in and sub-paths", () => {
    expect(get_is_auth_page("/sign-in")).toBe(true);
    expect(get_is_auth_page("/sign-in?redirect=/dashboard")).toBe(true);
  });

  it("returns true for exactly /unauthorized", () => {
    expect(get_is_auth_page("/unauthorized")).toBe(true);
  });

  it("returns false for other pages", () => {
    expect(get_is_auth_page("/")).toBe(false);
    expect(get_is_auth_page("/players")).toBe(false);
    expect(get_is_auth_page("/sign-out")).toBe(false);
  });
});

describe("is_route_guard_exempt", () => {
  it("exempts the root path", () => {
    expect(is_route_guard_exempt("/")).toBe(true);
  });

  it("exempts /sign-in paths", () => {
    expect(is_route_guard_exempt("/sign-in")).toBe(true);
    expect(is_route_guard_exempt("/sign-in?error=sync_failed")).toBe(true);
  });

  it("exempts /unauthorized", () => {
    expect(is_route_guard_exempt("/unauthorized")).toBe(true);
  });

  it("exempts /api/ paths", () => {
    expect(is_route_guard_exempt("/api/calendar/feed.ics")).toBe(true);
  });

  it("exempts /privacy, /terms, /contact", () => {
    expect(is_route_guard_exempt("/privacy")).toBe(true);
    expect(is_route_guard_exempt("/terms")).toBe(true);
    expect(is_route_guard_exempt("/contact")).toBe(true);
  });

  it("exempts public content pages", () => {
    expect(is_route_guard_exempt("/competition-results")).toBe(true);
    expect(is_route_guard_exempt("/calendar")).toBe(true);
    expect(is_route_guard_exempt("/match-report/fix-1")).toBe(true);
  });

  it("does NOT exempt protected pages", () => {
    expect(is_route_guard_exempt("/players")).toBe(false);
    expect(is_route_guard_exempt("/fixtures")).toBe(false);
    expect(is_route_guard_exempt("/competitions")).toBe(false);
    expect(is_route_guard_exempt("/system-users")).toBe(false);
    expect(is_route_guard_exempt("/official-roles")).toBe(false);
  });
});
