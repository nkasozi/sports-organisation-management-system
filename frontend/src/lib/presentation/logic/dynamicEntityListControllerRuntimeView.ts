import { get, type Writable } from "svelte/store";

import type { BaseEntity } from "$lib/core/entities/BaseEntity";
import { get_dynamic_entity_list_field_metadata_by_name } from "$lib/presentation/logic/dynamicEntityListControllerFields";
import {
  export_dynamic_entity_list_to_csv,
  get_dynamic_entity_list_cleared_filter_state,
  get_dynamic_entity_list_selected_entities,
  get_dynamic_entity_list_sort_state,
  get_dynamic_entity_list_toggle_all_selection,
  get_dynamic_entity_list_toggle_single_selection,
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

export function create_dynamic_entity_list_controller_view_actions(command: {
  get_options: () => DynamicEntityListControllerOptions;
  set_state: (updates: Partial<DynamicEntityListViewState>) => void;
  state_store: Writable<DynamicEntityListViewState>;
}): {
  clear_all_selections: () => void;
  dismiss_cached_columns: () => void;
  export_to_csv: () => void;
  get_current_selected_entities: () => BaseEntity[];
  get_field_metadata_by_name: (
    field_name: string,
  ) => ReturnType<typeof get_dynamic_entity_list_field_metadata_by_name>;
  get_selected_entity_count: () => number;
  reset_filters: () => void;
  set_filter_value: (field_name: string, value: string) => void;
  set_page: (page: number) => void;
  set_page_size: (size: number) => void;
  toggle_advanced_filter: () => void;
  toggle_all_entity_selection: () => void;
  toggle_column_selector: () => void;
  toggle_column_visibility: (field_name: string) => Promise<void>;
  toggle_export_modal: () => void;
  toggle_single_selection: (entity_id: string) => void;
  toggle_sort_by_column: (column: string) => void;
} {
  return {
    clear_all_selections: () => {
      command.set_state({ selected_entity_ids: new Set<string>() });
      command.get_options().on_selection_changed?.([]);
    },
    dismiss_cached_columns: () =>
      command.set_state({ columns_restored_from_cache: false }),
    export_to_csv: () => {
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
    },
    get_current_selected_entities: (): BaseEntity[] =>
      get_dynamic_entity_list_selected_entities(
        get(command.state_store).entities,
        get(command.state_store).selected_entity_ids,
      ),
    get_field_metadata_by_name: (field_name: string) =>
      get_dynamic_entity_list_field_metadata_by_name(
        get(command.state_store).entity_metadata,
        field_name,
      ),
    get_selected_entity_count: (): number =>
      get(command.state_store).selected_entity_ids.size,
    reset_filters: () => {
      const cleared_state = get_dynamic_entity_list_cleared_filter_state();
      command.set_state({
        current_page: 1,
        filter_values: cleared_state.filter_values,
        sort_column: cleared_state.sort_column,
        sort_direction: cleared_state.sort_direction,
      });
    },
    set_filter_value: (field_name: string, value: string) =>
      command.set_state({
        current_page: 1,
        filter_values: {
          ...get(command.state_store).filter_values,
          [field_name]: value,
        },
      }),
    set_page: (page: number) => command.set_state({ current_page: page }),
    set_page_size: (size: number) =>
      command.set_state({ current_page: 1, items_per_page: size }),
    toggle_advanced_filter: () =>
      command.set_state({
        show_advanced_filter: !get(command.state_store).show_advanced_filter,
      }),
    toggle_all_entity_selection: () => {
      const current_state = get(command.state_store);
      const selected_entity_ids = get_dynamic_entity_list_toggle_all_selection(
        current_state.filtered_entities,
        current_state.all_selected,
      );
      command.set_state({ selected_entity_ids });
      command
        .get_options()
        .on_selection_changed?.(
          get_dynamic_entity_list_selected_entities(
            current_state.entities,
            selected_entity_ids,
          ),
        );
    },
    toggle_column_selector: () =>
      command.set_state({
        show_column_selector: !get(command.state_store).show_column_selector,
      }),
    toggle_column_visibility: async (field_name: string): Promise<void> => {
      command.set_state({
        visible_columns: await toggle_dynamic_entity_list_column_visibility({
          entity_type: command.get_options().entity_type,
          field_name,
          sub_entity_filter: command.get_options().sub_entity_filter,
          visible_columns: get(command.state_store).visible_columns,
        }),
      });
    },
    toggle_export_modal: () =>
      command.set_state({
        show_export_modal: !get(command.state_store).show_export_modal,
      }),
    toggle_single_selection: (entity_id: string) => {
      const current_state = get(command.state_store);
      const selected_entity_ids =
        get_dynamic_entity_list_toggle_single_selection(
          current_state.selected_entity_ids,
          entity_id,
        );
      command.set_state({ selected_entity_ids });
      command
        .get_options()
        .on_selection_changed?.(
          get_dynamic_entity_list_selected_entities(
            current_state.entities,
            selected_entity_ids,
          ),
        );
    },
    toggle_sort_by_column: (column: string) => {
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
    },
  };
}
