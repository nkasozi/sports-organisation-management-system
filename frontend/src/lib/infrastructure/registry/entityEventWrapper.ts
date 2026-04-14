import type { BaseEntity } from "$lib/core/entities/BaseEntity";
import type { AsyncResult } from "$lib/core/types/Result";
import { EventBus } from "$lib/infrastructure/events/EventBus";

import { get_entity_display_name } from "./entityDisplayNames";
import type { GenericEntityUseCases } from "./entityUseCasesRegistry";

const ENTITIES_TO_SKIP_AUDIT = ["auditlog"];

export function wrap_use_cases_with_events(
  entity_type: string,
  use_cases: GenericEntityUseCases,
): GenericEntityUseCases {
  if (ENTITIES_TO_SKIP_AUDIT.includes(entity_type)) return use_cases;

  const original_create = use_cases.create.bind(use_cases);
  const original_update = use_cases.update.bind(use_cases);
  const original_delete = use_cases.delete.bind(use_cases);
  const original_get_by_id = use_cases.get_by_id.bind(use_cases);

  return {
    ...use_cases,

    async create(input: Record<string, unknown>): AsyncResult<BaseEntity> {
      const result = await original_create(input);
      if (result.success && result.data) {
        EventBus.emit_entity_created(
          entity_type,
          result.data.id,
          get_entity_display_name(entity_type, result.data),
          result.data as unknown as Record<string, unknown>,
        );
      }
      return result;
    },

    async update(
      id: BaseEntity["id"],
      input: Record<string, unknown>,
    ): AsyncResult<BaseEntity> {
      const old_entity_result = await original_get_by_id(id);
      const old_entity = old_entity_result.success
        ? old_entity_result.data
        : undefined;
      const result = await original_update(id, input);

      if (result.success && result.data && old_entity) {
        const old_data = old_entity as unknown as Record<string, unknown>;
        const new_data = result.data as unknown as Record<string, unknown>;
        const changed_fields = Object.keys(input).filter(
          (field) => old_data[field] !== new_data[field],
        );

        if (changed_fields.length > 0) {
          EventBus.emit_entity_updated(
            entity_type,
            result.data.id,
            get_entity_display_name(entity_type, result.data),
            old_data,
            new_data,
            changed_fields,
          );
        }
      }
      return result;
    },

    async delete(id: BaseEntity["id"]): AsyncResult<boolean> {
      const entity_result = await original_get_by_id(id);
      const entity = entity_result.success ? entity_result.data : undefined;
      const result = await original_delete(id);

      if (result.success && result.data && entity) {
        EventBus.emit_entity_deleted(
          entity_type,
          id,
          get_entity_display_name(entity_type, entity),
          entity as unknown as Record<string, unknown>,
        );
      }
      return result;
    },
  };
}
