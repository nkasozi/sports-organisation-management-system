import type { BaseEntity } from "$lib/core/entities/BaseEntity";
import { get_dynamic_entity_list_single_delete_state } from "$lib/presentation/logic/dynamicEntityListControllerCrud";
import {
  close_dynamic_entity_list_bulk_import,
  confirm_dynamic_entity_list_deletion_action,
  type DynamicEntityListCrudCommand,
  handle_dynamic_entity_list_bulk_delete,
  handle_dynamic_entity_list_create,
  handle_dynamic_entity_list_edit,
  handle_dynamic_entity_list_inline_cancel,
  handle_dynamic_entity_list_inline_save,
} from "$lib/presentation/logic/dynamicEntityListControllerRuntimeCrudHandlers";

type DynamicEntityListCrudActions = {
  cancel_deletion: () => void;
  close_bulk_import: () => Promise<void>;
  confirm_deletion_action: () => Promise<void>;
  handle_create_new_entity: () => boolean;
  handle_delete_multiple_entities: () => boolean;
  handle_delete_single_entity: (entity: BaseEntity) => boolean;
  handle_edit_entity: (entity: BaseEntity) => boolean;
  handle_inline_form_cancel: () => boolean;
  handle_inline_form_save: () => Promise<boolean>;
  open_bulk_import: () => void;
};

export function create_dynamic_entity_list_controller_crud_actions(
  command: DynamicEntityListCrudCommand,
): DynamicEntityListCrudActions {
  return {
    cancel_deletion: (): void =>
      command.set_state({
        entities_to_delete: [],
        show_delete_confirmation: false,
      }),
    close_bulk_import: (): Promise<void> =>
      close_dynamic_entity_list_bulk_import(command),
    confirm_deletion_action: (): Promise<void> =>
      confirm_dynamic_entity_list_deletion_action(command),
    handle_create_new_entity: (): boolean =>
      handle_dynamic_entity_list_create(command),
    handle_delete_multiple_entities: (): boolean =>
      handle_dynamic_entity_list_bulk_delete(command),
    handle_delete_single_entity: (entity: BaseEntity): boolean => {
      command.set_state({
        entities_to_delete: get_dynamic_entity_list_single_delete_state(entity),
        show_delete_confirmation: true,
      });
      return true;
    },
    handle_edit_entity: (entity: BaseEntity): boolean =>
      handle_dynamic_entity_list_edit(command, entity),
    handle_inline_form_cancel: (): boolean =>
      handle_dynamic_entity_list_inline_cancel(command),
    handle_inline_form_save: (): Promise<boolean> =>
      handle_dynamic_entity_list_inline_save(command),
    open_bulk_import: (): void =>
      command.set_state({ show_bulk_import_modal: true }),
  };
}
