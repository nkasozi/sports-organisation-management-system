import type { Table } from "dexie";

import type { BaseEntity } from "../../core/entities/BaseEntity";
import type { ScalarValueInput } from "../../core/types/DomainScalars";
import {
  create_timestamp_fields,
  generate_unique_id,
  update_timestamp,
} from "../../core/entities/BaseEntity";
import type { QueryOptions } from "../../core/interfaces/ports";
import type {
  AsyncResult,
  PaginatedAsyncResult,
  Result,
} from "../../core/types/Result";
import {
  create_failure_result,
  create_success_result,
} from "../../core/types/Result";
import {
  create_paginated_result_from_options,
  format_repository_error,
  paginate_entity_slice,
  sort_entities_by_options,
} from "./InBrowserBaseRepositoryHelpers";

interface RepositoryFailureDetails {
  log_message: string;
  event: string;
  operation: string;
  entity_prefix?: string;
  log_level?: "warn" | "error";
}

function create_entity_not_found_result(
  id: ScalarValueInput<BaseEntity["id"]>,
): Result<never, string> {
  return create_failure_result(`Entity with id '${id}' not found`);
}

function log_repository_failure(
  details: RepositoryFailureDetails,
  error: unknown,
): void {
  const log_method =
    details.log_level === "error" ? console.error : console.warn;
  log_method(details.log_message, {
    event: details.event,
    ...(details.entity_prefix ? { entity_prefix: details.entity_prefix } : {}),
    error: String(error),
  });
}

async function execute_repository_operation<TData>(
  details: RepositoryFailureDetails,
  operation: () => Promise<TData>,
): AsyncResult<TData> {
  try {
    return create_success_result(await operation());
  } catch (error) {
    log_repository_failure(details, error);
    return create_failure_result(
      format_repository_error(error, details.operation),
    );
  }
}

export function find_all_entities<TEntity extends BaseEntity, TFilter>(
  table: Table<TEntity, string>,
  filter: TFilter | undefined,
  options: QueryOptions | undefined,
  apply_entity_filter: (entities: TEntity[], filter: TFilter) => TEntity[],
): PaginatedAsyncResult<TEntity> {
  return execute_repository_operation(
    {
      log_message: "[Repository] Failed to fetch entities",
      event: "repository_fetch_entities_failed",
      operation: "fetch entities",
    },
    async () => {
      let all_entities = await table.toArray();
      if (filter !== undefined)
        all_entities = apply_entity_filter(all_entities, filter);
      const total_count = all_entities.length;
      const sorted_entities = sort_entities_by_options(all_entities, options);
      const paginated_entities = paginate_entity_slice(
        sorted_entities,
        options,
      );
      return create_paginated_result_from_options(
        paginated_entities,
        total_count,
        options,
      );
    },
  );
}

export async function find_entity_by_id<TEntity extends BaseEntity>(
  table: Table<TEntity, string>,
  id: ScalarValueInput<TEntity["id"]>,
): AsyncResult<TEntity> {
  const entity_result = await execute_repository_operation(
    {
      log_message: "[Repository] Failed to fetch entity by id",
      event: "repository_fetch_entity_by_id_failed",
      operation: "fetch entity by id",
    },
    async () => table.get(id),
  );
  if (!entity_result.success) return entity_result;
  if (!entity_result.data) return create_entity_not_found_result(id);
  return create_success_result(entity_result.data);
}

export function find_entities_by_ids<TEntity extends BaseEntity>(
  table: Table<TEntity, string>,
  ids: Array<ScalarValueInput<TEntity["id"]>>,
): AsyncResult<TEntity[]> {
  return execute_repository_operation(
    {
      log_message: "[Repository] Failed to fetch entities by ids",
      event: "repository_fetch_entities_by_ids_failed",
      operation: "fetch entities by ids",
    },
    async () =>
      (await table.bulkGet(ids)).filter(
        (entity): entity is TEntity => entity !== undefined,
      ),
  );
}

export function create_entity<TEntity extends BaseEntity, TCreateInput>(
  table: Table<TEntity, string>,
  input: TCreateInput,
  entity_prefix: string,
  create_entity_from_input: (
    input: TCreateInput,
    id: TEntity["id"],
    timestamps: Pick<BaseEntity, "created_at" | "updated_at">,
  ) => TEntity,
): AsyncResult<TEntity> {
  return execute_repository_operation(
    {
      log_message: "[Repository] Failed to create entity",
      event: "repository_create_entity_failed",
      operation: "create entity",
    },
    async () => {
      const entity_id = generate_unique_id(entity_prefix) as TEntity["id"];
      const new_entity = create_entity_from_input(
        input,
        entity_id,
        create_timestamp_fields(),
      );
      await table.add(new_entity);
      return new_entity;
    },
  );
}

export async function update_entity<TEntity extends BaseEntity, TUpdateInput>(
  table: Table<TEntity, string>,
  id: ScalarValueInput<TEntity["id"]>,
  updates: TUpdateInput,
  apply_updates_to_entity: (entity: TEntity, updates: TUpdateInput) => TEntity,
): AsyncResult<TEntity> {
  const existing_entity_result = await find_entity_by_id(table, id);
  if (!existing_entity_result.success) return existing_entity_result;
  return execute_repository_operation(
    {
      log_message: "[Repository] Failed to update entity",
      event: "repository_update_entity_failed",
      operation: "update entity",
    },
    async () => {
      const updated_entity = update_timestamp(
        apply_updates_to_entity(existing_entity_result.data, updates),
      );
      await table.put(updated_entity);
      return updated_entity;
    },
  );
}

export async function delete_entity_by_id<TEntity extends BaseEntity>(
  table: Table<TEntity, string>,
  id: ScalarValueInput<TEntity["id"]>,
): AsyncResult<boolean> {
  const existing_entity_result = await find_entity_by_id(table, id);
  if (!existing_entity_result.success) return existing_entity_result;
  return execute_repository_operation(
    {
      log_message: "[Repository] Failed to delete entity",
      event: "repository_delete_entity_failed",
      operation: "delete entity",
    },
    async () => {
      await table.delete(id);
      return true;
    },
  );
}

export function delete_entities_by_ids<TEntity extends BaseEntity>(
  table: Table<TEntity, string>,
  ids: Array<ScalarValueInput<TEntity["id"]>>,
): AsyncResult<number> {
  return execute_repository_operation(
    {
      log_message: "[Repository] Failed to delete entities",
      event: "repository_delete_entities_failed",
      operation: "delete entities",
    },
    async () => {
      await table.bulkDelete(ids);
      return ids.length;
    },
  );
}
