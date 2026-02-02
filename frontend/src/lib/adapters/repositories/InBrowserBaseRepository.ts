import type { Table } from "dexie";
import type { BaseEntity } from "../../core/entities/BaseEntity";
import type {
  AsyncResult,
  PaginatedAsyncResult,
  PaginatedResult,
} from "../../core/types/Result";
import {
  create_success_result,
  create_failure_result,
} from "../../core/types/Result";
import type {
  QueryOptions,
  Repository,
} from "../../core/interfaces/adapters/Repository";
import {
  generate_unique_id,
  create_timestamp_fields,
  update_timestamp,
} from "../../core/entities/BaseEntity";
import { get_database, type SportsOrgDatabase } from "./database";

export abstract class InBrowserBaseRepository<
  TEntity extends BaseEntity,
  TCreateInput,
  TUpdateInput,
> implements Repository<TEntity, TCreateInput, TUpdateInput> {
  protected entity_prefix: string;
  protected database: SportsOrgDatabase;

  constructor(entity_prefix: string) {
    this.entity_prefix = entity_prefix;
    this.database = get_database();
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

  protected create_paginated_result(
    items: TEntity[],
    total_count: number,
    options?: QueryOptions,
  ): PaginatedResult<TEntity> {
    const page_size = options?.page_size ?? 20;
    const page_number = options?.page_number ?? 1;
    const total_pages = Math.ceil(total_count / page_size);

    return {
      items,
      total_count,
      page_number,
      page_size,
      total_pages,
    };
  }

  protected apply_sort(entities: TEntity[], options?: QueryOptions): TEntity[] {
    if (!options?.sort_by) {
      return entities;
    }

    const result = [...entities];
    const sort_field = options.sort_by as keyof TEntity;
    const direction_multiplier = options.sort_direction === "desc" ? -1 : 1;

    result.sort((a, b) => {
      const value_a = a[sort_field];
      const value_b = b[sort_field];

      if (typeof value_a === "string" && typeof value_b === "string") {
        return value_a.localeCompare(value_b) * direction_multiplier;
      }

      if (value_a < value_b) return -1 * direction_multiplier;
      if (value_a > value_b) return 1 * direction_multiplier;
      return 0;
    });

    return result;
  }

  protected apply_pagination(
    entities: TEntity[],
    options?: QueryOptions,
  ): TEntity[] {
    if (!options?.page_number || !options?.page_size) {
      return entities;
    }

    const start_index = (options.page_number - 1) * options.page_size;
    const end_index = start_index + options.page_size;
    return entities.slice(start_index, end_index);
  }

  async find_all(options?: QueryOptions): PaginatedAsyncResult<TEntity> {
    try {
      const table = this.get_table();
      const all_entities = await table.toArray();
      const total_count = all_entities.length;

      const sorted_entities = this.apply_sort(all_entities, options);
      const paginated_entities = this.apply_pagination(
        sorted_entities,
        options,
      );

      return create_success_result(
        this.create_paginated_result(paginated_entities, total_count, options),
      );
    } catch (error) {
      const error_message =
        error instanceof Error ? error.message : "Unknown error occurred";
      return create_failure_result(
        `Failed to fetch entities: ${error_message}`,
      );
    }
  }

  async find_by_id(id: string): AsyncResult<TEntity> {
    try {
      const table = this.get_table();
      const entity = await table.get(id);

      if (!entity) {
        return create_failure_result(`Entity with id '${id}' not found`);
      }

      return create_success_result(entity);
    } catch (error) {
      const error_message =
        error instanceof Error ? error.message : "Unknown error occurred";
      return create_failure_result(
        `Failed to fetch entity by id: ${error_message}`,
      );
    }
  }

  async find_by_ids(ids: string[]): AsyncResult<TEntity[]> {
    try {
      const table = this.get_table();
      const entities = await table.bulkGet(ids);
      const found_entities = entities.filter(
        (entity): entity is TEntity => entity !== undefined,
      );

      return create_success_result(found_entities);
    } catch (error) {
      const error_message =
        error instanceof Error ? error.message : "Unknown error occurred";
      return create_failure_result(
        `Failed to fetch entities by ids: ${error_message}`,
      );
    }
  }

  async create(input: TCreateInput): AsyncResult<TEntity> {
    try {
      const entity_id = generate_unique_id(this.entity_prefix);
      const timestamps = create_timestamp_fields();
      const new_entity = this.create_entity_from_input(
        input,
        entity_id,
        timestamps,
      );

      const table = this.get_table();
      await table.add(new_entity);

      return create_success_result(new_entity);
    } catch (error) {
      const error_message =
        error instanceof Error ? error.message : "Unknown error occurred";
      return create_failure_result(`Failed to create entity: ${error_message}`);
    }
  }

  async update(id: string, updates: TUpdateInput): AsyncResult<TEntity> {
    try {
      const table = this.get_table();
      const existing_entity = await table.get(id);

      if (!existing_entity) {
        return create_failure_result(`Entity with id '${id}' not found`);
      }

      const updated_entity = update_timestamp(
        this.apply_updates_to_entity(existing_entity, updates),
      );

      await table.put(updated_entity);

      return create_success_result(updated_entity);
    } catch (error) {
      const error_message =
        error instanceof Error ? error.message : "Unknown error occurred";
      return create_failure_result(`Failed to update entity: ${error_message}`);
    }
  }

  async delete_by_id(id: string): AsyncResult<boolean> {
    try {
      const table = this.get_table();
      const existing_entity = await table.get(id);

      if (!existing_entity) {
        return create_failure_result(`Entity with id '${id}' not found`);
      }

      await table.delete(id);

      return create_success_result(true);
    } catch (error) {
      const error_message =
        error instanceof Error ? error.message : "Unknown error occurred";
      return create_failure_result(`Failed to delete entity: ${error_message}`);
    }
  }

  async delete_by_ids(ids: string[]): AsyncResult<number> {
    try {
      const table = this.get_table();
      await table.bulkDelete(ids);

      return create_success_result(ids.length);
    } catch (error) {
      const error_message =
        error instanceof Error ? error.message : "Unknown error occurred";
      return create_failure_result(
        `Failed to delete entities: ${error_message}`,
      );
    }
  }

  async count(): AsyncResult<number> {
    try {
      const table = this.get_table();
      const count = await table.count();

      return create_success_result(count);
    } catch (error) {
      const error_message =
        error instanceof Error ? error.message : "Unknown error occurred";
      return create_failure_result(
        `Failed to count entities: ${error_message}`,
      );
    }
  }

  async seed_with_data(entities: TEntity[]): Promise<void> {
    try {
      const table = this.get_table();
      await table.bulkPut(entities);
    } catch (error) {
      console.error(`[${this.entity_prefix}] Failed to seed data:`, error);
    }
  }

  async clear_all_data(): Promise<void> {
    try {
      const table = this.get_table();
      await table.clear();
    } catch (error) {
      console.error(`[${this.entity_prefix}] Failed to clear data:`, error);
    }
  }

  async has_data(): Promise<boolean> {
    try {
      const table = this.get_table();
      const count = await table.count();
      return count > 0;
    } catch {
      return false;
    }
  }
}
