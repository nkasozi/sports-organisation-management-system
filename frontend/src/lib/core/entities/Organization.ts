import {
  type DescriptionText,
  type EmailAddress,
  type EntityId,
  type IsoDateString,
  type Name,
  type OptionalHttpUrlValue,
  parse_description_text,
  parse_email_address,
  parse_optional_http_url_value,
  type ScalarInput,
} from "../types/DomainScalars";
import type { BaseEntity, EntityStatus } from "./BaseEntity";

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

function create_empty_organization_input(): CreateOrganizationInput {
  return {
    name: "",
    description: "",
    sport_id: "",
    founded_date: "",
    contact_email: "",
    contact_phone: "",
    address: "",
    website: "",
    status: "active",
  };
}

export function validate_organization_input(
  input: CreateOrganizationInput,
): string[] {
  const validation_errors: string[] = [];

  if (!input.name || input.name.trim().length < 2) {
    validation_errors.push("Organization name must be at least 2 characters");
  }

  if (!input.sport_id || input.sport_id.trim().length === 0) {
    validation_errors.push("Sport is required");
  }

  const description_result = parse_description_text(
    input.description,
    "Description is invalid",
  );
  if (!description_result.success) {
    validation_errors.push(description_result.error);
  }

  if (input.contact_email.length > 0) {
    const contact_email_result = parse_email_address(
      input.contact_email,
      "Invalid email format",
    );
    if (!contact_email_result.success) {
      validation_errors.push(contact_email_result.error);
    }
  }

  const website_result = parse_optional_http_url_value(
    input.website,
    "Website URL is invalid",
  );
  if (!website_result.success) {
    validation_errors.push(website_result.error);
  }

  return validation_errors;
}
