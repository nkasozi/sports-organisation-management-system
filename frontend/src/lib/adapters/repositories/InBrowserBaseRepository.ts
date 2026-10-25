import type { Table } from "dexie";

import type { BaseEntity } from "../../core/entities/BaseEntity";
import type { QueryOptions, Repository } from "../../core/interfaces/ports";
import type {
  ScalarInput,
  ScalarValueInput,
} from "../../core/types/DomainScalars";
import type {
  AsyncResult,
  PaginatedAsyncResult,
  PaginatedResult,
} from "../../core/types/Result";
import { get_database, type SportSyncDatabase } from "./database";
import {
  type AuditedWriteContext,
  create_audited_entity,
  delete_audited_entities,
  delete_audited_entity,
  update_audited_entity,
} from "./InBrowserBaseRepositoryAuditedWrites";
import {
  create_paginated_result_from_options,
  paginate_entity_slice,
  sort_entities_by_options,
} from "./InBrowserBaseRepositoryHelpers";
import {
  find_all_entities,
  find_entities_by_ids,
  find_entity_by_id,
} from "./InBrowserBaseRepositoryOperations";
import {
  clear_entity_data,
  count_entities,
  seed_entities,
  table_has_data,
} from "./InBrowserBaseRepositoryTableOperations";
import {
  type RepositoryWriteOrigin,
  run_repository_write,
  USER_WRITE_ORIGIN,
} from "./InBrowserRepositoryWriteOrigin";

const AUDITED = {
  CREATE: "create",
  UPDATE: "update",
  DELETE: "delete",
} as const;

export abstract class InBrowserBaseRepository<
  TEntity extends BaseEntity,
  TCreateInput,
  TUpdateInput,
  TFilter extends object = Record<string, never>,
> implements Repository<TEntity, TCreateInput, TUpdateInput, TFilter> {
  protected entity_prefix: string;
  protected write_origin: RepositoryWriteOrigin = USER_WRITE_ORIGIN;

  protected get database(): SportSyncDatabase {
    return get_database();
  }

  constructor(entity_prefix: string) {
    this.entity_prefix = entity_prefix;
  }

  with_write_origin(origin: RepositoryWriteOrigin): this {
    const origin_bound_view = Object.create(this) as this;
    origin_bound_view.write_origin = origin;
    return origin_bound_view;
  }

  protected run_write<TData>(
    write: () => AsyncResult<TData>,
  ): AsyncResult<TData> {
    return run_repository_write(this.get_table(), this.write_origin, write);
  }

  protected abstract get_table(): Table<TEntity, string>;
  protected abstract create_entity_from_input(
    input: TCreateInput,
    id: TEntity["id"],
    timestamps: Pick<BaseEntity, "created_at" | "updated_at">,
  ): TEntity;
  protected abstract apply_updates_to_entity(
    entity: TEntity,
    updates: TUpdateInput,
  ): TEntity;

  protected apply_entity_filter(
    entities: TEntity[],
    _filter: TFilter,
  ): TEntity[] {
    return entities;
  }

  protected create_paginated_result(
    items: TEntity[],
    total_count: number,
    options?: QueryOptions,
  ): PaginatedResult<TEntity> {
    return create_paginated_result_from_options(items, total_count, options);
  }

  protected apply_sort(entities: TEntity[], options?: QueryOptions): TEntity[] {
    return sort_entities_by_options(entities, options);
  }

  protected apply_pagination(
    entities: TEntity[],
    options?: QueryOptions,
  ): TEntity[] {
    return paginate_entity_slice(entities, options);
  }

  find_all(
    filter: TFilter = {} as TFilter,
    options?: QueryOptions,
  ): PaginatedAsyncResult<TEntity> {
    return find_all_entities(
      this.get_table(),
      filter,
      this.apply_entity_filter.bind(this),
      options,
    );
  }

  find_by_id(id: ScalarValueInput<TEntity["id"]>): AsyncResult<TEntity> {
    return find_entity_by_id(this.get_table(), id);
  }

  find_by_ids(
    ids: Array<ScalarValueInput<TEntity["id"]>>,
  ): AsyncResult<TEntity[]> {
    return find_entities_by_ids(this.get_table(), ids);
  }

  create(input: TCreateInput): AsyncResult<TEntity> {
    return create_audited_entity(
      this.write_context(),
      input,
      this.entity_prefix,
      this.create_entity_from_input.bind(this),
    );
  }

  update(
    id: ScalarValueInput<TEntity["id"]>,
    updates: TUpdateInput,
  ): AsyncResult<TEntity> {
    return update_audited_entity(
      this.write_context(),
      id,
      updates,
      this.apply_updates_to_entity.bind(this),
    );
  }

  delete_by_id(id: ScalarValueInput<TEntity["id"]>): AsyncResult<boolean> {
    return delete_audited_entity(this.write_context(), id);
  }

  delete_by_ids(
    ids: Array<ScalarValueInput<TEntity["id"]>>,
  ): AsyncResult<number> {
    return delete_audited_entities(this.write_context(), ids);
  }

  private write_context(): AuditedWriteContext<TEntity> {
    return { table: this.get_table(), origin: this.write_origin };
  }

  count(): AsyncResult<number> {
    return count_entities(this.get_table(), this.entity_prefix);
  }

  seed_with_data(entities: ScalarInput<TEntity>[]): AsyncResult<number> {
    return this.run_write(() =>
      seed_entities(this.get_table(), entities, this.entity_prefix),
    );
  }

  clear_all_data(): AsyncResult<boolean> {
    return this.run_write(() =>
      clear_entity_data(this.get_table(), this.entity_prefix),
    );
  }

  has_data(): AsyncResult<boolean> {
    return table_has_data(this.get_table(), this.entity_prefix);
  }
}
