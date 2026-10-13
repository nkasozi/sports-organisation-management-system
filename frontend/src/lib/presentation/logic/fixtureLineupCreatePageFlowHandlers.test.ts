import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  handle_fixture_lineup_create_fixture_change,
  handle_fixture_lineup_create_organization_change,
  reset_fixture_lineup_create_team_state,
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

describe("fixtureLineupCreatePageFlowHandlers", () => {
  beforeEach(() => {
    load_fixture_lineup_create_fixture_data_mock.mockReset();
    load_fixture_lineup_create_team_data_mock.mockReset();
  });

  it("clears the team-specific state when the flow is reset", () => {
    expect(reset_fixture_lineup_create_team_state()).toEqual({
      form_data: { team_id: "", selected_players: [] },
      selected_team_state: { status: "missing" },
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
      selected_organization_state: {
        status: "present",
        organization: { id: "organization-1", name: "Premier League" },
      },
      selected_fixture_state: { status: "missing" },
      current_step_index: 0,
    });
  });

  it("returns default fixture state when the user clears the fixture selection", async () => {
    await expect(
      handle_fixture_lineup_create_fixture_change({
        fixture_id: "",
        current_auth_profile_state: { status: "missing" },
        organizations: [],
        dependencies: {} as never,
        fixtures_with_complete_lineups: new Set(["fixture-9"]),
        team_players_count: 0,
      }),
    ).resolves.toEqual({
      success: true,
      error_message: "",
      form_data: { fixture_id: "", team_id: "", selected_players: [] },
      selected_fixture_state: { status: "missing" },
      selected_organization_state: { status: "missing" },
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
      error_message: "Every participating team already has a lineup.",
      should_clear_fixture: true,
      failure_reason: "all_teams_submitted",
    });

    const result = await handle_fixture_lineup_create_fixture_change({
      fixture_id: "fixture-1",
      current_auth_profile_state: { status: "missing" },
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

  it("keeps the complete fixture set unchanged for other fixture failures", async () => {
    load_fixture_lineup_create_fixture_data_mock.mockResolvedValue({
      success: false,
      error_message: "All teams have already submitted lineups elsewhere.",
      should_clear_fixture: false,
      failure_reason: "competition_unavailable",
    });

    const result = await handle_fixture_lineup_create_fixture_change({
      fixture_id: "fixture-1",
      current_auth_profile_state: { status: "missing" },
      organizations: [],
      dependencies: {} as never,
      fixtures_with_complete_lineups: new Set(["fixture-9"]),
      team_players_count: 0,
    });

    expect(result.form_data.fixture_id).toBe("fixture-1");
    expect(result.fixtures_with_complete_lineups).toEqual(
      new Set(["fixture-9"]),
    );
  });
});
