import { get, type Writable } from "svelte/store";

import type { BaseEntity } from "$lib/core/entities/BaseEntity";
import {
  confirm_dynamic_entity_list_deletion,
  get_dynamic_entity_list_bulk_delete_state,
  get_dynamic_entity_list_create_state,
  get_dynamic_entity_list_edit_state,
  get_dynamic_entity_list_inline_cancel_state,
} from "$lib/presentation/logic/dynamicEntityListControllerCrud";
import type {
  DynamicEntityListControllerOptions,
  DynamicEntityListViewState,
} from "$lib/presentation/logic/dynamicEntityListControllerTypes";

export type DynamicEntityListCrudCommand = {
  get_options: () => DynamicEntityListControllerOptions;
  load_all_entities_for_display: () => Promise<void>;
  set_state: (updates: Partial<DynamicEntityListViewState>) => void;
  state_store: Writable<DynamicEntityListViewState>;
};

type InlineFormState = ReturnType<
  typeof get_dynamic_entity_list_inline_cancel_state
>;

type DeletionResult = Awaited<
  ReturnType<typeof confirm_dynamic_entity_list_deletion>
>;

function apply_inline_form_state(
  command: DynamicEntityListCrudCommand,
  inline_state: InlineFormState,
): boolean {
  command.set_state({
    inline_form_entity: inline_state.inline_form_entity,
    is_inline_form_visible: inline_state.show_inline_form,
  });
  return true;
}

function notify_deletion_completed(
  options: DynamicEntityListControllerOptions,
  result: DeletionResult,
): void {
  if (result.success && result.deleted_entities.length === 1) {
    options.view_callbacks?.on_delete_completed?.(result.deleted_entities[0]);
  }
  if (result.success && result.deleted_entities.length > 1) {
    options.on_entities_batch_deleted?.(result.deleted_entities);
  }
}

export async function confirm_dynamic_entity_list_deletion_action(
  command: DynamicEntityListCrudCommand,
): Promise<void> {
  const current_state = get(command.state_store);
  if (current_state.entities_to_delete.length === 0) return;
  command.set_state({ is_deleting: true });
  const result = await confirm_dynamic_entity_list_deletion({
    crud_handlers: command.get_options().crud_handlers,
    entities: current_state.entities,
    entities_to_delete: current_state.entities_to_delete,
    entity_type: command.get_options().entity_type,
  });
  notify_deletion_completed(command.get_options(), result);
  command.set_state({
    current_page: 1,
    entities: result.entities,
    entities_to_delete: [],
    error_message: result.error_message,
    is_deleting: false,
    selected_entity_ids: new Set<string>(),
    show_delete_confirmation: false,
  });
}

export function handle_dynamic_entity_list_create(
  command: DynamicEntityListCrudCommand,
): boolean {
  return apply_inline_form_state(
    command,
    get_dynamic_entity_list_create_state(
      command.get_options().sub_entity_filter,
      command.get_options().view_callbacks,
    ),
  );
}

export function handle_dynamic_entity_list_edit(
  command: DynamicEntityListCrudCommand,
  entity: BaseEntity,
): boolean {
  return apply_inline_form_state(
    command,
    get_dynamic_entity_list_edit_state(
      entity,
      command.get_options().sub_entity_filter,
      command.get_options().view_callbacks,
    ),
  );
}

export function handle_dynamic_entity_list_inline_cancel(
  command: DynamicEntityListCrudCommand,
): boolean {
  return apply_inline_form_state(
    command,
    get_dynamic_entity_list_inline_cancel_state(),
  );
}

export async function handle_dynamic_entity_list_inline_save(
  command: DynamicEntityListCrudCommand,
): Promise<boolean> {
  apply_inline_form_state(
    command,
    get_dynamic_entity_list_inline_cancel_state(),
  );
  await command.load_all_entities_for_display();
  return true;
}

export function handle_dynamic_entity_list_bulk_delete(
  command: DynamicEntityListCrudCommand,
): boolean {
  const current_state = get(command.state_store);
  command.set_state({
    entities_to_delete: get_dynamic_entity_list_bulk_delete_state(
      current_state.entities,
      current_state.selected_entity_ids,
    ),
    show_delete_confirmation: true,
  });
  return true;
}

export async function close_dynamic_entity_list_bulk_import(
  command: DynamicEntityListCrudCommand,
): Promise<void> {
  command.set_state({ show_bulk_import_modal: false });
  await command.load_all_entities_for_display();
}
