import { beforeEach, describe, expect, it, vi } from "vitest";

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

import {
  handle_fixture_lineup_create_fixture_change,
  handle_fixture_lineup_create_organization_change,
  handle_fixture_lineup_create_team_change,
  reset_fixture_lineup_create_team_state,
} from "./fixtureLineupCreatePageFlowHandlers";

describe("fixtureLineupCreatePageFlowHandlers", () => {
  beforeEach(() => {
    load_fixture_lineup_create_fixture_data_mock.mockReset();
    load_fixture_lineup_create_team_data_mock.mockReset();
  });

  it("clears the team-specific state when the flow is reset", () => {
    expect(reset_fixture_lineup_create_team_state()).toEqual({
      form_data: { team_id: "", selected_players: [] },
      selected_team: null,
      team_players: [],
      available_teams: [],
    });
  });

  it("updates the selected organization and clears the downstream selections", () => {
    expect(
      handle_fixture_lineup_create_organization_change({
        organization_id: "organization-1",
        organizations: [
          { id: "organization-1", name: "Premier League" },
        ] as never,
      }),
    ).toEqual({
      form_data: {
        organization_id: "organization-1",
        fixture_id: "",
        team_id: "",
        selected_players: [],
      },
      error_message: "",
      validation_errors: {},
      selected_organization: { id: "organization-1", name: "Premier League" },
      selected_fixture: null,
      current_step_index: 0,
    });
  });

  it("returns default fixture state when the user clears the fixture selection", async () => {
    await expect(
      handle_fixture_lineup_create_fixture_change({
        fixture_id: "",
        current_auth_profile: null,
        organizations: [],
        dependencies: {} as never,
        fixtures_with_complete_lineups: new Set(["fixture-9"]),
        team_players_count: 0,
      }),
    ).resolves.toEqual({
      success: true,
      error_message: "",
      form_data: { fixture_id: "", team_id: "", selected_players: [] },
      selected_fixture: null,
      selected_organization: null,
      min_players: 2,
      max_players: 18,
      starters_count: 11,
      available_teams: [],
      fixture_team_label_by_team_id: new Map(),
      teams_with_existing_lineups: new Map(),
      current_step_index: 1,
      auto_selected_team_id: "",
      fixtures_with_complete_lineups: new Set(["fixture-9"]),
    });
  });

  it("marks a fixture as complete when both teams have already submitted lineups", async () => {
    load_fixture_lineup_create_fixture_data_mock.mockResolvedValue({
      success: false,
      error_message:
        "All teams have already submitted lineups for this fixture.",
      should_clear_fixture: true,
    });

    const result = await handle_fixture_lineup_create_fixture_change({
      fixture_id: "fixture-1",
      current_auth_profile: null,
      organizations: [],
      dependencies: {} as never,
      fixtures_with_complete_lineups: new Set(["fixture-9"]),
      team_players_count: 0,
    });

    expect(result.form_data.fixture_id).toBe("");
    expect(result.fixtures_with_complete_lineups).toEqual(
      new Set(["fixture-9", "fixture-1"]),
    );
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
      current_auth_profile: { team_id: "team-1" } as never,
      organizations: [
        { id: "organization-1", name: "Premier League" },
      ] as never,
      dependencies: {} as never,
      fixtures_with_complete_lineups: new Set(),
      team_players_count: 3,
    });

    expect(result).toEqual(
      expect.objectContaining({
        selected_fixture: { id: "fixture-1" },
        selected_organization: { id: "organization-1", name: "Premier League" },
        current_step_index: 3,
        auto_selected_team_id: "team-1",
      }),
    );
  });

  it("delegates team loading and returns the loaded squad state", async () => {
    load_fixture_lineup_create_team_data_mock.mockResolvedValue({
      selected_team: { id: "team-1" },
      team_players: [{ id: "player-1" }],
      selected_players: [{ id: "player-1" }],
      validation_error: "",
    });

    await expect(
      handle_fixture_lineup_create_team_change({
        team_id: "team-1",
        selected_fixture: { id: "fixture-1" } as never,
        current_auth_profile: null,
        max_players: 18,
        dependencies: {} as never,
      }),
    ).resolves.toEqual({
      selected_team: { id: "team-1" },
      team_players: [{ id: "player-1" }],
      selected_players: [{ id: "player-1" }],
      validation_error: "",
    });
  });
});
