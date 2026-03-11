import type { BaseEntity, EntityStatus } from "./BaseEntity";

export interface Gender extends BaseEntity {
  name: string;
  description: string;
  status: EntityStatus;
}

export type CreateGenderInput = Omit<
  Gender,
  "id" | "created_at" | "updated_at"
>;

export type UpdateGenderInput = Partial<CreateGenderInput>;

function create_empty_gender_input(): CreateGenderInput {
  return {
    name: "",
    description: "",
    status: "active",
  };
}

export function validate_gender_input(input: CreateGenderInput): string[] {
  const validation_errors: string[] = [];

  if (!input.name || input.name.trim().length < 2) {
    validation_errors.push("Name must be at least 2 characters");
  }

  return validation_errors;
}

function get_gender_display_name(gender: Gender): string {
  return gender.name;
}
