import type { BaseEntity, EntityMetadata } from "$lib/core/entities/BaseEntity";
import type { SubEntityFilter } from "$lib/core/types/SubEntityFilter";
import { save_column_preferences } from "$lib/presentation/logic/columnPreferences";
import {
  build_csv_content,
  build_csv_filename,
  clear_filter_state,
  get_selected_entities_from_list,
  toggle_column_in_set,
  toggle_select_all_entities,
  toggle_single_entity_selection,
  toggle_sort_direction,
} from "$lib/presentation/logic/dynamicListLogic";

interface DynamicEntityListColumnToggleCommand {
  entity_type: string;
  field_name: string;
  sub_entity_filter: SubEntityFilter | null;
  visible_columns: Set<string>;
}

export function get_dynamic_entity_list_sort_state(
  current_sort_column: string,
  next_sort_column: string,
  current_sort_direction: "asc" | "desc",
): {
  sort_column: string;
  sort_direction: "asc" | "desc";
} {
  return toggle_sort_direction(
    current_sort_column,
    next_sort_column,
    current_sort_direction,
  );
}

export async function toggle_dynamic_entity_list_column_visibility(
  command: DynamicEntityListColumnToggleCommand,
): Promise<Set<string>> {
  const next_visible_columns = toggle_column_in_set(
    command.visible_columns,
    command.field_name,
  );
  await save_column_preferences(
    command.entity_type,
    command.sub_entity_filter,
    next_visible_columns,
  );
  return next_visible_columns;
}

export function export_dynamic_entity_list_to_csv(
  entities: BaseEntity[],
  visible_column_list: string[],
  entity_metadata: EntityMetadata | null,
  entity_type: string,
  foreign_key_options: Record<string, BaseEntity[]>,
): void {
  const csv_blob = new Blob(
    [
      build_csv_content(
        entities,
        visible_column_list,
        entity_metadata,
        foreign_key_options,
      ),
    ],
    { type: "text/csv;charset=utf-8;" },
  );
  const download_link = document.createElement("a");
  download_link.setAttribute("href", URL.createObjectURL(csv_blob));
  download_link.setAttribute(
    "download",
    build_csv_filename(entity_type, new Date()),
  );
  document.body.appendChild(download_link);
  download_link.click();
  document.body.removeChild(download_link);
}

export function get_dynamic_entity_list_cleared_filter_state(): {
  filter_values: Record<string, string>;
  sort_column: string;
  sort_direction: "asc" | "desc";
} {
  return clear_filter_state();
}

export function get_dynamic_entity_list_selected_entities(
  entities: BaseEntity[],
  selected_entity_ids: Set<string>,
): BaseEntity[] {
  return get_selected_entities_from_list(entities, selected_entity_ids);
}

export function get_dynamic_entity_list_toggle_all_selection(
  entities: BaseEntity[],
  all_selected: boolean,
): Set<string> {
  return toggle_select_all_entities(entities, all_selected);
}

export function get_dynamic_entity_list_toggle_single_selection(
  selected_entity_ids: Set<string>,
  entity_id: string,
): Set<string> {
  return toggle_single_entity_selection(selected_entity_ids, entity_id);
}
