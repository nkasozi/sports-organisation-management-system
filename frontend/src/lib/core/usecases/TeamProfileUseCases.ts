import type {
  TeamProfile,
  CreateTeamProfileInput,
  UpdateTeamProfileInput,
} from "../entities/TeamProfile";
import type {
  TeamProfileRepository,
  TeamProfileFilter,
} from "../interfaces/adapters/TeamProfileRepository";
import type { QueryOptions } from "../interfaces/adapters/Repository";
import type {
  EntityOperationResult,
  EntityListResult,
} from "../entities/BaseEntity";
import { validate_team_profile_input } from "../entities/TeamProfile";
import { get_team_profile_repository } from "../../adapters/repositories/InMemoryTeamProfileRepository";

export interface TeamProfileUseCases {
  list(
    filter?: TeamProfileFilter | Record<string, string>,
    options?: QueryOptions,
  ): Promise<EntityListResult<TeamProfile>>;
  get_by_id(id: string): Promise<EntityOperationResult<TeamProfile>>;
  get_by_team_id(team_id: string): Promise<EntityOperationResult<TeamProfile>>;
  get_by_slug(slug: string): Promise<EntityOperationResult<TeamProfile>>;
  create(
    input: CreateTeamProfileInput,
  ): Promise<EntityOperationResult<TeamProfile>>;
  update(
    id: string,
    input: UpdateTeamProfileInput,
  ): Promise<EntityOperationResult<TeamProfile>>;
  delete(id: string): Promise<EntityOperationResult<boolean>>;
  list_public_profiles(
    options?: QueryOptions,
  ): Promise<EntityListResult<TeamProfile>>;
}

export function create_team_profile_use_cases(
  repository: TeamProfileRepository,
): TeamProfileUseCases {
  return {
    async list(
      filter?: TeamProfileFilter | Record<string, string>,
      options?: QueryOptions,
    ): Promise<EntityListResult<TeamProfile>> {
      const typed_filter: TeamProfileFilter = {
        team_id: filter?.team_id,
        visibility: filter?.visibility as TeamProfileFilter["visibility"],
        status: filter?.status as TeamProfileFilter["status"],
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

    async get_by_id(id: string): Promise<EntityOperationResult<TeamProfile>> {
      if (!id || id.trim().length === 0) {
        return {
          success: false,
          error_message: "Profile ID is required",
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

    async get_by_team_id(
      team_id: string,
    ): Promise<EntityOperationResult<TeamProfile>> {
      if (!team_id || team_id.trim().length === 0) {
        return {
          success: false,
          error_message: "Team ID is required",
        };
      }
      const result = await repository.find_by_team_id(team_id);
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

    async get_by_slug(
      slug: string,
    ): Promise<EntityOperationResult<TeamProfile>> {
      if (!slug || slug.trim().length === 0) {
        return {
          success: false,
          error_message: "Profile slug is required",
        };
      }
      const result = await repository.find_by_slug(slug);
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
      input: CreateTeamProfileInput,
    ): Promise<EntityOperationResult<TeamProfile>> {
      const validation = validate_team_profile_input(input);
      if (!validation.is_valid) {
        const error_messages = Object.values(validation.errors).join(", ");
        return {
          success: false,
          error_message: error_messages,
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
      input: UpdateTeamProfileInput,
    ): Promise<EntityOperationResult<TeamProfile>> {
      if (!id || id.trim().length === 0) {
        return {
          success: false,
          error_message: "Profile ID is required",
        };
      }

      const validation = validate_team_profile_input(input);
      if (!validation.is_valid) {
        const error_messages = Object.values(validation.errors).join(", ");
        return {
          success: false,
          error_message: error_messages,
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
          error_message: "Profile ID is required",
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

    async list_public_profiles(
      options?: QueryOptions,
    ): Promise<EntityListResult<TeamProfile>> {
      const result = await repository.find_public_profiles(options);

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

export function get_team_profile_use_cases(): TeamProfileUseCases {
  const repository = get_team_profile_repository();
  return create_team_profile_use_cases(repository);
}
