import { describe, expect, it } from "vitest";

import type { Competition } from "$lib/core/entities/Competition";
import type { CompetitionTeam } from "$lib/core/entities/CompetitionTeam";
import type { Fixture } from "$lib/core/entities/Fixture";
import type { Team } from "$lib/core/entities/Team";
import {
  build_fixture_lineup_create_wizard_steps,
  build_fixture_team_label_map,
  format_fixture_date_time,
  get_fixture_display_name,
  get_player_role_label,
} from "$lib/presentation/logic/fixtureLineupCreateState";

function build_fixture(): Fixture {
  return {
    id: "fixture-1",
    competition_id: "competition-1",
    home_team_id: "team-1",
    away_team_id: "team-2",
    scheduled_date: "2026-05-10",
    scheduled_time: "14:30",
    status: "scheduled",
  } as Fixture;
}

describe("fixture lineup create wizard steps", () => {
  it("marks steps complete from the selected state", () => {
    const steps = build_fixture_lineup_create_wizard_steps(
      true,
      true,
      true,
      12,
      2,
      18,
      true,
    );
    expect(steps.map((step) => step.is_completed)).toEqual([
      true,
      true,
      true,
      true,
      true,
    ]);
  });

  it("requires player bounds before confirm completes", () => {
    const steps = build_fixture_lineup_create_wizard_steps(
      true,
      true,
      true,
      1,
      2,
      18,
      true,
    );
    expect(steps[3].is_completed).toBe(false);
    expect(steps[4].is_completed).toBe(false);
  });
});

describe("fixture lineup create labels", () => {
  it("builds grouped fixture names with competition and date", () => {
    const fixture = build_fixture();
    const teams = [
      { id: "team-1", name: "Kampala" },
      { id: "team-2", name: "Jinja" },
    ] as Team[];
    const competitions = [
      { id: "competition-1", name: "Premier League" },
    ] as Competition[];
    expect(get_fixture_display_name(fixture, teams, competitions)).toBe(
      "Premier League - Kampala vs Jinja - 10 May 2026 - 14:30",
    );
  });

  it("builds fixture team labels with seed and status", () => {
    const teams = [{ id: "team-1", name: "Kampala" }] as Team[];
    const competition_teams = [
      {
        id: "competition-team-1",
        competition_id: "competition-1",
        team_id: "team-1",
        registration_date: "2026-05-01",
        seed_number: 3,
        group_name: "",
        points: 0,
        goals_for: 0,
        goals_against: 0,
        goal_difference: 0,
        matches_played: 0,
        matches_won: 0,
        matches_drawn: 0,
        matches_lost: 0,
        notes: "",
        status: "confirmed",
      },
    ] as CompetitionTeam[];
    expect(
      build_fixture_team_label_map(teams, competition_teams).get("team-1"),
    ).toBe("Kampala • Seed 3 • confirmed");
  });

  it("formats starter and substitute roles by index", () => {
    expect(get_player_role_label(0, 11)).toBe("Starter");
    expect(get_player_role_label(11, 11)).toBe("Substitute");
  });

  it("formats fixture date strings when present", () => {
    expect(format_fixture_date_time("2026-05-10", "14:30")).toBe(
      "10 May 2026 - 14:30",
    );
    expect(format_fixture_date_time("", "14:30")).toBe("");
  });
});
