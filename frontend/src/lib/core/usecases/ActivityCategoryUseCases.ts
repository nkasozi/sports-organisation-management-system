import type {
  ActivityCategory,
  CreateActivityCategoryInput,
  UpdateActivityCategoryInput,
} from "../entities/ActivityCategory";
import {
  validate_activity_category_input,
  create_default_categories_for_organization,
} from "../entities/ActivityCategory";
import type {
  ActivityCategoryRepository,
  ActivityCategoryFilter,
} from "../interfaces/ports";
import type { QueryOptions } from "../interfaces/ports";
import type { PaginatedAsyncResult, AsyncResult } from "../types/Result";
import { create_success_result, create_failure_result } from "../types/Result";
import type { EntityListResult } from "../entities/BaseEntity";
import type { ActivityCategoryUseCasesPort } from "../interfaces/ports";
import { get_repository_container } from "../../infrastructure/container";

export type ActivityCategoryUseCases = ActivityCategoryUseCasesPort;

export function create_activity_category_use_cases(
  repository: ActivityCategoryRepository,
): ActivityCategoryUseCases {
  return {
    async list(
      filter?: ActivityCategoryFilter,
      options?: QueryOptions,
    ): Promise<EntityListResult<ActivityCategory>> {
      const result = await repository.find_all(filter, options);

      if (!result.success) {
        return {
          success: false,
          data: [],
          total_count: 0,
          error_message: result.error,
        };
      }

      return {
        success: true,
        data: result.data?.items || [],
        total_count: result.data?.total_count || 0,
      };
    },

    async get_by_id(id: string): AsyncResult<ActivityCategory> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("Category ID is required");
      }

      return repository.find_by_id(id);
    },

    async create(
      input: CreateActivityCategoryInput,
    ): AsyncResult<ActivityCategory> {
      const validation = validate_activity_category_input(input);

      if (!validation.is_valid) {
        const error_messages = Object.values(validation.errors).join(", ");
        return create_failure_result(error_messages);
      }

      return repository.create(input);
    },

    async update(
      id: string,
      input: UpdateActivityCategoryInput,
    ): AsyncResult<ActivityCategory> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("Category ID is required");
      }

      return repository.update(id, input);
    },

    async delete(id: string): AsyncResult<boolean> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("Category ID is required");
      }

      const category_result = await repository.find_by_id(id);

      if (!category_result.success) {
        return create_failure_result(category_result.error);
      }

      if (category_result.data?.is_system_generated) {
        return create_failure_result(
          "Cannot delete system-generated categories",
        );
      }

      return repository.delete_by_id(id);
    },

    async list_by_organization(
      organization_id: string,
      options?: QueryOptions,
    ): Promise<PaginatedAsyncResult<ActivityCategory>> {
      if (!organization_id || organization_id.trim().length === 0) {
        return {
          success: false,
          error: "Organization ID is required",
        };
      }

      return repository.find_by_organization(organization_id, options);
    },

    async ensure_default_categories_exist(
      organization_id: string,
    ): Promise<{ success: boolean; categories_created: number }> {
      if (!organization_id || organization_id.trim().length === 0) {
        return { success: false, categories_created: 0 };
      }

      const existing_result =
        await repository.find_by_organization(organization_id);

      if (!existing_result.success) {
        return { success: false, categories_created: 0 };
      }

      const existing_categories = existing_result.data?.items || [];
      const existing_types = new Set(
        existing_categories
          .filter((c) => c.is_system_generated)
          .map((c) => c.category_type),
      );

      const default_categories =
        create_default_categories_for_organization(organization_id);
      const categories_to_create = default_categories.filter(
        (c) => !existing_types.has(c.category_type),
      );

      let categories_created = 0;

      for (const category_input of categories_to_create) {
        const create_result = await repository.create(category_input);
        if (create_result.success) {
          categories_created++;
        }
      }

      return { success: true, categories_created };
    },
  };
}

export function get_activity_category_use_cases(): ActivityCategoryUseCases {
  const container = get_repository_container();
  return create_activity_category_use_cases(
    container.activity_category_repository,
  );
}
