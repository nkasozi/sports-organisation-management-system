import type { BaseEntity, EntityStatus } from "./BaseEntity";
import type { UserRole } from "../interfaces/ports/AuthenticationPort";

export type SystemUserRole = UserRole;

export interface SystemUser extends BaseEntity {
  email: string;
  first_name: string;
  last_name: string;
  role: SystemUserRole;
  status: EntityStatus;
  organization_id: string;
  team_id?: string;
  player_id?: string;
  official_id?: string;
  profile_picture_base64?: string;
}

export interface CreateSystemUserInput {
  email: string;
  first_name: string;
  last_name: string;
  role: SystemUserRole;
  organization_id: string;
  status?: EntityStatus;
  team_id?: string;
  player_id?: string;
  official_id?: string;
  profile_picture_base64?: string;
}

export interface UpdateSystemUserInput {
  email?: string;
  first_name?: string;
  last_name?: string;
  role?: SystemUserRole;
  organization_id?: string;
  status?: EntityStatus;
  team_id?: string;
  player_id?: string;
  official_id?: string;
  profile_picture_base64?: string;
}

export function validate_system_user_input(
  input: CreateSystemUserInput,
): string[] {
  const errors: string[] = [];

  if (!input.email?.trim()) {
    errors.push("Email is required");
  } else if (!is_valid_email(input.email)) {
    errors.push("Invalid email format");
  }

  if (!input.first_name?.trim()) {
    errors.push("First name is required");
  }

  if (!input.last_name?.trim()) {
    errors.push("Last name is required");
  }

  if (!input.role) {
    errors.push("Role is required");
  }

  return errors;
}

function is_valid_email(email: string): boolean {
  const email_regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return email_regex.test(email);
}
