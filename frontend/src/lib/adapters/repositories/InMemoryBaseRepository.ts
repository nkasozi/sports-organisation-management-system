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

const SIMULATED_NETWORK_DELAY_MS = 150;

export abstract class InMemoryBaseRepository<
  TEntity extends BaseEntity,
  TCreateInput,
  TUpdateInput,
> implements Repository<TEntity, TCreateInput, TUpdateInput> {
  protected storage_key: string;
  protected entity_prefix: string;
  protected entity_cache: Map<string, TEntity> = new Map();
  protected is_cache_initialized: boolean = false;

  constructor(storage_key: string, entity_prefix: string) {
    this.storage_key = storage_key;
    this.entity_prefix = entity_prefix;
  }

  protected abstract create_entity_from_input(
    input: TCreateInput,
    id: string,
    timestamps: Pick<BaseEntity, "created_at" | "updated_at">,
  ): TEntity;

  protected abstract apply_updates_to_entity(
    entity: TEntity,
    updates: TUpdateInput,
  ): TEntity;

  protected async simulate_network_delay(): Promise<void> {
    await new Promise((resolve) =>
      setTimeout(resolve, SIMULATED_NETWORK_DELAY_MS),
    );
  }

  protected load_from_local_storage(): Map<string, TEntity> {
    if (typeof window === "undefined") {
      return new Map();
    }

    const stored_data = localStorage.getItem(this.storage_key);
    if (!stored_data) {
      return new Map();
    }

    try {
      const parsed_array: TEntity[] = JSON.parse(stored_data);
      const entity_map = new Map<string, TEntity>();

      for (const entity of parsed_array) {
        entity_map.set(entity.id, entity);
      }

      return entity_map;
    } catch (error) {
      console.warn(`[${this.storage_key}] Failed to parse stored data:`, error);
      return new Map();
    }
  }

  protected save_to_local_storage(): boolean {
    if (typeof window === "undefined") {
      return false;
    }

    try {
      const entities_array = Array.from(this.entity_cache.values());
      localStorage.setItem(this.storage_key, JSON.stringify(entities_array));
      return true;
    } catch (error) {
      console.error(
        `[${this.storage_key}] Failed to save to localStorage:`,
        error,
      );
      return false;
    }
  }

  protected ensure_cache_initialized(): void {
    if (this.is_cache_initialized) {
      return;
    }

    this.entity_cache = this.load_from_local_storage();
    this.is_cache_initialized = true;
  }

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

  protected apply_pagination_and_sort(
    entities: TEntity[],
    options?: QueryOptions,
  ): TEntity[] {
    let result = [...entities];

    if (options?.sort_by) {
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
    }

    if (options?.page_number && options?.page_size) {
      const start_index = (options.page_number - 1) * options.page_size;
      const end_index = start_index + options.page_size;
      result = result.slice(start_index, end_index);
    }

    return result;
  }

  async find_all(options?: QueryOptions): PaginatedAsyncResult<TEntity> {
    await this.simulate_network_delay();
    this.ensure_cache_initialized();

    const all_entities = Array.from(this.entity_cache.values());
    const total_count = all_entities.length;
    const paginated_entities = this.apply_pagination_and_sort(
      all_entities,
      options,
    );

    return create_success_result(
      this.create_paginated_result(paginated_entities, total_count, options),
    );
  }

  async find_by_id(id: string): AsyncResult<TEntity> {
    await this.simulate_network_delay();
    this.ensure_cache_initialized();

    const entity = this.entity_cache.get(id);

    if (!entity) {
      return create_failure_result(`Entity with id '${id}' not found`);
    }

    return create_success_result({ ...entity });
  }

  async find_by_ids(ids: string[]): AsyncResult<TEntity[]> {
    await this.simulate_network_delay();
    this.ensure_cache_initialized();

    const found_entities: TEntity[] = [];

    for (const id of ids) {
      const entity = this.entity_cache.get(id);
      if (entity) {
        found_entities.push({ ...entity });
      }
    }

    return create_success_result(found_entities);
  }

  async create(input: TCreateInput): AsyncResult<TEntity> {
    await this.simulate_network_delay();
    this.ensure_cache_initialized();

    const entity_id = generate_unique_id(this.entity_prefix);
    const timestamps = create_timestamp_fields();
    const new_entity = this.create_entity_from_input(
      input,
      entity_id,
      timestamps,
    );

    this.entity_cache.set(entity_id, new_entity);
    this.save_to_local_storage();

    return create_success_result({ ...new_entity });
  }

  async update(id: string, updates: TUpdateInput): AsyncResult<TEntity> {
    await this.simulate_network_delay();
    this.ensure_cache_initialized();

    const existing_entity = this.entity_cache.get(id);

    if (!existing_entity) {
      return create_failure_result(`Entity with id '${id}' not found`);
    }

    const updated_entity = update_timestamp(
      this.apply_updates_to_entity(existing_entity, updates),
    );
    this.entity_cache.set(id, updated_entity);
    this.save_to_local_storage();

    return create_success_result({ ...updated_entity });
  }

  async delete_by_id(id: string): AsyncResult<boolean> {
    await this.simulate_network_delay();
    this.ensure_cache_initialized();

    const existed = this.entity_cache.has(id);

    if (!existed) {
      return create_failure_result(`Entity with id '${id}' not found`);
    }

    this.entity_cache.delete(id);
    this.save_to_local_storage();

    return create_success_result(true);
  }

  async delete_by_ids(ids: string[]): AsyncResult<number> {
    await this.simulate_network_delay();
    this.ensure_cache_initialized();

    let deleted_count = 0;

    for (const id of ids) {
      if (this.entity_cache.has(id)) {
        this.entity_cache.delete(id);
        deleted_count++;
      }
    }

    this.save_to_local_storage();

    return create_success_result(deleted_count);
  }

  async count(): AsyncResult<number> {
    await this.simulate_network_delay();
    this.ensure_cache_initialized();

    return create_success_result(this.entity_cache.size);
  }

  seed_with_data(entities: TEntity[]): void {
    this.ensure_cache_initialized();

    for (const entity of entities) {
      this.entity_cache.set(entity.id, entity);
    }

    this.save_to_local_storage();
  }

  clear_all_data(): void {
    this.entity_cache.clear();
    this.save_to_local_storage();
  }
}
