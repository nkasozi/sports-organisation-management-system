import type { EntityId, Name, ScalarInput } from "../types/DomainScalars";
import type { BaseEntity, EntityStatus } from "./BaseEntity";

export interface TeamStaffRole extends BaseEntity {
  name: Name;
  code: string;
  description: string;
  category: "coaching" | "medical" | "administrative" | "technical" | "other";
  is_primary_contact: boolean;
  display_order: number;
  status: EntityStatus;
  organization_id: EntityId;
}

export type CreateTeamStaffRoleInput = Omit<
  ScalarInput<TeamStaffRole>,
  "id" | "created_at" | "updated_at"
>;
export type UpdateTeamStaffRoleInput = Partial<CreateTeamStaffRoleInput>;

export function validate_team_staff_role_input(
  input: CreateTeamStaffRoleInput,
): string[] {
  const validation_errors: string[] = [];

  if (!input.name || input.name.trim().length < 2) {
    validation_errors.push("Role name must be at least 2 characters");
  }

  if (!input.code || input.code.trim().length < 2) {
    validation_errors.push("Role code must be at least 2 characters");
  }

  return validation_errors;
}
