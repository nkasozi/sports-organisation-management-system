import type { EntityId, IsoDateTimeString } from "../types/DomainScalars";
import type { EntityStatusValue } from "./StatusConstants";

export interface BaseEntity<TEntityId extends EntityId = EntityId> {
  id: TEntityId;
  created_at: IsoDateTimeString;
  updated_at: IsoDateTimeString;
}

export type EntityStatus = EntityStatusValue;

export interface EntityMetadata<T extends BaseEntity = BaseEntity> {
  entity_name: string;
  display_name: string;
  fields: FieldMetadata<T>[];
}

export interface EnumDependencyConfig {
  depends_on_field: string;
  options_map: Record<string, { value: string; label: string }[]>;
}

export interface FieldVisibilityCondition {
  depends_on_field: string;
  visible_when_values: string[];
}

export interface FieldMetadata<T extends BaseEntity = BaseEntity> {
  field_name: Extract<keyof T, string> | string;
  display_name: string;
  field_type:
    | "string"
    | "number"
    | "star_rating"
    | "boolean"
    | "date"
    | "enum"
    | "foreign_key"
    | "file"
    | "sub_entity"
    | "official_assignment_array"
    | "stage_template_array";
  is_required: boolean;
  is_read_only: boolean;
  is_read_only_on_edit?: boolean;
  is_read_only_on_create?: boolean;
  show_in_list?: boolean;
  show_in_form?: boolean;
  hide_on_create?: boolean;
  hide_on_edit?: boolean;
  placeholder?: string;
  enum_values?: string[];
  enum_options?: { value: string; label: string }[];
  enum_dependency?: EnumDependencyConfig;
  visible_when?: FieldVisibilityCondition;
  foreign_key_entity?: string;
  foreign_key_value_field?: string;
  is_form_only?: boolean;
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
    | "stages_from_competition"
    | "competitions_from_organization"
    | "fixtures_from_organization"
    | "teams_from_organization"
    | "players_from_organization"
    | "officials_from_organization"
    | "live_game_logs_from_organization"
    | "teams_from_player_memberships"
    | "teams_excluding_player_memberships"
    | "lookup_from_organization"
    | "exclude_selected_field"
    | "fixtures_from_official"
    | "fixtures_for_rating"
    | "officials_from_fixture"
    | "fixtures_without_setup"
    | "fixtures_without_setup_in_competition";
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
  rule_value: number | string;
  error_message: string;
}

const ENTITY_ID_RANDOM_RADIX = 36;
const ENTITY_ID_RANDOM_START = 2;
const ENTITY_ID_RANDOM_END = 15;

export function generate_unique_id(entity_prefix: string): EntityId {
  const timestamp = Date.now();
  const random_part = Math.random()
    .toString(ENTITY_ID_RANDOM_RADIX)
    .substring(ENTITY_ID_RANDOM_START, ENTITY_ID_RANDOM_END);
  return `${entity_prefix}-${timestamp}-${random_part}` as EntityId;
}

export function create_timestamp_fields(): Pick<
  BaseEntity,
  "created_at" | "updated_at"
> {
  const now = new Date().toISOString() as IsoDateTimeString;
  return { created_at: now, updated_at: now };
}

export function update_timestamp<T extends BaseEntity>(entity: T): T {
  return {
    ...entity,
    updated_at: new Date().toISOString() as IsoDateTimeString,
  };
}
