import { get, type Writable } from "svelte/store";

import type { BaseEntity } from "$lib/core/entities/BaseEntity";
import {
  confirm_dynamic_entity_list_deletion,
  get_dynamic_entity_list_bulk_delete_state,
  get_dynamic_entity_list_create_state,
  get_dynamic_entity_list_edit_state,
  get_dynamic_entity_list_inline_cancel_state,
  get_dynamic_entity_list_single_delete_state,
} from "$lib/presentation/logic/dynamicEntityListControllerCrud";
import type {
  DynamicEntityListControllerOptions,
  DynamicEntityListViewState,
} from "$lib/presentation/logic/dynamicEntityListControllerTypes";

export function create_dynamic_entity_list_controller_crud_actions(command: {
  get_options: () => DynamicEntityListControllerOptions;
  load_all_entities_for_display: () => Promise<void>;
  set_state: (updates: Partial<DynamicEntityListViewState>) => void;
  state_store: Writable<DynamicEntityListViewState>;
}): {
  cancel_deletion: () => void;
  close_bulk_import: () => Promise<void>;
  confirm_deletion_action: () => Promise<void>;
  handle_create_new_entity: () => boolean;
  handle_delete_multiple_entities: () => boolean;
  handle_delete_single_entity: (entity: BaseEntity) => boolean;
  handle_edit_entity: (entity: BaseEntity) => boolean;
  handle_inline_form_cancel: () => boolean;
  handle_inline_form_save: (
    event: CustomEvent<{ entity: BaseEntity }>,
  ) => Promise<boolean>;
  open_bulk_import: () => void;
} {
  return {
    cancel_deletion: () =>
      command.set_state({
        entities_to_delete: [],
        show_delete_confirmation: false,
      }),
    close_bulk_import: async (): Promise<void> => {
      command.set_state({ show_bulk_import_modal: false });
      await command.load_all_entities_for_display();
    },
    confirm_deletion_action: async (): Promise<void> => {
      const current_state = get(command.state_store);
      if (current_state.entities_to_delete.length === 0) {
        return;
      }
      command.set_state({ is_deleting: true });
      const result = await confirm_dynamic_entity_list_deletion({
        crud_handlers: command.get_options().crud_handlers,
        entities: current_state.entities,
        entities_to_delete: current_state.entities_to_delete,
        entity_type: command.get_options().entity_type,
      });
      if (result.success && result.deleted_entities.length === 1) {
        command
          .get_options()
          .view_callbacks?.on_delete_completed?.(result.deleted_entities[0]);
      }
      if (result.success && result.deleted_entities.length > 1) {
        command
          .get_options()
          .on_entities_batch_deleted?.(result.deleted_entities);
      }
      command.set_state({
        current_page: 1,
        entities: result.entities,
        entities_to_delete: [],
        error_message: result.error_message,
        is_deleting: false,
        selected_entity_ids: new Set<string>(),
        show_delete_confirmation: false,
      });
    },
    handle_create_new_entity: (): boolean => {
      const create_state = get_dynamic_entity_list_create_state(
        command.get_options().sub_entity_filter,
        command.get_options().view_callbacks,
      );
      command.set_state({
        inline_form_entity: create_state.inline_form_entity,
        is_inline_form_visible: create_state.show_inline_form,
      });
      return true;
    },
    handle_delete_multiple_entities: (): boolean => {
      const current_state = get(command.state_store);
      command.set_state({
        entities_to_delete: get_dynamic_entity_list_bulk_delete_state(
          current_state.entities,
          current_state.selected_entity_ids,
        ),
        show_delete_confirmation: true,
      });
      return true;
    },
    handle_delete_single_entity: (entity: BaseEntity): boolean => {
      command.set_state({
        entities_to_delete: get_dynamic_entity_list_single_delete_state(entity),
        show_delete_confirmation: true,
      });
      return true;
    },
    handle_edit_entity: (entity: BaseEntity): boolean => {
      const edit_state = get_dynamic_entity_list_edit_state(
        entity,
        command.get_options().sub_entity_filter,
        command.get_options().view_callbacks,
      );
      command.set_state({
        inline_form_entity: edit_state.inline_form_entity,
        is_inline_form_visible: edit_state.show_inline_form,
      });
      return true;
    },
    handle_inline_form_cancel: (): boolean => {
      const cancel_state = get_dynamic_entity_list_inline_cancel_state();
      command.set_state({
        inline_form_entity: cancel_state.inline_form_entity,
        is_inline_form_visible: cancel_state.show_inline_form,
      });
      return true;
    },
    handle_inline_form_save: async (
      event: CustomEvent<{ entity: BaseEntity }>,
    ): Promise<boolean> => {
      void event.detail.entity;
      const cancel_state = get_dynamic_entity_list_inline_cancel_state();
      command.set_state({
        inline_form_entity: cancel_state.inline_form_entity,
        is_inline_form_visible: cancel_state.show_inline_form,
      });
      await command.load_all_entities_for_display();
      return true;
    },
    open_bulk_import: () => command.set_state({ show_bulk_import_modal: true }),
  };
}
