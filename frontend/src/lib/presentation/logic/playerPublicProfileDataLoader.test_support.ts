import type { Fixture, GameEvent } from "$lib/core/entities/Fixture";
import type { Player } from "$lib/core/entities/Player";
import type { PlayerPosition } from "$lib/core/entities/PlayerPosition";
import type { PlayerProfile } from "$lib/core/entities/PlayerProfile";
import type { PlayerTeamMembership } from "$lib/core/entities/PlayerTeamMembership";
import type { ProfileLink } from "$lib/core/entities/ProfileLink";
import type { Team } from "$lib/core/entities/Team";
import type { ScalarInput } from "$lib/core/types/DomainScalars";

type EditableFixture = ScalarInput<Fixture>;
type EditableGameEvent = ScalarInput<GameEvent>;
type EditablePlayer = ScalarInput<Player>;
type EditablePlayerPosition = ScalarInput<PlayerPosition>;
type EditablePlayerProfile = ScalarInput<PlayerProfile>;
type EditablePlayerTeamMembership = ScalarInput<PlayerTeamMembership>;
type EditableProfileLink = ScalarInput<ProfileLink>;
type EditableTeam = ScalarInput<Team>;

export function create_player_profile(
  overrides: Partial<EditablePlayerProfile> = {},
): PlayerProfile {
  return {
    id: "profile_1",
    player_id: "player_1",
    profile_summary: "Fast winger",
    visibility: "public",
    profile_slug: "jane-doe",
    featured_image_url: "",
    status: "active",
    created_at: "2026-04-01T00:00:00Z",
    updated_at: "2026-04-01T00:00:00Z",
    ...overrides,
  } as unknown as PlayerProfile;
}

export function create_player(overrides: Partial<EditablePlayer> = {}): Player {
  return {
    id: "player_1",
    first_name: "Jane",
    last_name: "Doe",
    gender_id: "gender_1",
    email: "",
    phone: "",
    date_of_birth: "2000-01-01",
    position_id: "position_1",
    organization_id: "org_1",
    height_cm: 168,
    weight_kg: 58,
    nationality: "Uganda",
    profile_image_url: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    medical_notes: "",
    status: "active",
    created_at: "2026-04-01T00:00:00Z",
    updated_at: "2026-04-01T00:00:00Z",
    ...overrides,
  } as unknown as Player;
}

export function create_position(
  overrides: Partial<EditablePlayerPosition> = {},
): PlayerPosition {
  return {
    id: "position_1",
    name: "Winger",
    code: "WG",
    category: "forward",
    description: "",
    sport_type: "Football",
    display_order: 1,
    is_available: true,
    status: "active",
    organization_id: "org_1",
    created_at: "2026-04-01T00:00:00Z",
    updated_at: "2026-04-01T00:00:00Z",
    ...overrides,
  } as unknown as PlayerPosition;
}

export function create_team(overrides: Partial<EditableTeam> = {}): Team {
  return {
    id: "team_1",
    name: "Kampala Queens",
    short_name: "KQ",
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
    founded_year: 2010,
    status: "active",
    created_at: "2026-04-01T00:00:00Z",
    updated_at: "2026-04-01T00:00:00Z",
    ...overrides,
  } as unknown as Team;
}

export function create_membership(
  overrides: Partial<EditablePlayerTeamMembership> = {},
): PlayerTeamMembership {
  return {
    id: "membership_1",
    organization_id: "org_1",
    player_id: "player_1",
    team_id: "team_1",
    start_date: "2025-01-01",
    jersey_number: 7,
    status: "active",
    created_at: "2026-04-01T00:00:00Z",
    updated_at: "2026-04-01T00:00:00Z",
    ...overrides,
  } as unknown as PlayerTeamMembership;
}

export function create_game_event(
  overrides: Partial<EditableGameEvent> = {},
): GameEvent {
  return {
    id: "event_1",
    event_type: "goal",
    minute: 10,
    stoppage_time_minute: 0,
    team_side: "home",
    player_name: "Jane Doe",
    secondary_player_name: "Mary Smith",
    description: "",
    recorded_at: "2026-04-01T00:00:00Z",
    ...overrides,
  } as unknown as GameEvent;
}

export function create_fixture(
  overrides: Partial<EditableFixture> = {},
): Fixture {
  return {
    id: "fixture_1",
    organization_id: "org_1",
    competition_id: "competition_1",
    round_number: 1,
    round_name: "Round 1",
    home_team_id: "team_1",
    away_team_id: "team_2",
    venue: "Main Ground",
    scheduled_date: "2026-04-07",
    scheduled_time: "15:00",
    home_team_score: 2,
    away_team_score: 1,
    assigned_officials: [],
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

export function create_profile_link(
  overrides: Partial<EditableProfileLink> = {},
): ProfileLink {
  return {
    id: "link_1",
    profile_id: "profile_1",
    platform: "instagram",
    title: "Instagram",
    url: "https://example.com",
    display_order: 1,
    status: "active",
    created_at: "2026-04-01T00:00:00Z",
    updated_at: "2026-04-01T00:00:00Z",
    ...overrides,
  } as unknown as ProfileLink;
}
