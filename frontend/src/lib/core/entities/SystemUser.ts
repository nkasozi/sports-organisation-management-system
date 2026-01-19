import type { BaseEntity, EntityStatus } from "./BaseEntity";

export type SystemUserRole = "super_admin" | "admin" | "manager" | "user";

export interface SystemUser extends BaseEntity {
  email: string;
  first_name: string;
  last_name: string;
  role: SystemUserRole;
  status: EntityStatus;
  profile_picture_base64?: string;
}

export interface CreateSystemUserInput {
  email: string;
  first_name: string;
  last_name: string;
  role: SystemUserRole;
  status?: EntityStatus;
  profile_picture_base64?: string;
}

export interface UpdateSystemUserInput {
  email?: string;
  first_name?: string;
  last_name?: string;
  role?: SystemUserRole;
  status?: EntityStatus;
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
