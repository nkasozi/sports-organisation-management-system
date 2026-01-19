import type { BaseEntity, EntityStatus } from "./BaseEntity";

export const DEFAULT_STAFF_AVATAR =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%2310b981'/%3E%3Ccircle cx='50' cy='35' r='18' fill='white'/%3E%3Cpath d='M50 55c-22 0-35 12-35 30h70c0-18-13-30-35-30z' fill='white'/%3E%3C/svg%3E";

export interface TeamStaff extends BaseEntity {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  team_id: string;
  role_id: string;
  nationality: string;
  profile_image_url: string;
  employment_start_date: string;
  employment_end_date: string | null;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  notes: string;
  status: EntityStatus;
}

export type CreateTeamStaffInput = Omit<
  TeamStaff,
  "id" | "created_at" | "updated_at"
>;
export type UpdateTeamStaffInput = Partial<CreateTeamStaffInput>;

export function get_team_staff_avatar(staff: TeamStaff): string {
  return staff.profile_image_url && staff.profile_image_url.trim() !== ""
    ? staff.profile_image_url
    : DEFAULT_STAFF_AVATAR;
}

export function get_team_staff_full_name(staff: TeamStaff): string {
  return `${staff.first_name} ${staff.last_name}`.trim();
}

export function get_team_staff_initials(staff: TeamStaff): string {
  const first_initial = staff.first_name
    ? staff.first_name.charAt(0).toUpperCase()
    : "";
  const last_initial = staff.last_name
    ? staff.last_name.charAt(0).toUpperCase()
    : "";
  return `${first_initial}${last_initial}` || "??";
}

export function create_empty_team_staff_input(
  team_id: string = "",
  role_id: string = "",
): CreateTeamStaffInput {
  return {
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    date_of_birth: "",
    team_id,
    role_id,
    nationality: "",
    profile_image_url: "",
    employment_start_date: new Date().toISOString().split("T")[0],
    employment_end_date: null,
    emergency_contact_name: "",
    emergency_contact_phone: "",
    notes: "",
    status: "active",
  };
}

export function validate_team_staff_input(
  input: CreateTeamStaffInput,
): string[] {
  const validation_errors: string[] = [];

  if (!input.first_name || input.first_name.trim().length < 2) {
    validation_errors.push("First name must be at least 2 characters");
  }

  if (!input.last_name || input.last_name.trim().length < 2) {
    validation_errors.push("Last name must be at least 2 characters");
  }

  if (!input.team_id) {
    validation_errors.push("Team is required");
  }

  if (!input.role_id) {
    validation_errors.push("Role is required");
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
