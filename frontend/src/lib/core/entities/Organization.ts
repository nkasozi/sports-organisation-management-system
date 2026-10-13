import {
  type DescriptionText,
  type EmailAddress,
  type EntityId,
  type IsoDateString,
  type Name,
  type OptionalHttpUrlValue,
  parse_description_text,
  parse_optional_http_url_value,
  type ScalarInput,
} from "../types/DomainScalars";
import type { BaseEntity, EntityStatus } from "./BaseEntity";
import {
  check_condition,
  check_minimum_text_length,
  check_optional_email_address,
  collect_validation_errors,
  is_blank_text,
} from "./EntityValidation";

const MINIMUM_NAME_LENGTH = 2;

const ORGANIZATION_VALIDATION_MESSAGES = {
  NAME_TOO_SHORT: "Organization name must be at least 2 characters",
  SPORT_REQUIRED: "Sport is required",
  INVALID_DESCRIPTION: "Description is invalid",
  INVALID_EMAIL: "Invalid email format",
  INVALID_WEBSITE: "Website URL is invalid",
} as const;

export interface Organization extends BaseEntity {
  name: Name;
  description: DescriptionText;
  sport_id: EntityId;
  founded_date: IsoDateString | "";
  contact_email: EmailAddress;
  contact_phone: string;
  address: string;
  website: OptionalHttpUrlValue;
  status: EntityStatus;
}

export type CreateOrganizationInput = Omit<
  ScalarInput<Organization>,
  "id" | "created_at" | "updated_at"
>;
export type UpdateOrganizationInput = Partial<CreateOrganizationInput>;

export function validate_organization_input(
  input: CreateOrganizationInput,
): string[] {
  return collect_validation_errors([
    check_minimum_text_length(
      input.name,
      MINIMUM_NAME_LENGTH,
      ORGANIZATION_VALIDATION_MESSAGES.NAME_TOO_SHORT,
    ),
    check_condition(
      !is_blank_text(input.sport_id),
      ORGANIZATION_VALIDATION_MESSAGES.SPORT_REQUIRED,
    ),
    parse_description_text(
      input.description,
      ORGANIZATION_VALIDATION_MESSAGES.INVALID_DESCRIPTION,
    ),
    check_optional_email_address(
      input.contact_email,
      ORGANIZATION_VALIDATION_MESSAGES.INVALID_EMAIL,
    ),
    parse_optional_http_url_value(
      input.website,
      ORGANIZATION_VALIDATION_MESSAGES.INVALID_WEBSITE,
    ),
  ]);
}
