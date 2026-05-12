import {
  type DescriptionText,
  type EntityId,
  type HexColorValue,
  type Name,
  type OptionalHttpUrlValue,
  type OptionalMediaUrlValue,
  parse_description_text,
  parse_hex_color_value,
  parse_optional_http_url_value,
  parse_optional_media_url_value,
  parse_positive_integer_value,
  parse_year_value,
  type PositiveIntegerValue,
  type ScalarInput,
  type YearValue,
} from "../types/DomainScalars";
import type { BaseEntity, EntityStatus } from "./BaseEntity";

type SportType =
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
  name: Name;
  short_name: Name;
  description: DescriptionText;
  organization_id: EntityId;
  gender_id: EntityId;
  captain_player_id: EntityId;
  vice_captain_player_id: EntityId;
  max_squad_size: PositiveIntegerValue;
  home_venue_id: EntityId;
  primary_color: HexColorValue;
  secondary_color: HexColorValue;
  logo_url: OptionalMediaUrlValue;
  website: OptionalHttpUrlValue;
  founded_year: YearValue;
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

export type CreateTeamInput = Omit<
  ScalarInput<Team>,
  "id" | "created_at" | "updated_at"
>;
export type UpdateTeamInput = Partial<CreateTeamInput>;

function create_empty_team_input(
  organization_id: CreateTeamInput["organization_id"] = "",
): CreateTeamInput {
  return {
    name: "",
    short_name: "",
    description: "",
    organization_id,
    gender_id: "",
    captain_player_id: "",
    vice_captain_player_id: "",
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

  const description_result = parse_description_text(
    input.description,
    "Team description is invalid",
  );
  if (!description_result.success) {
    validation_errors.push(description_result.error);
  }

  const max_squad_size_result = parse_positive_integer_value(
    input.max_squad_size,
    "Maximum squad size must be at least 1",
  );
  if (!max_squad_size_result.success) {
    validation_errors.push(max_squad_size_result.error);
  }

  const primary_color_result = parse_hex_color_value(
    input.primary_color,
    "Primary color must be a valid hex color",
  );
  if (!primary_color_result.success) {
    validation_errors.push(primary_color_result.error);
  }

  const secondary_color_result = parse_hex_color_value(
    input.secondary_color,
    "Secondary color must be a valid hex color",
  );
  if (!secondary_color_result.success) {
    validation_errors.push(secondary_color_result.error);
  }

  const logo_url_result = parse_optional_media_url_value(
    input.logo_url,
    "Logo URL is invalid",
  );
  if (!logo_url_result.success) {
    validation_errors.push(logo_url_result.error);
  }

  const website_result = parse_optional_http_url_value(
    input.website,
    "Website URL is invalid",
  );
  if (!website_result.success) {
    validation_errors.push(website_result.error);
  }

  const founded_year_result = parse_year_value(
    input.founded_year,
    "Founded year is invalid",
  );
  if (!founded_year_result.success) {
    validation_errors.push(founded_year_result.error);
  }

  return validation_errors;
}
