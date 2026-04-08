import { describe, expect, it } from "vitest";

import {
  apply_fixture_lineup_authorization_defaults,
  handle_fixture_lineup_create_step_change_attempt,
  select_all_fixture_lineup_create_players,
  toggle_fixture_lineup_create_player,
  validate_fixture_lineup_create_players,
} from "./fixtureLineupCreatePageFlowUtilities";

describe("fixtureLineupCreatePageFlowUtilities", () => {
  it("validates selected player counts against the configured bounds", () => {
    expect(
      validate_fixture_lineup_create_players({
        selected_players: [{ id: "player-1" }],
        min_players: 2,
        max_players: 4,
      } as never).players,
    ).toContain("Not enough players selected");
    expect(
      validate_fixture_lineup_create_players({
        selected_players: [
          { id: "1" },
          { id: "2" },
          { id: "3" },
          { id: "4" },
          { id: "5" },
        ],
        min_players: 2,
        max_players: 4,
      } as never).players,
    ).toContain("Too many players selected");
    expect(
      validate_fixture_lineup_create_players({
        selected_players: [{ id: "1" }, { id: "2" }],
        min_players: 2,
        max_players: 4,
      } as never),
    ).toEqual({});
  });

  it("blocks step changes until prior selections are made and validates player bounds at the player step", () => {
    expect(
      handle_fixture_lineup_create_step_change_attempt({
        from_step_index: 0,
        to_step_index: 1,
        form_data: {
          organization_id: "",
          fixture_id: "",
          team_id: "",
          selected_players: [],
        },
        min_players: 2,
        max_players: 4,
      } as never),
    ).toEqual({
      is_allowed: false,
      validation_errors: {
        organization_id: "Please select an organization first.",
      },
    });
    expect(
      handle_fixture_lineup_create_step_change_attempt({
        from_step_index: 3,
        to_step_index: 4,
        form_data: {
          organization_id: "organization-1",
          fixture_id: "fixture-1",
          team_id: "team-1",
          selected_players: [{ id: "1" }],
        },
        min_players: 2,
        max_players: 4,
      } as never).is_allowed,
    ).toBe(false);
  });

  it("toggles selected players, enforces the maximum, and selects the first allowed players in bulk", () => {
    const team_players = [
      {
        id: "player-1",
        first_name: "Ada",
        last_name: "Stone",
        jersey_number: 9,
        position: "GK",
      },
      {
        id: "player-2",
        first_name: "Bo",
        last_name: "Reed",
        jersey_number: 4,
        position: "DF",
      },
      {
        id: "player-3",
        first_name: "Cy",
        last_name: "Lake",
        jersey_number: 7,
        position: "FW",
      },
    ] as never;

    expect(
      toggle_fixture_lineup_create_player({
        form_data: { selected_players: [] },
        team_players,
        player_id: "player-1",
        max_players: 2,
      } as never),
    ).toEqual({
      selected_players: [
        {
          id: "player-1",
          first_name: "Ada",
          last_name: "Stone",
          jersey_number: 9,
          position: "GK",
          is_captain: false,
          is_substitute: false,
        },
      ],
      error_message: "",
    });
    expect(
      toggle_fixture_lineup_create_player({
        form_data: { selected_players: [{ id: "1" }, { id: "2" }] },
        team_players,
        player_id: "player-3",
        max_players: 2,
      } as never).error_message,
    ).toBe("Maximum 2 players can be selected");
    expect(
      select_all_fixture_lineup_create_players({
        team_players,
        max_players: 2,
      } as never),
    ).toHaveLength(2);
  });

  it("applies authorization defaults without overwriting explicit form selections", () => {
    expect(
      apply_fixture_lineup_authorization_defaults({
        form_data: { organization_id: "", team_id: "", selected_players: [] },
        current_auth_profile: {
          organization_id: "organization-1",
          team_id: "team-1",
        },
      } as never),
    ).toEqual({
      organization_id: "organization-1",
      team_id: "team-1",
      selected_players: [],
    });
    expect(
      apply_fixture_lineup_authorization_defaults({
        form_data: {
          organization_id: "organization-2",
          team_id: "team-2",
          selected_players: [],
        },
        current_auth_profile: {
          organization_id: "organization-1",
          team_id: "team-1",
        },
      } as never),
    ).toEqual({
      organization_id: "organization-2",
      team_id: "team-2",
      selected_players: [],
    });
  });
});
