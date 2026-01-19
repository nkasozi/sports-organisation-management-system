import type {
  BaseEntity,
  FieldMetadata,
  EntityMetadata,
} from "../../core/entities/BaseEntity";
import type { SubEntityFilter } from "../../core/types/SubEntityFilter";

export function extract_items_from_result_data(
  data:
    | BaseEntity[]
    | { items: BaseEntity[]; total_count: number }
    | null
    | undefined,
): BaseEntity[] {
  if (!data) {
    return [];
  }
  if (Array.isArray(data)) {
    return data;
  }
  if (typeof data === "object" && "items" in data) {
    return data.items;
  }
  return [];
}

export function extract_total_count_from_result_data(
  data:
    | BaseEntity[]
    | { items: BaseEntity[]; total_count: number }
    | null
    | undefined,
): number {
  if (!data) {
    return 0;
  }
  if (Array.isArray(data)) {
    return data.length;
  }
  if (typeof data === "object" && "total_count" in data) {
    return data.total_count;
  }
  return 0;
}

export function extract_error_message_from_result(
  result:
    | { success: boolean; error?: string; error_message?: string }
    | null
    | undefined,
): string {
  if (!result) {
    return "Unknown error";
  }
  if (!result.success) {
    if ("error_message" in result && result.error_message) {
      return result.error_message;
    }
    if ("error" in result && result.error) {
      return result.error;
    }
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

export function check_if_all_entities_selected(
  entity_list: BaseEntity[],
  selected_ids: Set<string>,
): boolean {
  if (!entity_list || entity_list.length === 0) {
    return false;
  }
  if (!selected_ids || selected_ids.size === 0) {
    return false;
  }
  return entity_list.every((entity) => selected_ids.has(entity.id));
}

export function check_if_some_entities_selected(
  selected_ids: Set<string> | null | undefined,
): boolean {
  if (!selected_ids) {
    return false;
  }
  return selected_ids.size > 0;
}

export function determine_if_bulk_actions_available(
  has_selection: boolean,
  actions_enabled: boolean,
): boolean {
  return has_selection && actions_enabled;
}

export function build_filter_from_sub_entity_config(
  filter_config: SubEntityFilter | null | undefined,
): Record<string, string> | undefined {
  if (!filter_config) {
    return undefined;
  }

  const filter: Record<string, string> = {};
  filter[filter_config.foreign_key_field] = filter_config.foreign_key_value;

  if (filter_config.holder_type_field && filter_config.holder_type_value) {
    filter[filter_config.holder_type_field] = filter_config.holder_type_value;
  }

  return filter;
}

export function get_display_value_for_entity_field(
  entity: BaseEntity,
  field_name: string,
  foreign_key_options: Record<string, BaseEntity[]>,
): string {
  if (!entity || !field_name) {
    return "";
  }

  const raw_value = (entity as unknown as Record<string, unknown>)[field_name];

  if (raw_value === null || raw_value === undefined) {
    return "";
  }

  if (foreign_key_options && field_name in foreign_key_options) {
    const options = foreign_key_options[field_name];
    const matched_option = options.find((option) => option.id === raw_value);
    if (matched_option) {
      return (
        ((matched_option as unknown as Record<string, unknown>)[
          "name"
        ] as string) || String(raw_value)
      );
    }
  }

  if (typeof raw_value === "boolean") {
    return raw_value ? "Yes" : "No";
  }

  if (raw_value instanceof Date) {
    return raw_value.toLocaleDateString();
  }

  return String(raw_value);
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

export function apply_filters_to_entities(
  entity_list: BaseEntity[],
  filters: Record<string, string>,
  entity_metadata: EntityMetadata | null | undefined,
  foreign_key_options: Record<string, BaseEntity[]>,
): BaseEntity[] {
  if (!entity_list || entity_list.length === 0) {
    return [];
  }

  if (!filters) {
    return [...entity_list];
  }

  const active_filters = Object.entries(filters).filter(
    ([_, value]) => value && value.trim() !== "",
  );

  if (active_filters.length === 0) {
    return [...entity_list];
  }

  return entity_list.filter((entity) => {
    return active_filters.every(([field, filter_value]) => {
      const field_meta = entity_metadata?.fields.find(
        (f: FieldMetadata) => f.field_name === field,
      );

      if (
        field_meta &&
        field_meta.field_type === "foreign_key" &&
        field_meta.foreign_key_entity
      ) {
        if (!filter_value) return true;
        const raw_value = (entity as unknown as Record<string, unknown>)[field];
        return String(raw_value ?? "") === filter_value;
      } else {
        const entity_value = get_display_value_for_entity_field(
          entity,
          field,
          foreign_key_options,
        ).toLowerCase();
        return entity_value.includes(filter_value.toLowerCase());
      }
    });
  });
}

export function sort_entities(
  entity_list: BaseEntity[],
  sort_column: string,
  sort_direction: "asc" | "desc",
  foreign_key_options: Record<string, BaseEntity[]>,
): BaseEntity[] {
  if (!entity_list || entity_list.length === 0) {
    return [];
  }

  if (!sort_column) {
    return [...entity_list];
  }

  const sorted = [...entity_list];

  sorted.sort((a, b) => {
    const a_value = get_display_value_for_entity_field(
      a,
      sort_column,
      foreign_key_options,
    );
    const b_value = get_display_value_for_entity_field(
      b,
      sort_column,
      foreign_key_options,
    );

    const comparison = a_value.localeCompare(b_value, undefined, {
      numeric: true,
    });

    return sort_direction === "asc" ? comparison : -comparison;
  });

  return sorted;
}

export function apply_filters_and_sorting(
  entity_list: BaseEntity[],
  filters: Record<string, string>,
  sort_column: string,
  sort_direction: "asc" | "desc",
  entity_metadata: EntityMetadata | null | undefined,
  foreign_key_options: Record<string, BaseEntity[]>,
): BaseEntity[] {
  const filtered = apply_filters_to_entities(
    entity_list,
    filters,
    entity_metadata,
    foreign_key_options,
  );

  return sort_entities(
    filtered,
    sort_column,
    sort_direction,
    foreign_key_options,
  );
}

export function build_csv_content(
  entities: BaseEntity[],
  visible_column_list: string[],
  entity_metadata: EntityMetadata | null | undefined,
  foreign_key_options: Record<string, BaseEntity[]>,
): string {
  if (!entities || entities.length === 0) {
    return "";
  }

  if (!visible_column_list || visible_column_list.length === 0) {
    return "";
  }

  const headers = visible_column_list.map((field_name) => {
    const field = entity_metadata?.fields.find(
      (f: FieldMetadata) => f.field_name === field_name,
    );
    return field?.display_name || field_name;
  });

  const csv_rows = [headers.join(",")];

  entities.forEach((entity) => {
    const row = visible_column_list.map((field_name) => {
      const value = get_display_value_for_entity_field(
        entity,
        field_name,
        foreign_key_options,
      );
      return `"${value.replace(/"/g, '""')}"`;
    });
    csv_rows.push(row.join(","));
  });

  return csv_rows.join("\n");
}

export function build_csv_filename(
  entity_type: string,
  export_date: Date,
): string {
  const date_string = export_date.toISOString().split("T")[0];
  return `${entity_type}_export_${date_string}.csv`;
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

export function get_selected_entities_from_list(
  entities: BaseEntity[],
  selected_ids: Set<string>,
): BaseEntity[] {
  if (!entities || entities.length === 0) {
    return [];
  }
  if (!selected_ids || selected_ids.size === 0) {
    return [];
  }
  return entities.filter((entity) => selected_ids.has(entity.id));
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

export function clear_filter_state(): {
  filter_values: Record<string, string>;
  sort_column: string;
  sort_direction: "asc" | "desc";
} {
  return {
    filter_values: {},
    sort_column: "",
    sort_direction: "asc",
  };
}

export function toggle_select_all_entities(
  entities: BaseEntity[],
  currently_all_selected: boolean,
): Set<string> {
  if (currently_all_selected) {
    return new Set<string>();
  }
  return new Set(entities.map((entity) => entity.id));
}

export function toggle_single_entity_selection(
  selected_ids: Set<string>,
  entity_id: string,
): Set<string> {
  const new_selected = new Set(selected_ids);
  if (new_selected.has(entity_id)) {
    new_selected.delete(entity_id);
  } else {
    new_selected.add(entity_id);
  }
  return new_selected;
}
