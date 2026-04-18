import { get, type Writable, writable } from "svelte/store";

import type { BaseEntity } from "$lib/core/entities/BaseEntity";
import type { UserScopeProfile } from "$lib/core/interfaces/ports";
import { ensure_auth_profile } from "$lib/presentation/logic/authGuard";
import { get_dynamic_entity_list_field_metadata_by_name } from "$lib/presentation/logic/dynamicEntityListControllerFields";
import { create_dynamic_entity_list_controller_crud_actions } from "$lib/presentation/logic/dynamicEntityListControllerRuntimeCrud";
import { create_dynamic_entity_list_controller_view_actions } from "$lib/presentation/logic/dynamicEntityListControllerRuntimeView";
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
import type { ListAuthorizationProfileState } from "$lib/presentation/logic/listAuthorizationFilterLogic";
import { auth_store } from "$lib/presentation/stores/auth";
import { normalize_auth_profile_state } from "$lib/presentation/stores/authTypes";

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
    const normalized_profile_state = normalize_auth_profile_state(
      auth_state.current_profile,
    );
    const current_profile_state: ListAuthorizationProfileState =
      normalized_profile_state.status === "present"
        ? {
            status: "present",
            profile:
              normalized_profile_state.profile as unknown as UserScopeProfile,
          }
        : { status: "missing" };
    const raw_token =
      auth_state.current_token.status === "present"
        ? auth_state.current_token.token.raw_token
        : "";
    const result = await load_dynamic_entity_list_entities({
      crud_handlers: current_options.crud_handlers,
      current_profile_state,
      display_name: current_state.display_name,
      entity_metadata: current_state.entity_metadata,
      entity_type: current_options.entity_type,
      raw_token,
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
  const crud_actions = create_dynamic_entity_list_controller_crud_actions({
    get_options: () => current_options,
    load_all_entities_for_display,
    set_state,
    state_store,
  });
  const view_actions = create_dynamic_entity_list_controller_view_actions({
    get_options: () => current_options,
    set_state,
    state_store,
  });
  return {
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
    state_store,
    update_options: (next_options: DynamicEntityListControllerOptions) => {
      current_options = next_options;
      state_store.update((state) =>
        build_dynamic_entity_list_view_state(current_options, state),
      );
    },
    ...crud_actions,
    ...view_actions,
  };
}
