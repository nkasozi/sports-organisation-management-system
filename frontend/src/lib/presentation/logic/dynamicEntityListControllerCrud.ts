import type { BaseEntity } from "$lib/core/entities/BaseEntity";
import type {
  EntityCrudHandlers,
  EntityViewCallbacks,
} from "$lib/core/types/EntityHandlers";
import type { SubEntityFilter } from "$lib/core/types/SubEntityFilter";
import {
  build_dynamic_entity_list_sub_entity_defaults,
  delete_dynamic_entity_list_entities,
} from "$lib/presentation/logic/dynamicEntityListMutations";

interface DynamicEntityListCreateResult {
  inline_form_entity: Partial<BaseEntity> | null;
  show_inline_form: boolean;
}

interface DynamicEntityListDeleteCommand {
  crud_handlers: EntityCrudHandlers | null;
  entities: BaseEntity[];
  entities_to_delete: BaseEntity[];
  entity_type: string;
}

export function get_dynamic_entity_list_create_state(
  sub_entity_filter: SubEntityFilter | null,
  view_callbacks: EntityViewCallbacks | null,
): DynamicEntityListCreateResult {
  if (!sub_entity_filter) {
    view_callbacks?.on_create_requested?.();
    return { inline_form_entity: null, show_inline_form: false };
  }
  return {
    inline_form_entity:
      build_dynamic_entity_list_sub_entity_defaults(sub_entity_filter),
    show_inline_form: true,
  };
}

export function get_dynamic_entity_list_edit_state(
  entity: BaseEntity,
  sub_entity_filter: SubEntityFilter | null,
  view_callbacks: EntityViewCallbacks | null,
): DynamicEntityListCreateResult {
  if (!sub_entity_filter) {
    view_callbacks?.on_edit_requested?.(entity);
    return { inline_form_entity: null, show_inline_form: false };
  }
  return { inline_form_entity: { ...entity }, show_inline_form: true };
}

export function get_dynamic_entity_list_inline_cancel_state(): DynamicEntityListCreateResult {
  return { inline_form_entity: null, show_inline_form: false };
}

export function get_dynamic_entity_list_single_delete_state(
  entity: BaseEntity,
): BaseEntity[] {
  return [entity];
}

export function get_dynamic_entity_list_bulk_delete_state(
  entities: BaseEntity[],
  selected_entity_ids: Set<string>,
): BaseEntity[] {
  return entities.filter((entity: BaseEntity) =>
    selected_entity_ids.has(entity.id),
  );
}

export async function confirm_dynamic_entity_list_deletion(
  command: DynamicEntityListDeleteCommand,
): Promise<{
  deleted_entities: BaseEntity[];
  entities: BaseEntity[];
  error_message: string;
  success: boolean;
}> {
  const result = await delete_dynamic_entity_list_entities(command);
  return result.success
    ? {
        deleted_entities: result.deleted_entities,
        entities: result.entities,
        error_message: "",
        success: true,
      }
    : {
        deleted_entities: [],
        entities: command.entities,
        error_message: result.error_message,
        success: false,
      };
}
