import type {
  DescriptionText,
  EmailAddress,
  EntityId,
  IsoDateString,
  Name,
  NonNegativeIntegerValue,
  OptionalMediaUrlValue,
  ScalarInput,
} from "../types/DomainScalars";
import {
  parse_description_text,
  parse_non_negative_integer_value,
  parse_optional_media_url_value,
} from "../types/DomainScalars";
import type { BaseEntity } from "./BaseEntity";

export type PlayerStatus = "active" | "injured" | "suspended" | "inactive";

export const DEFAULT_PLAYER_AVATAR =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%236366f1'/%3E%3Ccircle cx='50' cy='35' r='18' fill='white'/%3E%3Cpath d='M50 55c-22 0-35 12-35 30h70c0-18-13-30-35-30z' fill='white'/%3E%3C/svg%3E";

export interface Player extends BaseEntity {
  first_name: Name;
  last_name: Name;
  gender_id: EntityId;
  email: EmailAddress;
  phone: string;
  date_of_birth: IsoDateString;
  position_id: EntityId;
  organization_id: EntityId;
  height_cm: NonNegativeIntegerValue;
  weight_kg: NonNegativeIntegerValue;
  nationality: string;
  profile_image_url: OptionalMediaUrlValue;
  emergency_contact_name: Name;
  emergency_contact_phone: string;
  medical_notes: DescriptionText;
  status: PlayerStatus;
}

export function get_player_avatar(player: Player): string {
  return player.profile_image_url && player.profile_image_url.trim() !== ""
    ? player.profile_image_url
    : DEFAULT_PLAYER_AVATAR;
}

export function get_player_initials(player: Player): string {
  const first_initial = player.first_name
    ? player.first_name.charAt(0).toUpperCase()
    : "";
  const last_initial = player.last_name
    ? player.last_name.charAt(0).toUpperCase()
    : "";
  return `${first_initial}${last_initial}` || "??";
}

export type CreatePlayerInput = Omit<
  ScalarInput<Player>,
  "id" | "created_at" | "updated_at"
>;
export type UpdatePlayerInput = Partial<CreatePlayerInput>;

export function get_player_full_name(player: Player): string {
  return `${player.first_name} ${player.last_name}`.trim();
}

export function create_empty_player_input(
  organization_id: CreatePlayerInput["organization_id"] = "",
): CreatePlayerInput {
  return {
    first_name: "",
    last_name: "",
    gender_id: "",
    email: "",
    phone: "",
    date_of_birth: "",
    position_id: "",
    organization_id,
    height_cm: 0,
    weight_kg: 0,
    nationality: "",
    profile_image_url: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    medical_notes: "",
    status: "active",
  };
}

export function validate_player_input(input: CreatePlayerInput): string[] {
  const validation_errors: string[] = [];

  if (!input.first_name || input.first_name.trim().length < 1) {
    validation_errors.push("First name is required");
  }

  if (!input.last_name || input.last_name.trim().length < 1) {
    validation_errors.push("Last name is required");
  }

  if (!input.gender_id || input.gender_id.trim().length === 0) {
    validation_errors.push("Gender is required");
  }

  if (!input.date_of_birth) {
    validation_errors.push("Date of birth is required");
  }

  if (!input.nationality || input.nationality.trim().length === 0) {
    validation_errors.push("Nationality is required");
  }

  if (!input.position_id || input.position_id.trim().length === 0) {
    validation_errors.push("Position is required");
  }

  if (!input.organization_id || input.organization_id.trim().length === 0) {
    validation_errors.push("Organization is required");
  }

  const height_result = parse_non_negative_integer_value(
    input.height_cm,
    "Height must be zero or greater",
  );
  if (!height_result.success) {
    validation_errors.push(height_result.error);
  }

  const weight_result = parse_non_negative_integer_value(
    input.weight_kg,
    "Weight must be zero or greater",
  );
  if (!weight_result.success) {
    validation_errors.push(weight_result.error);
  }

  const profile_image_result = parse_optional_media_url_value(
    input.profile_image_url,
    "Profile image URL is invalid",
  );
  if (!profile_image_result.success) {
    validation_errors.push(profile_image_result.error);
  }

  const medical_notes_result = parse_description_text(
    input.medical_notes,
    "Medical notes are invalid",
  );
  if (!medical_notes_result.success) {
    validation_errors.push(medical_notes_result.error);
  }

  return validation_errors;
}
