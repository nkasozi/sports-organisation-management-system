// Unified API service that handles all entity CRUD operations
// Follows coding rules: stateless functions, explicit return types, dependency injection
import type {
  BaseEntity,
  EntityListResult,
} from "../../core/entities/BaseEntity";
import type { AsyncResult } from "../../core/types/Result";
import {
  create_success_result,
  create_failure_result,
} from "../../core/types/Result";

export type EntityFilterFunction<T> = (entity: T) => boolean;

export interface UnifiedApiServiceInterface {
  get_entity_by_id<T extends BaseEntity>(
    entity_type: string,
    id: string,
  ): AsyncResult<T>;
  get_all_entities<T extends BaseEntity>(
    entity_type: string,
    filter_function?: EntityFilterFunction<T>,
  ): Promise<EntityListResult<T>>;
  create_entity<T extends BaseEntity>(
    entity_type: string,
    entity_data: Omit<T, "id" | "created_at" | "updated_at">,
  ): AsyncResult<T>;
  update_entity<T extends BaseEntity>(
    entity_type: string,
    id: string,
    updates: Partial<T>,
  ): AsyncResult<T>;
  delete_entity(entity_type: string, id: string): AsyncResult<boolean>;
  delete_multiple_entities(
    entity_type: string,
    ids: string[],
  ): AsyncResult<boolean>;
}

// In-memory implementation of the unified service
class InMemoryUnifiedApiService implements UnifiedApiServiceInterface {
  private entity_storage_map: Map<string, Map<string, BaseEntity>> = new Map();
  private storage_key_prefix = "sports_unified_storage_";

  private load_entities_from_local_storage(
    entity_type: string,
  ): Map<string, BaseEntity> {
    if (typeof window === "undefined") {
      return new Map();
    }

    const normalized_type = entity_type.toLowerCase();
    const storage_key = `${this.storage_key_prefix}${normalized_type}`;
    const stored_data = localStorage.getItem(storage_key);

    if (!stored_data) {
      return new Map();
    }

    try {
      const parsed_data = JSON.parse(stored_data);
      const entity_map = new Map<string, BaseEntity>();

      Object.entries(parsed_data).forEach(([id, entity]) => {
        entity_map.set(id, entity as BaseEntity);
      });

      return entity_map;
    } catch (error) {
      console.warn(`Failed to parse stored data for ${entity_type}:`, error);
      return new Map();
    }
  }

  private save_entities_to_local_storage(
    entity_type: string,
    entities: Map<string, BaseEntity>,
  ): boolean {
    if (typeof window === "undefined") {
      return false;
    }

    try {
      const normalized_type = entity_type.toLowerCase();
      const storage_key = `${this.storage_key_prefix}${normalized_type}`;
      const entities_object = Object.fromEntries(entities);
      localStorage.setItem(storage_key, JSON.stringify(entities_object));
      return true;
    } catch (error) {
      console.error(`Failed to save entities for ${entity_type}:`, error);
      return false;
    }
  }

  private get_entity_storage_for_type(
    entity_type: string,
  ): Map<string, BaseEntity> {
    const normalized_type = entity_type.toLowerCase();
    if (!this.entity_storage_map.has(normalized_type)) {
      const loaded_entities =
        this.load_entities_from_local_storage(normalized_type);
      this.entity_storage_map.set(normalized_type, loaded_entities);
    }
    return this.entity_storage_map.get(normalized_type)!;
  }

  async get_entity_by_id<T extends BaseEntity>(
    entity_type: string,
    id: string,
  ): AsyncResult<T> {
    try {
      const entities = this.get_entity_storage_for_type(entity_type);
      const found_entity = entities.get(id);

      if (!found_entity) {
        return create_failure_result(
          `Entity with id ${id} not found in ${entity_type}`,
        );
      }

      return create_success_result(found_entity as T);
    } catch (error) {
      return create_failure_result(`Failed to retrieve entity: ${error}`);
    }
  }

  async get_all_entities<T extends BaseEntity>(
    entity_type: string,
    filter_function?: EntityFilterFunction<T>,
  ): Promise<EntityListResult<T>> {
    try {
      const entities = this.get_entity_storage_for_type(entity_type);
      let entities_array = Array.from(entities.values()) as T[];

      if (filter_function) {
        entities_array = entities_array.filter(filter_function);
      }

      return {
        success: true,
        data: entities_array,
        total_count: entities_array.length,
        debug_info: `Retrieved ${entities_array.length} entities of type ${entity_type}`,
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        total_count: 0,
        error_message: `Failed to retrieve entities: ${error}`,
        debug_info: `Error occurred while getting all ${entity_type} entities`,
      };
    }
  }

  async create_entity<T extends BaseEntity>(
    entity_type: string,
    entity_data: Omit<T, "id" | "created_at" | "updated_at">,
  ): AsyncResult<T> {
    try {
      const entities = this.get_entity_storage_for_type(entity_type);
      const entity_id = this.generate_unique_entity_id(entity_type);
      const now = new Date().toISOString();

      const new_entity: T = {
        ...entity_data,
        id: entity_id,
        created_at: now,
        updated_at: now,
      } as T;

      entities.set(entity_id, new_entity);
      const save_success = this.save_entities_to_local_storage(
        entity_type,
        entities,
      );

      if (!save_success) {
        return create_failure_result("Failed to persist entity to storage");
      }

      return create_success_result(new_entity);
    } catch (error) {
      return create_failure_result(`Failed to create entity: ${error}`);
    }
  }

  async update_entity<T extends BaseEntity>(
    entity_type: string,
    id: string,
    updates: Partial<T>,
  ): AsyncResult<T> {
    try {
      const entities = this.get_entity_storage_for_type(entity_type);
      const existing_entity = entities.get(id);

      if (!existing_entity) {
        return create_failure_result(
          `Entity with id ${id} not found for update`,
        );
      }

      const updated_entity: T = {
        ...existing_entity,
        ...updates,
        id,
        updated_at: new Date().toISOString(),
      } as T;

      entities.set(id, updated_entity);
      const save_success = this.save_entities_to_local_storage(
        entity_type,
        entities,
      );

      if (!save_success) {
        return create_failure_result(
          "Failed to persist updated entity to storage",
        );
      }

      return create_success_result(updated_entity);
    } catch (error) {
      return create_failure_result(`Failed to update entity: ${error}`);
    }
  }

  async delete_entity(entity_type: string, id: string): AsyncResult<boolean> {
    try {
      const entities = this.get_entity_storage_for_type(entity_type);
      const entity_existed = entities.has(id);

      if (!entity_existed) {
        return create_failure_result(
          `Entity with id ${id} not found for deletion`,
        );
      }

      entities.delete(id);
      const save_success = this.save_entities_to_local_storage(
        entity_type,
        entities,
      );

      if (!save_success) {
        return create_failure_result("Failed to persist deletion to storage");
      }

      return create_success_result(true);
    } catch (error) {
      return create_failure_result(`Failed to delete entity: ${error}`);
    }
  }

  async delete_multiple_entities(
    entity_type: string,
    ids: string[],
  ): AsyncResult<boolean> {
    try {
      const entities = this.get_entity_storage_for_type(entity_type);
      let deleted_count = 0;

      for (const id of ids) {
        if (entities.has(id)) {
          entities.delete(id);
          deleted_count++;
        }
      }

      const save_success = this.save_entities_to_local_storage(
        entity_type,
        entities,
      );

      if (!save_success) {
        return create_failure_result(
          "Failed to persist bulk deletion to storage",
        );
      }

      return create_success_result(true);
    } catch (error) {
      return create_failure_result(
        `Failed to delete multiple entities: ${error}`,
      );
    }
  }

  private generate_unique_entity_id(entity_type: string): string {
    const timestamp = Date.now();
    const random_part = Math.random().toString(36).substring(2, 15);
    return `${entity_type}-${timestamp}-${random_part}`;
  }
}

// Export the service instance
export const unifiedApiService: UnifiedApiServiceInterface =
  new InMemoryUnifiedApiService();
