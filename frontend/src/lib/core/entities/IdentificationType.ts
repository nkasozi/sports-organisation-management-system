import type { BaseEntity, EntityStatus } from "./BaseEntity";

export interface IdentificationType extends BaseEntity {
  name: string;
  identifier_field_label: string;
  description: string;
  status: EntityStatus;
}

export type CreateIdentificationTypeInput = Omit<
  IdentificationType,
  "id" | "created_at" | "updated_at"
>;

export type UpdateIdentificationTypeInput =
  Partial<CreateIdentificationTypeInput>;

export function create_empty_identification_type_input(): CreateIdentificationTypeInput {
  return {
    name: "",
    identifier_field_label: "",
    description: "",
    status: "active",
  };
}

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

export function get_identification_type_display_name(
  identification_type: IdentificationType,
): string {
  return identification_type.name;
}
