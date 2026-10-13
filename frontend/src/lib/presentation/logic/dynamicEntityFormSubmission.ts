import type { EntityCrudHandlers } from "$lib/core/types/EntityHandlers";

import type { BaseEntity } from "../../core/entities/BaseEntity";
import type { Result } from "../../core/types/Result";
import { create_failure_result } from "../../core/types/Result";
import { get_use_cases_for_entity_type } from "../../infrastructure/registry/entityUseCasesRegistry";
import {
  DYNAMIC_ENTITY_FORM_EVENT,
  DYNAMIC_ENTITY_FORM_MESSAGE,
} from "./dynamicEntityFormMessages";

function report_save_handler_failure(
  entity_type: string,
  event: string,
  user_message: string,
): Result<never, string> {
  console.error("[DynamicEntityForm] Save handler unavailable", {
    event,
    entity_type,
  });
  return create_failure_result(user_message);
}

export async function resolve_dynamic_form_create_result(
  entity_type: string,
  crud_handlers: EntityCrudHandlers | undefined,
  data: Record<string, unknown>,
): Promise<Result<BaseEntity, string>> {
  if (crud_handlers?.create) {
    return crud_handlers.create(data);
  }

  const use_cases_result = get_use_cases_for_entity_type(
    entity_type.toLowerCase(),
  );
  if (!use_cases_result.success) {
    return report_save_handler_failure(
      entity_type,
      DYNAMIC_ENTITY_FORM_EVENT.SAVE_HANDLER_MISSING,
      DYNAMIC_ENTITY_FORM_MESSAGE.SAVE_HANDLER_MISSING,
    );
  }
  if (!(use_cases_result.data.create instanceof Function)) {
    return report_save_handler_failure(
      entity_type,
      DYNAMIC_ENTITY_FORM_EVENT.CREATE_NOT_SUPPORTED,
      DYNAMIC_ENTITY_FORM_MESSAGE.CREATE_NOT_SUPPORTED,
    );
  }
  return use_cases_result.data.create(data);
}

export async function resolve_dynamic_form_update_result(
  entity_type: string,
  crud_handlers: EntityCrudHandlers | undefined,
  id: string,
  data: Record<string, unknown>,
): Promise<Result<BaseEntity, string>> {
  if (crud_handlers?.update) {
    return crud_handlers.update(id, data);
  }

  const use_cases_result = get_use_cases_for_entity_type(
    entity_type.toLowerCase(),
  );
  if (!use_cases_result.success) {
    return report_save_handler_failure(
      entity_type,
      DYNAMIC_ENTITY_FORM_EVENT.SAVE_HANDLER_MISSING,
      DYNAMIC_ENTITY_FORM_MESSAGE.SAVE_HANDLER_MISSING,
    );
  }
  if (!(use_cases_result.data.update instanceof Function)) {
    return report_save_handler_failure(
      entity_type,
      DYNAMIC_ENTITY_FORM_EVENT.UPDATE_NOT_SUPPORTED,
      DYNAMIC_ENTITY_FORM_MESSAGE.UPDATE_NOT_SUPPORTED,
    );
  }
  return use_cases_result.data.update(id, data);
}
