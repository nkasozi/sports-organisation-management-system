import type { UserRole } from "../interfaces/ports";
import type {
  EmailAddress,
  EntityId,
  EntityScope,
  Name,
  ScalarInput,
} from "../types/DomainScalars";
import { create_failure_result } from "../types/Result";
import type { BaseEntity, EntityStatus } from "./BaseEntity";
import {
  check_condition,
  check_required_email_address,
  collect_validation_errors,
  type FieldCheck,
  is_blank_text,
} from "./EntityValidation";

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

const SYSTEM_USER_VALIDATION_MESSAGES = {
  EMAIL_REQUIRED: "Email is required",
  INVALID_EMAIL: "Invalid email format",
  FIRST_NAME_REQUIRED: "First name is required",
  LAST_NAME_REQUIRED: "Last name is required",
  ROLE_REQUIRED: "Role is required",
} as const;

export function validate_system_user_input(
  input: CreateSystemUserInput,
): string[] {
  return collect_validation_errors([
    check_system_user_email(input.email),
    check_condition(
      !is_blank_text(input.first_name),
      SYSTEM_USER_VALIDATION_MESSAGES.FIRST_NAME_REQUIRED,
    ),
    check_condition(
      !is_blank_text(input.last_name),
      SYSTEM_USER_VALIDATION_MESSAGES.LAST_NAME_REQUIRED,
    ),
    check_condition(
      Boolean(input.role),
      SYSTEM_USER_VALIDATION_MESSAGES.ROLE_REQUIRED,
    ),
  ]);
}

function check_system_user_email(email: string | undefined): FieldCheck {
  return is_blank_text(email)
    ? create_failure_result(SYSTEM_USER_VALIDATION_MESSAGES.EMAIL_REQUIRED)
    : check_required_email_address(
        email,
        SYSTEM_USER_VALIDATION_MESSAGES.INVALID_EMAIL,
      );
}
