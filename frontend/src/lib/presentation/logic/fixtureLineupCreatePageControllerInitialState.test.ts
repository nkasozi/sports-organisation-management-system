import { describe, expect, it } from "vitest";

import { create_fixture_lineup_create_page_controller_state } from "./fixtureLineupCreatePageControllerInitialState";

describe("fixtureLineupCreatePageControllerInitialState", () => {
  it("starts loading with default squad limits and nothing selected", () => {
    const state = create_fixture_lineup_create_page_controller_state();
    expect(state).toMatchObject({
      min_players: 2,
      max_players: 18,
      starters_count: 11,
      current_step_index: 0,
      loading: true,
      saving: false,
      confirm_lock_understood: false,
      selected_fixture_state: { status: "missing" },
      selected_team_state: { status: "missing" },
      selected_organization_state: { status: "missing" },
      current_auth_profile_state: { status: "missing" },
    });
    expect(state.fixtures_with_complete_lineups.size).toBe(0);
    expect(state.teams_with_existing_lineups.size).toBe(0);
  });

  it("returns fresh collections on every call", () => {
    const first = create_fixture_lineup_create_page_controller_state();
    const second = create_fixture_lineup_create_page_controller_state();
    expect(first.form_data).not.toBe(second.form_data);
    expect(first.fixture_team_label_by_team_id).not.toBe(
      second.fixture_team_label_by_team_id,
    );
  });
});
