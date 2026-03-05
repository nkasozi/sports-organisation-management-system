import type {
  ProfileLink,
  CreateProfileLinkInput,
  UpdateProfileLinkInput,
} from "../entities/ProfileLink";
import type {
  ProfileLinkRepository,
  ProfileLinkFilter,
} from "../interfaces/ports";
import type { QueryOptions } from "../interfaces/ports";
import type { EntityListResult } from "../entities/BaseEntity";
import type { AsyncResult } from "../types/Result";
import { create_failure_result } from "../types/Result";
import { validate_profile_link_input } from "../entities/ProfileLink";
import { get_profile_link_repository } from "../../adapters/repositories/InBrowserProfileLinkRepository";

export interface ProfileLinkUseCases {
  list(
    filter?: ProfileLinkFilter | Record<string, string>,
    options?: QueryOptions,
  ): Promise<EntityListResult<ProfileLink>>;
  get_by_id(id: string): AsyncResult<ProfileLink>;
  create(input: CreateProfileLinkInput): AsyncResult<ProfileLink>;
  update(id: string, input: UpdateProfileLinkInput): AsyncResult<ProfileLink>;
  delete(id: string): AsyncResult<boolean>;
  list_by_profile(
    profile_id: string,
    options?: QueryOptions,
  ): Promise<EntityListResult<ProfileLink>>;
}

export function create_profile_link_use_cases(
  repository: ProfileLinkRepository,
): ProfileLinkUseCases {
  return {
    async list(
      filter?: ProfileLinkFilter | Record<string, string>,
      options?: QueryOptions,
    ): Promise<EntityListResult<ProfileLink>> {
      const typed_filter: ProfileLinkFilter = {
        profile_id: filter?.profile_id,
        platform: filter?.platform,
        status: filter?.status,
      };

      const result = filter
        ? await repository.find_by_filter(typed_filter, options)
        : await repository.find_all(options);

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

    async get_by_id(id: string): AsyncResult<ProfileLink> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("Link ID is required");
      }
      return repository.find_by_id(id);
    },

    async create(input: CreateProfileLinkInput): AsyncResult<ProfileLink> {
      const validation_errors = validate_profile_link_input(input);

      if (validation_errors.length > 0) {
        return create_failure_result(validation_errors.join(", "));
      }

      return repository.create(input);
    },

    async update(
      id: string,
      input: UpdateProfileLinkInput,
    ): AsyncResult<ProfileLink> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("Link ID is required");
      }

      return repository.update(id, input);
    },

    async delete(id: string): AsyncResult<boolean> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("Link ID is required");
      }

      return repository.delete_by_id(id);
    },

    async list_by_profile(
      profile_id: string,
      options?: QueryOptions,
    ): Promise<EntityListResult<ProfileLink>> {
      const result = await repository.find_by_profile_id(profile_id, options);

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
  };
}

export function get_profile_link_use_cases(): ProfileLinkUseCases {
  const repository = get_profile_link_repository();
  return create_profile_link_use_cases(repository);
}
