import { describe, expect, it } from "vitest";

import {
  build_sync_progress_message,
  determine_session_action,
  format_table_name,
  is_in_app_navigation,
  scale_sync_percentage,
  should_pull_org_from_server,
} from "./layoutLogic";

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

  it("returns false for an empty organization id", () => {
    expect(should_pull_org_from_server("")).toBe(false);
  });

  it("returns false for whitespace-only organization ids", () => {
    expect(should_pull_org_from_server("   ")).toBe(false);
  });

  it("returns false for the wildcard after trimming", () => {
    expect(should_pull_org_from_server(" * ")).toBe(false);
  });
});
