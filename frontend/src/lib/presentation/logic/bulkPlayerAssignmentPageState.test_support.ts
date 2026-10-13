import type { Player } from "$lib/core/entities/Player";
import type { PlayerTeamMembership } from "$lib/core/entities/PlayerTeamMembership";
import type { Team } from "$lib/core/entities/Team";
import type { ScalarInput } from "$lib/core/types/DomainScalars";

export function create_test_player(
  overrides: Partial<ScalarInput<Player>> = {},
): Player {
  return {
    id: overrides.id ?? "player_1",
    created_at: overrides.created_at ?? "2024-01-01T00:00:00.000Z",
    updated_at: overrides.updated_at ?? "2024-01-01T00:00:00.000Z",
    first_name: overrides.first_name ?? "Alex",
    last_name: overrides.last_name ?? "Morgan",
    gender_id: overrides.gender_id ?? "gender_women",
    email: overrides.email ?? "",
    phone: overrides.phone ?? "",
    date_of_birth: overrides.date_of_birth ?? "1990-01-01",
    position_id: overrides.position_id ?? "position_1",
    organization_id: overrides.organization_id ?? "org_1",
    height_cm: overrides.height_cm ?? 0,
    weight_kg: overrides.weight_kg ?? 0,
    nationality: overrides.nationality ?? "UG",
    profile_image_url: overrides.profile_image_url ?? "",
    emergency_contact_name: overrides.emergency_contact_name ?? "",
    emergency_contact_phone: overrides.emergency_contact_phone ?? "",
    medical_notes: overrides.medical_notes ?? "",
    status: overrides.status ?? "active",
  } as unknown as Player;
}

export function create_test_team(
  overrides: Partial<ScalarInput<Team>> = {},
): Team {
  return {
    id: overrides.id ?? "team_1",
    created_at: overrides.created_at ?? "2024-01-01T00:00:00.000Z",
    updated_at: overrides.updated_at ?? "2024-01-01T00:00:00.000Z",
    name: overrides.name ?? "Blue Stars",
    short_name: overrides.short_name ?? "BST",
    description: overrides.description ?? "",
    organization_id: overrides.organization_id ?? "org_1",
    gender_id: overrides.gender_id ?? "gender_women",
    captain_player_id: overrides.captain_player_id ?? "",
    vice_captain_player_id: overrides.vice_captain_player_id ?? "",
    max_squad_size: overrides.max_squad_size ?? 25,
    home_venue_id: overrides.home_venue_id ?? "venue_1",
    primary_color: overrides.primary_color ?? "#0000FF",
    secondary_color: overrides.secondary_color ?? "#FFFFFF",
    logo_url: overrides.logo_url ?? "",
    website: overrides.website ?? "",
    founded_year: overrides.founded_year ?? 2020,
    status: overrides.status ?? "active",
  } as unknown as Team;
}

export function create_test_membership(
  overrides: Partial<ScalarInput<PlayerTeamMembership>> = {},
): PlayerTeamMembership {
  return {
    id: overrides.id ?? "membership_1",
    created_at: overrides.created_at ?? "2024-01-01T00:00:00.000Z",
    updated_at: overrides.updated_at ?? "2024-01-01T00:00:00.000Z",
    organization_id: overrides.organization_id ?? "org_1",
    player_id: overrides.player_id ?? "player_1",
    team_id: overrides.team_id ?? "team_1",
    start_date: overrides.start_date ?? "2024-01-01",
    jersey_number: overrides.jersey_number ?? 10,
    status: overrides.status ?? "active",
  } as unknown as PlayerTeamMembership;
}
