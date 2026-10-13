import type { EntityId, Name, ScalarInput } from "../types/DomainScalars";
import type { BaseEntity, EntityStatus } from "./BaseEntity";

export interface Gender extends BaseEntity {
  name: Name;
  description: string;
  status: EntityStatus;
  organization_id: EntityId;
}

export type CreateGenderInput = Omit<
  ScalarInput<Gender>,
  "id" | "created_at" | "updated_at"
>;

export type UpdateGenderInput = Partial<CreateGenderInput>;

export function validate_gender_input(input: CreateGenderInput): string[] {
  const validation_errors: string[] = [];

  if (!input.name || input.name.trim().length < 2) {
    validation_errors.push("Name must be at least 2 characters");
  }

  return validation_errors;
}
