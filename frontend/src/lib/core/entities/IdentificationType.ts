import type { EntityId, Name, ScalarInput } from "../types/DomainScalars";
import type { BaseEntity, EntityStatus } from "./BaseEntity";

export interface IdentificationType extends BaseEntity {
  name: Name;
  identifier_field_label: string;
  description: string;
  status: EntityStatus;
  organization_id: EntityId;
}

export type CreateIdentificationTypeInput = Omit<
  ScalarInput<IdentificationType>,
  "id" | "created_at" | "updated_at"
>;

export type UpdateIdentificationTypeInput =
  Partial<CreateIdentificationTypeInput>;

export function validate_identification_type_input(
  input: CreateIdentificationTypeInput,
): string[] {
  const validation_errors: string[] = [];

  if (!input.name || input.name.trim().length < 2) {
    validation_errors.push("Name must be at least 2 characters");
  }

  if (
    !input.identifier_field_label ||
    input.identifier_field_label.trim().length < 2
  ) {
    validation_errors.push(
      "Identifier field label must be at least 2 characters",
    );
  }

  return validation_errors;
}
