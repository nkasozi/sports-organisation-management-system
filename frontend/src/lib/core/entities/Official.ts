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
import type { BaseEntity, EntityStatus } from "./BaseEntity";
import {
  check_condition,
  check_optional_email_address,
  collect_validation_errors,
  is_blank_text,
} from "./EntityValidation";

const OFFICIAL_VALIDATION_MESSAGES = {
  FIRST_NAME_REQUIRED: "First name is required",
  LAST_NAME_REQUIRED: "Last name is required",
  ORGANIZATION_REQUIRED: "Organization is required",
  GENDER_REQUIRED: "Gender is required",
  INVALID_EMAIL: "Invalid email format",
  INVALID_YEARS_OF_EXPERIENCE: "Years of experience must be zero or greater",
  INVALID_PROFILE_IMAGE: "Profile image URL is invalid",
  INVALID_NOTES: "Notes are invalid",
} as const;

export type OfficialStatus = EntityStatus;

export const DEFAULT_OFFICIAL_AVATAR =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%23f59e0b'/%3E%3Ccircle cx='50' cy='35' r='18' fill='white'/%3E%3Cpath d='M50 55c-22 0-35 12-35 30h70c0-18-13-30-35-30z' fill='white'/%3E%3C/svg%3E";

export interface Official extends BaseEntity {
  first_name: Name;
  last_name: Name;
  gender_id: EntityId;
  email: EmailAddress;
  phone: string;
  date_of_birth: IsoDateString;
  organization_id: EntityId;
  years_of_experience: NonNegativeIntegerValue;
  nationality: string;
  profile_image_url: OptionalMediaUrlValue;
  emergency_contact_name: Name;
  emergency_contact_phone: string;
  notes: DescriptionText;
  status: OfficialStatus;
}

export type CreateOfficialInput = Omit<
  ScalarInput<Official>,
  "id" | "created_at" | "updated_at"
>;
export type UpdateOfficialInput = Partial<CreateOfficialInput>;

export function get_official_full_name(official: Official): string {
  return `${official.first_name} ${official.last_name}`.trim();
}

export function validate_official_input(input: CreateOfficialInput): string[] {
  return collect_validation_errors([
    check_condition(
      !is_blank_text(input.first_name),
      OFFICIAL_VALIDATION_MESSAGES.FIRST_NAME_REQUIRED,
    ),
    check_condition(
      !is_blank_text(input.last_name),
      OFFICIAL_VALIDATION_MESSAGES.LAST_NAME_REQUIRED,
    ),
    check_condition(
      Boolean(input.organization_id),
      OFFICIAL_VALIDATION_MESSAGES.ORGANIZATION_REQUIRED,
    ),
    check_condition(
      !is_blank_text(input.gender_id),
      OFFICIAL_VALIDATION_MESSAGES.GENDER_REQUIRED,
    ),
    check_optional_email_address(
      input.email,
      OFFICIAL_VALIDATION_MESSAGES.INVALID_EMAIL,
    ),
    parse_non_negative_integer_value(
      input.years_of_experience,
      OFFICIAL_VALIDATION_MESSAGES.INVALID_YEARS_OF_EXPERIENCE,
    ),
    parse_optional_media_url_value(
      input.profile_image_url,
      OFFICIAL_VALIDATION_MESSAGES.INVALID_PROFILE_IMAGE,
    ),
    parse_description_text(
      input.notes,
      OFFICIAL_VALIDATION_MESSAGES.INVALID_NOTES,
    ),
  ]);
}
