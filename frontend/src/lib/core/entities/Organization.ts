import type { BaseEntity, EntityStatus } from "./BaseEntity";

export interface Organization extends BaseEntity {
  name: string;
  description: string;
  sport_id: string;
  founded_date: string | null;
  contact_email: string;
  contact_phone: string;
  address: string;
  website: string;
  status: EntityStatus;
}

export type CreateOrganizationInput = Omit<
  Organization,
  "id" | "created_at" | "updated_at"
>;
export type UpdateOrganizationInput = Partial<CreateOrganizationInput>;

export function create_empty_organization_input(): CreateOrganizationInput {
  return {
    name: "",
    description: "",
    sport_id: "",
    founded_date: null,
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

  if (input.contact_email && !is_valid_email(input.contact_email)) {
    validation_errors.push("Invalid email format");
  }

  return validation_errors;
}

function is_valid_email(email: string): boolean {
  const email_regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return email_regex.test(email);
}
