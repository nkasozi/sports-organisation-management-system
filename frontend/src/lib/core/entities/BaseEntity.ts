// Base entity class that all entities inherit from
// Follows the coding rule: well-named variables and methods over short names

export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

export type EntityStatus =
  | "active"
  | "inactive"
  | "archived"
  | "pending"
  | "deleted";

export interface EntityMetadata<T extends BaseEntity = any> {
  entity_name: string;
  display_name: string;
  fields: FieldMetadata<T>[];
}

export interface EnumDependencyConfig {
  depends_on_field: string;
  options_map: Record<string, { value: string; label: string }[]>;
}

export interface FieldMetadata<T extends BaseEntity = any> {
  field_name: Extract<keyof T, string> | string;
  display_name: string;
  field_type:
    | "string"
    | "number"
    | "boolean"
    | "date"
    | "enum"
    | "foreign_key"
    | "file"
    | "sub_entity";
  is_required: boolean;
  is_read_only: boolean;
  is_read_only_on_edit?: boolean;
  show_in_list?: boolean;
  show_in_form?: boolean;
  hide_on_create?: boolean;
  placeholder?: string;
  enum_values?: string[];
  enum_options?: { value: string; label: string }[];
  enum_dependency?: EnumDependencyConfig;
  foreign_key_entity?: string;
  foreign_key_filter?: ForeignKeyFilterConfig;
  validation_rules?: ValidationRule[];
  sub_entity_config?: SubEntityConfig;
}

export interface ForeignKeyFilterConfig {
  depends_on_field: string;
  filter_type:
    | "team_jersey_from_fixture"
    | "official_jersey_from_competition"
    | "holder_type_filter"
    | "teams_from_competition"
    | "exclude_selected_field";
  holder_type?: string;
  team_side?: "home" | "away";
  exclude_field?: string;
}

export interface SubEntityConfig {
  child_entity_type: string;
  foreign_key_field: string;
  holder_type_field?: string;
  holder_type_value?: string;
}

export interface ValidationRule {
  rule_type:
    | "min_length"
    | "max_length"
    | "min_value"
    | "max_value"
    | "pattern"
    | "custom";
  rule_value: any;
  error_message: string;
}

export interface EntityOperationResult<T = any> {
  success: boolean;
  data?: T;
  error_message?: string;
  validation_errors?: Record<string, string>;
  debug_info?: string;
}

export interface EntityListResult<T = any> {
  success: boolean;
  data: T[];
  total_count: number;
  error_message?: string;
  debug_info?: string;
}

// Helper function to generate UUID with entity prefix
export function generate_entity_id(entity_prefix: string): string {
  const timestamp = Date.now();
  const random_part = Math.random().toString(36).substring(2, 15);
  return `${entity_prefix}-${timestamp}-${random_part}`;
}

// Helper function to create base entity fields
export function create_base_entity_timestamp_fields(): Pick<
  BaseEntity,
  "created_at" | "updated_at"
> {
  const now = new Date().toISOString();
  return {
    created_at: now,
    updated_at: now,
  };
}

// Helper function to update timestamp on entity modification
export function update_entity_timestamp<T extends BaseEntity>(entity: T): T {
  return {
    ...entity,
    updated_at: new Date().toISOString(),
  };
}

export const generate_unique_id = generate_entity_id;
export const create_timestamp_fields = create_base_entity_timestamp_fields;
export const update_timestamp = update_entity_timestamp;
