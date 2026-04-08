import { describe, expect, it } from "vitest";

import {
  build_fixture_lineup_create_page_derived_state,
  sync_fixture_lineup_create_selected_organization,
} from "./fixtureLineupCreatePageControllerDerived";

describe("fixtureLineupCreatePageControllerDerived", () => {
  it("builds restricted, filtered fixture options and wizard state for the current authorization scope", () => {
    const derived_state = build_fixture_lineup_create_page_derived_state({
      current_auth_profile: {
        organization_id: "organization-1",
        team_id: "team-a",
      },
      form_data: {
        organization_id: "organization-1",
        selected_players: [{ id: "1" }, { id: "2" }],
      },
      selected_organization: { id: "organization-1" },
      selected_fixture: {
        id: "fixture-1",
        organization_id: "organization-1",
        competition_id: "competition-1",
        home_team_id: "team-a",
        away_team_id: "team-b",
        scheduled_date: "2024-06-01",
        scheduled_time: "15:00",
        status: "scheduled",
      },
      selected_team: { id: "team-a" },
      team_players: [
        {
          id: "player-1",
          first_name: "Ada",
          last_name: "Stone",
          jersey_number: 9,
          position: "Goalkeeper",
        },
        {
          id: "player-2",
          first_name: "Bo",
          last_name: "Reed",
          jersey_number: 4,
          position: "Defender",
        },
      ],
      player_search_text: "goal",
      organizations: [{ id: "organization-1", name: "Premier League" }],
      fixtures: [
        {
          id: "fixture-1",
          organization_id: "organization-1",
          competition_id: "competition-1",
          home_team_id: "team-a",
          away_team_id: "team-b",
          scheduled_date: "2024-06-01",
          scheduled_time: "15:00",
          status: "scheduled",
        },
        {
          id: "fixture-2",
          organization_id: "organization-1",
          competition_id: "competition-1",
          home_team_id: "team-a",
          away_team_id: "team-c",
          status: "in_progress",
        },
        {
          id: "fixture-3",
          organization_id: "organization-1",
          competition_id: "competition-1",
          home_team_id: "team-b",
          away_team_id: "team-c",
          status: "scheduled",
        },
      ],
      all_teams: [
        { id: "team-a", name: "Lions" },
        { id: "team-b", name: "Tigers" },
        { id: "team-c", name: "Bulls" },
      ],
      all_competitions: [{ id: "competition-1", name: "Cup" }],
      available_teams: [{ id: "team-a", name: "Lions" }],
      fixtures_with_complete_lineups: new Set(["fixture-3"]),
      fixture_team_label_by_team_id: new Map([
        ["team-a", "Lions • Seed 1 • active"],
      ]),
      min_players: 2,
      max_players: 18,
      confirm_lock_understood: true,
    } as never);

    expect(derived_state).toEqual(
      expect.objectContaining({
        organization_is_restricted: true,
        team_is_restricted: true,
        user_team_id: "team-a",
        non_scheduled_fixtures_count: 1,
        fixtures_for_organization: [
          expect.objectContaining({ id: "fixture-1" }),
        ],
        fixture_select_options: [
          expect.objectContaining({ value: "fixture-1", group: "Cup" }),
        ],
        team_select_options: [
          { value: "team-a", label: "Lions • Seed 1 • active" },
        ],
        filtered_team_players: [expect.objectContaining({ id: "player-1" })],
      }),
    );
    expect(derived_state.current_fixture_title).toContain("Cup");
    expect(derived_state.wizard_steps.at(-1)?.is_completed).toBe(true);
  });

  it("syncs the selected organization by id and returns null when it is missing", () => {
    expect(
      sync_fixture_lineup_create_selected_organization("organization-1", [
        { id: "organization-1", name: "Premier League" },
      ] as never),
    ).toEqual({ id: "organization-1", name: "Premier League" });
    expect(
      sync_fixture_lineup_create_selected_organization("missing", [] as never),
    ).toBeNull();
  });
});
