import type { Table } from "dexie";

import type { BaseEntity } from "../../core/entities/BaseEntity";
import type { ScalarValueInput } from "../../core/types/DomainScalars";
import {
  BASE_REPOSITORY_OPERATION,
  REPOSITORY_CONTEXT_KEY,
} from "./InBrowserRepositoryEvents";
import {
  create_warning_failure_details,
  type RepositoryFailureDetails,
  with_failure_context,
} from "./InBrowserRepositoryQueryRunner";

export function describe_base_operation_failure(
  operation: string,
): RepositoryFailureDetails {
  return create_warning_failure_details(
    `[Repository] Failed to ${operation}`,
    `repository_${operation.replaceAll(" ", "_")}_failed`,
    operation,
  );
}

export function describe_table_operation_failure<TEntity extends BaseEntity>(
  operation: BASE_REPOSITORY_OPERATION,
  table: Table<TEntity, string>,
): RepositoryFailureDetails {
  return with_failure_context(describe_base_operation_failure(operation), {
    [REPOSITORY_CONTEXT_KEY.TABLE]: table.name,
  });
}

export function describe_entity_operation_failure<TEntity extends BaseEntity>(
  operation: BASE_REPOSITORY_OPERATION,
  table: Table<TEntity, string>,
  id: ScalarValueInput<TEntity["id"]>,
): RepositoryFailureDetails {
  return with_failure_context(
    describe_table_operation_failure(operation, table),
    { [REPOSITORY_CONTEXT_KEY.ENTITY_ID]: String(id) },
  );
}
