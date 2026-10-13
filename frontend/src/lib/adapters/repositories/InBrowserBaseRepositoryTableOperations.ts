import type { Table } from "dexie";

import type { BaseEntity } from "../../core/entities/BaseEntity";
import type { ScalarInput } from "../../core/types/DomainScalars";
import type { AsyncResult } from "../../core/types/Result";
import {
  REPOSITORY_CONTEXT_KEY,
  REPOSITORY_EVENT,
  REPOSITORY_LOG_MESSAGE,
  REPOSITORY_OPERATION,
} from "./InBrowserRepositoryEvents";
import {
  create_error_failure_details,
  create_warning_failure_details,
  execute_repository_operation,
  type RepositoryFailureDetails,
  with_failure_context,
} from "./InBrowserRepositoryQueryRunner";

function with_table_context<TEntity extends BaseEntity>(
  details: RepositoryFailureDetails,
  table: Table<TEntity, string>,
  entity_prefix: string,
): RepositoryFailureDetails {
  return with_failure_context(details, {
    [REPOSITORY_CONTEXT_KEY.TABLE]: table.name,
    [REPOSITORY_CONTEXT_KEY.ENTITY_PREFIX]: entity_prefix,
  });
}

export function count_entities<TEntity extends BaseEntity>(
  table: Table<TEntity, string>,
  entity_prefix: string,
): AsyncResult<number> {
  const failure = create_warning_failure_details(
    REPOSITORY_LOG_MESSAGE.COUNT_ENTITIES_FAILED,
    REPOSITORY_EVENT.COUNT_ENTITIES_FAILED,
    REPOSITORY_OPERATION.COUNT_ENTITIES,
  );
  return execute_repository_operation(
    with_table_context(failure, table, entity_prefix),
    () => table.count(),
  );
}

export function seed_entities<TEntity extends BaseEntity>(
  table: Table<TEntity, string>,
  entities: ScalarInput<TEntity>[],
  entity_prefix: string,
): AsyncResult<number> {
  const failure = create_error_failure_details(
    REPOSITORY_LOG_MESSAGE.SEED_FAILED,
    REPOSITORY_EVENT.SEED_FAILED,
    REPOSITORY_OPERATION.SEED_ENTITIES,
  );
  return execute_repository_operation(
    with_table_context(failure, table, entity_prefix),
    async () => {
      await table.bulkPut(entities as TEntity[]);
      console.log(REPOSITORY_LOG_MESSAGE.SEED_SUCCEEDED, {
        event: REPOSITORY_EVENT.SEED_SUCCEEDED,
        table: table.name,
        entity_prefix,
        record_count: entities.length,
      });
      return entities.length;
    },
  );
}

export function clear_entity_data<TEntity extends BaseEntity>(
  table: Table<TEntity, string>,
  entity_prefix: string,
): AsyncResult<boolean> {
  const failure = create_error_failure_details(
    REPOSITORY_LOG_MESSAGE.CLEAR_FAILED,
    REPOSITORY_EVENT.CLEAR_FAILED,
    REPOSITORY_OPERATION.CLEAR_ENTITIES,
  );
  return execute_repository_operation(
    with_table_context(failure, table, entity_prefix),
    async () => {
      await table.clear();
      return true;
    },
  );
}

export function table_has_data<TEntity extends BaseEntity>(
  table: Table<TEntity, string>,
  entity_prefix: string,
): AsyncResult<boolean> {
  const failure = create_warning_failure_details(
    REPOSITORY_LOG_MESSAGE.HAS_DATA_CHECK_FAILED,
    REPOSITORY_EVENT.HAS_DATA_CHECK_FAILED,
    REPOSITORY_OPERATION.CHECK_FOR_DATA,
  );
  return execute_repository_operation(
    with_table_context(failure, table, entity_prefix),
    async () => (await table.count()) > 0,
  );
}
