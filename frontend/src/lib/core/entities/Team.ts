import type { BaseEntity, EntityStatus } from "./BaseEntity";

export type SportType =
  | "Football"
  | "Basketball"
  | "Baseball"
  | "Hockey"
  | "Soccer"
  | "Cricket"
  | "Rugby"
  | "Other";

export const DEFAULT_TEAM_LOGO =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='48' fill='%233b82f6' stroke='%231d4ed8' stroke-width='2'/%3E%3Cpath d='M50 15L65 40H35L50 15Z' fill='white'/%3E%3Ccircle cx='50' cy='55' r='20' fill='white'/%3E%3Cpath d='M30 75L50 85L70 75' stroke='white' stroke-width='4' fill='none'/%3E%3C/svg%3E";

export interface Team extends BaseEntity {
  name: string;
  short_name: string;
  description: string;
  organization_id: string;
  captain_player_id: string | null;
  vice_captain_player_id: string | null;
  max_squad_size: number;
  home_venue_id: string;
  primary_color: string;
  secondary_color: string;
  logo_url: string;
  website: string;
  founded_year: number;
  status: EntityStatus;
}

export function get_team_logo(team: Team): string {
  return team.logo_url && team.logo_url.trim() !== ""
    ? team.logo_url
    : DEFAULT_TEAM_LOGO;
}

export function get_team_initials(team: Team): string {
  if (team.short_name && team.short_name.trim() !== "") {
    return team.short_name.substring(0, 3).toUpperCase();
  }
  const words = team.name.split(" ");
  if (words.length >= 2) {
    return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
  }
  return team.name.substring(0, 2).toUpperCase();
}

export type CreateTeamInput = Omit<Team, "id" | "created_at" | "updated_at">;
export type UpdateTeamInput = Partial<CreateTeamInput>;

export function create_empty_team_input(
  organization_id: string = "",
): CreateTeamInput {
  return {
    name: "",
    short_name: "",
    description: "",
    organization_id,
    captain_player_id: null,
    vice_captain_player_id: null,
    max_squad_size: 25,
    home_venue_id: "",
    primary_color: "#3B82F6",
    secondary_color: "#FFFFFF",
    logo_url: "",
    website: "",
    founded_year: new Date().getFullYear(),
    status: "active",
  };
}

export function validate_team_input(input: CreateTeamInput): string[] {
  const validation_errors: string[] = [];

  if (!input.name || input.name.trim().length < 2) {
    validation_errors.push("Team name must be at least 2 characters");
  }

  if (!input.organization_id) {
    validation_errors.push("Organization is required");
  }

  if (input.max_squad_size < 1) {
    validation_errors.push("Maximum squad size must be at least 1");
  }

  return validation_errors;
}
