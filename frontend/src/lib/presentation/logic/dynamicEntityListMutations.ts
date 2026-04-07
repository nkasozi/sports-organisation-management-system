import type { BaseEntity } from "$lib/core/entities/BaseEntity";
import type { EntityCrudHandlers } from "$lib/core/types/EntityHandlers";
import type { SubEntityFilter } from "$lib/core/types/SubEntityFilter";
import { get_use_cases_for_entity_type } from "$lib/infrastructure/registry/entityUseCasesRegistry";

interface DynamicEntityDeleteResult {
  success: boolean;
  error?: string;
  error_message?: string;
}

interface DynamicEntityDeleteMultipleResult {
  success: boolean;
  error_message?: string;
}

function get_dynamic_entity_delete_error(
  result: DynamicEntityDeleteResult,
): string {
  return result.error || result.error_message || "Failed to delete entity";
}

export function build_dynamic_entity_list_sub_entity_defaults(
  sub_entity_filter: SubEntityFilter | null,
): Partial<BaseEntity> {
  const next_entity: Record<string, string> = { id: "" };
  if (!sub_entity_filter) {
    return next_entity as Partial<BaseEntity>;
  }
  next_entity[sub_entity_filter.foreign_key_field] =
    sub_entity_filter.foreign_key_value;
  if (
    sub_entity_filter.holder_type_field &&
    sub_entity_filter.holder_type_value
  ) {
    next_entity[sub_entity_filter.holder_type_field] =
      sub_entity_filter.holder_type_value;
  }
  return next_entity as Partial<BaseEntity>;
}

async function delete_with_custom_handler(command: {
  crud_handlers: EntityCrudHandlers;
  ids_to_delete: string[];
}): Promise<{ error_message: string; success: boolean }> {
  for (const entity_id of command.ids_to_delete) {
    const result = await command.crud_handlers.delete?.(entity_id);
    if (result?.success) {
      continue;
    }
    return {
      success: false,
      error_message: get_dynamic_entity_delete_error(
        (result || {}) as DynamicEntityDeleteResult,
      ),
    };
  }
  return { success: true, error_message: "" };
}

async function delete_with_default_use_cases(command: {
  entity_type: string;
  ids_to_delete: string[];
}): Promise<{ error_message: string; success: boolean }> {
  const use_cases_result = get_use_cases_for_entity_type(command.entity_type);
  if (!use_cases_result.success) {
    return {
      success: false,
      error_message: `No use cases found for entity type: ${command.entity_type}`,
    };
  }
  const use_cases = use_cases_result.data as typeof use_cases_result.data & {
    delete_multiple?: (
      ids: string[],
    ) => Promise<DynamicEntityDeleteMultipleResult>;
  };
  if (command.ids_to_delete.length > 1 && use_cases.delete_multiple) {
    const result = await use_cases.delete_multiple(command.ids_to_delete);
    return {
      success: result.success,
      error_message: result.error_message || "Failed to delete entities",
    };
  }
  for (const entity_id of command.ids_to_delete) {
    const result = await use_cases.delete(entity_id);
    if (result.success) {
      continue;
    }
    return {
      success: false,
      error_message: get_dynamic_entity_delete_error(
        result as DynamicEntityDeleteResult,
      ),
    };
  }
  return { success: true, error_message: "" };
}

export async function delete_dynamic_entity_list_entities(command: {
  crud_handlers: EntityCrudHandlers | null;
  entities: BaseEntity[];
  entities_to_delete: BaseEntity[];
  entity_type: string;
}): Promise<{
  deleted_entities: BaseEntity[];
  entities: BaseEntity[];
  error_message: string;
  success: boolean;
}> {
  const ids_to_delete = command.entities_to_delete.map((entity) => entity.id);
  const deletion_result = command.crud_handlers?.delete
    ? await delete_with_custom_handler({
        crud_handlers: command.crud_handlers,
        ids_to_delete,
      })
    : await delete_with_default_use_cases({
        entity_type: command.entity_type,
        ids_to_delete,
      });
  return deletion_result.success
    ? {
        success: true,
        error_message: "",
        deleted_entities: command.entities_to_delete,
        entities: command.entities.filter(
          (entity) => !ids_to_delete.includes(entity.id),
        ),
      }
    : {
        success: false,
        error_message: deletion_result.error_message,
        deleted_entities: [],
        entities: command.entities,
      };
}
