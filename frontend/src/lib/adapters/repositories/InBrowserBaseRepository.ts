import type { Table } from "dexie";
import type { BaseEntity } from "../../core/entities/BaseEntity";
import type {
  AsyncResult,
  PaginatedAsyncResult,
} from "../../core/types/Result";
import {
  create_success_result,
  create_failure_result,
} from "../../core/types/Result";
import type { QueryOptions, Repository } from "../../core/interfaces/ports";
import {
  generate_unique_id,
  create_timestamp_fields,
  update_timestamp,
} from "../../core/entities/BaseEntity";
import { get_database, type SportSyncDatabase } from "./database";
import {
  format_repository_error,
  create_paginated_result_from_options,
  sort_entities_by_options,
  paginate_entity_slice,
} from "./InBrowserBaseRepositoryHelpers";

export abstract class InBrowserBaseRepository<
  TEntity extends BaseEntity,
  TCreateInput,
  TUpdateInput,
  TFilter = undefined,
> implements Repository<TEntity, TCreateInput, TUpdateInput, TFilter> {
  protected entity_prefix: string;

  protected get database(): SportSyncDatabase {
    return get_database();
  }

  constructor(entity_prefix: string) {
    this.entity_prefix = entity_prefix;
  }

  protected abstract get_table(): Table<TEntity, string>;
  protected abstract create_entity_from_input(
    input: TCreateInput,
    id: string,
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
  ) {
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

  async find_all(
    filter?: TFilter,
    options?: QueryOptions,
  ): PaginatedAsyncResult<TEntity> {
    try {
      let all_entities = await this.get_table().toArray();
      if (filter) {
        all_entities = this.apply_entity_filter(all_entities, filter);
      }
      const total_count = all_entities.length;
      const sorted = sort_entities_by_options(all_entities, options);
      const paginated = paginate_entity_slice(sorted, options);
      return create_success_result(
        create_paginated_result_from_options(paginated, total_count, options),
      );
    } catch (error) {
      return create_failure_result(
        format_repository_error(error, "fetch entities"),
      );
    }
  }

  async find_by_id(id: string): AsyncResult<TEntity> {
    try {
      const entity = await this.get_table().get(id);
      if (!entity)
        return create_failure_result(`Entity with id '${id}' not found`);
      return create_success_result(entity);
    } catch (error) {
      return create_failure_result(
        format_repository_error(error, "fetch entity by id"),
      );
    }
  }

  async find_by_ids(ids: string[]): AsyncResult<TEntity[]> {
    try {
      const entities = await this.get_table().bulkGet(ids);
      return create_success_result(
        entities.filter((e): e is TEntity => e !== undefined),
      );
    } catch (error) {
      return create_failure_result(
        format_repository_error(error, "fetch entities by ids"),
      );
    }
  }

  async create(input: TCreateInput): AsyncResult<TEntity> {
    try {
      const entity_id = generate_unique_id(this.entity_prefix);
      const new_entity = this.create_entity_from_input(
        input,
        entity_id,
        create_timestamp_fields(),
      );
      await this.get_table().add(new_entity);
      return create_success_result(new_entity);
    } catch (error) {
      return create_failure_result(
        format_repository_error(error, "create entity"),
      );
    }
  }

  async update(id: string, updates: TUpdateInput): AsyncResult<TEntity> {
    try {
      const existing = await this.get_table().get(id);
      if (!existing)
        return create_failure_result(`Entity with id '${id}' not found`);
      const updated_entity = update_timestamp(
        this.apply_updates_to_entity(existing, updates),
      );
      await this.get_table().put(updated_entity);
      return create_success_result(updated_entity);
    } catch (error) {
      return create_failure_result(
        format_repository_error(error, "update entity"),
      );
    }
  }

  async delete_by_id(id: string): AsyncResult<boolean> {
    try {
      const existing = await this.get_table().get(id);
      if (!existing)
        return create_failure_result(`Entity with id '${id}' not found`);
      await this.get_table().delete(id);
      return create_success_result(true);
    } catch (error) {
      return create_failure_result(
        format_repository_error(error, "delete entity"),
      );
    }
  }

  async delete_by_ids(ids: string[]): AsyncResult<number> {
    try {
      await this.get_table().bulkDelete(ids);
      return create_success_result(ids.length);
    } catch (error) {
      return create_failure_result(
        format_repository_error(error, "delete entities"),
      );
    }
  }

  async count(): AsyncResult<number> {
    try {
      return create_success_result(await this.get_table().count());
    } catch (error) {
      return create_failure_result(
        format_repository_error(error, "count entities"),
      );
    }
  }

  async seed_with_data(entities: TEntity[]): AsyncResult<number> {
    try {
      await this.get_table().bulkPut(entities);
      console.log(
        `[${this.entity_prefix}] Seeded ${entities.length} records successfully`,
      );
      return create_success_result(entities.length);
    } catch (error) {
      console.error(`[${this.entity_prefix}] Failed to seed data:`, error);
      return create_failure_result(
        format_repository_error(error, `seed ${this.entity_prefix}`),
      );
    }
  }

  async clear_all_data(): Promise<void> {
    try {
      await this.get_table().clear();
    } catch (error) {
      console.error(`[${this.entity_prefix}] Failed to clear data`, {
        event: "repository_clear_failed",
        entity_prefix: this.entity_prefix,
        error: String(error),
      });
    }
  }

  async has_data(): Promise<boolean> {
    try {
      return (await this.get_table().count()) > 0;
    } catch (error) {
      console.warn(`[${this.entity_prefix}] Failed to check data existence`, {
        event: "repository_has_data_check_failed",
        entity_prefix: this.entity_prefix,
        error: String(error),
      });
      return false;
    }
  }
}
