import { describe, expect, it } from "vitest";

import type { Competition } from "$lib/core/entities/Competition";
import type { Fixture } from "$lib/core/entities/Fixture";
import type { LineupPlayer } from "$lib/core/entities/FixtureLineup";
import type { Official } from "$lib/core/entities/Official";
import type { Sport } from "$lib/core/entities/Sport";
import type { Team } from "$lib/core/entities/Team";
import type { Venue } from "$lib/core/entities/Venue";
import type { ScalarInput } from "$lib/core/types/DomainScalars";
import {
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";

import {
  load_match_report_page_data,
  refresh_match_report_fixture_data,
} from "./matchReportPageLoad";

function create_fixture(
  overrides: Partial<ScalarInput<Fixture>> = {},
): Fixture {
  return {
    id: "fixture_1",
    organization_id: "org_1",
    competition_id: "competition_1",
    round_number: 1,
    round_name: "Round 1",
    home_team_id: "team_1",
    away_team_id: "team_2",
    venue: "venue_1",
    scheduled_date: "2026-04-07",
    scheduled_time: "15:00",
    home_team_score: 2,
    away_team_score: 1,
    assigned_officials: [
      {
        official_id: "official_1",
        role_id: "role_1",
        role_name: "Referee",
      },
    ],
    game_events: [],
    current_period: "finished",
    current_minute: 90,
    match_day: 1,
    notes: "",
    stage_id: "stage_1",
    status: "completed",
    created_at: "2026-04-01T00:00:00Z",
    updated_at: "2026-04-01T00:00:00Z",
    ...overrides,
  } as unknown as Fixture;
}

function create_team(overrides: Partial<ScalarInput<Team>> = {}): Team {
  return {
    id: "team_1",
    name: "Lions",
    short_name: "LIO",
    description: "",
    organization_id: "org_1",
    gender_id: "gender_1",
    captain_player_id: "",
    vice_captain_player_id: "",
    max_squad_size: 25,
    home_venue_id: "venue_1",
    primary_color: "#000000",
    secondary_color: "#ffffff",
    logo_url: "",
    website: "",
    founded_year: 2020,
    status: "active",
    created_at: "2026-04-01T00:00:00Z",
    updated_at: "2026-04-01T00:00:00Z",
    ...overrides,
  } as unknown as Team;
}

function create_lineup_player(
  overrides: Partial<ScalarInput<LineupPlayer>> = {},
): LineupPlayer {
  return {
    id: "player_1",
    first_name: "Jordan",
    last_name: "Miles",
    jersey_number: 9,
    position: "Forward",
    is_captain: false,
    is_substitute: false,
    time_on: "present_at_start",
    ...overrides,
  } as unknown as LineupPlayer;
}

function create_competition(
  overrides: Partial<ScalarInput<Competition>> = {},
): Competition {
  return {
    id: "competition_1",
    name: "National League",
    description: "",
    organization_id: "org_1",
    competition_format_id: "format_1",
    team_ids: ["team_1", "team_2"],
    allow_auto_squad_submission: false,
    squad_generation_strategy: "first_available",
    allow_auto_fixture_details_setup: false,
    lineup_submission_deadline_hours: 24,
    start_date: "2026-04-01",
    end_date: "2026-07-01",
    registration_deadline: "2026-03-01",
    max_teams: 12,
    entry_fee: 0,
    prize_pool: 0,
    location: "Kampala",
    rule_overrides: {},
    status: "active",
    created_at: "2026-04-01T00:00:00Z",
    updated_at: "2026-04-01T00:00:00Z",
    ...overrides,
  } as unknown as Competition;
}

function create_sport(overrides: Partial<ScalarInput<Sport>> = {}): Sport {
  return {
    id: "sport_1",
    name: "Football",
    description: "",
    organization_id: "org_1",
    team_size: 11,
    max_substitutes: 5,
    match_duration_minutes: 90,
    has_periods: true,
    period_count: 2,
    period_duration_minutes: 45,
    rules_config: {},
    card_types: [],
    scoring_system: { goal: 1 },
    allowed_formation_types: [],
    status: "active",
    created_at: "2026-04-01T00:00:00Z",
    updated_at: "2026-04-01T00:00:00Z",
    ...overrides,
  } as unknown as Sport;
}

function create_venue(overrides: Partial<ScalarInput<Venue>> = {}): Venue {
  return {
    id: "venue_1",
    name: "Main Stadium",
    city: "Kampala",
    country: "Uganda",
    organization_id: "org_1",
    address: "",
    capacity: 1000,
    surface_type: "grass",
    facilities: [],
    contact_name: "",
    contact_phone: "",
    contact_email: "",
    status: "active",
    created_at: "2026-04-01T00:00:00Z",
    updated_at: "2026-04-01T00:00:00Z",
    ...overrides,
  } as unknown as Venue;
}

function create_official(
  overrides: Partial<ScalarInput<Official>> = {},
): Official {
  return {
    id: "official_1",
    first_name: "Alex",
    last_name: "Ref",
    organization_id: "org_1",
    gender_id: "gender_1",
    email: "",
    phone: "",
    date_of_birth: "1990-01-01",
    certification_level: "Level 1",
    specializations: [],
    availability_status: "available",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    notes: "",
    status: "active",
    created_at: "2026-04-01T00:00:00Z",
    updated_at: "2026-04-01T00:00:00Z",
    ...overrides,
  } as unknown as Official;
}

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
