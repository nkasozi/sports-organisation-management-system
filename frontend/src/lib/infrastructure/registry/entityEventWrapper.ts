import type { BaseEntity } from "$lib/core/entities/BaseEntity";
import type { AsyncResult } from "$lib/core/types/Result";
import { EventBus } from "$lib/infrastructure/events/EventBus";

import { get_entity_display_name } from "./entityDisplayNames";
import type { GenericEntityUseCases } from "./entityUseCasesRegistry";
import {
  ENTITY_EVENT_OPERATION,
  ENTITY_TYPES_SKIPPING_AUDIT_EVENTS,
  REGISTRY_LOG_EVENT,
} from "./registryConstants";

type EntityRecord = Record<string, unknown>;

function as_entity_record(entity: BaseEntity): EntityRecord {
  return entity as unknown as EntityRecord;
}

function log_previous_entity_unavailable(
  entity_type: string,
  entity_id: string,
  operation: string,
): void {
  console.warn("[EntityEventWrapper] Previous entity unavailable, no event", {
    event: REGISTRY_LOG_EVENT.PREVIOUS_ENTITY_UNAVAILABLE,
    entity_type,
    entity_id,
    operation,
  });
}

function find_changed_fields(
  input: EntityRecord,
  old_data: EntityRecord,
  new_data: EntityRecord,
): string[] {
  return Object.keys(input).filter(
    (field) => old_data[field] !== new_data[field],
  );
}

function wrap_create(
  entity_type: string,
  use_cases: GenericEntityUseCases,
): GenericEntityUseCases["create"] {
  return async (input: EntityRecord): AsyncResult<BaseEntity> => {
    const result = await use_cases.create(input);
    if (!result.success) return result;
    EventBus.emit_entity_created(
      entity_type,
      result.data.id,
      get_entity_display_name(entity_type, result.data),
      as_entity_record(result.data),
    );
    return result;
  };
}

function emit_update_if_changed(
  entity_type: string,
  input: EntityRecord,
  old_entity: BaseEntity,
  new_entity: BaseEntity,
): void {
  const old_data = as_entity_record(old_entity);
  const new_data = as_entity_record(new_entity);
  const changed_fields = find_changed_fields(input, old_data, new_data);
  if (changed_fields.length === 0) return;
  EventBus.emit_entity_updated(
    entity_type,
    new_entity.id,
    get_entity_display_name(entity_type, new_entity),
    old_data,
    new_data,
    changed_fields,
  );
}

function wrap_update(
  entity_type: string,
  use_cases: GenericEntityUseCases,
): GenericEntityUseCases["update"] {
  return async (id, input): AsyncResult<BaseEntity> => {
    const old_entity_result = await use_cases.get_by_id(id);
    const result = await use_cases.update(id, input);
    if (!old_entity_result.success) {
      log_previous_entity_unavailable(
        entity_type,
        id,
        ENTITY_EVENT_OPERATION.UPDATE,
      );
      return result;
    }
    if (!result.success) return result;
    emit_update_if_changed(
      entity_type,
      input,
      old_entity_result.data,
      result.data,
    );
    return result;
  };
}

function wrap_delete(
  entity_type: string,
  use_cases: GenericEntityUseCases,
): GenericEntityUseCases["delete"] {
  return async (id): AsyncResult<boolean> => {
    const entity_result = await use_cases.get_by_id(id);
    const result = await use_cases.delete(id);
    if (!entity_result.success) {
      log_previous_entity_unavailable(
        entity_type,
        id,
        ENTITY_EVENT_OPERATION.DELETE,
      );
      return result;
    }
    if (!result.success || !result.data) return result;
    EventBus.emit_entity_deleted(
      entity_type,
      id,
      get_entity_display_name(entity_type, entity_result.data),
      as_entity_record(entity_result.data),
    );
    return result;
  };
}

export function wrap_use_cases_with_events(
  entity_type: string,
  use_cases: GenericEntityUseCases,
): GenericEntityUseCases {
  if (ENTITY_TYPES_SKIPPING_AUDIT_EVENTS.includes(entity_type))
    return use_cases;
  return {
    ...use_cases,
    create: wrap_create(entity_type, use_cases),
    update: wrap_update(entity_type, use_cases),
    delete: wrap_delete(entity_type, use_cases),
  };
}
