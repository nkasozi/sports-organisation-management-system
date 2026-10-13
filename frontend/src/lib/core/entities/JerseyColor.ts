import type { EntityId, Name, ScalarInput } from "../types/DomainScalars";
import type { BaseEntity, EntityStatus } from "./BaseEntity";

export const JERSEY_COLOR_HOLDER_TYPE = {
  TEAM: "team",
  COMPETITION_OFFICIAL: "competition_official",
} as const;

export type JerseyColorHolderType =
  (typeof JERSEY_COLOR_HOLDER_TYPE)[keyof typeof JERSEY_COLOR_HOLDER_TYPE];

export interface JerseyColor extends BaseEntity {
  holder_type: JerseyColorHolderType;
  holder_id: EntityId;
  nickname: Name;
  main_color: string;
  secondary_color: string;
  tertiary_color: string;
  status: EntityStatus;
}

export type CreateJerseyColorInput = Omit<
  ScalarInput<JerseyColor>,
  "id" | "created_at" | "updated_at"
>;

export type UpdateJerseyColorInput = Partial<CreateJerseyColorInput>;

export function validate_jersey_color_input(
  input: CreateJerseyColorInput,
): string[] {
  const validation_errors: string[] = [];

  if (!input.holder_type) {
    validation_errors.push("Holder type is required");
  }

  if (!input.holder_id || input.holder_id.trim() === "") {
    validation_errors.push("Holder ID is required");
  }

  if (!input.nickname || input.nickname.trim() === "") {
    validation_errors.push(
      "Nickname is required (e.g., Home Jersey, Away Jersey)",
    );
  }

  if (!input.main_color || input.main_color.trim() === "") {
    validation_errors.push("Main color is required");
  }

  if (!input.status) {
    validation_errors.push("Status is required");
  }

  return validation_errors;
}
