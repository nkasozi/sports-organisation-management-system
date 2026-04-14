import type { UserRole } from "../interfaces/ports";
import type {
  EmailAddress,
  EntityId,
  EntityScope,
  Name,
  ScalarInput,
} from "../types/DomainScalars";
import type { BaseEntity, EntityStatus } from "./BaseEntity";

export type SystemUserRole = UserRole;

export interface SystemUser extends BaseEntity {
  email: EmailAddress;
  first_name: Name;
  last_name: Name;
  role: SystemUserRole;
  status: EntityStatus;
  organization_id: EntityScope;
  team_id?: EntityId;
  player_id?: EntityId;
  official_id?: EntityId;
  profile_picture_base64?: string;
}

export type CreateSystemUserInput = Omit<
  ScalarInput<SystemUser>,
  "id" | "created_at" | "updated_at"
>;

export type UpdateSystemUserInput = Partial<CreateSystemUserInput>;

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
