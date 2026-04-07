import { get, type Writable, writable } from "svelte/store";

import type { BaseEntity } from "$lib/core/entities/BaseEntity";
import type { UserScopeProfile } from "$lib/core/interfaces/ports";
import { ensure_auth_profile } from "$lib/presentation/logic/authGuard";
import {
  confirm_dynamic_entity_list_deletion,
  get_dynamic_entity_list_bulk_delete_state,
  get_dynamic_entity_list_create_state,
  get_dynamic_entity_list_edit_state,
  get_dynamic_entity_list_inline_cancel_state,
  get_dynamic_entity_list_single_delete_state,
} from "$lib/presentation/logic/dynamicEntityListControllerCrud";
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
import { build_dynamic_entity_list_view_state } from "$lib/presentation/logic/dynamicEntityListControllerStateBuilder";
import type {
  DynamicEntityListControllerOptions,
  DynamicEntityListViewState,
} from "$lib/presentation/logic/dynamicEntityListControllerTypes";
import {
  load_dynamic_entity_list_columns,
  load_dynamic_entity_list_entities,
  load_dynamic_entity_list_filter_options,
} from "$lib/presentation/logic/dynamicEntityListData";
import { auth_store } from "$lib/presentation/stores/auth";

export function create_dynamic_entity_list_controller_runtime(
  initial_options: DynamicEntityListControllerOptions,
): {
  clear_all_selections: () => void;
  close_bulk_import: () => Promise<void>;
  confirm_deletion_action: () => Promise<void>;
  dismiss_cached_columns: () => void;
  get_current_selected_entities: () => BaseEntity[];
  get_field_metadata_by_name: (
    field_name: string,
  ) => ReturnType<typeof get_dynamic_entity_list_field_metadata_by_name>;
  get_selected_entity_count: () => number;
  handle_create_new_entity: () => boolean;
  handle_delete_multiple_entities: () => boolean;
  handle_delete_single_entity: (entity: BaseEntity) => boolean;
  handle_edit_entity: (entity: BaseEntity) => boolean;
  handle_inline_form_cancel: () => boolean;
  handle_inline_form_save: (
    event: CustomEvent<{ entity: BaseEntity }>,
  ) => Promise<boolean>;
  initialize: () => Promise<void>;
  load_all_entities_for_display: () => Promise<void>;
  open_bulk_import: () => void;
  set_filter_value: (field_name: string, value: string) => void;
  set_page: (page: number) => void;
  set_page_size: (size: number) => void;
  state_store: Writable<DynamicEntityListViewState>;
  toggle_advanced_filter: () => void;
  toggle_all_entity_selection: () => void;
  toggle_column_selector: () => void;
  toggle_column_visibility: (field_name: string) => Promise<void>;
  toggle_export_modal: () => void;
  toggle_single_selection: (entity_id: string) => void;
  toggle_sort_by_column: (column: string) => void;
  update_options: (next_options: DynamicEntityListControllerOptions) => void;
  reset_filters: () => void;
  export_to_csv: () => void;
  cancel_deletion: () => void;
} {
  let current_options = initial_options;
  const state_store = writable(
    build_dynamic_entity_list_view_state(current_options, {}),
  );
  const set_state = (updates: Partial<DynamicEntityListViewState>): void =>
    state_store.update((state) =>
      build_dynamic_entity_list_view_state(current_options, {
        ...state,
        ...updates,
      }),
    );
  const load_all_entities_for_display = async (): Promise<void> => {
    set_state({ error_message: "", is_loading: true });
    const current_state = get(state_store);
    const auth_state = get(auth_store);
    const result = await load_dynamic_entity_list_entities({
      crud_handlers: current_options.crud_handlers,
      current_profile: auth_state.current_profile as UserScopeProfile | null,
      display_name: current_state.display_name,
      entity_metadata: current_state.entity_metadata,
      entity_type: current_options.entity_type,
      raw_token: auth_state.current_token?.raw_token ?? null,
      sub_entity_filter: current_options.sub_entity_filter,
    });
    set_state({
      current_page: 1,
      entities: result.entities,
      error_message: result.error_message,
      is_loading: false,
    });
    current_options.on_total_count_changed?.(result.entities.length);
  };
  return {
    cancel_deletion: () =>
      set_state({ entities_to_delete: [], show_delete_confirmation: false }),
    clear_all_selections: () => {
      set_state({ selected_entity_ids: new Set<string>() });
      current_options.on_selection_changed?.([]);
    },
    close_bulk_import: async () => {
      set_state({ show_bulk_import_modal: false });
      await load_all_entities_for_display();
    },
    confirm_deletion_action: async () => {
      const current_state = get(state_store);
      if (current_state.entities_to_delete.length === 0) return;
      set_state({ is_deleting: true });
      const result = await confirm_dynamic_entity_list_deletion({
        crud_handlers: current_options.crud_handlers,
        entities: current_state.entities,
        entities_to_delete: current_state.entities_to_delete,
        entity_type: current_options.entity_type,
      });
      if (result.success && result.deleted_entities.length === 1)
        current_options.view_callbacks?.on_delete_completed?.(
          result.deleted_entities[0],
        );
      if (result.success && result.deleted_entities.length > 1)
        current_options.on_entities_batch_deleted?.(result.deleted_entities);
      set_state({
        current_page: 1,
        entities: result.entities,
        entities_to_delete: [],
        error_message: result.error_message,
        is_deleting: false,
        selected_entity_ids: new Set<string>(),
        show_delete_confirmation: false,
      });
    },
    dismiss_cached_columns: () =>
      set_state({ columns_restored_from_cache: false }),
    export_to_csv: () => {
      const current_state = get(state_store);
      export_dynamic_entity_list_to_csv(
        current_state.filtered_entities,
        current_state.visible_column_list,
        current_state.entity_metadata,
        current_state.entity_type,
        current_state.foreign_key_options,
      );
      set_state({ show_export_modal: false });
    },
    get_current_selected_entities: () =>
      get_dynamic_entity_list_selected_entities(
        get(state_store).entities,
        get(state_store).selected_entity_ids,
      ),
    get_field_metadata_by_name: (field_name: string) =>
      get_dynamic_entity_list_field_metadata_by_name(
        get(state_store).entity_metadata,
        field_name,
      ),
    get_selected_entity_count: () => get(state_store).selected_entity_ids.size,
    handle_create_new_entity: () => {
      const create_state = get_dynamic_entity_list_create_state(
        current_options.sub_entity_filter,
        current_options.view_callbacks,
      );
      set_state({
        inline_form_entity: create_state.inline_form_entity,
        is_inline_form_visible: create_state.show_inline_form,
      });
      return true;
    },
    handle_delete_multiple_entities: () => {
      const current_state = get(state_store);
      set_state({
        entities_to_delete: get_dynamic_entity_list_bulk_delete_state(
          current_state.entities,
          current_state.selected_entity_ids,
        ),
        show_delete_confirmation: true,
      });
      return true;
    },
    handle_delete_single_entity: (entity: BaseEntity) => {
      set_state({
        entities_to_delete: get_dynamic_entity_list_single_delete_state(entity),
        show_delete_confirmation: true,
      });
      return true;
    },
    handle_edit_entity: (entity: BaseEntity) => {
      const edit_state = get_dynamic_entity_list_edit_state(
        entity,
        current_options.sub_entity_filter,
        current_options.view_callbacks,
      );
      set_state({
        inline_form_entity: edit_state.inline_form_entity,
        is_inline_form_visible: edit_state.show_inline_form,
      });
      return true;
    },
    handle_inline_form_cancel: () => {
      const cancel_state = get_dynamic_entity_list_inline_cancel_state();
      set_state({
        inline_form_entity: cancel_state.inline_form_entity,
        is_inline_form_visible: cancel_state.show_inline_form,
      });
      return true;
    },
    handle_inline_form_save: async (
      event: CustomEvent<{ entity: BaseEntity }>,
    ) => {
      void event.detail.entity;
      const cancel_state = get_dynamic_entity_list_inline_cancel_state();
      set_state({
        inline_form_entity: cancel_state.inline_form_entity,
        is_inline_form_visible: cancel_state.show_inline_form,
      });
      await load_all_entities_for_display();
      return true;
    },
    initialize: async () => {
      const current_state = get(state_store);
      if (!current_state.entity_metadata) return;
      const column_state = await load_dynamic_entity_list_columns({
        entity_metadata: current_state.entity_metadata,
        entity_type: current_options.entity_type,
        sub_entity_filter: current_options.sub_entity_filter,
      });
      set_state({
        columns_restored_from_cache: column_state.columns_restored_from_cache,
        visible_columns: column_state.visible_columns,
      });
      const auth_result = await ensure_auth_profile();
      if (!auth_result.success) {
        set_state({ error_message: auth_result.error_message });
        return;
      }
      await load_all_entities_for_display();
      set_state({
        foreign_key_options: await load_dynamic_entity_list_filter_options(
          current_state.entity_metadata.fields,
        ),
      });
    },
    load_all_entities_for_display,
    open_bulk_import: () => set_state({ show_bulk_import_modal: true }),
    reset_filters: () => {
      const cleared_state = get_dynamic_entity_list_cleared_filter_state();
      set_state({
        current_page: 1,
        filter_values: cleared_state.filter_values,
        sort_column: cleared_state.sort_column,
        sort_direction: cleared_state.sort_direction,
      });
    },
    set_filter_value: (field_name: string, value: string) =>
      set_state({
        current_page: 1,
        filter_values: {
          ...get(state_store).filter_values,
          [field_name]: value,
        },
      }),
    set_page: (page: number) => set_state({ current_page: page }),
    set_page_size: (size: number) =>
      set_state({ current_page: 1, items_per_page: size }),
    state_store,
    toggle_advanced_filter: () =>
      set_state({
        show_advanced_filter: !get(state_store).show_advanced_filter,
      }),
    toggle_all_entity_selection: () => {
      const current_state = get(state_store);
      const selected_entity_ids = get_dynamic_entity_list_toggle_all_selection(
        current_state.filtered_entities,
        current_state.all_selected,
      );
      set_state({ selected_entity_ids });
      current_options.on_selection_changed?.(
        get_dynamic_entity_list_selected_entities(
          current_state.entities,
          selected_entity_ids,
        ),
      );
    },
    toggle_column_selector: () =>
      set_state({
        show_column_selector: !get(state_store).show_column_selector,
      }),
    toggle_column_visibility: async (field_name: string) =>
      set_state({
        visible_columns: await toggle_dynamic_entity_list_column_visibility({
          entity_type: current_options.entity_type,
          field_name,
          sub_entity_filter: current_options.sub_entity_filter,
          visible_columns: get(state_store).visible_columns,
        }),
      }),
    toggle_export_modal: () =>
      set_state({ show_export_modal: !get(state_store).show_export_modal }),
    toggle_single_selection: (entity_id: string) => {
      const current_state = get(state_store);
      const selected_entity_ids =
        get_dynamic_entity_list_toggle_single_selection(
          current_state.selected_entity_ids,
          entity_id,
        );
      set_state({ selected_entity_ids });
      current_options.on_selection_changed?.(
        get_dynamic_entity_list_selected_entities(
          current_state.entities,
          selected_entity_ids,
        ),
      );
    },
    toggle_sort_by_column: (column: string) => {
      const sort_state = get_dynamic_entity_list_sort_state(
        get(state_store).sort_column,
        column,
        get(state_store).sort_direction,
      );
      set_state({
        current_page: 1,
        sort_column: sort_state.sort_column,
        sort_direction: sort_state.sort_direction,
      });
    },
    update_options: (next_options: DynamicEntityListControllerOptions) => {
      current_options = next_options;
      state_store.update((state) =>
        build_dynamic_entity_list_view_state(current_options, state),
      );
    },
  };
}
