import { describe, it, expect } from "vitest";
import {
  PUBLIC_TABLES,
  ALLOWED_SYNC_TABLES,
  is_public_table,
} from "../../../../convex/lib/sync_validation";

const COMPETITION_RESULTS_TABLES = [
  "organizations",
  "competitions",
  "competition_formats",
  "competition_stages",
  "competition_teams",
  "teams",
  "fixtures",
  "fixture_lineups",
  "fixture_details_setups",
  "officials",
  "team_staff",
  "team_staff_roles",
  "game_official_roles",
];

const CALENDAR_TABLES = [
  "organizations",
  "competitions",
  "teams",
  "fixtures",
  "activities",
  "activity_categories",
];

const MATCH_REPORT_TABLES = [
  "organizations",
  "competitions",
  "competition_formats",
  "competition_stages",
  "teams",
  "fixtures",
  "fixture_lineups",
  "fixture_details_setups",
  "officials",
  "team_staff",
  "team_staff_roles",
  "game_official_roles",
  "players",
  "player_positions",
  "player_team_memberships",
];

describe("PUBLIC_TABLES completeness (R31)", () => {
  it("contains every table required by competition-results pages", () => {
    for (const table of COMPETITION_RESULTS_TABLES) {
      expect(PUBLIC_TABLES.has(table)).toBe(true);
    }
  });

  it("contains every table required by calendar pages", () => {
    for (const table of CALENDAR_TABLES) {
      expect(PUBLIC_TABLES.has(table)).toBe(true);
    }
  });

  it("contains every table required by match-report pages", () => {
    for (const table of MATCH_REPORT_TABLES) {
      expect(PUBLIC_TABLES.has(table)).toBe(true);
    }
  });

  it("only contains tables that are in ALLOWED_SYNC_TABLES", () => {
    const allowed_set = new Set<string>(ALLOWED_SYNC_TABLES);
    for (const table of PUBLIC_TABLES) {
      expect(allowed_set.has(table)).toBe(true);
    }
  });

  it("does not contain sensitive auth-only tables", () => {
    const sensitive_tables = [
      "system_users",
      "calendar_tokens",
      "organization_settings",
      "identifications",
      "identification_types",
      "qualifications",
    ];
    for (const table of sensitive_tables) {
      expect(PUBLIC_TABLES.has(table)).toBe(false);
    }
  });
});

describe("is_public_table", () => {
  it("returns true for tables in PUBLIC_TABLES", () => {
    expect(is_public_table("organizations")).toBe(true);
    expect(is_public_table("competitions")).toBe(true);
    expect(is_public_table("teams")).toBe(true);
    expect(is_public_table("fixtures")).toBe(true);
  });

  it("returns false for auth-only tables", () => {
    expect(is_public_table("system_users")).toBe(false);
    expect(is_public_table("calendar_tokens")).toBe(false);
    expect(is_public_table("organization_settings")).toBe(false);
  });

  it("returns false for unknown tables", () => {
    expect(is_public_table("nonexistent_table")).toBe(false);
  });
});
