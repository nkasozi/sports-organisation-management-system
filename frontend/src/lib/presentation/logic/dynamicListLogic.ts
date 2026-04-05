import type {
  BaseEntity,
  FieldMetadata,
  EntityMetadata,
} from "../../core/entities/BaseEntity";
import type { SubEntityFilter } from "../../core/types/SubEntityFilter";

export { get_display_value_for_entity_field } from "./listDisplayValueLogic";
export {
  build_filter_from_sub_entity_config,
  apply_filters_to_entities,
  sort_entities,
  apply_filters_and_sorting,
  clear_filter_state,
} from "./listFilterSortLogic";
export {
  check_if_all_entities_selected,
  check_if_some_entities_selected,
  determine_if_bulk_actions_available,
  toggle_select_all_entities,
  toggle_single_entity_selection,
  get_selected_entities_from_list,
} from "./listSelectionLogic";
export {
  type EntityAuthFilterResult,
  build_entity_authorization_filter,
  apply_id_filter_to_entities,
  merge_entity_list_filters,
} from "./listAuthorizationFilterLogic";

export function normalize_entity_type_for_filter(type: string): string {
  return type.toLowerCase().replace(/[\s_-]/g, "");
}
export { build_csv_content, build_csv_filename } from "./listCsvExportLogic";

export function extract_items_from_result_data(
  data:
    | BaseEntity[]
    | { items: BaseEntity[]; total_count: number }
    | null
    | undefined,
): BaseEntity[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (typeof data === "object" && "items" in data) return data.items;
  return [];
}

export function extract_total_count_from_result_data(
  data:
    | BaseEntity[]
    | { items: BaseEntity[]; total_count: number }
    | null
    | undefined,
): number {
  if (!data) return 0;
  if (Array.isArray(data)) return data.length;
  if (typeof data === "object" && "total_count" in data)
    return data.total_count;
  return 0;
}

export function extract_error_message_from_result(
  result:
    | { success: boolean; error?: string; error_message?: string }
    | null
    | undefined,
): string {
  if (!result) return "Unknown error";
  if (!result.success) {
    if ("error_message" in result && result.error_message)
      return result.error_message;
    if ("error" in result && result.error) return result.error;
  }
  return "Unknown error";
}

export function build_default_visible_column_names(
  fields: FieldMetadata[],
  max_columns: number,
): string[] {
  if (!fields || fields.length === 0) {
    return [];
  }

  const displayable_fields = fields.filter(
    (field: FieldMetadata) => field.field_type !== "sub_entity",
  );

  const explicitly_enabled_fields = displayable_fields.filter(
    (field: FieldMetadata) => field.show_in_list === true,
  );

  const preferred_fields =
    explicitly_enabled_fields.length > 0
      ? explicitly_enabled_fields
      : displayable_fields;

  const safe_max_columns = Math.max(0, max_columns);

  return preferred_fields
    .slice(0, safe_max_columns)
    .map((field: FieldMetadata) => field.field_name);
}

export function toggle_sort_direction(
  current_column: string,
  clicked_column: string,
  current_direction: "asc" | "desc",
): { sort_column: string; sort_direction: "asc" | "desc" } {
  if (current_column === clicked_column) {
    return {
      sort_column: clicked_column,
      sort_direction: current_direction === "asc" ? "desc" : "asc",
    };
  }
  return {
    sort_column: clicked_column,
    sort_direction: "asc",
  };
}

export function toggle_column_in_set(
  visible_columns: Set<string>,
  field_name: string,
): Set<string> {
  const new_columns = new Set(visible_columns);
  if (new_columns.has(field_name)) {
    new_columns.delete(field_name);
  } else {
    new_columns.add(field_name);
  }
  return new_columns;
}

export function create_new_entity_with_defaults(
  sub_entity_filter: SubEntityFilter | null | undefined,
): Partial<BaseEntity> {
  const new_entity: Record<string, unknown> = { id: "" };

  if (sub_entity_filter) {
    new_entity[sub_entity_filter.foreign_key_field] =
      sub_entity_filter.foreign_key_value;

    if (
      sub_entity_filter.holder_type_field &&
      sub_entity_filter.holder_type_value
    ) {
      new_entity[sub_entity_filter.holder_type_field] =
        sub_entity_filter.holder_type_value;
    }
  }

  return new_entity as Partial<BaseEntity>;
}

export function remove_entities_by_ids(
  entities: BaseEntity[],
  ids_to_remove: string[],
): BaseEntity[] {
  if (!entities || entities.length === 0) {
    return [];
  }
  if (!ids_to_remove || ids_to_remove.length === 0) {
    return [...entities];
  }
  const ids_set = new Set(ids_to_remove);
  return entities.filter((entity) => !ids_set.has(entity.id));
}

export function build_display_name_from_metadata(
  entity_metadata: EntityMetadata | null | undefined,
  entity_type: string,
): string {
  if (
    entity_metadata &&
    typeof entity_metadata.display_name === "string" &&
    entity_metadata.display_name.length > 0
  ) {
    return entity_metadata.display_name;
  }

  if (typeof entity_type === "string" && entity_type.length > 0) {
    return entity_type;
  }

  return "Entity";
}

export function get_column_responsive_class(column_index: number): string {
  if (column_index === 0) return "";
  if (column_index === 1) return "hidden sm:table-cell";
  if (column_index === 2) return "hidden md:table-cell";
  return "hidden lg:table-cell";
}

export function build_full_name_from_entity(
  entity: Record<string, unknown>,
): string {
  const first_name = entity.first_name;
  const last_name = entity.last_name;
  if (typeof first_name === "string" || typeof last_name === "string") {
    return [first_name, last_name]
      .filter(
        (part) =>
          typeof part === "string" && (part as string).trim().length > 0,
      )
      .join(" ")
      .trim();
  }
  return "";
}
