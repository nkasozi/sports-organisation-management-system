import { describe, expect, it } from "vitest";

import {
  build_fixture_lineup_create_fixture_change_state,
  build_fixture_lineup_create_reference_state,
  build_fixture_lineup_create_team_change_state,
  get_fixture_lineup_create_validation_field,
} from "./fixtureLineupCreatePageControllerUpdates";

describe("fixtureLineupCreatePageControllerUpdates", () => {
  it("preserves the loaded reference collections without reshaping them", () => {
    const reference_state = build_fixture_lineup_create_reference_state({
      fixtures: [{ id: "fixture-1" }],
      teams: [{ id: "team-1" }],
      all_teams: [{ id: "team-1" }],
      all_competitions: [{ id: "competition-1" }],
      organizations: [{ id: "organization-1" }],
      selected_organization_state: {
        status: "present",
        organization: { id: "organization-1" },
      },
      error_message: "",
    } as never);

    expect(reference_state).toEqual(
      expect.objectContaining({
        fixtures: [{ id: "fixture-1" }],
        teams: [{ id: "team-1" }],
        selected_organization_state: {
          status: "present",
          organization: { id: "organization-1" },
        },
      }),
    );
  });

  it("merges fixture-change form data and resets team-specific state", () => {
    const result = build_fixture_lineup_create_fixture_change_state(
      {
        error_message: "",
        form_data: {
          fixture_id: "fixture-1",
          organization_id: "organization-1",
        },
        selected_fixture_state: {
          status: "present",
          fixture: { id: "fixture-1" },
        } as never,
        selected_organization_state: {
          status: "present",
          organization: { id: "organization-1" },
        } as never,
        min_players: 7,
        max_players: 18,
        starters_count: 11,
        available_teams: [{ id: "team-1" }] as never,
        fixture_team_label_by_team_id: new Map([["team-1", "Lions"]]),
        teams_with_existing_lineups: new Map([["team-2", "Tigers"]]),
        fixtures_with_complete_lineups: new Set(["fixture-2"]),
      },
      {
        organization_id: "",
        fixture_id: "",
        team_id: "team-old",
        selected_players: [{ id: "player-1" }],
      } as never,
    );

    expect(result).toEqual(
      expect.objectContaining({
        form_data: expect.objectContaining({
          organization_id: "organization-1",
          fixture_id: "fixture-1",
          team_id: "team-old",
        }),
        selected_team_state: { status: "missing" },
        team_players: [],
        available_teams: [{ id: "team-1" }],
      }),
    );
  });

  it("merges selected team data and maps validation steps to their form fields", () => {
    expect(
      build_fixture_lineup_create_team_change_state(
        {
          selected_team_state: {
            status: "present",
            team: { id: "team-1" },
          },
          team_players: [{ id: "player-1" }],
          selected_players: [{ id: "player-1" }],
          validation_error: "Pick more players",
        } as never,
        {
          organization_id: "organization-1",
          fixture_id: "fixture-1",
          team_id: "",
          selected_players: [],
        } as never,
        "team-1",
      ),
    ).toEqual({
      selected_team_state: {
        status: "present",
        team: { id: "team-1" },
      },
      team_players: [{ id: "player-1" }],
      form_data: {
        organization_id: "organization-1",
        fixture_id: "fixture-1",
        team_id: "team-1",
        selected_players: [{ id: "player-1" }],
      },
      validation_errors: { players: "Pick more players" },
    });
    expect(get_fixture_lineup_create_validation_field(0)).toBe(
      "organization_id",
    );
    expect(get_fixture_lineup_create_validation_field(3)).toBe("players");
  });
});
