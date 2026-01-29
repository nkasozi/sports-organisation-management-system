import type { BaseEntity } from "./BaseEntity";

export type ActivityCategoryType =
  | "competition"
  | "fixture"
  | "training"
  | "administrative"
  | "transfer_window"
  | "meeting"
  | "medical"
  | "travel"
  | "custom";

export interface ActivityCategory extends BaseEntity {
  name: string;
  description: string;
  organization_id: string;
  category_type: ActivityCategoryType;
  color: string;
  icon: string;
  is_system_generated: boolean;
}

export type CreateActivityCategoryInput = Omit<
  ActivityCategory,
  "id" | "created_at" | "updated_at"
>;

export type UpdateActivityCategoryInput = Partial<CreateActivityCategoryInput>;

export const ACTIVITY_CATEGORY_COLORS = [
  "#EF4444",
  "#F97316",
  "#F59E0B",
  "#84CC16",
  "#22C55E",
  "#14B8A6",
  "#06B6D4",
  "#0EA5E9",
  "#3B82F6",
  "#6366F1",
  "#8B5CF6",
  "#A855F7",
  "#D946EF",
  "#EC4899",
  "#F43F5E",
] as const;

export const ACTIVITY_CATEGORY_ICONS = [
  "trophy",
  "calendar",
  "users",
  "briefcase",
  "clipboard",
  "heart",
  "plane",
  "flag",
  "star",
  "clock",
] as const;

export const DEFAULT_CATEGORY_COLORS: Record<ActivityCategoryType, string> = {
  competition: "#3B82F6",
  fixture: "#22C55E",
  training: "#F59E0B",
  administrative: "#6366F1",
  transfer_window: "#EC4899",
  meeting: "#14B8A6",
  medical: "#EF4444",
  travel: "#0EA5E9",
  custom: "#8B5CF6",
};

export const DEFAULT_CATEGORY_ICONS: Record<ActivityCategoryType, string> = {
  competition: "trophy",
  fixture: "calendar",
  training: "users",
  administrative: "briefcase",
  transfer_window: "clipboard",
  meeting: "users",
  medical: "heart",
  travel: "plane",
  custom: "star",
};

export function validate_activity_category_input(
  input: CreateActivityCategoryInput,
): { is_valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (!input.name || input.name.trim().length === 0) {
    errors.name = "Category name is required";
  }

  if (input.name && input.name.trim().length > 100) {
    errors.name = "Category name must be 100 characters or less";
  }

  if (!input.organization_id || input.organization_id.trim().length === 0) {
    errors.organization_id = "Organization is required";
  }

  if (!input.category_type) {
    errors.category_type = "Category type is required";
  }

  if (!input.color || input.color.trim().length === 0) {
    errors.color = "Color is required";
  }

  const is_valid = Object.keys(errors).length === 0;
  return { is_valid, errors };
}

export function create_default_categories_for_organization(
  organization_id: string,
): CreateActivityCategoryInput[] {
  const category_types: ActivityCategoryType[] = [
    "competition",
    "fixture",
    "training",
    "administrative",
    "transfer_window",
    "meeting",
    "medical",
    "travel",
  ];

  return category_types.map((category_type) => ({
    name:
      category_type.charAt(0).toUpperCase() +
      category_type.slice(1).replace(/_/g, " "),
    description: `Default ${category_type.replace(/_/g, " ")} category`,
    organization_id,
    category_type,
    color: DEFAULT_CATEGORY_COLORS[category_type],
    icon: DEFAULT_CATEGORY_ICONS[category_type],
    is_system_generated: true,
  }));
}
