import type { Table } from "dexie";

import type { BaseEntity } from "../../core/entities/BaseEntity";
import {
  create_timestamp_fields,
  generate_unique_id,
  update_timestamp,
} from "../../core/entities/BaseEntity";
import type { ScalarValueInput } from "../../core/types/DomainScalars";
import type { AsyncResult } from "../../core/types/Result";
import {
  describe_entity_operation_failure,
  describe_table_operation_failure,
} from "./InBrowserBaseRepositoryFailureDetails";
import { BASE_REPOSITORY_OPERATION } from "./InBrowserRepositoryEvents";
import { check_entity_field_rules } from "./InBrowserRepositoryFieldRules";
import { execute_repository_operation } from "./InBrowserRepositoryQueryRunner";

export function create_entity<TEntity extends BaseEntity, TCreateInput>(
  table: Table<TEntity, string>,
  input: TCreateInput,
  entity_prefix: string,
  create_entity_from_input: (
    input: TCreateInput,
    id: TEntity["id"],
    timestamps: Pick<BaseEntity, "created_at" | "updated_at">,
  ) => TEntity,
  check_fields: boolean,
): AsyncResult<TEntity> {
  const entity_id = generate_unique_id(entity_prefix) as TEntity["id"];
  const new_entity = create_entity_from_input(
    input,
    entity_id,
    create_timestamp_fields(),
  );
  const field_check = check_entity_field_rules(
    table.name,
    new_entity,
    check_fields,
  );
  if (!field_check.success) return Promise.resolve(field_check);
  return execute_repository_operation(
    describe_table_operation_failure(
      BASE_REPOSITORY_OPERATION.CREATE_ENTITY,
      table,
    ),
    async () => {
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
  check_fields: boolean,
): AsyncResult<TEntity> {
  const updated_entity = update_timestamp(
    apply_updates_to_entity(existing_entity, updates),
  );
  const field_check = check_entity_field_rules(
    table.name,
    updated_entity,
    check_fields,
  );
  if (!field_check.success) return Promise.resolve(field_check);
  return execute_repository_operation(
    describe_entity_operation_failure(
      BASE_REPOSITORY_OPERATION.UPDATE_ENTITY,
      table,
      existing_entity.id as ScalarValueInput<TEntity["id"]>,
    ),
    async () => {
      await table.put(updated_entity);
      return updated_entity;
    },
  );
}
