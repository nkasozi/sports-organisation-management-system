import type { Team } from "$lib/core/entities/Team";

function create_team(id: string, name: string): Team {
  return {
    id,
    name,
    short_name: name.slice(0, 3).toUpperCase(),
    description: `${name} description`,
    organization_id: "organization-1",
    gender_id: "gender-1",
    captain_player_id: "",
    vice_captain_player_id: "",
    max_squad_size: 25,
    home_venue_id: "venue-1",
    primary_color: "#111111",
    secondary_color: "#ffffff",
    logo_url: "",
    website: "https://example.com",
    founded_year: 2020,
    status: "active",
    created_at: "2024-01-01T00:00:00.000Z",
    updated_at: "2024-01-01T00:00:00.000Z",
  } as Team;
}

export const fixture = {
  id: "fixture-1",
  home_team_id: "team-1",
  away_team_id: "team-2",
  scheduled_date: "2024-06-01",
};

export const team_map = new Map([
  ["team-1", create_team("team-1", "Lions")],
  ["team-2", create_team("team-2", "Falcons")],
]);
