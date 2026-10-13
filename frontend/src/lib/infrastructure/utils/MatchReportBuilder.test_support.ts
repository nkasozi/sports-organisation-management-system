import type { Competition } from "$lib/core/entities/Competition";
import type { Fixture, GameEvent } from "$lib/core/entities/Fixture";
import type { Official } from "$lib/core/entities/Official";
import type { Team } from "$lib/core/entities/Team";
import type { ScalarInput } from "$lib/core/types/DomainScalars";

import { type MatchReportBuildContext } from "./MatchReportBuilder";

export function make_fixture(
  overrides: Partial<ScalarInput<Fixture>> = {},
): Fixture {
  return {
    id: "fix-1",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    home_team_id: "team-home",
    away_team_id: "team-away",
    competition_id: "comp-1",
    organization_id: "org-1",
    scheduled_date: "2026-03-14",
    scheduled_time: "14:00",
    venue: "Main Stadium",
    status: "completed",
    home_team_score: 2,
    away_team_score: 1,
    match_day: 5,
    round_name: "Group A",
    round_number: 3,
    game_events: [],
    notes: "",

    current_minute: 90,
    ...overrides,
  } as unknown as Fixture;
}

function make_team(
  name: string,
  overrides: Partial<ScalarInput<Team>> = {},
): Team {
  return {
    id: `team-${name}`,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    name,
    organization_id: "org-1",
    primary_color: "#FFFFFF",
    ...overrides,
  } as unknown as Team;
}

export function make_competition(
  overrides: Partial<ScalarInput<Competition>> = {},
): Competition {
  return {
    id: "comp-1",
    name: "Premier Cup",
    organization_id: "org-1",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  } as unknown as Competition;
}

export function make_official(first_name: string, last_name: string): Official {
  return {
    id: `off-${first_name}`,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    first_name,
    last_name,
    organization_id: "org-1",
  } as unknown as Official;
}

export function make_basic_context(
  overrides: Partial<MatchReportBuildContext> = {},
): MatchReportBuildContext {
  return {
    fixture: make_fixture(),
    home_team: make_team("Harare City"),
    away_team: make_team("Dynamos FC"),
    competition: make_competition(),
    home_lineup: [],
    away_lineup: [],
    assigned_officials: [],
    ...overrides,
  } as MatchReportBuildContext;
}

export function make_game_event(
  overrides: Partial<ScalarInput<GameEvent>> = {},
): GameEvent {
  return {
    id: "event-1",
    event_type: "goal",
    minute: 10,
    stoppage_time_minute: 0,
    team_side: "home",
    player_name: "",
    secondary_player_name: "",
    description: "",
    recorded_at: "2026-01-01T00:00:00Z",
    ...overrides,
  } as GameEvent;
}
