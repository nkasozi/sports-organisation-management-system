import type { BaseEntity } from "../../core/entities/BaseEntity";
import type { ScalarValueInput } from "../../core/types/DomainScalars";
import type { AsyncResult, Result } from "../../core/types/Result";
import {
  create_failure_result,
  create_success_result,
} from "../../core/types/Result";
import {
  INITIALIZATION_ERROR_CODE,
  INITIALIZATION_EVENT,
} from "./initializationEvents";
import { emit_entity_created_events } from "./seedingUserSetup";

export interface DemoEntityBatch<
  TEntity extends { id: ScalarValueInput<BaseEntity["id"]> },
> {
  plural_label: string;
  entity_type: string;
  entities: TEntity[];
  seed: (entities: TEntity[]) => AsyncResult<number>;
  describe_entity: (entity: TEntity) => string;
}

function create_demo_seeding_failure_message(plural_label: string): string {
  return `Failed to seed demo ${plural_label}`;
}

export function log_seeding_failure(
  entity_type: string,
  plural_label: string,
  error: string,
): Result<never> {
  console.error("[Seeding] Demo batch seeding failed", {
    event: INITIALIZATION_EVENT.DEMO_BATCH_SEEDING_FAILED,
    error_code: INITIALIZATION_ERROR_CODE.DEMO_SEEDING_FAILED,
    entity_type,
    error,
  });
  return create_failure_result(
    create_demo_seeding_failure_message(plural_label),
  );
}

export function log_seeding_started(entity_type: string): boolean {
  console.log("[Seeding] Demo batch seeding started", {
    event: INITIALIZATION_EVENT.DEMO_BATCH_SEEDING_STARTED,
    entity_type,
  });
  return true;
}

export function announce_seeded_batch<
  TEntity extends { id: ScalarValueInput<BaseEntity["id"]> },
>(batch: DemoEntityBatch<TEntity>): Result<number> {
  emit_entity_created_events(
    batch.entity_type,
    batch.entities,
    batch.describe_entity,
  );
  console.log("[Seeding] Demo batch seeded", {
    event: INITIALIZATION_EVENT.DEMO_BATCH_SEEDED,
    entity_type: batch.entity_type,
    count: batch.entities.length,
  });
  return create_success_result(batch.entities.length);
}

export async function seed_demo_entity_batch<
  TEntity extends { id: ScalarValueInput<BaseEntity["id"]> },
>(batch: DemoEntityBatch<TEntity>): Promise<Result<number>> {
  log_seeding_started(batch.entity_type);
  const result = await batch.seed(batch.entities);
  if (!result.success) {
    return log_seeding_failure(
      batch.entity_type,
      batch.plural_label,
      result.error,
    );
  }
  return announce_seeded_batch(batch);
}

export function describe_person(person: {
  first_name: string;
  last_name: string;
}): string {
  return `${person.first_name} ${person.last_name}`;
}
