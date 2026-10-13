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
import {
  check_condition,
  collect_validation_errors,
  type FieldCheck,
  is_blank_text,
} from "./EntityValidation";

const PLAYER_VALIDATION_MESSAGES = {
  FIRST_NAME_REQUIRED: "First name is required",
  LAST_NAME_REQUIRED: "Last name is required",
  GENDER_REQUIRED: "Gender is required",
  DATE_OF_BIRTH_REQUIRED: "Date of birth is required",
  NATIONALITY_REQUIRED: "Nationality is required",
  POSITION_REQUIRED: "Position is required",
  ORGANIZATION_REQUIRED: "Organization is required",
  INVALID_HEIGHT: "Height must be zero or greater",
  INVALID_WEIGHT: "Weight must be zero or greater",
  INVALID_PROFILE_IMAGE: "Profile image URL is invalid",
  INVALID_MEDICAL_NOTES: "Medical notes are invalid",
} as const;

const PLAYER_STATUS = {
  ACTIVE: "active",
  INJURED: "injured",
  SUSPENDED: "suspended",
  INACTIVE: "inactive",
} as const;

export type PlayerStatus = (typeof PLAYER_STATUS)[keyof typeof PLAYER_STATUS];

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
    status: PLAYER_STATUS.ACTIVE,
  };
}

export function validate_player_input(input: CreatePlayerInput): string[] {
  return collect_validation_errors([
    ...collect_required_player_field_checks(input),
    parse_non_negative_integer_value(
      input.height_cm,
      PLAYER_VALIDATION_MESSAGES.INVALID_HEIGHT,
    ),
    parse_non_negative_integer_value(
      input.weight_kg,
      PLAYER_VALIDATION_MESSAGES.INVALID_WEIGHT,
    ),
    parse_optional_media_url_value(
      input.profile_image_url,
      PLAYER_VALIDATION_MESSAGES.INVALID_PROFILE_IMAGE,
    ),
    parse_description_text(
      input.medical_notes,
      PLAYER_VALIDATION_MESSAGES.INVALID_MEDICAL_NOTES,
    ),
  ]);
}

function collect_required_player_field_checks(
  input: CreatePlayerInput,
): FieldCheck[] {
  const required_fields: ReadonlyArray<readonly [string | undefined, string]> =
    [
      [input.first_name, PLAYER_VALIDATION_MESSAGES.FIRST_NAME_REQUIRED],
      [input.last_name, PLAYER_VALIDATION_MESSAGES.LAST_NAME_REQUIRED],
      [input.gender_id, PLAYER_VALIDATION_MESSAGES.GENDER_REQUIRED],
      [input.date_of_birth, PLAYER_VALIDATION_MESSAGES.DATE_OF_BIRTH_REQUIRED],
      [input.nationality, PLAYER_VALIDATION_MESSAGES.NATIONALITY_REQUIRED],
      [input.position_id, PLAYER_VALIDATION_MESSAGES.POSITION_REQUIRED],
      [input.organization_id, PLAYER_VALIDATION_MESSAGES.ORGANIZATION_REQUIRED],
    ];
  return required_fields.map(([value, message]) =>
    check_condition(!is_blank_text(value), message),
  );
}
