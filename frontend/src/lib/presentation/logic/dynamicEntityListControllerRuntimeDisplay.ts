import { get, type Writable } from "svelte/store";

import { get_dynamic_entity_list_field_metadata_by_name } from "$lib/presentation/logic/dynamicEntityListControllerFields";
import {
  export_dynamic_entity_list_to_csv,
  get_dynamic_entity_list_cleared_filter_state,
  get_dynamic_entity_list_sort_state,
  toggle_dynamic_entity_list_column_visibility,
} from "$lib/presentation/logic/dynamicEntityListControllerInteractions";
import type {
  DynamicEntityListControllerOptions,
  DynamicEntityListViewState,
} from "$lib/presentation/logic/dynamicEntityListControllerTypes";
import {
  create_missing_csv_metadata_state,
  create_present_csv_metadata_state,
} from "$lib/presentation/logic/listCsvExportLogic";

export type DynamicEntityListViewCommand = {
  get_options: () => DynamicEntityListControllerOptions;
  set_state: (updates: Partial<DynamicEntityListViewState>) => void;
  state_store: Writable<DynamicEntityListViewState>;
};

type DynamicEntityListDisplayActions = {
  dismiss_cached_columns: () => void;
  export_to_csv: () => void;
  get_field_metadata_by_name: (
    field_name: string,
  ) => ReturnType<typeof get_dynamic_entity_list_field_metadata_by_name>;
  reset_filters: () => void;
  set_filter_value: (field_name: string, value: string) => void;
  set_page: (page: number) => void;
  set_page_size: (size: number) => void;
  toggle_advanced_filter: () => void;
  toggle_column_selector: () => void;
  toggle_column_visibility: (field_name: string) => Promise<void>;
  toggle_export_modal: () => void;
  toggle_sort_by_column: (column: string) => void;
};

type DynamicEntityListToggleKey =
  | "show_advanced_filter"
  | "show_column_selector"
  | "show_export_modal";

function toggle_dynamic_entity_list_flag(
  command: DynamicEntityListViewCommand,
  key: DynamicEntityListToggleKey,
): void {
  command.set_state({ [key]: !get(command.state_store)[key] });
}

function export_dynamic_entity_list_csv(
  command: DynamicEntityListViewCommand,
): void {
  const current_state = get(command.state_store);
  const metadata_state = current_state.entity_metadata
    ? create_present_csv_metadata_state(current_state.entity_metadata)
    : create_missing_csv_metadata_state();
  export_dynamic_entity_list_to_csv(
    current_state.filtered_entities,
    current_state.visible_column_list,
    metadata_state,
    current_state.entity_type,
    current_state.foreign_key_options,
  );
  command.set_state({ show_export_modal: false });
}

function reset_dynamic_entity_list_filters(
  command: DynamicEntityListViewCommand,
): void {
  const cleared_state = get_dynamic_entity_list_cleared_filter_state();
  command.set_state({
    current_page: 1,
    filter_values: cleared_state.filter_values,
    sort_column: cleared_state.sort_column,
    sort_direction: cleared_state.sort_direction,
  });
}

async function toggle_dynamic_entity_list_column(
  command: DynamicEntityListViewCommand,
  field_name: string,
): Promise<void> {
  command.set_state({
    visible_columns: await toggle_dynamic_entity_list_column_visibility({
      entity_type: command.get_options().entity_type,
      field_name,
      sub_entity_filter: command.get_options().sub_entity_filter,
      visible_columns: get(command.state_store).visible_columns,
    }),
  });
}

function toggle_dynamic_entity_list_sort(
  command: DynamicEntityListViewCommand,
  column: string,
): void {
  const sort_state = get_dynamic_entity_list_sort_state(
    get(command.state_store).sort_column,
    column,
    get(command.state_store).sort_direction,
  );
  command.set_state({
    current_page: 1,
    sort_column: sort_state.sort_column,
    sort_direction: sort_state.sort_direction,
  });
}

export function create_dynamic_entity_list_display_actions(
  command: DynamicEntityListViewCommand,
): DynamicEntityListDisplayActions {
  return {
    dismiss_cached_columns: (): void =>
      command.set_state({ columns_restored_from_cache: false }),
    export_to_csv: (): void => export_dynamic_entity_list_csv(command),
    get_field_metadata_by_name: (field_name: string) =>
      get_dynamic_entity_list_field_metadata_by_name(
        get(command.state_store).entity_metadata,
        field_name,
      ),
    reset_filters: (): void => reset_dynamic_entity_list_filters(command),
    set_filter_value: (field_name: string, value: string): void =>
      command.set_state({
        current_page: 1,
        filter_values: {
          ...get(command.state_store).filter_values,
          [field_name]: value,
        },
      }),
    set_page: (page: number): void => command.set_state({ current_page: page }),
    set_page_size: (size: number): void =>
      command.set_state({ current_page: 1, items_per_page: size }),
    toggle_advanced_filter: (): void =>
      toggle_dynamic_entity_list_flag(command, "show_advanced_filter"),
    toggle_column_selector: (): void =>
      toggle_dynamic_entity_list_flag(command, "show_column_selector"),
    toggle_column_visibility: (field_name: string): Promise<void> =>
      toggle_dynamic_entity_list_column(command, field_name),
    toggle_export_modal: (): void =>
      toggle_dynamic_entity_list_flag(command, "show_export_modal"),
    toggle_sort_by_column: (column: string): void =>
      toggle_dynamic_entity_list_sort(command, column),
  };
}
