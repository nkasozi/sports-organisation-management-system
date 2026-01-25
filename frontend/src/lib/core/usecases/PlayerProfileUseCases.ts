import type {
  PlayerProfile,
  CreatePlayerProfileInput,
  UpdatePlayerProfileInput,
} from "../entities/PlayerProfile";
import type {
  PlayerProfileRepository,
  PlayerProfileFilter,
} from "../interfaces/adapters/PlayerProfileRepository";
import type { QueryOptions } from "../interfaces/adapters/Repository";
import type {
  EntityOperationResult,
  EntityListResult,
} from "../entities/BaseEntity";
import { validate_player_profile_input } from "../entities/PlayerProfile";
import { get_player_profile_repository } from "../../adapters/repositories/InMemoryPlayerProfileRepository";

export interface PlayerProfileUseCases {
  list(
    filter?: PlayerProfileFilter | Record<string, string>,
    options?: QueryOptions,
  ): Promise<EntityListResult<PlayerProfile>>;
  get_by_id(id: string): Promise<EntityOperationResult<PlayerProfile>>;
  get_by_player_id(
    player_id: string,
  ): Promise<EntityOperationResult<PlayerProfile>>;
  get_by_slug(slug: string): Promise<EntityOperationResult<PlayerProfile>>;
  create(
    input: CreatePlayerProfileInput,
  ): Promise<EntityOperationResult<PlayerProfile>>;
  update(
    id: string,
    input: UpdatePlayerProfileInput,
  ): Promise<EntityOperationResult<PlayerProfile>>;
  delete(id: string): Promise<EntityOperationResult<boolean>>;
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
      const typed_filter: PlayerProfileFilter = {
        player_id: filter?.player_id,
        visibility: filter?.visibility as PlayerProfileFilter["visibility"],
        status: filter?.status as PlayerProfileFilter["status"],
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

    async get_by_id(id: string): Promise<EntityOperationResult<PlayerProfile>> {
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

    async get_by_player_id(
      player_id: string,
    ): Promise<EntityOperationResult<PlayerProfile>> {
      if (!player_id || player_id.trim().length === 0) {
        return {
          success: false,
          error_message: "Player ID is required",
        };
      }
      const result = await repository.find_by_player_id(player_id);
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
    ): Promise<EntityOperationResult<PlayerProfile>> {
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
      input: CreatePlayerProfileInput,
    ): Promise<EntityOperationResult<PlayerProfile>> {
      const validation = validate_player_profile_input(input);

      if (!validation.is_valid) {
        return {
          success: false,
          error_message: Object.values(validation.errors).join(", "),
        };
      }

      const existing = await repository.find_by_player_id(input.player_id);
      if (existing.success && existing.data) {
        return {
          success: false,
          error_message: "A profile already exists for this player",
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
      input: UpdatePlayerProfileInput,
    ): Promise<EntityOperationResult<PlayerProfile>> {
      if (!id || id.trim().length === 0) {
        return {
          success: false,
          error_message: "Profile ID is required",
        };
      }

      const validation = validate_player_profile_input(input);

      if (!validation.is_valid) {
        return {
          success: false,
          error_message: Object.values(validation.errors).join(", "),
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

let use_cases_instance: PlayerProfileUseCases | null = null;

export function get_player_profile_use_cases(): PlayerProfileUseCases {
  if (!use_cases_instance) {
    const repository = get_player_profile_repository();
    use_cases_instance = create_player_profile_use_cases(repository);
  }
  return use_cases_instance;
}
