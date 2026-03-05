import type {
  PlayerProfile,
  CreatePlayerProfileInput,
  UpdatePlayerProfileInput,
} from "../entities/PlayerProfile";
import type {
  PlayerProfileRepository,
  PlayerProfileFilter,
} from "../interfaces/ports";
import type { QueryOptions } from "../interfaces/ports";
import type { EntityListResult } from "../entities/BaseEntity";
import type { AsyncResult } from "../types/Result";
import { create_failure_result } from "../types/Result";
import { validate_player_profile_input } from "../entities/PlayerProfile";
import { get_repository_container } from "../../infrastructure/container";

export interface PlayerProfileUseCases {
  list(
    filter?: PlayerProfileFilter | Record<string, string>,
    options?: QueryOptions,
  ): Promise<EntityListResult<PlayerProfile>>;
  get_by_id(id: string): AsyncResult<PlayerProfile>;
  get_by_player_id(player_id: string): AsyncResult<PlayerProfile>;
  get_by_slug(slug: string): AsyncResult<PlayerProfile>;
  create(input: CreatePlayerProfileInput): AsyncResult<PlayerProfile>;
  update(
    id: string,
    input: UpdatePlayerProfileInput,
  ): AsyncResult<PlayerProfile>;
  delete(id: string): AsyncResult<boolean>;
  list_public_profiles(
    options?: QueryOptions,
  ): Promise<EntityListResult<PlayerProfile>>;
}

export function create_player_profile_use_cases(
  repository: PlayerProfileRepository,
): PlayerProfileUseCases {
  return {
    async list(
      filter?: PlayerProfileFilter | Record<string, string>,
      options?: QueryOptions,
    ): Promise<EntityListResult<PlayerProfile>> {
      if (!filter) {
        const result = await repository.find_all(undefined, options);

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
      }

      const typed_filter: PlayerProfileFilter = {
        player_id: filter?.player_id,
        visibility: filter?.visibility as PlayerProfileFilter["visibility"],
        status: filter?.status as PlayerProfileFilter["status"],
      };

      const result = await repository.find_all(typed_filter, options);

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

    async get_by_id(id: string): AsyncResult<PlayerProfile> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("Profile ID is required");
      }
      return repository.find_by_id(id);
    },

    async get_by_player_id(player_id: string): AsyncResult<PlayerProfile> {
      if (!player_id || player_id.trim().length === 0) {
        return create_failure_result("Player ID is required");
      }
      return repository.find_by_player_id(player_id);
    },

    async get_by_slug(slug: string): AsyncResult<PlayerProfile> {
      if (!slug || slug.trim().length === 0) {
        return create_failure_result("Profile slug is required");
      }
      return repository.find_by_slug(slug);
    },

    async create(input: CreatePlayerProfileInput): AsyncResult<PlayerProfile> {
      const validation = validate_player_profile_input(input);

      if (!validation.is_valid) {
        return create_failure_result(
          Object.values(validation.errors).join(", "),
        );
      }

      const existing = await repository.find_by_player_id(input.player_id);
      if (existing.success && existing.data) {
        return create_failure_result(
          "A profile already exists for this player",
        );
      }

      return repository.create(input);
    },

    async update(
      id: string,
      input: UpdatePlayerProfileInput,
    ): AsyncResult<PlayerProfile> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("Profile ID is required");
      }

      const validation = validate_player_profile_input(input);

      if (!validation.is_valid) {
        return create_failure_result(
          Object.values(validation.errors).join(", "),
        );
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
    ): Promise<EntityListResult<PlayerProfile>> {
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

export function get_player_profile_use_cases(): PlayerProfileUseCases {
  const container = get_repository_container();
  return create_player_profile_use_cases(container.player_profile_repository);
}
