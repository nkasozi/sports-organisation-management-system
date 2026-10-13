import type { Table } from "dexie";

import type { BaseEntity } from "../../core/entities/BaseEntity";
import {
  create_timestamp_fields,
  generate_unique_id,
  update_timestamp,
} from "../../core/entities/BaseEntity";
import type { QueryOptions } from "../../core/interfaces/ports";
import type { ScalarValueInput } from "../../core/types/DomainScalars";
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
  describe_entity_operation_failure,
  describe_table_operation_failure,
} from "./InBrowserBaseRepositoryFailureDetails";
import {
  create_paginated_result_from_options,
  paginate_entity_slice,
  sort_entities_by_options,
} from "./InBrowserBaseRepositoryHelpers";
import { BASE_REPOSITORY_OPERATION } from "./InBrowserRepositoryEvents";
import { execute_repository_operation } from "./InBrowserRepositoryQueryRunner";

export { describe_base_operation_failure } from "./InBrowserBaseRepositoryFailureDetails";

function has_filter_fields<TFilter extends object>(filter: TFilter): boolean {
  return Object.keys(filter).length > 0;
}

function create_entity_not_found_result(
  id: ScalarValueInput<BaseEntity["id"]>,
): Result<never, string> {
  return create_failure_result(`Entity with id '${id}' not found`);
}

export function find_all_entities<
  TEntity extends BaseEntity,
  TFilter extends object,
>(
  table: Table<TEntity, string>,
  filter: Partial<TFilter>,
  apply_entity_filter: (entities: TEntity[], filter: TFilter) => TEntity[],
  options?: QueryOptions,
): PaginatedAsyncResult<TEntity> {
  return execute_repository_operation(
    describe_table_operation_failure(
      BASE_REPOSITORY_OPERATION.FETCH_ENTITIES,
      table,
    ),
    async () => {
      let all_entities = await table.toArray();
      if (has_filter_fields(filter))
        all_entities = apply_entity_filter(all_entities, filter as TFilter);
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
    describe_entity_operation_failure(
      BASE_REPOSITORY_OPERATION.FETCH_ENTITY_BY_ID,
      table,
      id,
    ),
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
    describe_table_operation_failure(
      BASE_REPOSITORY_OPERATION.FETCH_ENTITIES_BY_IDS,
      table,
    ),
    async () =>
      (await table.bulkGet(ids)).filter((entity): entity is TEntity =>
        Boolean(entity),
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
    describe_table_operation_failure(
      BASE_REPOSITORY_OPERATION.CREATE_ENTITY,
      table,
    ),
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

export function write_updated_entity<TEntity extends BaseEntity, TUpdateInput>(
  table: Table<TEntity, string>,
  existing_entity: TEntity,
  updates: TUpdateInput,
  apply_updates_to_entity: (entity: TEntity, updates: TUpdateInput) => TEntity,
): AsyncResult<TEntity> {
  return execute_repository_operation(
    describe_entity_operation_failure(
      BASE_REPOSITORY_OPERATION.UPDATE_ENTITY,
      table,
      existing_entity.id as ScalarValueInput<TEntity["id"]>,
    ),
    async () => {
      const updated_entity = update_timestamp(
        apply_updates_to_entity(existing_entity, updates),
      );
      await table.put(updated_entity);
      return updated_entity;
    },
  );
}

export function delete_existing_entity<TEntity extends BaseEntity>(
  table: Table<TEntity, string>,
  id: ScalarValueInput<TEntity["id"]>,
): AsyncResult<boolean> {
  return execute_repository_operation(
    describe_entity_operation_failure(
      BASE_REPOSITORY_OPERATION.DELETE_ENTITY,
      table,
      id,
    ),
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
    describe_table_operation_failure(
      BASE_REPOSITORY_OPERATION.DELETE_ENTITIES,
      table,
    ),
    async () => {
      await table.bulkDelete(ids);
      return ids.length;
    },
  );
}
