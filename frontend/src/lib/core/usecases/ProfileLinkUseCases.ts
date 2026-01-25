import type {
  ProfileLink,
  CreateProfileLinkInput,
  UpdateProfileLinkInput,
} from "../entities/ProfileLink";
import type {
  ProfileLinkRepository,
  ProfileLinkFilter,
} from "../interfaces/adapters/ProfileLinkRepository";
import type { QueryOptions } from "../interfaces/adapters/Repository";
import type {
  EntityOperationResult,
  EntityListResult,
} from "../entities/BaseEntity";
import { validate_profile_link_input } from "../entities/ProfileLink";
import { get_profile_link_repository } from "../../adapters/repositories/InMemoryProfileLinkRepository";

export interface ProfileLinkUseCases {
  list(
    filter?: ProfileLinkFilter | Record<string, string>,
    options?: QueryOptions,
  ): Promise<EntityListResult<ProfileLink>>;
  get_by_id(id: string): Promise<EntityOperationResult<ProfileLink>>;
  create(
    input: CreateProfileLinkInput,
  ): Promise<EntityOperationResult<ProfileLink>>;
  update(
    id: string,
    input: UpdateProfileLinkInput,
  ): Promise<EntityOperationResult<ProfileLink>>;
  delete(id: string): Promise<EntityOperationResult<boolean>>;
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

    async get_by_id(id: string): Promise<EntityOperationResult<ProfileLink>> {
      if (!id || id.trim().length === 0) {
        return {
          success: false,
          error_message: "Link ID is required",
        };
      }
      const result = await repository.find_by_id(id);
      if (!result.success) {
        return {
          success: false,
          error_message: result.error,
        };
      }
      return {
        success: true,
        data: result.data,
      };
    },

    async create(
      input: CreateProfileLinkInput,
    ): Promise<EntityOperationResult<ProfileLink>> {
      const validation_errors = validate_profile_link_input(input);

      if (validation_errors.length > 0) {
        return {
          success: false,
          error_message: validation_errors.join(", "),
        };
      }

      const result = await repository.create(input);

      if (!result.success) {
        return {
          success: false,
          error_message: result.error,
        };
      }

      return {
        success: true,
        data: result.data,
      };
    },

    async update(
      id: string,
      input: UpdateProfileLinkInput,
    ): Promise<EntityOperationResult<ProfileLink>> {
      if (!id || id.trim().length === 0) {
        return {
          success: false,
          error_message: "Link ID is required",
        };
      }

      const result = await repository.update(id, input);

      if (!result.success) {
        return {
          success: false,
          error_message: result.error,
        };
      }

      return {
        success: true,
        data: result.data,
      };
    },

    async delete(id: string): Promise<EntityOperationResult<boolean>> {
      if (!id || id.trim().length === 0) {
        return {
          success: false,
          error_message: "Link ID is required",
        };
      }

      const result = await repository.delete_by_id(id);

      if (!result.success) {
        return {
          success: false,
          error_message: result.error,
        };
      }

      return {
        success: true,
        data: true,
      };
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
