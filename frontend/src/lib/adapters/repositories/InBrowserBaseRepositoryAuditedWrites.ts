import type { Table } from "dexie";

import type { BaseEntity } from "../../core/entities/BaseEntity";
import type { ScalarValueInput } from "../../core/types/DomainScalars";
import type { AsyncResult } from "../../core/types/Result";
import {
  create_entity,
  delete_entities_by_ids,
  delete_existing_entity,
  find_entities_by_ids,
  find_entity_by_id,
  write_updated_entity,
} from "./InBrowserBaseRepositoryOperations";
import {
  type RepositoryWriteOrigin,
  run_repository_write,
} from "./InBrowserRepositoryWriteOrigin";
import {
  audit_after_write,
  audit_repository_change,
} from "./repositoryChangeAudit";

const AUDITED_ACTION = {
  CREATE: "create",
  UPDATE: "update",
  DELETE: "delete",
} as const;

export interface AuditedWriteContext<TEntity extends BaseEntity> {
  table: Table<TEntity, string>;
  origin: RepositoryWriteOrigin;
}

function target<TEntity extends BaseEntity>(
  context: AuditedWriteContext<TEntity>,
  action: (typeof AUDITED_ACTION)[keyof typeof AUDITED_ACTION],
): {
  table_name: string;
  origin: RepositoryWriteOrigin;
  action: typeof action;
} {
  return { table_name: context.table.name, origin: context.origin, action };
}

export async function create_audited_entity<TEntity extends BaseEntity, TInput>(
  context: AuditedWriteContext<TEntity>,
  input: TInput,
  entity_prefix: string,
  build: (
    input: TInput,
    id: TEntity["id"],
    timestamps: Pick<BaseEntity, "created_at" | "updated_at">,
  ) => TEntity,
): AsyncResult<TEntity> {
  const result = await run_repository_write(context.table, context.origin, () =>
    create_entity(context.table, input, entity_prefix, build),
  );
  return audit_after_write(
    target(context, AUDITED_ACTION.CREATE),
    false,
    result,
  );
}

export async function update_audited_entity<
  TEntity extends BaseEntity,
  TUpdate,
>(
  context: AuditedWriteContext<TEntity>,
  id: ScalarValueInput<TEntity["id"]>,
  updates: TUpdate,
  apply: (entity: TEntity, updates: TUpdate) => TEntity,
): AsyncResult<TEntity> {
  const existing = await find_entity_by_id(context.table, id);
  if (!existing.success) return existing;
  const result = await run_repository_write(context.table, context.origin, () =>
    write_updated_entity(context.table, existing.data, updates, apply),
  );
  return audit_after_write(
    target(context, AUDITED_ACTION.UPDATE),
    existing.data,
    result,
  );
}

export async function delete_audited_entity<TEntity extends BaseEntity>(
  context: AuditedWriteContext<TEntity>,
  id: ScalarValueInput<TEntity["id"]>,
): AsyncResult<boolean> {
  const existing = await find_entity_by_id(context.table, id);
  if (!existing.success) return existing;
  const result = await run_repository_write(context.table, context.origin, () =>
    delete_existing_entity(context.table, id),
  );
  return audit_after_write(
    target(context, AUDITED_ACTION.DELETE),
    existing.data,
    result,
  );
}

export async function delete_audited_entities<TEntity extends BaseEntity>(
  context: AuditedWriteContext<TEntity>,
  ids: Array<ScalarValueInput<TEntity["id"]>>,
): AsyncResult<number> {
  const existing = await find_entities_by_ids(context.table, ids);
  const result = await run_repository_write(context.table, context.origin, () =>
    delete_entities_by_ids(context.table, ids),
  );
  const deleted = existing.success && result.success ? existing.data : [];
  for (const entity of deleted)
    audit_repository_change(
      target(context, AUDITED_ACTION.DELETE),
      entity,
      false,
    );
  return result;
}
