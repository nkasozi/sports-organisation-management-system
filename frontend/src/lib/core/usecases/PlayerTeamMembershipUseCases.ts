import type {
  CreatePlayerTeamMembershipInput,
  PlayerTeamMembership,
  UpdatePlayerTeamMembershipInput,
} from "../entities/PlayerTeamMembership";
import { validate_player_team_membership_input } from "../entities/PlayerTeamMembership";
import type {
  PlayerTeamMembershipFilter,
  PlayerTeamMembershipRepository,
} from "../interfaces/ports";
import type { QueryOptions } from "../interfaces/ports";
import type { PlayerTeamMembershipUseCasesPort } from "../interfaces/ports";
import type { ScalarValueInput } from "../types/DomainScalars";
import type { AsyncResult, PaginatedAsyncResult } from "../types/Result";
import { create_failure_result } from "../types/Result";

export type PlayerTeamMembershipUseCases = PlayerTeamMembershipUseCasesPort;

export function create_player_team_membership_use_cases(
  repository: PlayerTeamMembershipRepository,
): PlayerTeamMembershipUseCases {
  return {
    async list(
      filter?: PlayerTeamMembershipFilter,
      options?: QueryOptions,
    ): PaginatedAsyncResult<PlayerTeamMembership> {
      return repository.find_all(filter ?? {}, options ?? {});
    },

    async get_by_id(
      id: PlayerTeamMembership["id"],
    ): AsyncResult<PlayerTeamMembership> {
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
      id: PlayerTeamMembership["id"],
      input: UpdatePlayerTeamMembershipInput,
    ): AsyncResult<PlayerTeamMembership> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("Membership ID is required");
      }

      return repository.update(id, input);
    },

    async delete(id: PlayerTeamMembership["id"]): AsyncResult<boolean> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("Membership ID is required");
      }

      return repository.delete_by_id(id);
    },

    async list_memberships_by_team(
      team_id: ScalarValueInput<PlayerTeamMembership["team_id"]>,
      options?: QueryOptions,
    ): PaginatedAsyncResult<PlayerTeamMembership> {
      if (!team_id || team_id.trim().length === 0) {
        return create_failure_result("Team ID is required");
      }

      return repository.find_by_team(team_id, options);
    },

    async list_memberships_by_player(
      player_id: ScalarValueInput<PlayerTeamMembership["player_id"]>,
      options?: QueryOptions,
    ): PaginatedAsyncResult<PlayerTeamMembership> {
      if (!player_id || player_id.trim().length === 0) {
        return create_failure_result("Player ID is required");
      }

      return repository.find_by_player(player_id, options);
    },

    async delete_memberships(
      ids: ScalarValueInput<PlayerTeamMembership["id"]>[],
    ): AsyncResult<number> {
      if (!ids || ids.length === 0) {
        return create_failure_result("At least one membership ID is required");
      }

      return repository.delete_by_ids(ids);
    },
  };
}
