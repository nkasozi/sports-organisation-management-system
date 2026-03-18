import { describe, it, expect } from "vitest";
import {
  get_is_public_profile_page,
  get_is_public_content_page,
  get_is_auth_page,
  is_route_guard_exempt,
  determine_session_action,
  is_in_app_navigation,
  format_table_name,
  scale_sync_percentage,
  build_sync_progress_message,
  should_pull_org_from_server,
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

describe("determine_session_action", () => {
  it("returns 'login_sync' when signed in but session not yet synced", () => {
    expect(determine_session_action(true, false)).toBe("login_sync");
  });

  it("returns 'verified_page_reload' when signed in and session already synced", () => {
    expect(determine_session_action(true, true)).toBe("verified_page_reload");
  });

  it("returns 'first_time_anonymous' when not signed in and no prior session", () => {
    expect(determine_session_action(false, false)).toBe("first_time_anonymous");
  });

  it("returns 'returning_anonymous' when not signed in but session previously existed", () => {
    expect(determine_session_action(false, true)).toBe("returning_anonymous");
  });
});

describe("is_in_app_navigation", () => {
  it("returns true for 'link'", () => {
    expect(is_in_app_navigation("link")).toBe(true);
  });

  it("returns true for 'goto'", () => {
    expect(is_in_app_navigation("goto")).toBe(true);
  });

  it("returns true for 'popstate'", () => {
    expect(is_in_app_navigation("popstate")).toBe(true);
  });

  it("returns false for 'enter' (full page load)", () => {
    expect(is_in_app_navigation("enter")).toBe(false);
  });

  it("returns false for unknown types", () => {
    expect(is_in_app_navigation("unknown")).toBe(false);
    expect(is_in_app_navigation("")).toBe(false);
  });
});

describe("format_table_name", () => {
  it("converts underscores to spaces", () => {
    expect(format_table_name("game_official_roles")).toBe(
      "Game Official Roles",
    );
  });

  it("capitalizes the first letter of each word", () => {
    expect(format_table_name("player_team_memberships")).toBe(
      "Player Team Memberships",
    );
  });

  it("handles a single word with no underscores", () => {
    expect(format_table_name("fixtures")).toBe("Fixtures");
  });
});

describe("scale_sync_percentage", () => {
  it("maps 0% raw progress to 20 scaled", () => {
    expect(scale_sync_percentage(0)).toBe(20);
  });

  it("maps 100% raw progress to 88 scaled", () => {
    expect(scale_sync_percentage(100)).toBe(88);
  });

  it("maps 50% raw progress to the midpoint (54)", () => {
    expect(scale_sync_percentage(50)).toBe(54);
  });
});

describe("build_sync_progress_message", () => {
  it("builds a human-readable progress string", () => {
    expect(build_sync_progress_message("game_official_roles", 3, 35)).toBe(
      "Syncing Game Official Roles (3/35)",
    );
  });

  it("formats single-word table names", () => {
    expect(build_sync_progress_message("fixtures", 1, 35)).toBe(
      "Syncing Fixtures (1/35)",
    );
  });
});

describe("should_pull_org_from_server", () => {
  it("returns true for a real organization_id", () => {
    expect(should_pull_org_from_server("org_123")).toBe(true);
  });

  it("returns false for the wildcard '*'", () => {
    expect(should_pull_org_from_server("*")).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(should_pull_org_from_server(undefined)).toBe(false);
  });

  it("returns false for null", () => {
    expect(should_pull_org_from_server(null)).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(should_pull_org_from_server("")).toBe(false);
  });
});
