import type {
  PlayerTeamMembership,
  CreatePlayerTeamMembershipInput,
  UpdatePlayerTeamMembershipInput,
} from "../entities/PlayerTeamMembership";
import { validate_player_team_membership_input } from "../entities/PlayerTeamMembership";
import type {
  PlayerTeamMembershipRepository,
  PlayerTeamMembershipFilter,
} from "../interfaces/adapters/PlayerTeamMembershipRepository";
import type { QueryOptions } from "../interfaces/adapters/Repository";
import type { AsyncResult, PaginatedAsyncResult } from "../types/Result";
import { create_failure_result } from "../types/Result";
import type { EntityListResult, EntityOperationResult } from "./BaseUseCases";
import { get_player_team_membership_repository } from "../../adapters/repositories/InMemoryPlayerTeamMembershipRepository";
import type { PlayerTeamMembershipUseCasesPort } from "../interfaces/ports/PlayerTeamMembershipUseCasesPort";

export type PlayerTeamMembershipUseCases = PlayerTeamMembershipUseCasesPort;

export function create_player_team_membership_use_cases(
  repository: PlayerTeamMembershipRepository,
): PlayerTeamMembershipUseCases {
  return {
    async list(
      filter?: PlayerTeamMembershipFilter,
      options?: QueryOptions,
    ): Promise<EntityListResult<PlayerTeamMembership>> {
      const result = filter
        ? await repository.find_by_filter(filter, options)
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

    async get_by_id(
      id: string,
    ): Promise<EntityOperationResult<PlayerTeamMembership>> {
      if (!id || id.trim().length === 0) {
        return { success: false, error_message: "Membership ID is required" };
      }

      const result = await repository.find_by_id(id);
      if (!result.success) {
        return { success: false, error_message: result.error };
      }

      return { success: true, data: result.data };
    },

    async create(
      input: CreatePlayerTeamMembershipInput,
    ): Promise<EntityOperationResult<PlayerTeamMembership>> {
      const validation_errors = validate_player_team_membership_input(input);

      if (validation_errors.length > 0) {
        return {
          success: false,
          error_message: validation_errors.join(", "),
        };
      }

      const result = await repository.create(input);
      if (!result.success) {
        return { success: false, error_message: result.error };
      }

      return { success: true, data: result.data };
    },

    async update(
      id: string,
      input: UpdatePlayerTeamMembershipInput,
    ): Promise<EntityOperationResult<PlayerTeamMembership>> {
      if (!id || id.trim().length === 0) {
        return { success: false, error_message: "Membership ID is required" };
      }

      const result = await repository.update(id, input);
      if (!result.success) {
        return { success: false, error_message: result.error };
      }

      return { success: true, data: result.data };
    },

    async delete(id: string): Promise<EntityOperationResult<boolean>> {
      if (!id || id.trim().length === 0) {
        return { success: false, error_message: "Membership ID is required" };
      }

      const result = await repository.delete_by_id(id);
      if (!result.success) {
        return { success: false, error_message: result.error };
      }

      return { success: true, data: result.data };
    },

    async list_memberships_by_team(
      team_id: string,
      options?: QueryOptions,
    ): Promise<PaginatedAsyncResult<PlayerTeamMembership>> {
      if (!team_id || team_id.trim().length === 0) {
        return create_failure_result("Team ID is required");
      }

      return repository.find_by_team(team_id, options);
    },

    async list_memberships_by_player(
      player_id: string,
      options?: QueryOptions,
    ): Promise<PaginatedAsyncResult<PlayerTeamMembership>> {
      if (!player_id || player_id.trim().length === 0) {
        return create_failure_result("Player ID is required");
      }

      return repository.find_by_player(player_id, options);
    },

    async delete_memberships(ids: string[]): Promise<AsyncResult<number>> {
      if (!ids || ids.length === 0) {
        return create_failure_result("At least one membership ID is required");
      }

      return repository.delete_by_ids(ids);
    },
  };
}

export function get_player_team_membership_use_cases(): PlayerTeamMembershipUseCases {
  const repository = get_player_team_membership_repository();
  return create_player_team_membership_use_cases(repository);
}
