import { describe, it, expect } from "vitest";
import {
  build_match_report_data,
  generate_match_report_filename,
  type MatchReportBuildContext,
} from "./MatchReportBuilder";
import type { Fixture } from "$lib/core/entities/Fixture";
import type { Team } from "$lib/core/entities/Team";
import type { Competition } from "$lib/core/entities/Competition";
import type { Official } from "$lib/core/entities/Official";

function make_fixture(overrides: Partial<Fixture> = {}): Fixture {
  return {
    id: "fix-1",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    home_team_id: "team-home",
    away_team_id: "team-away",
    competition_id: "comp-1",
    organization_id: "org-1",
    scheduled_date: "2026-03-14",
    scheduled_time: "14:00",
    venue: "Main Stadium",
    status: "completed",
    home_team_score: 2,
    away_team_score: 1,
    match_day: 5,
    round_name: "Group A",
    round_number: 3,
    game_events: [],
    notes: "",
    home_team_jersey: null,
    away_team_jersey: null,
    current_minute: 90,
    ...overrides,
  } as unknown as Fixture;
}

function make_team(name: string, overrides: Partial<Team> = {}): Team {
  return {
    id: `team-${name}`,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    name,
    organization_id: "org-1",
    primary_color: "#FFFFFF",
    ...overrides,
  } as unknown as Team;
}

function make_competition(overrides: Partial<Competition> = {}): Competition {
  return {
    id: "comp-1",
    name: "Premier Cup",
    organization_id: "org-1",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  } as unknown as Competition;
}

function make_official(
  first_name: string,
  last_name: string,
): Official {
  return {
    id: `off-${first_name}`,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    first_name,
    last_name,
    organization_id: "org-1",
  } as unknown as Official;
}

function make_basic_context(overrides: Partial<MatchReportBuildContext> = {}): MatchReportBuildContext {
  return {
    fixture: make_fixture(),
    home_team: make_team("Harare City"),
    away_team: make_team("Dynamos FC"),
    competition: make_competition(),
    home_lineup: [],
    away_lineup: [],
    assigned_officials: [],
    ...overrides,
  };
}

describe("build_match_report_data", () => {
  it("returns correct final score from fixture", () => {
    const ctx = make_basic_context({
      fixture: make_fixture({ home_team_score: 3, away_team_score: 0 }),
    });
    const report = build_match_report_data(ctx);
    expect(report.final_score.home).toBe(3);
    expect(report.final_score.away).toBe(0);
  });

  it("defaults final score to 0 when fixture scores are null", () => {
    const ctx = make_basic_context({
      fixture: make_fixture({ home_team_score: null as unknown as number, away_team_score: null as unknown as number }),
    });
    const report = build_match_report_data(ctx);
    expect(report.final_score.home).toBe(0);
    expect(report.final_score.away).toBe(0);
  });

  it("sets competition name in uppercase", () => {
    const ctx = make_basic_context({ competition: make_competition({ name: "Premier Cup" }) });
    const report = build_match_report_data(ctx);
    expect(report.competition_name).toBe("PREMIER CUP");
  });

  it("falls back to 'COMPETITION' when competition is null", () => {
    const ctx = make_basic_context({ competition: null });
    const report = build_match_report_data(ctx);
    expect(report.competition_name).toBe("COMPETITION");
  });

  it("uses organization_name as league_name", () => {
    const ctx = make_basic_context({ organization_name: "Zimbabwe Hockey Union" });
    const report = build_match_report_data(ctx);
    expect(report.league_name).toBe("Zimbabwe Hockey Union");
  });

  it("defaults league_name when organization_name absent", () => {
    const ctx = make_basic_context();
    const report = build_match_report_data(ctx);
    expect(report.league_name).toBe("SPORTS ORGANIZATION");
  });

  it("populates home and away team names", () => {
    const ctx = make_basic_context();
    const report = build_match_report_data(ctx);
    expect(report.home_team.name).toBe("Harare City");
    expect(report.away_team.name).toBe("Dynamos FC");
  });

  it("derives team initials from team names", () => {
    const ctx = make_basic_context();
    const report = build_match_report_data(ctx);
    expect(report.home_team.initials).toBeTruthy();
    expect(report.away_team.initials).toBeTruthy();
  });

  it("uses fixture scheduled_time for push_back_time", () => {
    const ctx = make_basic_context({ fixture: make_fixture({ scheduled_time: "15:30" }) });
    const report = build_match_report_data(ctx);
    expect(report.push_back_time).toBe("15:30");
    expect(report.scheduled_push_back).toBe("15:30");
  });

  it("defaults scheduled_time to 00:00 when absent", () => {
    const ctx = make_basic_context({ fixture: make_fixture({ scheduled_time: null as unknown as string }) });
    const report = build_match_report_data(ctx);
    expect(report.push_back_time).toBe("00:00");
  });

  it("uses venue_name prop when provided", () => {
    const ctx = make_basic_context({ venue_name: "National Sports Stadium" });
    const report = build_match_report_data(ctx);
    expect(report.venue_name).toBe("National Sports Stadium");
  });

  it("falls back to fixture.venue when venue_name prop absent", () => {
    const ctx = make_basic_context({ fixture: make_fixture({ venue: "Old Hararians" }) });
    const report = build_match_report_data(ctx);
    expect(report.venue_name).toBe("Old Hararians");
  });

  it("falls back to 'Unknown Venue' when neither venue_name nor fixture.venue set", () => {
    const ctx = make_basic_context({ fixture: make_fixture({ venue: "" }) });
    const report = build_match_report_data(ctx);
    expect(report.venue_name).toBe("Unknown Venue");
  });

  it("populates fixture year from scheduled_date", () => {
    const ctx = make_basic_context({ fixture: make_fixture({ scheduled_date: "2026-03-14" }) });
    const report = build_match_report_data(ctx);
    expect(report.fixture_year).toBe("2026");
  });

  it("populates game_week from fixture.match_day", () => {
    const ctx = make_basic_context({ fixture: make_fixture({ match_day: 7 }) });
    const report = build_match_report_data(ctx);
    expect(report.game_week).toBe(7);
  });

  it("populates pool from fixture.round_name", () => {
    const ctx = make_basic_context({ fixture: make_fixture({ round_name: "Group B" }) });
    const report = build_match_report_data(ctx);
    expect(report.pool).toBe("Group B");
  });

  it("maps assigned officials to name/role pairs", () => {
    const ctx = make_basic_context({
      assigned_officials: [
        { official: make_official("John", "Doe"), role_name: "referee" },
        { official: make_official("Jane", "Smith"), role_name: "assistant_referee" },
      ],
    });
    const report = build_match_report_data(ctx);
    expect(report.officials).toHaveLength(2);
    expect(report.officials[0].role).toBe("Referee");
    expect(report.officials[0].name).toContain("Doe");
    expect(report.officials[1].role).toBe("Assistant Referee");
  });

  it("maps unknown official roles using the raw string", () => {
    const ctx = make_basic_context({
      assigned_officials: [
        { official: make_official("A", "B"), role_name: "video_review_officer" },
      ],
    });
    const report = build_match_report_data(ctx);
    expect(report.officials[0].role).toBe("video_review_officer");
  });

  it("includes fixture notes as remarks", () => {
    const ctx = make_basic_context({ fixture: make_fixture({ notes: "Match postponed once" }) });
    const report = build_match_report_data(ctx);
    expect(report.remarks).toBe("Match postponed once");
  });

  it("uses DEFAULT_CARD_TYPES when card_types not provided", () => {
    const ctx = make_basic_context();
    const report = build_match_report_data(ctx);
    expect(report.card_types.length).toBeGreaterThan(0);
    const types = report.card_types.map((c) => c.event_type);
    expect(types).toContain("yellow_card");
    expect(types).toContain("red_card");
  });

  it("uses custom card_types when provided", () => {
    const custom_cards = [{ id: "custom", name: "Custom", color: "#000", event_type: "custom_card" }];
    const ctx = make_basic_context({ card_types: custom_cards });
    const report = build_match_report_data(ctx);
    expect(report.card_types).toEqual(custom_cards);
  });

  it("score_by_period always includes at least two periods", () => {
    const ctx = make_basic_context();
    const report = build_match_report_data(ctx);
    expect(report.score_by_period.length).toBeGreaterThanOrEqual(2);
  });

  it("score_by_period adds extra time periods when extra time goals exist", () => {
    const fixture = make_fixture({
      game_events: [
        { id: "e1", event_type: "goal", team_side: "home", minute: 100, player_id: "p1", jersey_number: 10, created_at: "", notes: "" } as any,
      ],
    });
    const ctx = make_basic_context({ fixture });
    const report = build_match_report_data(ctx);
    const period_names = report.score_by_period.map((p) => p.period_name);
    expect(period_names).toContain("Third Period");
  });

  it("goal events increment home score correctly", () => {
    const fixture = make_fixture({
      game_events: [
        { id: "e1", event_type: "goal", team_side: "home", minute: 20, player_id: "p1", jersey_number: 9, created_at: "", notes: "" } as any,
        { id: "e2", event_type: "goal", team_side: "home", minute: 40, player_id: "p2", jersey_number: 7, created_at: "", notes: "" } as any,
      ],
    });
    const ctx = make_basic_context({ fixture });
    const report = build_match_report_data(ctx);
    const half_time = report.score_by_period.find((p) => p.period_name === "Half-time");
    expect(half_time?.home_score).toBe(2);
  });

  it("own_goal event credits home team even if team_side is away", () => {
    const fixture = make_fixture({
      game_events: [
        { id: "e1", event_type: "own_goal", team_side: "away", minute: 30, player_id: "p1", jersey_number: 5, created_at: "", notes: "" } as any,
      ],
    });
    const ctx = make_basic_context({ fixture });
    const report = build_match_report_data(ctx);
    const half_time = report.score_by_period.find((p) => p.period_name === "Half-time");
    expect(half_time?.home_score).toBe(1);
    expect(half_time?.away_score).toBe(0);
  });

  it("home_staff and away_staff propagated to team info", () => {
    const ctx = make_basic_context({
      home_staff: [{ role: "Coach", name: "Bob" }],
      away_staff: [{ role: "Manager", name: "Alice" }],
    });
    const report = build_match_report_data(ctx);
    expect(report.home_team.staff).toEqual([{ role: "Coach", name: "Bob" }]);
    expect(report.away_team.staff).toEqual([{ role: "Manager", name: "Alice" }]);
  });

  it("defaults staff to empty arrays when not provided", () => {
    const ctx = make_basic_context();
    const report = build_match_report_data(ctx);
    expect(report.home_team.staff).toEqual([]);
    expect(report.away_team.staff).toEqual([]);
  });

  it("organization_logo_url defaults to empty string", () => {
    const ctx = make_basic_context();
    const report = build_match_report_data(ctx);
    expect(report.organization_logo_url).toBe("");
  });

  it("organization_logo_url uses provided value", () => {
    const ctx = make_basic_context({ organization_logo_url: "https://example.com/logo.png" });
    const report = build_match_report_data(ctx);
    expect(report.organization_logo_url).toBe("https://example.com/logo.png");
  });
});

describe("generate_match_report_filename", () => {
  it("produces a .pdf filename", () => {
    const name = generate_match_report_filename("Harare City", "Dynamos FC", "2026-03-14");
    expect(name).toMatch(/\.pdf$/);
  });

  it("replaces special characters in team names with underscores", () => {
    const name = generate_match_report_filename("Team A & B", "Team C/D", "2026-03-14");
    expect(name).not.toContain("&");
    expect(name).not.toContain("/");
    expect(name).not.toContain(" ");
  });

  it("replaces special characters in date with underscores", () => {
    const name = generate_match_report_filename("HomeTeam", "AwayTeam", "2026-03-14");
    expect(name).not.toContain("-");
  });

  it("includes both team names in the filename", () => {
    const name = generate_match_report_filename("HarareCity", "DynamosFC", "20260314");
    expect(name).toContain("HarareCity");
    expect(name).toContain("DynamosFC");
  });

  it("includes the date in the filename", () => {
    const name = generate_match_report_filename("TeamA", "TeamB", "20260314");
    expect(name).toContain("20260314");
  });

  it("includes 'Match_Report' prefix", () => {
    const name = generate_match_report_filename("A", "B", "2026");
    expect(name).toMatch(/^Match_Report_/);
  });
});
