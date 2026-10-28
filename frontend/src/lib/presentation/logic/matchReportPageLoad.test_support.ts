import type { Competition } from "$lib/core/entities/Competition";
import type { Fixture } from "$lib/core/entities/Fixture";
import type { LineupPlayer } from "$lib/core/entities/FixtureLineup";
import type { Official } from "$lib/core/entities/Official";
import type { Sport } from "$lib/core/entities/Sport";
import type { Team } from "$lib/core/entities/Team";
import type { Venue } from "$lib/core/entities/Venue";
import type { ScalarInput } from "$lib/core/types/DomainScalars";

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

export function create_team(overrides: Partial<ScalarInput<Team>> = {}): Team {
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

export function create_competition(
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
    max_event_edits_per_game: 3,
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

export function create_sport(
  overrides: Partial<ScalarInput<Sport>> = {},
): Sport {
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

export function create_venue(
  overrides: Partial<ScalarInput<Venue>> = {},
): Venue {
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

export function create_official(
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
