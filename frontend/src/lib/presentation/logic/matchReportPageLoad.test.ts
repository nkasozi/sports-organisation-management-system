import { describe, expect, it } from "vitest";

import {
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";

import {
  load_match_report_page_data,
  refresh_match_report_fixture_data,
} from "./matchReportPageLoad";
import {
  create_competition,
  create_fixture,
  create_lineup_player,
  create_official,
  create_sport,
  create_team,
  create_venue,
} from "./matchReportPageLoad.test_support";

describe("matchReportPageLoad", () => {
  it("returns a failure result when the fixture cannot be loaded", async () => {
    const result = await load_match_report_page_data({
      fixture_id: "missing",
      dependencies: {
        fixture_use_cases: {
          get_by_id: async () => create_failure_result("Missing"),
        },
        team_use_cases: {
          get_by_id: async () => create_success_result(create_team()),
        },
        fixture_lineup_use_cases: {
          get_lineup_for_team_in_fixture: async () =>
            create_success_result({ selected_players: [] }),
        },
        competition_use_cases: {
          get_by_id: async () => create_success_result(create_competition()),
        },
        organization_use_cases: {
          get_by_id: async () =>
            create_success_result({
              id: "org_1",
              name: "Org 1",
              sport_id: "sport_1",
            } as never),
        },
        sport_use_cases: {
          get_by_id: async () => create_success_result(create_sport()),
        },
        venue_use_cases: {
          get_by_id: async () => create_success_result(create_venue()),
        },
        official_use_cases: {
          get_by_id: async () => create_success_result(create_official()),
        },
      },
    });

    expect(result.success).toBe(false);
  });

  it("loads the match report page data with related entities and lineups", async () => {
    const result = await load_match_report_page_data({
      fixture_id: "fixture_1",
      dependencies: {
        fixture_use_cases: {
          get_by_id: async () => create_success_result(create_fixture()),
        },
        team_use_cases: {
          get_by_id: async (team_id: string) =>
            create_success_result(
              create_team({
                id: team_id,
                name: team_id === "team_1" ? "Lions" : "Tigers",
              }),
            ),
        },
        fixture_lineup_use_cases: {
          get_lineup_for_team_in_fixture: async (
            _fixture_id: string,
            team_id: string,
          ) =>
            create_success_result({
              selected_players: [
                create_lineup_player({ id: `${team_id}_player_1` }),
              ],
            }),
        },
        competition_use_cases: {
          get_by_id: async () => create_success_result(create_competition()),
        },
        organization_use_cases: {
          get_by_id: async () =>
            create_success_result({
              id: "org_1",
              name: "Org 1",
              sport_id: "sport_1",
            } as never),
        },
        sport_use_cases: {
          get_by_id: async () => create_success_result(create_sport()),
        },
        venue_use_cases: {
          get_by_id: async () => create_success_result(create_venue()),
        },
        official_use_cases: {
          get_by_id: async () => create_success_result(create_official()),
        },
      },
    });

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.data.home_team_state).toEqual({
      status: "present",
      team: expect.objectContaining({ name: "Lions" }),
    });
    expect(result.data.away_team_state).toEqual({
      status: "present",
      team: expect.objectContaining({ name: "Tigers" }),
    });
    expect(result.data.competition_state).toEqual({
      status: "present",
      competition: expect.objectContaining({ name: "National League" }),
    });
    expect(result.data.organization_name).toBe("Org 1");
    expect(result.data.sport_state).toEqual({
      status: "present",
      sport: expect.objectContaining({ name: "Football" }),
    });
    expect(result.data.venue_state).toEqual({
      status: "present",
      venue: expect.objectContaining({ name: "Main Stadium" }),
    });
    expect(result.data.assigned_officials_data).toHaveLength(1);
    expect(result.data.home_players).toHaveLength(1);
    expect(result.data.away_players).toHaveLength(1);
  });

  it("refreshes only the fixture and lineup state for live polling", async () => {
    const result = await refresh_match_report_fixture_data({
      fixture_id: "fixture_1",
      dependencies: {
        fixture_use_cases: {
          get_by_id: async () =>
            create_success_result(create_fixture({ status: "in_progress" })),
        },
        fixture_lineup_use_cases: {
          get_lineup_for_team_in_fixture: async (
            _fixture_id: string,
            team_id: string,
          ) =>
            create_success_result({
              selected_players: [
                create_lineup_player({ id: `${team_id}_player_1` }),
              ],
            }),
        },
      },
    });

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.data.fixture.status).toBe("in_progress");
    expect(result.data.home_players).toHaveLength(1);
    expect(result.data.away_players).toHaveLength(1);
  });
});
