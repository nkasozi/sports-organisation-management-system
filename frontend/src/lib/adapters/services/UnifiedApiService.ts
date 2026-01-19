// Unified API service that handles all entity CRUD operations
// Follows coding rules: stateless functions, explicit return types, dependency injection
import type {
  BaseEntity,
  EntityOperationResult,
  EntityListResult,
} from "../../core/entities/BaseEntity";

export type EntityFilterFunction<T> = (entity: T) => boolean;

export interface UnifiedApiServiceInterface {
  get_entity_by_id<T extends BaseEntity>(
    entity_type: string,
    id: string,
  ): Promise<EntityOperationResult<T>>;
  get_all_entities<T extends BaseEntity>(
    entity_type: string,
    filter_function?: EntityFilterFunction<T>,
  ): Promise<EntityListResult<T>>;
  create_entity<T extends BaseEntity>(
    entity_type: string,
    entity_data: Omit<T, "id" | "created_at" | "updated_at">,
  ): Promise<EntityOperationResult<T>>;
  update_entity<T extends BaseEntity>(
    entity_type: string,
    id: string,
    updates: Partial<T>,
  ): Promise<EntityOperationResult<T>>;
  delete_entity(
    entity_type: string,
    id: string,
  ): Promise<EntityOperationResult<boolean>>;
  delete_multiple_entities(
    entity_type: string,
    ids: string[],
  ): Promise<EntityOperationResult<boolean>>;
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
  ): Promise<EntityOperationResult<T>> {
    try {
      const entities = this.get_entity_storage_for_type(entity_type);
      const found_entity = entities.get(id);

      if (!found_entity) {
        return {
          success: false,
          error_message: `Entity with id ${id} not found in ${entity_type}`,
          debug_info: `Searched in storage with ${entities.size} entities`,
        };
      }

      return {
        success: true,
        data: found_entity as T,
        debug_info: `Successfully retrieved ${entity_type} with id ${id}`,
      };
    } catch (error) {
      return {
        success: false,
        error_message: `Failed to retrieve entity: ${error}`,
        debug_info: `Error occurred while getting ${entity_type} by id ${id}`,
      };
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
  ): Promise<EntityOperationResult<T>> {
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
        return {
          success: false,
          error_message: "Failed to persist entity to storage",
          debug_info: `Entity created in memory but failed to save to localStorage for ${entity_type}`,
        };
      }

      return {
        success: true,
        data: new_entity,
        debug_info: `Successfully created ${entity_type} with id ${entity_id}`,
      };
    } catch (error) {
      return {
        success: false,
        error_message: `Failed to create entity: ${error}`,
        debug_info: `Error occurred while creating ${entity_type}`,
      };
    }
  }

  async update_entity<T extends BaseEntity>(
    entity_type: string,
    id: string,
    updates: Partial<T>,
  ): Promise<EntityOperationResult<T>> {
    try {
      const entities = this.get_entity_storage_for_type(entity_type);
      const existing_entity = entities.get(id);

      if (!existing_entity) {
        return {
          success: false,
          error_message: `Entity with id ${id} not found for update`,
          debug_info: `Attempted to update non-existent ${entity_type} with id ${id}`,
        };
      }

      const updated_entity: T = {
        ...existing_entity,
        ...updates,
        id, // Ensure ID doesn't change
        updated_at: new Date().toISOString(),
      } as T;

      entities.set(id, updated_entity);
      const save_success = this.save_entities_to_local_storage(
        entity_type,
        entities,
      );

      if (!save_success) {
        return {
          success: false,
          error_message: "Failed to persist updated entity to storage",
          debug_info: `Entity updated in memory but failed to save to localStorage for ${entity_type}`,
        };
      }

      return {
        success: true,
        data: updated_entity,
        debug_info: `Successfully updated ${entity_type} with id ${id}`,
      };
    } catch (error) {
      return {
        success: false,
        error_message: `Failed to update entity: ${error}`,
        debug_info: `Error occurred while updating ${entity_type} with id ${id}`,
      };
    }
  }

  async delete_entity(
    entity_type: string,
    id: string,
  ): Promise<EntityOperationResult<boolean>> {
    try {
      const entities = this.get_entity_storage_for_type(entity_type);
      const entity_existed = entities.has(id);

      if (!entity_existed) {
        return {
          success: false,
          error_message: `Entity with id ${id} not found for deletion`,
          debug_info: `Attempted to delete non-existent ${entity_type} with id ${id}`,
        };
      }

      entities.delete(id);
      const save_success = this.save_entities_to_local_storage(
        entity_type,
        entities,
      );

      if (!save_success) {
        return {
          success: false,
          error_message: "Failed to persist deletion to storage",
          debug_info: `Entity deleted from memory but failed to save to localStorage for ${entity_type}`,
        };
      }

      return {
        success: true,
        data: true,
        debug_info: `Successfully deleted ${entity_type} with id ${id}`,
      };
    } catch (error) {
      return {
        success: false,
        error_message: `Failed to delete entity: ${error}`,
        debug_info: `Error occurred while deleting ${entity_type} with id ${id}`,
      };
    }
  }

  async delete_multiple_entities(
    entity_type: string,
    ids: string[],
  ): Promise<EntityOperationResult<boolean>> {
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
        return {
          success: false,
          error_message: "Failed to persist bulk deletion to storage",
          debug_info: `${deleted_count} entities deleted from memory but failed to save to localStorage`,
        };
      }

      return {
        success: true,
        data: true,
        debug_info: `Successfully deleted ${deleted_count} out of ${ids.length} requested ${entity_type} entities`,
      };
    } catch (error) {
      return {
        success: false,
        error_message: `Failed to delete multiple entities: ${error}`,
        debug_info: `Error occurred while bulk deleting ${entity_type} entities`,
      };
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
