import type {
  FieldMetadata,
  EntityMetadata,
  ValidationRule,
  BaseEntity,
  SubEntityConfig,
} from "../../core/entities/BaseEntity";
import type { SubEntityFilter } from "../../core/types/SubEntityFilter";

export function determine_if_edit_mode(
  data: Partial<BaseEntity> | null,
): boolean {
  return data !== null && data.id !== undefined;
}

export function build_form_title(
  display_name: string,
  edit_mode: boolean,
): string {
  const action = edit_mode ? "Edit" : "Create";
  return `${action} ${display_name}`;
}

export function get_sub_entity_fields(
  metadata: EntityMetadata | null,
): FieldMetadata[] {
  if (!metadata) return [];
  return metadata.fields.filter((field) => field.field_type === "sub_entity");
}

export function build_sub_entity_filter(
  field: FieldMetadata,
  parent_entity: Partial<BaseEntity> | null,
): SubEntityFilter | null {
  if (!field.sub_entity_config || !parent_entity?.id) return null;

  const config = field.sub_entity_config;
  return {
    foreign_key_field: config.foreign_key_field,
    foreign_key_value: parent_entity.id,
    holder_type_field: config.holder_type_field,
    holder_type_value: config.holder_type_value,
  };
}

export function get_default_value_for_field_type(field: FieldMetadata): any {
  if (field.field_type === "string") return "";
  if (field.field_type === "number") return 0;
  if (field.field_type === "boolean") return false;
  if (field.field_type === "date") return "";
  if (field.field_type === "file") return "";
  if (field.field_type === "enum") {
    if (!field.enum_values || field.enum_values.length === 0) return "";
    if (!field.is_required) return "";
    return field.enum_values[0];
  }
  if (field.field_type === "foreign_key") return "";
  return "";
}

export function get_sorted_fields_for_display(
  fields: FieldMetadata[],
  in_edit_mode: boolean,
): FieldMetadata[] {
  const renderable_fields = fields.filter((f) => f.field_type !== "sub_entity");
  const visible_fields = renderable_fields.filter((f) => {
    if (!in_edit_mode && f.hide_on_create) return false;
    return true;
  });
  const file_fields = visible_fields.filter((f) => f.field_type === "file");
  const other_fields = visible_fields.filter((f) => f.field_type !== "file");
  return [...file_fields, ...other_fields];
}

export function get_input_type_for_field(field: FieldMetadata): string {
  if (field.field_type === "number") return "number";
  if (field.field_type === "date") return "date";
  if (field.field_type === "file") return "file";
  if (field.field_name.includes("email")) return "email";
  if (field.field_name.includes("phone") || field.field_name.includes("tel"))
    return "tel";
  if (field.field_name.includes("icon")) return "text";
  if (
    field.field_name.includes("url") ||
    field.field_name.includes("website") ||
    field.field_name.includes("link")
  )
    return "url";
  return "text";
}

export interface FormValidationResult {
  is_valid: boolean;
  errors: Record<string, string>;
}

export function validate_form_data_against_metadata(
  data: Record<string, any>,
  metadata: EntityMetadata,
): FormValidationResult {
  const errors: Record<string, string> = {};

  for (const field of metadata.fields) {
    const field_value = data[field.field_name];

    if (
      field.is_required &&
      (field_value === "" || field_value === null || field_value === undefined)
    ) {
      errors[field.field_name] = `${field.display_name} is required`;
      continue;
    }

    if (
      field.validation_rules &&
      field_value !== "" &&
      field_value !== null &&
      field_value !== undefined
    ) {
      const rule_validation_result = validate_field_against_rules(
        field_value,
        field.validation_rules,
      );
      if (!rule_validation_result.is_valid) {
        errors[field.field_name] = rule_validation_result.error_message;
      }
    }
  }

  return {
    is_valid: Object.keys(errors).length === 0,
    errors,
  };
}

export interface FieldValidationResult {
  is_valid: boolean;
  error_message: string;
}

export function validate_field_against_rules(
  value: any,
  rules: ValidationRule[],
): FieldValidationResult {
  for (const rule of rules) {
    if (
      rule.rule_type === "min_length" &&
      typeof value === "string" &&
      value.length < rule.rule_value
    ) {
      return { is_valid: false, error_message: rule.error_message };
    }
    if (
      rule.rule_type === "max_length" &&
      typeof value === "string" &&
      value.length > rule.rule_value
    ) {
      return { is_valid: false, error_message: rule.error_message };
    }
    if (
      rule.rule_type === "min_value" &&
      typeof value === "number" &&
      value < rule.rule_value
    ) {
      return { is_valid: false, error_message: rule.error_message };
    }
    if (
      rule.rule_type === "max_value" &&
      typeof value === "number" &&
      value > rule.rule_value
    ) {
      return { is_valid: false, error_message: rule.error_message };
    }
    if (
      rule.rule_type === "pattern" &&
      typeof value === "string" &&
      !new RegExp(rule.rule_value).test(value)
    ) {
      return { is_valid: false, error_message: rule.error_message };
    }
  }
  return { is_valid: true, error_message: "" };
}

export function build_entity_display_label(entity: BaseEntity): string {
  const record = entity as unknown as Record<string, unknown>;

  const name = record["name"];
  if (typeof name === "string" && name.trim() !== "") return name;

  const first_name = record["first_name"];
  const last_name = record["last_name"];
  if (
    typeof first_name === "string" &&
    typeof last_name === "string" &&
    (first_name.trim() !== "" || last_name.trim() !== "")
  ) {
    return `${first_name} ${last_name}`.trim();
  }

  const title = record["title"];
  if (typeof title === "string" && title.trim() !== "") return title;

  const home_team_id = record["home_team_id"];
  const away_team_id = record["away_team_id"];
  if (typeof home_team_id === "string" && typeof away_team_id === "string") {
    const home_team_name = record["home_team_name"];
    const away_team_name = record["away_team_name"];
    if (
      typeof home_team_name === "string" &&
      typeof away_team_name === "string"
    ) {
      return `${home_team_name} vs ${away_team_name}`;
    }
    const scheduled_date = record["scheduled_date"];
    const round_name = record["round_name"];
    if (typeof scheduled_date === "string" && scheduled_date.trim() !== "") {
      return `Fixture (${scheduled_date})`;
    }
    if (typeof round_name === "string" && round_name.trim() !== "") {
      return `Fixture (${round_name})`;
    }
    return `Fixture: ${entity.id.slice(0, 8)}`;
  }

  return entity.id;
}

export function get_display_value_for_foreign_key(
  options: BaseEntity[],
  value: string,
): string {
  const normalized_value = String(value ?? "").trim();
  const found_option = options.find((option) => {
    const option_id = String((option as BaseEntity).id ?? "").trim();
    return option_id === normalized_value;
  });
  if (found_option) return build_entity_display_label(found_option);
  return normalized_value;
}

export function initialize_form_data_from_metadata(
  metadata: EntityMetadata,
  existing_data: Partial<BaseEntity> | null,
): Record<string, any> {
  const new_form_data: Record<string, any> = {};

  for (const field of metadata.fields) {
    if (
      existing_data &&
      existing_data[field.field_name as keyof BaseEntity] !== undefined
    ) {
      new_form_data[field.field_name] =
        existing_data[field.field_name as keyof BaseEntity];
    } else {
      new_form_data[field.field_name] = get_default_value_for_field_type(field);
    }
  }

  return new_form_data;
}
