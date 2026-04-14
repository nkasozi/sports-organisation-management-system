import { EventBus } from "$lib/infrastructure/events/EventBus";

import type {
  CreatePlayerTeamTransferHistoryInput,
  PlayerTeamTransferHistory,
  UpdatePlayerTeamTransferHistoryInput,
} from "../entities/PlayerTeamTransferHistory";
import { validate_player_team_transfer_history_input } from "../entities/PlayerTeamTransferHistory";
import type {
  PlayerTeamMembershipRepository,
  PlayerTeamTransferHistoryFilter,
  PlayerTeamTransferHistoryRepository,
  PlayerTeamTransferHistoryUseCasesPort,
  QueryOptions,
} from "../interfaces/ports";
import type { ScalarValueInput } from "../types/DomainScalars";
import type { AsyncResult, PaginatedAsyncResult } from "../types/Result";
import { create_failure_result, create_success_result } from "../types/Result";
import { create_transfer_confirmation } from "./TransferConfirmationUseCases";

export type PlayerTeamTransferHistoryUseCases =
  PlayerTeamTransferHistoryUseCasesPort;

export function create_player_team_transfer_history_use_cases(
  repository: PlayerTeamTransferHistoryRepository,
  membership_repository: PlayerTeamMembershipRepository,
): PlayerTeamTransferHistoryUseCases {
  return {
    async list(
      filter?: PlayerTeamTransferHistoryFilter,
      options?: QueryOptions,
    ): PaginatedAsyncResult<PlayerTeamTransferHistory> {
      return repository.find_all(filter, options);
    },

    async get_by_id(
      id: ScalarValueInput<PlayerTeamTransferHistory["id"]>,
    ): AsyncResult<PlayerTeamTransferHistory> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("Transfer ID is required");
      }

      const result = await repository.find_by_id(id);
      if (!result.success) {
        return create_failure_result(result.error);
      }

      return create_success_result(result.data);
    },

    async create(
      input: CreatePlayerTeamTransferHistoryInput,
    ): AsyncResult<PlayerTeamTransferHistory> {
      const validation_errors =
        validate_player_team_transfer_history_input(input);

      if (validation_errors.length > 0) {
        return create_failure_result(validation_errors.join(", "));
      }

      const result = await repository.create(input);
      if (!result.success) {
        return create_failure_result(result.error);
      }

      return create_success_result(result.data);
    },

    async update(
      id: ScalarValueInput<PlayerTeamTransferHistory["id"]>,
      input: UpdatePlayerTeamTransferHistoryInput,
    ): AsyncResult<PlayerTeamTransferHistory> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("Transfer ID is required");
      }

      const result = await repository.update(id, input);
      if (!result.success) {
        return create_failure_result(result.error);
      }

      return create_success_result(result.data);
    },

    async delete(
      id: ScalarValueInput<PlayerTeamTransferHistory["id"]>,
    ): AsyncResult<boolean> {
      if (!id || id.trim().length === 0) {
        return create_failure_result("Transfer ID is required");
      }

      const result = await repository.delete_by_id(id);
      if (!result.success) {
        return create_failure_result(result.error);
      }

      return create_success_result(result.data);
    },

    async list_transfers_by_player(
      player_id: ScalarValueInput<PlayerTeamTransferHistory["player_id"]>,
      options?: QueryOptions,
    ): PaginatedAsyncResult<PlayerTeamTransferHistory> {
      if (!player_id || player_id.trim().length === 0) {
        return create_failure_result("Player ID is required");
      }

      return repository.find_by_player(player_id, options);
    },

    async list_transfers_by_team(
      team_id: ScalarValueInput<PlayerTeamTransferHistory["from_team_id"]>,
      options?: QueryOptions,
    ): PaginatedAsyncResult<PlayerTeamTransferHistory> {
      if (!team_id || team_id.trim().length === 0) {
        return create_failure_result("Team ID is required");
      }

      return repository.find_by_team(team_id, options);
    },

    async list_pending_transfers(
      options?: QueryOptions,
    ): PaginatedAsyncResult<PlayerTeamTransferHistory> {
      return repository.find_pending_transfers(options);
    },

    ...create_transfer_confirmation(repository, membership_repository),

    async delete_transfers(
      ids: Array<ScalarValueInput<PlayerTeamTransferHistory["id"]>>,
    ): AsyncResult<number> {
      if (!ids || ids.length === 0) {
        return create_failure_result("At least one transfer ID is required");
      }

      const transfers_to_delete = await Promise.all(
        ids.map((id) => repository.find_by_id(id)),
      );

      const result = await repository.delete_by_ids(ids);

      if (result.success) {
        for (const transfer_result of transfers_to_delete) {
          if (transfer_result.success && transfer_result.data) {
            EventBus.emit_entity_deleted(
              "playerteamtransferhistory",
              transfer_result.data.id,
              transfer_result.data.id,
              transfer_result.data as unknown as Record<string, unknown>,
            );
          }
        }
      }

      return result;
    },
  };
}
