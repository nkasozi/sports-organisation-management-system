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
  create_paginated_result_from_options,
  paginate_entity_slice,
  sort_entities_by_options,
} from "./InBrowserBaseRepositoryHelpers";
import {
  create_entity,
  delete_entities_by_ids,
  delete_existing_entity,
  find_all_entities,
  find_entities_by_ids,
  find_entity_by_id,
  write_updated_entity,
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
    return this.run_write(() =>
      create_entity(
        this.get_table(),
        input,
        this.entity_prefix,
        this.create_entity_from_input.bind(this),
      ),
    );
  }

  async update(
    id: ScalarValueInput<TEntity["id"]>,
    updates: TUpdateInput,
  ): AsyncResult<TEntity> {
    const existing_entity_result = await find_entity_by_id(
      this.get_table(),
      id,
    );
    if (!existing_entity_result.success) return existing_entity_result;
    return this.run_write(() =>
      write_updated_entity(
        this.get_table(),
        existing_entity_result.data,
        updates,
        this.apply_updates_to_entity.bind(this),
      ),
    );
  }

  async delete_by_id(
    id: ScalarValueInput<TEntity["id"]>,
  ): AsyncResult<boolean> {
    const existing_entity_result = await find_entity_by_id(
      this.get_table(),
      id,
    );
    if (!existing_entity_result.success) return existing_entity_result;
    return this.run_write(() => delete_existing_entity(this.get_table(), id));
  }

  delete_by_ids(
    ids: Array<ScalarValueInput<TEntity["id"]>>,
  ): AsyncResult<number> {
    return this.run_write(() => delete_entities_by_ids(this.get_table(), ids));
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
