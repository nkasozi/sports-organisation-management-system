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
import { check_optional_numeric_value } from "./EntityValidation";
import {
  check_condition,
  check_minimum_text_length,
  collect_validation_errors,
  type FieldCheck,
} from "./EntityValidation";

const MINIMUM_TEAM_NAME_LENGTH = 2;

const TEAM_VALIDATION_MESSAGES = {
  NAME_TOO_SHORT: "Team name must be at least 2 characters",
  ORGANIZATION_REQUIRED: "Organization is required",
  INVALID_DESCRIPTION: "Team description is invalid",
  INVALID_MAX_SQUAD_SIZE: "Maximum squad size must be at least 1",
  INVALID_PRIMARY_COLOR: "Primary color must be a valid hex color",
  INVALID_SECONDARY_COLOR: "Secondary color must be a valid hex color",
  INVALID_LOGO_URL: "Logo URL is invalid",
  INVALID_WEBSITE: "Website URL is invalid",
  INVALID_FOUNDED_YEAR: "Founded year is invalid",
} as const;

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

export function validate_team_input(input: CreateTeamInput): string[] {
  return collect_validation_errors([
    check_minimum_text_length(
      input.name,
      MINIMUM_TEAM_NAME_LENGTH,
      TEAM_VALIDATION_MESSAGES.NAME_TOO_SHORT,
    ),
    check_condition(
      Boolean(input.organization_id),
      TEAM_VALIDATION_MESSAGES.ORGANIZATION_REQUIRED,
    ),
    parse_description_text(
      input.description,
      TEAM_VALIDATION_MESSAGES.INVALID_DESCRIPTION,
    ),
    parse_positive_integer_value(
      input.max_squad_size,
      TEAM_VALIDATION_MESSAGES.INVALID_MAX_SQUAD_SIZE,
    ),
    ...collect_team_branding_checks(input),
  ]);
}

function collect_team_branding_checks(input: CreateTeamInput): FieldCheck[] {
  return [
    parse_hex_color_value(
      input.primary_color,
      TEAM_VALIDATION_MESSAGES.INVALID_PRIMARY_COLOR,
    ),
    parse_hex_color_value(
      input.secondary_color,
      TEAM_VALIDATION_MESSAGES.INVALID_SECONDARY_COLOR,
    ),
    parse_optional_media_url_value(
      input.logo_url,
      TEAM_VALIDATION_MESSAGES.INVALID_LOGO_URL,
    ),
    parse_optional_http_url_value(
      input.website,
      TEAM_VALIDATION_MESSAGES.INVALID_WEBSITE,
    ),
    check_optional_numeric_value(
      input.founded_year,
      parse_year_value,
      TEAM_VALIDATION_MESSAGES.INVALID_FOUNDED_YEAR,
    ),
  ];
}
