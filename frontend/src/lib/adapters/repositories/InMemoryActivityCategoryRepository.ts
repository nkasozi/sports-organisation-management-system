import type { BaseEntity } from "../../core/entities/BaseEntity";
import type { QueryOptions } from "../../core/interfaces/adapters/Repository";
import type { PaginatedAsyncResult } from "../../core/types/Result";
import { create_success_result } from "../../core/types/Result";
import {
  type ActivityCategory,
  type CreateActivityCategoryInput,
  type UpdateActivityCategoryInput,
} from "../../core/entities/ActivityCategory";
import type {
  ActivityCategoryRepository,
  ActivityCategoryFilter,
} from "../../core/interfaces/adapters/ActivityCategoryRepository";
import { InMemoryBaseRepository } from "./InMemoryBaseRepository";

const STORAGE_KEY = "sports_org_activity_categories";
const ENTITY_PREFIX = "activity_category";

export class InMemoryActivityCategoryRepository
  extends InMemoryBaseRepository<
    ActivityCategory,
    CreateActivityCategoryInput,
    UpdateActivityCategoryInput
  >
  implements ActivityCategoryRepository
{
  constructor() {
    super(STORAGE_KEY, ENTITY_PREFIX);
  }

  protected create_entity_from_input(
    input: CreateActivityCategoryInput,
    id: string,
    timestamps: Pick<BaseEntity, "created_at" | "updated_at">,
  ): ActivityCategory {
    return {
      id,
      ...timestamps,
      ...input,
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

  async find_by_filter(
    filter: ActivityCategoryFilter,
    options?: QueryOptions,
  ): PaginatedAsyncResult<ActivityCategory> {
    await this.simulate_network_delay();
    this.ensure_cache_initialized();

    let filtered_categories = Array.from(this.entity_cache.values());

    if (filter.name_contains) {
      const search_term = filter.name_contains.toLowerCase();
      filtered_categories = filtered_categories.filter((category) =>
        category.name.toLowerCase().includes(search_term),
      );
    }

    if (filter.organization_id) {
      filtered_categories = filtered_categories.filter(
        (category) => category.organization_id === filter.organization_id,
      );
    }

    if (filter.category_type) {
      filtered_categories = filtered_categories.filter(
        (category) => category.category_type === filter.category_type,
      );
    }

    if (filter.is_system_generated !== undefined) {
      filtered_categories = filtered_categories.filter(
        (category) =>
          category.is_system_generated === filter.is_system_generated,
      );
    }

    const total_count = filtered_categories.length;
    const paginated_categories = this.apply_pagination_and_sort(
      filtered_categories,
      options,
    );

    return create_success_result(
      this.create_paginated_result(paginated_categories, total_count, options),
    );
  }

  async find_by_organization(
    organization_id: string,
    options?: QueryOptions,
  ): PaginatedAsyncResult<ActivityCategory> {
    return this.find_by_filter({ organization_id }, options);
  }

  async find_by_category_type(
    organization_id: string,
    category_type: ActivityCategory["category_type"],
    options?: QueryOptions,
  ): PaginatedAsyncResult<ActivityCategory> {
    return this.find_by_filter({ organization_id, category_type }, options);
  }
}

let repository_instance: InMemoryActivityCategoryRepository | null = null;

export function get_activity_category_repository(): ActivityCategoryRepository {
  if (!repository_instance) {
    repository_instance = new InMemoryActivityCategoryRepository();
  }
  return repository_instance;
}

export function reset_activity_category_repository(): void {
  repository_instance = null;
}
