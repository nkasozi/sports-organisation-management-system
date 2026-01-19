import type { BaseEntity, EntityStatus } from "./BaseEntity";

export type IdentificationHolderType = "player" | "team_staff" | "official";

export interface Identification extends BaseEntity {
  holder_type: IdentificationHolderType;
  holder_id: string;
  identification_type_id: string;
  identifier_value: string;
  document_image_url: string;
  issue_date: string;
  expiry_date: string;
  notes: string;
  status: EntityStatus;
}

export type CreateIdentificationInput = Omit<
  Identification,
  "id" | "created_at" | "updated_at"
>;

export type UpdateIdentificationInput = Partial<CreateIdentificationInput>;

export const IDENTIFICATION_HOLDER_TYPE_OPTIONS = [
  { value: "player", label: "Player" },
  { value: "team_staff", label: "Team Staff" },
  { value: "official", label: "Official" },
];

export function create_empty_identification_input(
  holder_type?: IdentificationHolderType,
  holder_id?: string,
): CreateIdentificationInput {
  return {
    holder_type: holder_type || "player",
    holder_id: holder_id || "",
    identification_type_id: "",
    identifier_value: "",
    document_image_url: "",
    issue_date: "",
    expiry_date: "",
    notes: "",
    status: "active",
  };
}

export function validate_identification_input(
  input: CreateIdentificationInput,
): string[] {
  const validation_errors: string[] = [];

  if (!input.holder_type) {
    validation_errors.push("Holder type is required");
  }

  if (!input.holder_id || input.holder_id.trim().length === 0) {
    validation_errors.push("Holder is required");
  }

  if (
    !input.identification_type_id ||
    input.identification_type_id.trim().length === 0
  ) {
    validation_errors.push("Identification type is required");
  }

  if (!input.identifier_value || input.identifier_value.trim().length === 0) {
    validation_errors.push("Identifier value is required");
  }

  return validation_errors;
}
