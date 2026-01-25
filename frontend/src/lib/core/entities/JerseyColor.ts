import type { BaseEntity, EntityStatus } from "./BaseEntity";

export type JerseyColorHolderType = "team" | "competition_official";

export interface JerseyColor extends BaseEntity {
  holder_type: JerseyColorHolderType;
  holder_id: string;
  nickname: string;
  main_color: string;
  secondary_color: string;
  tertiary_color: string;
  status: EntityStatus;
}

export type CreateJerseyColorInput = Omit<
  JerseyColor,
  "id" | "created_at" | "updated_at"
>;

export type UpdateJerseyColorInput = Partial<CreateJerseyColorInput>;

export const JERSEY_COLOR_HOLDER_TYPE_OPTIONS = [
  { value: "team", label: "Team" },
  { value: "competition_official", label: "Competition Officials" },
];

export function create_empty_jersey_color_input(
  holder_type?: JerseyColorHolderType,
  holder_id?: string,
): CreateJerseyColorInput {
  return {
    holder_type: holder_type || "team",
    holder_id: holder_id || "",
    nickname: "",
    main_color: "#000000",
    secondary_color: "",
    tertiary_color: "",
    status: "active",
  };
}

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

export function is_color_match(color1: string, color2: string): boolean {
  if (!color1 || !color2) return false;
  const normalized_color1 = color1.toLowerCase().trim();
  const normalized_color2 = color2.toLowerCase().trim();
  return normalized_color1 === normalized_color2;
}

export function check_main_color_clash(
  jersey1: JerseyColor,
  jersey2: JerseyColor,
): boolean {
  return is_color_match(jersey1.main_color, jersey2.main_color);
}
