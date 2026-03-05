import type {
  TeamProfile,
  CreateTeamProfileInput,
  UpdateTeamProfileInput,
} from "../entities/TeamProfile";
import type {
  TeamProfileRepository,
  TeamProfileFilter,
} from "../interfaces/ports";
import type { QueryOptions } from "../interfaces/ports";
import type { EntityListResult } from "../entities/BaseEntity";
import type { AsyncResult } from "../types/Result";
import { create_failure_result } from "../types/Result";
import { validate_team_profile_input } from "../entities/TeamProfile";
import { get_team_profile_repository } from "../../adapters/repositories/InBrowserTeamProfileRepository";

export interface TeamProfileUseCases {
  list(
    filter?: TeamProfileFilter | Record<string, string>,
    options?: QueryOptions,
  ): Promise<EntityListResult<TeamProfile>>;
  get_by_id(id: string): AsyncResult<TeamProfile>;
  get_by_team_id(team_id: string): AsyncResult<TeamProfile>;
  get_by_slug(slug: string): AsyncResult<TeamProfile>;
  create(input: CreateTeamProfileInput): AsyncResult<TeamProfile>;
  update(id: string, input: UpdateTeamProfileInput): AsyncResult<TeamProfile>;
  delete(id: string): AsyncResult<boolean>;
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

    async get_by_id(id: string): AsyncResult<TeamProfile> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("Profile ID is required");
      }
      return repository.find_by_id(id);
    },

    async get_by_team_id(team_id: string): AsyncResult<TeamProfile> {
      if (!team_id || team_id.trim().length === 0) {
        return create_failure_result("Team ID is required");
      }
      return repository.find_by_team_id(team_id);
    },

    async get_by_slug(slug: string): AsyncResult<TeamProfile> {
      if (!slug || slug.trim().length === 0) {
        return create_failure_result("Profile slug is required");
      }
      return repository.find_by_slug(slug);
    },

    async create(input: CreateTeamProfileInput): AsyncResult<TeamProfile> {
      const validation = validate_team_profile_input(input);
      if (!validation.is_valid) {
        const error_messages = Object.values(validation.errors).join(", ");
        return create_failure_result(error_messages);
      }

      return repository.create(input);
    },

    async update(
      id: string,
      input: UpdateTeamProfileInput,
    ): AsyncResult<TeamProfile> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("Profile ID is required");
      }

      const validation = validate_team_profile_input(input);
      if (!validation.is_valid) {
        const error_messages = Object.values(validation.errors).join(", ");
        return create_failure_result(error_messages);
      }

      return repository.update(id, input);
    },

    async delete(id: string): AsyncResult<boolean> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("Profile ID is required");
      }
      return repository.delete_by_id(id);
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
