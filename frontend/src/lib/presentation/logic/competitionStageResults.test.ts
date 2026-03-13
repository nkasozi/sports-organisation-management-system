import { describe, expect, it } from "vitest";
import {
  build_competition_stage_results_sections,
  calculate_team_standings,
  infer_group_stage_team_groups,
} from "./competitionStageResults";
import type { CompetitionStage } from "$lib/core/entities/CompetitionStage";
import type { Fixture } from "$lib/core/entities/Fixture";
import type { Team } from "$lib/core/entities/Team";
import type { PointsConfig } from "$lib/core/entities/CompetitionFormat";
import type { TieBreaker } from "$lib/core/entities/CompetitionFormat";

function create_team(id: string, name: string): Team {
  return {
    id,
    name,
    short_name: name.slice(0, 3).toUpperCase(),
    description: `${name} description`,
    organization_id: "org-123",
    gender_id: "gender-123",
    captain_player_id: null,
    vice_captain_player_id: null,
    max_squad_size: 25,
    home_venue_id: "venue-123",
    founded_year: 2020,
    primary_color: "Blue",
    secondary_color: "White",
    logo_url: "",
    website: "",
    status: "active",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  };
}

function create_stage(
  overrides: Partial<CompetitionStage> = {},
): CompetitionStage {
  return {
    id: "stage-1",
    competition_id: "comp-123",
    name: "Pool Stage",
    stage_type: "group_stage",
    stage_order: 1,
    status: "active",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function create_fixture(
  home_team_id: string,
  away_team_id: string,
  overrides: Partial<Fixture> = {},
): Fixture {
  return {
    id: `${home_team_id}-${away_team_id}`,
    organization_id: "org-123",
    competition_id: "comp-123",
    stage_id: "stage-1",
    round_number: 1,
    round_name: "Round 1",
    home_team_id,
    away_team_id,
    venue: "Ground",
    scheduled_date: "2026-04-01",
    scheduled_time: "15:00",
    home_team_score: 1,
    away_team_score: 0,
    assigned_officials: [],
    game_events: [],
    current_period: "pre_game",
    current_minute: 0,
    match_day: 1,
    notes: "",
    status: "completed",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("competitionStageResults", () => {
  it("keeps disconnected fixtures as separate inferred groups", () => {
    const groups = infer_group_stage_team_groups([
      create_fixture("team-a", "team-b"),
      create_fixture("team-c", "team-d"),
    ]);

    expect(groups).toEqual([
      ["team-a", "team-b"],
      ["team-c", "team-d"],
    ]);
  });

  it("merges inferred groups when fixtures connect them", () => {
    const groups = infer_group_stage_team_groups([
      create_fixture("team-a", "team-b"),
      create_fixture("team-c", "team-d"),
      create_fixture("team-b", "team-c"),
    ]);

    expect(groups).toEqual([["team-a", "team-b", "team-c", "team-d"]]);
  });

  it("calculates standings from completed fixtures only", () => {
    const standings = calculate_team_standings(
      [
        create_fixture("team-a", "team-b", {
          home_team_score: 2,
          away_team_score: 0,
          status: "completed",
        }),
        create_fixture("team-b", "team-a", {
          home_team_score: null,
          away_team_score: null,
          status: "scheduled",
        }),
      ],
      [create_team("team-a", "Team A"), create_team("team-b", "Team B")],
    );

    expect(standings[0].team_id).toBe("team-a");
    expect(standings[0].points).toBe(3);
    expect(standings[1].played).toBe(1);
  });

  it("builds grouped stage sections for group stages", () => {
    const stage_sections = build_competition_stage_results_sections(
      [create_stage()],
      [
        create_fixture("team-a", "team-b", {
          home_team_score: 1,
          away_team_score: 0,
        }),
        create_fixture("team-c", "team-d", {
          home_team_score: 2,
          away_team_score: 2,
        }),
      ],
      [
        create_team("team-a", "Team A"),
        create_team("team-b", "Team B"),
        create_team("team-c", "Team C"),
        create_team("team-d", "Team D"),
      ],
    );

    expect(stage_sections).toHaveLength(1);
    expect(stage_sections[0].inferred_groups).toHaveLength(2);
    expect(stage_sections[0].inferred_groups[0].label).toBe("Group A");
    expect(stage_sections[0].inferred_groups[1].label).toBe("Group B");
  });

  it("awards configured points_for_win instead of hardcoded 3", () => {
    const custom_points: PointsConfig = {
      points_for_win: 2,
      points_for_draw: 1,
      points_for_loss: 0,
    };

    const standings = calculate_team_standings(
      [
        create_fixture("team-a", "team-b", {
          home_team_score: 1,
          away_team_score: 0,
          status: "completed",
        }),
      ],
      [create_team("team-a", "Team A"), create_team("team-b", "Team B")],
      custom_points,
    );

    expect(standings[0].team_id).toBe("team-a");
    expect(standings[0].points).toBe(2);
    expect(standings[1].points).toBe(0);
  });

  it("awards configured points_for_draw instead of hardcoded 1", () => {
    const custom_points: PointsConfig = {
      points_for_win: 3,
      points_for_draw: 0,
      points_for_loss: 0,
    };

    const standings = calculate_team_standings(
      [
        create_fixture("team-a", "team-b", {
          home_team_score: 1,
          away_team_score: 1,
          status: "completed",
        }),
      ],
      [create_team("team-a", "Team A"), create_team("team-b", "Team B")],
      custom_points,
    );

    expect(standings[0].points).toBe(0);
    expect(standings[1].points).toBe(0);
  });

  it("uses head_to_head tie-breaker when points and goal_difference are equal", () => {
    const tie_breakers: TieBreaker[] = [
      "goal_difference",
      "head_to_head",
      "goals_scored",
    ];

    const standings = calculate_team_standings(
      [
        create_fixture("team-a", "team-b", {
          home_team_score: 2,
          away_team_score: 0,
          status: "completed",
        }),
        create_fixture("team-b", "team-c", {
          home_team_score: 2,
          away_team_score: 0,
          status: "completed",
        }),
        create_fixture("team-a", "team-c", {
          home_team_score: 2,
          away_team_score: 0,
          status: "completed",
        }),
      ],
      [
        create_team("team-a", "Team A"),
        create_team("team-b", "Team B"),
        create_team("team-c", "Team C"),
      ],
      undefined,
      tie_breakers,
    );

    expect(standings[0].team_id).toBe("team-a");
    expect(standings[0].points).toBe(6);
    expect(standings[1].team_id).toBe("team-b");
    expect(standings[1].points).toBe(3);
    expect(standings[2].team_id).toBe("team-c");
  });

  it("uses goals_scored tie-breaker when points and goal_difference are equal between tied teams", () => {
    const tie_breakers: TieBreaker[] = ["goal_difference", "goals_scored"];

    const standings = calculate_team_standings(
      [
        create_fixture("team-a", "team-b", {
          home_team_score: 3,
          away_team_score: 1,
          status: "completed",
        }),
        create_fixture("team-c", "team-d", {
          home_team_score: 2,
          away_team_score: 0,
          status: "completed",
        }),
      ],
      [
        create_team("team-a", "Team A"),
        create_team("team-b", "Team B"),
        create_team("team-c", "Team C"),
        create_team("team-d", "Team D"),
      ],
      undefined,
      tie_breakers,
    );

    expect(standings[0].team_id).toBe("team-a");
    expect(standings[0].goals_for).toBe(3);
    expect(standings[1].team_id).toBe("team-c");
    expect(standings[1].goals_for).toBe(2);
  });
});
