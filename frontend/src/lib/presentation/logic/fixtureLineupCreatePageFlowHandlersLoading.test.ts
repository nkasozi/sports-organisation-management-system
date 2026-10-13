import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  handle_fixture_lineup_create_fixture_change,
  handle_fixture_lineup_create_team_change,
} from "./fixtureLineupCreatePageFlowHandlers";

const {
  load_fixture_lineup_create_fixture_data_mock,
  load_fixture_lineup_create_team_data_mock,
} = vi.hoisted(() => ({
  load_fixture_lineup_create_fixture_data_mock: vi.fn(),
  load_fixture_lineup_create_team_data_mock: vi.fn(),
}));

vi.mock("$lib/presentation/logic/fixtureLineupCreateData", () => ({
  load_fixture_lineup_create_fixture_data:
    load_fixture_lineup_create_fixture_data_mock,
  load_fixture_lineup_create_team_data:
    load_fixture_lineup_create_team_data_mock,
}));

describe("fixtureLineupCreatePageFlowHandlers loading", () => {
  beforeEach(() => {
    load_fixture_lineup_create_fixture_data_mock.mockReset();
    load_fixture_lineup_create_team_data_mock.mockReset();
  });

  it("loads the fixture context and auto-advances when a team can be preselected", async () => {
    load_fixture_lineup_create_fixture_data_mock.mockResolvedValue({
      success: true,
      data: {
        selected_fixture: { id: "fixture-1" },
        organization_id: "organization-1",
        min_players: 7,
        max_players: 18,
        starters_count: 11,
        available_teams: [{ id: "team-1" }],
        fixture_team_label_by_team_id: new Map([["team-1", "Lions"]]),
        teams_with_existing_lineups: new Map(),
        auto_selected_team_id: "team-1",
      },
    });

    const result = await handle_fixture_lineup_create_fixture_change({
      fixture_id: "fixture-1",
      current_auth_profile_state: {
        status: "present",
        profile: { organization_id: "", team_id: "team-1" },
      } as never,
      organizations: [
        { id: "organization-1", name: "Premier League" },
      ] as never,
      dependencies: {} as never,
      fixtures_with_complete_lineups: new Set(),
      team_players_count: 3,
    });

    expect(result).toEqual(
      expect.objectContaining({
        selected_fixture_state: {
          status: "present",
          fixture: { id: "fixture-1" },
        },
        selected_organization_state: {
          status: "present",
          organization: { id: "organization-1", name: "Premier League" },
        },
        current_step_index: 3,
        auto_selected_team_id: "team-1",
      }),
    );
  });

  it("delegates team loading and returns the loaded squad state", async () => {
    load_fixture_lineup_create_team_data_mock.mockResolvedValue({
      selected_team_state: {
        status: "present",
        team: { id: "team-1" },
      },
      team_players: [{ id: "player-1" }],
      selected_players: [{ id: "player-1" }],
      validation_error: "",
    });

    await expect(
      handle_fixture_lineup_create_team_change({
        team_id: "team-1",
        selected_fixture_state: {
          status: "present",
          fixture: { id: "fixture-1" } as never,
        },
        current_auth_profile_state: { status: "missing" },
        max_players: 18,
        dependencies: {} as never,
      }),
    ).resolves.toEqual({
      selected_team_state: {
        status: "present",
        team: { id: "team-1" },
      },
      team_players: [{ id: "player-1" }],
      selected_players: [{ id: "player-1" }],
      validation_error: "",
    });
  });
});
