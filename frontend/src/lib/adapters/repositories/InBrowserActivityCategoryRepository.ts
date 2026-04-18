import type { Table } from "dexie";

import type {
  ActivityCategory,
  CreateActivityCategoryInput,
  UpdateActivityCategoryInput,
} from "../../core/entities/ActivityCategory";
import type { BaseEntity } from "../../core/entities/BaseEntity";
import type {
  ActivityCategoryFilter,
  ActivityCategoryRepository,
} from "../../core/interfaces/ports";
import type { QueryOptions } from "../../core/interfaces/ports";
import type { PaginatedAsyncResult } from "../../core/types/Result";
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
    id: ActivityCategory["id"],
    timestamps: Pick<BaseEntity, "created_at" | "updated_at">,
  ): ActivityCategory {
    return {
      id: id as ActivityCategory["id"],
      ...timestamps,
      name: input.name,
      description: input.description,
      organization_id: input.organization_id,
      category_type: input.category_type,
      color: input.color,
      icon: input.icon,
      is_system_generated: input.is_system_generated,
    } as ActivityCategory;
  }

  protected apply_updates_to_entity(
    entity: ActivityCategory,
    updates: UpdateActivityCategoryInput,
  ): ActivityCategory {
    return {
      ...entity,
      ...updates,
    } as ActivityCategory;
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

    if ("is_system_generated" in filter) {
      filtered = filtered.filter(
        (category) =>
          category.is_system_generated === filter.is_system_generated,
      );
    }

    return filtered;
  }

  async find_by_organization(
    organization_id: ActivityCategory["organization_id"],
    options?: QueryOptions,
  ): PaginatedAsyncResult<ActivityCategory> {
    return this.find_all({ organization_id }, options);
  }

  async find_by_category_type(
    organization_id: ActivityCategory["organization_id"],
    category_type: ActivityCategory["category_type"],
    options?: QueryOptions,
  ): PaginatedAsyncResult<ActivityCategory> {
    return this.find_all({ organization_id, category_type }, options);
  }
}

type ActivityCategoryRepositoryState =
  | { status: "uninitialized" }
  | {
      status: "ready";
      repository: InBrowserActivityCategoryRepository;
    };

let activity_category_repository_state: ActivityCategoryRepositoryState = {
  status: "uninitialized",
};

export function get_activity_category_repository(): ActivityCategoryRepository {
  if (activity_category_repository_state.status === "ready") {
    return activity_category_repository_state.repository;
  }

  const repository = new InBrowserActivityCategoryRepository();
  activity_category_repository_state = { status: "ready", repository };

  return repository;
}
