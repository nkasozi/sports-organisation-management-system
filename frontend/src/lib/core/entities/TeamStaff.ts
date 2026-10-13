import type {
  DescriptionText,
  EmailAddress,
  EntityId,
  IsoDateString,
  Name,
  OptionalMediaUrlValue,
  ScalarInput,
} from "../types/DomainScalars";
import {
  parse_description_text,
  parse_optional_media_url_value,
} from "../types/DomainScalars";
import type { BaseEntity, EntityStatus } from "./BaseEntity";
import {
  check_condition,
  check_minimum_text_length,
  check_optional_email_address,
  collect_validation_errors,
} from "./EntityValidation";

const MINIMUM_NAME_LENGTH = 2;

const TEAM_STAFF_VALIDATION_MESSAGES = {
  FIRST_NAME_TOO_SHORT: "First name must be at least 2 characters",
  LAST_NAME_TOO_SHORT: "Last name must be at least 2 characters",
  TEAM_REQUIRED: "Team is required",
  ROLE_REQUIRED: "Role is required",
  INVALID_EMAIL: "Invalid email format",
  INVALID_PROFILE_IMAGE: "Profile image URL is invalid",
  INVALID_NOTES: "Notes are invalid",
} as const;

export const DEFAULT_STAFF_AVATAR =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%2310b981'/%3E%3Ccircle cx='50' cy='35' r='18' fill='white'/%3E%3Cpath d='M50 55c-22 0-35 12-35 30h70c0-18-13-30-35-30z' fill='white'/%3E%3C/svg%3E";

export interface TeamStaff extends BaseEntity {
  first_name: Name;
  last_name: Name;
  email: EmailAddress;
  phone: string;
  date_of_birth: IsoDateString;
  organization_id: EntityId;
  team_id: EntityId;
  role_id: EntityId;
  nationality: string;
  profile_image_url: OptionalMediaUrlValue;
  employment_start_date: IsoDateString;
  employment_end_date: IsoDateString | "";
  emergency_contact_name: Name;
  emergency_contact_phone: string;
  notes: DescriptionText;
  status: EntityStatus;
}

export type CreateTeamStaffInput = Omit<
  ScalarInput<TeamStaff>,
  "id" | "created_at" | "updated_at"
>;
export type UpdateTeamStaffInput = Partial<CreateTeamStaffInput>;

export function get_team_staff_full_name(staff: TeamStaff): string {
  return `${staff.first_name} ${staff.last_name}`.trim();
}

export function validate_team_staff_input(
  input: CreateTeamStaffInput,
): string[] {
  return collect_validation_errors([
    check_minimum_text_length(
      input.first_name,
      MINIMUM_NAME_LENGTH,
      TEAM_STAFF_VALIDATION_MESSAGES.FIRST_NAME_TOO_SHORT,
    ),
    check_minimum_text_length(
      input.last_name,
      MINIMUM_NAME_LENGTH,
      TEAM_STAFF_VALIDATION_MESSAGES.LAST_NAME_TOO_SHORT,
    ),
    check_condition(
      Boolean(input.team_id),
      TEAM_STAFF_VALIDATION_MESSAGES.TEAM_REQUIRED,
    ),
    check_condition(
      Boolean(input.role_id),
      TEAM_STAFF_VALIDATION_MESSAGES.ROLE_REQUIRED,
    ),
    check_optional_email_address(
      input.email,
      TEAM_STAFF_VALIDATION_MESSAGES.INVALID_EMAIL,
    ),
    parse_optional_media_url_value(
      input.profile_image_url,
      TEAM_STAFF_VALIDATION_MESSAGES.INVALID_PROFILE_IMAGE,
    ),
    parse_description_text(
      input.notes,
      TEAM_STAFF_VALIDATION_MESSAGES.INVALID_NOTES,
    ),
  ]);
}
