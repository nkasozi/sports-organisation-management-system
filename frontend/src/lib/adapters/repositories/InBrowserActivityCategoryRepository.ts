import type { Table } from "dexie";
import type {
  ActivityCategory,
  CreateActivityCategoryInput,
  UpdateActivityCategoryInput,
} from "../../core/entities/ActivityCategory";
import type { BaseEntity } from "../../core/entities/BaseEntity";
import type {
  ActivityCategoryRepository,
  ActivityCategoryFilter,
} from "../../core/interfaces/ports";
import type { QueryOptions } from "../../core/interfaces/ports";
import type { PaginatedAsyncResult } from "../../core/types/Result";
import {
  create_success_result,
  create_failure_result,
} from "../../core/types/Result";
import { InBrowserBaseRepository } from "./InBrowserBaseRepository";

const ENTITY_PREFIX = "activity_category";

class InBrowserActivityCategoryRepository
  extends InBrowserBaseRepository<
    ActivityCategory,
    CreateActivityCategoryInput,
    UpdateActivityCategoryInput,
    ActivityCategoryFilter
  >
  implements ActivityCategoryRepository
{
  constructor() {
    super(ENTITY_PREFIX);
  }

  protected get_table(): Table<ActivityCategory, string> {
    return this.database.activity_categories;
  }

  protected create_entity_from_input(
    input: CreateActivityCategoryInput,
    id: string,
    timestamps: Pick<BaseEntity, "created_at" | "updated_at">,
  ): ActivityCategory {
    return {
      id,
      ...timestamps,
      name: input.name,
      description: input.description,
      organization_id: input.organization_id,
      category_type: input.category_type,
      color: input.color,
      icon: input.icon,
      is_system_generated: input.is_system_generated,
    };
  }

  protected apply_updates_to_entity(
    entity: ActivityCategory,
    updates: UpdateActivityCategoryInput,
  ): ActivityCategory {
    return {
      ...entity,
      ...updates,
    };
  }

  protected apply_entity_filter(
    entities: ActivityCategory[],
    filter: ActivityCategoryFilter,
  ): ActivityCategory[] {
    let filtered = entities;

    if (filter.name_contains) {
      const search_term = filter.name_contains.toLowerCase();
      filtered = filtered.filter((category) =>
        category.name.toLowerCase().includes(search_term),
      );
    }

    if (filter.organization_id) {
      filtered = filtered.filter(
        (category) => category.organization_id === filter.organization_id,
      );
    }

    if (filter.category_type) {
      filtered = filtered.filter(
        (category) => category.category_type === filter.category_type,
      );
    }

    if (filter.is_system_generated !== undefined) {
      filtered = filtered.filter(
        (category) =>
          category.is_system_generated === filter.is_system_generated,
      );
    }

    return filtered;
  }

  async find_by_organization(
    organization_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<ActivityCategory> {
    return this.find_all({ organization_id }, options);
  }

  async find_by_category_type(
    organization_id: string,
    category_type: ActivityCategory["category_type"],
    options?: QueryOptions,
  ): PaginatedAsyncResult<ActivityCategory> {
    return this.find_all({ organization_id, category_type }, options);
  }
}

let singleton_instance: InBrowserActivityCategoryRepository | null = null;

export function get_activity_category_repository(): ActivityCategoryRepository {
  if (!singleton_instance) {
    singleton_instance = new InBrowserActivityCategoryRepository();
  }
  return singleton_instance;
}
