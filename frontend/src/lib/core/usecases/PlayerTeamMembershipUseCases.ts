import type {
  PlayerTeamMembership,
  CreatePlayerTeamMembershipInput,
  UpdatePlayerTeamMembershipInput,
} from "../entities/PlayerTeamMembership";
import { validate_player_team_membership_input } from "../entities/PlayerTeamMembership";
import type {
  PlayerTeamMembershipRepository,
  PlayerTeamMembershipFilter,
} from "../interfaces/ports";
import type { QueryOptions } from "../interfaces/ports";
import type { AsyncResult, PaginatedAsyncResult } from "../types/Result";
import { create_success_result, create_failure_result } from "../types/Result";
import type { EntityListResult } from "./BaseUseCases";
import { get_repository_container } from "../../infrastructure/container";
import type { PlayerTeamMembershipUseCasesPort } from "../interfaces/ports";

export type PlayerTeamMembershipUseCases = PlayerTeamMembershipUseCasesPort;

export function create_player_team_membership_use_cases(
  repository: PlayerTeamMembershipRepository,
): PlayerTeamMembershipUseCases {
  return {
    async list(
      filter?: PlayerTeamMembershipFilter,
      options?: QueryOptions,
    ): Promise<EntityListResult<PlayerTeamMembership>> {
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

    async get_by_id(id: string): AsyncResult<PlayerTeamMembership> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("Membership ID is required");
      }

      return repository.find_by_id(id);
    },

    async create(
      input: CreatePlayerTeamMembershipInput,
    ): AsyncResult<PlayerTeamMembership> {
      const validation_errors = validate_player_team_membership_input(input);

      if (validation_errors.length > 0) {
        return create_failure_result(validation_errors.join(", "));
      }

      return repository.create(input);
    },

    async update(
      id: string,
      input: UpdatePlayerTeamMembershipInput,
    ): AsyncResult<PlayerTeamMembership> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("Membership ID is required");
      }

      return repository.update(id, input);
    },

    async delete(id: string): AsyncResult<boolean> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("Membership ID is required");
      }

      return repository.delete_by_id(id);
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
  const container = get_repository_container();
  return create_player_team_membership_use_cases(
    container.player_team_membership_repository,
  );
}
