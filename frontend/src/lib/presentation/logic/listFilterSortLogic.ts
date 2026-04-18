import type {
  BaseEntity,
  EntityMetadata,
  FieldMetadata,
} from "../../core/entities/BaseEntity";
import type { SubEntityFilter } from "../../core/types/SubEntityFilter";
import { get_display_value_for_entity_field } from "./listDisplayValueLogic";

export function build_filter_from_sub_entity_config(
  filter_config?: SubEntityFilter,
): Record<string, string> | undefined {
  if (!filter_config) return;
  const filter: Record<string, string> = {};
  filter[filter_config.foreign_key_field] = filter_config.foreign_key_value;
  if (filter_config.holder_type_field && filter_config.holder_type_value) {
    filter[filter_config.holder_type_field] = filter_config.holder_type_value;
  }
  return filter;
}

export function apply_filters_to_entities(
  entity_list: BaseEntity[],
  filters: Record<string, string>,
  entity_metadata: EntityMetadata | undefined,
  foreign_key_options: Record<string, BaseEntity[]>,
): BaseEntity[] {
  if (!entity_list || entity_list.length === 0) return [];
  if (!filters) return [...entity_list];
  const active_filters = Object.entries(filters).filter(
    ([_, value]) => value && value.trim() !== "",
  );
  if (active_filters.length === 0) return [...entity_list];

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
      }
      const entity_value = get_display_value_for_entity_field(
        entity,
        field,
        foreign_key_options,
      ).toLowerCase();
      return entity_value.includes(filter_value.toLowerCase());
    });
  });
}

export function sort_entities(
  entity_list: BaseEntity[],
  sort_column: string,
  sort_direction: "asc" | "desc",
  foreign_key_options: Record<string, BaseEntity[]>,
): BaseEntity[] {
  if (!entity_list || entity_list.length === 0) return [];
  if (!sort_column) return [...entity_list];
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
    const comparison = a_value.localeCompare(b_value, "en", {
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
  entity_metadata: EntityMetadata | undefined,
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

export function clear_filter_state(): {
  filter_values: Record<string, string>;
  sort_column: string;
  sort_direction: "asc" | "desc";
} {
  return { filter_values: {}, sort_column: "", sort_direction: "asc" };
}
