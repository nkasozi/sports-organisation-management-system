import type { Fixture, GameEvent } from "$lib/core/entities/Fixture";
import type { LineupPlayer } from "$lib/core/entities/FixtureLineup";
import type { ScalarInput } from "$lib/core/types/DomainScalars";
import type { MatchReportPageDataState } from "$lib/presentation/logic/matchReportPageLoadTypes";

export function create_game_event(
  overrides: Partial<ScalarInput<GameEvent>> = {},
): GameEvent {
  return {
    id: "event_1",
    event_type: "goal",
    minute: 10,
    stoppage_time_minute: 0,
    team_side: "home",
    player_name: "Jordan Miles",
    secondary_player_name: "",
    description: "Goal",
    recorded_at: "2026-04-07T10:00:00Z",
    ...overrides,
  } as unknown as GameEvent;
}

export function create_lineup_player(
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

export function create_fixture(
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
    assigned_officials: [],
    game_events: [],
    current_period: "first_half",
    current_minute: 12,
    match_day: 1,
    notes: "",
    stage_id: "stage_1",
    status: "in_progress",
    created_at: "2026-04-01T00:00:00Z",
    updated_at: "2026-04-01T00:00:00Z",
    ...overrides,
  } as unknown as Fixture;
}

export function create_match_report_page_data_state(
  overrides: Partial<MatchReportPageDataState> = {},
): MatchReportPageDataState {
  return {
    status: "present",
    page_data: {
      fixture: create_fixture(),
      home_team_state: {
        status: "present",
        team: { id: "team_1", name: "Lions" } as never,
      },
      away_team_state: {
        status: "present",
        team: { id: "team_2", name: "Tigers" } as never,
      },
      competition_state: { status: "missing" },
      sport_state: { status: "missing" },
      venue_state: { status: "missing" },
      organization_name: "",
      assigned_officials_data: [],
      home_players: [],
      away_players: [],
    },
    ...overrides,
  } as MatchReportPageDataState;
}
