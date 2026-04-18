import { describe, expect, it, vi } from "vitest";

import type { Team } from "$lib/core/entities/Team";

import {
  load_team_fixtures_bundle,
  sort_team_fixtures,
} from "./competitionResultsTeamFixturesData";

describe("competitionResultsTeamFixturesData", () => {
  function create_team(id: string, name: string): Team {
    return {
      id,
      name,
      short_name: name.slice(0, 3).toUpperCase(),
      description: `${name} description`,
      organization_id: "organization-1",
      gender_id: "gender-1",
      captain_player_id: "",
      vice_captain_player_id: "",
      max_squad_size: 25,
      home_venue_id: "venue-1",
      primary_color: "#111111",
      secondary_color: "#ffffff",
      logo_url: "",
      website: "https://example.com",
      founded_year: 2020,
      status: "active",
      created_at: "2024-01-01T00:00:00.000Z",
      updated_at: "2024-01-01T00:00:00.000Z",
    } as Team;
  }

  it("sorts team fixtures by scheduled date", () => {
    expect(
      sort_team_fixtures([
        { id: "fixture-2", scheduled_date: "2024-06-02" },
        { id: "fixture-1", scheduled_date: "2024-06-01" },
      ] as never),
    ).toEqual([
      { id: "fixture-1", scheduled_date: "2024-06-01" },
      { id: "fixture-2", scheduled_date: "2024-06-02" },
    ]);
  });

  it("loads team fixtures across competitions and extends missing team and competition records", async () => {
    const fixtures = [
      {
        id: "fixture-1",
        home_team_id: "team-1",
        away_team_id: "team-2",
        competition_id: "competition-1",
      },
    ];
    const all_fixtures = [
      ...fixtures,
      {
        id: "fixture-2",
        home_team_id: "team-3",
        away_team_id: "team-1",
        competition_id: "competition-2",
      },
    ];
    const dependencies = {
      fixture_use_cases: {
        list: vi.fn().mockResolvedValueOnce({
          success: true,
          data: { items: all_fixtures },
        }),
      },
      team_use_cases: {
        get_by_id: vi.fn().mockResolvedValueOnce({
          success: true,
          data: create_team("team-3", "Eagles"),
        }),
      },
      competition_use_cases: {
        get_by_id: vi.fn().mockResolvedValueOnce({
          success: true,
          data: { id: "competition-2", name: "League Two" },
        }),
      },
    };

    await expect(
      load_team_fixtures_bundle({
        team_id: "team-1",
        fixtures: fixtures as never,
        team_map: new Map([
          ["team-1", create_team("team-1", "Lions")],
          ["team-2", create_team("team-2", "Falcons")],
        ]),
        competitions: [{ id: "competition-1", name: "League One" }] as never,
        dependencies: dependencies as never,
      }),
    ).resolves.toEqual({
      team_fixtures_in_competition: fixtures,
      team_fixtures_all_competitions: all_fixtures,
      extended_team_map: new Map([
        ["team-1", create_team("team-1", "Lions")],
        ["team-2", create_team("team-2", "Falcons")],
        ["team-3", create_team("team-3", "Eagles")],
      ]),
      extended_competition_map: new Map([
        ["competition-1", { id: "competition-1", name: "League One" }],
        ["competition-2", { id: "competition-2", name: "League Two" }],
      ]),
    });
  });
});
