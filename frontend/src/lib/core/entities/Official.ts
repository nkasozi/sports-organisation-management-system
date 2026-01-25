import type { BaseEntity, EntityStatus } from "./BaseEntity";

export type OfficialStatus = EntityStatus;

export const DEFAULT_OFFICIAL_AVATAR =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%23f59e0b'/%3E%3Ccircle cx='50' cy='35' r='18' fill='white'/%3E%3Cpath d='M50 55c-22 0-35 12-35 30h70c0-18-13-30-35-30z' fill='white'/%3E%3C/svg%3E";

export interface Official extends BaseEntity {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  organization_id: string;
  years_of_experience: number;
  nationality: string;
  profile_image_url: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  notes: string;
  status: OfficialStatus;
}

export function get_official_avatar(official: Official): string {
  return official.profile_image_url && official.profile_image_url.trim() !== ""
    ? official.profile_image_url
    : DEFAULT_OFFICIAL_AVATAR;
}

export function get_official_initials(official: Official): string {
  const first_initial = official.first_name
    ? official.first_name.charAt(0).toUpperCase()
    : "";
  const last_initial = official.last_name
    ? official.last_name.charAt(0).toUpperCase()
    : "";
  return `${first_initial}${last_initial}` || "??";
}

export type CreateOfficialInput = Omit<
  Official,
  "id" | "created_at" | "updated_at"
>;
export type UpdateOfficialInput = Partial<CreateOfficialInput>;

export function get_official_full_name(official: Official): string {
  return `${official.first_name} ${official.last_name}`.trim();
}

export function create_empty_official_input(
  organization_id: string = "",
): CreateOfficialInput {
  return {
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    date_of_birth: "",
    organization_id,
    years_of_experience: 0,
    nationality: "",
    profile_image_url: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    notes: "",
    status: "active",
  };
}

export function validate_official_input(input: CreateOfficialInput): string[] {
  const validation_errors: string[] = [];

  if (!input.first_name || input.first_name.trim().length < 1) {
    validation_errors.push("First name is required");
  }

  if (!input.last_name || input.last_name.trim().length < 1) {
    validation_errors.push("Last name is required");
  }

  if (!input.organization_id) {
    validation_errors.push("Organization is required");
  }

  if (input.email && !is_valid_email(input.email)) {
    validation_errors.push("Invalid email format");
  }

  return validation_errors;
}

function is_valid_email(email: string): boolean {
  const email_regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return email_regex.test(email);
}
