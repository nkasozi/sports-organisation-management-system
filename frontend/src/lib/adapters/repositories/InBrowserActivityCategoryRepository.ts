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
} from "../../core/interfaces/adapters/ActivityCategoryRepository";
import type { QueryOptions } from "../../core/interfaces/adapters/Repository";
import type { PaginatedAsyncResult } from "../../core/types/Result";
import {
  create_success_result,
  create_failure_result,
} from "../../core/types/Result";
import { InBrowserBaseRepository } from "./InBrowserBaseRepository";
import { get_organization_repository } from "./InBrowserOrganizationRepository";

const ENTITY_PREFIX = "activity_category";

export class InBrowserActivityCategoryRepository
  extends InBrowserBaseRepository<
    ActivityCategory,
    CreateActivityCategoryInput,
    UpdateActivityCategoryInput
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

  async find_by_filter(
    filter: ActivityCategoryFilter,
    options?: QueryOptions,
  ): PaginatedAsyncResult<ActivityCategory> {
    try {
      let filtered_entities = await this.database.activity_categories.toArray();

      if (filter.name_contains) {
        const search_term = filter.name_contains.toLowerCase();
        filtered_entities = filtered_entities.filter((category) =>
          category.name.toLowerCase().includes(search_term),
        );
      }

      if (filter.organization_id) {
        filtered_entities = filtered_entities.filter(
          (category) => category.organization_id === filter.organization_id,
        );
      }

      if (filter.category_type) {
        filtered_entities = filtered_entities.filter(
          (category) => category.category_type === filter.category_type,
        );
      }

      if (filter.is_system_generated !== undefined) {
        filtered_entities = filtered_entities.filter(
          (category) =>
            category.is_system_generated === filter.is_system_generated,
        );
      }

      const total_count = filtered_entities.length;
      const sorted_entities = this.apply_sort(filtered_entities, options);
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
        `Failed to filter activity categories: ${error_message}`,
      );
    }
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

async function get_default_organization_id(): Promise<string> {
  const organization_repository = get_organization_repository();
  const result = await organization_repository.find_all({ page_size: 1 });

  if (result.success && result.data.items.length > 0) {
    return result.data.items[0].id;
  }

  return "org_default_1";
}

export async function create_default_activity_categories(): Promise<
  ActivityCategory[]
> {
  const now = new Date().toISOString();
  const organization_id = await get_default_organization_id();

  return [
    {
      id: "activity_category_competition",
      name: "Competition",
      description: "Official competition matches and tournaments",
      organization_id,
      category_type: "competition",
      color: "#3B82F6",
      icon: "trophy",
      is_system_generated: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: "activity_category_fixture",
      name: "Fixture",
      description: "Scheduled match fixtures",
      organization_id,
      category_type: "fixture",
      color: "#22C55E",
      icon: "calendar",
      is_system_generated: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: "activity_category_training",
      name: "Training",
      description: "Team training sessions and practice",
      organization_id,
      category_type: "training",
      color: "#F59E0B",
      icon: "users",
      is_system_generated: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: "activity_category_administrative",
      name: "Administrative",
      description: "Administrative meetings and paperwork",
      organization_id,
      category_type: "administrative",
      color: "#6366F1",
      icon: "briefcase",
      is_system_generated: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: "activity_category_transfer_window",
      name: "Transfer Window",
      description: "Player transfer period activities",
      organization_id,
      category_type: "transfer_window",
      color: "#EC4899",
      icon: "clipboard",
      is_system_generated: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: "activity_category_meeting",
      name: "Meeting",
      description: "Team meetings and briefings",
      organization_id,
      category_type: "meeting",
      color: "#14B8A6",
      icon: "users",
      is_system_generated: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: "activity_category_medical",
      name: "Medical",
      description: "Medical checkups and health assessments",
      organization_id,
      category_type: "medical",
      color: "#EF4444",
      icon: "heart",
      is_system_generated: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: "activity_category_travel",
      name: "Travel",
      description: "Team travel and transportation",
      organization_id,
      category_type: "travel",
      color: "#0EA5E9",
      icon: "plane",
      is_system_generated: true,
      created_at: now,
      updated_at: now,
    },
  ];
}

let singleton_instance: InBrowserActivityCategoryRepository | null = null;

export function get_activity_category_repository(): ActivityCategoryRepository {
  if (!singleton_instance) {
    singleton_instance = new InBrowserActivityCategoryRepository();
  }
  return singleton_instance;
}

export async function initialize_activity_category_repository(): Promise<void> {
  const repository =
    get_activity_category_repository() as InBrowserActivityCategoryRepository;
  const has_data = await repository.has_data();

  if (!has_data) {
    const default_categories = await create_default_activity_categories();
    await repository.seed_with_data(default_categories);
  }
}

export async function reset_activity_category_repository(): Promise<void> {
  const repository =
    get_activity_category_repository() as InBrowserActivityCategoryRepository;
  await repository.clear_all_data();
  const default_categories = await create_default_activity_categories();
  await repository.seed_with_data(default_categories);
}
