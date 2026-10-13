import type {
  EntityId,
  IsoDateString,
  ScalarInput,
} from "../types/DomainScalars";
import type { BaseEntity, EntityStatus } from "./BaseEntity";

export const IDENTIFICATION_HOLDER_TYPE = {
  PLAYER: "player",
  TEAM_STAFF: "team_staff",
  OFFICIAL: "official",
} as const;

export type IdentificationHolderType =
  (typeof IDENTIFICATION_HOLDER_TYPE)[keyof typeof IDENTIFICATION_HOLDER_TYPE];

export interface Identification extends BaseEntity {
  holder_type: IdentificationHolderType;
  holder_id: EntityId;
  identification_type_id: EntityId;
  identifier_value: string;
  document_image_url: string;
  issue_date: IsoDateString;
  expiry_date: IsoDateString;
  notes: string;
  status: EntityStatus;
}

export type CreateIdentificationInput = Omit<
  ScalarInput<Identification>,
  "id" | "created_at" | "updated_at"
>;

export type UpdateIdentificationInput = Partial<CreateIdentificationInput>;

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
