import type {
  PlayerTeamTransferHistory,
  CreatePlayerTeamTransferHistoryInput,
  UpdatePlayerTeamTransferHistoryInput,
} from "../entities/PlayerTeamTransferHistory";
import { validate_player_team_transfer_history_input } from "../entities/PlayerTeamTransferHistory";
import type {
  PlayerTeamTransferHistoryRepository,
  PlayerTeamTransferHistoryFilter,
} from "../interfaces/ports";
import type { PlayerTeamMembershipRepository } from "../interfaces/ports";
import type { QueryOptions } from "../interfaces/ports";
import type { AsyncResult, PaginatedAsyncResult } from "../types/Result";
import { create_failure_result, create_success_result } from "../types/Result";
import type { EntityListResult, EntityOperationResult } from "./BaseUseCases";
import { InBrowserPlayerTeamTransferHistoryRepository } from "../../adapters/repositories/InBrowserPlayerTeamTransferHistoryRepository";
import { InBrowserPlayerTeamMembershipRepository } from "../../adapters/repositories/InBrowserPlayerTeamMembershipRepository";
import type { PlayerTeamTransferHistoryUseCasesPort } from "../interfaces/ports";

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
    ): Promise<EntityListResult<PlayerTeamTransferHistory>> {
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
    ): Promise<EntityOperationResult<PlayerTeamTransferHistory>> {
      if (!id || id.trim().length === 0) {
        return { success: false, error_message: "Transfer ID is required" };
      }

      const result = await repository.find_by_id(id);
      if (!result.success) {
        return { success: false, error_message: result.error };
      }

      return { success: true, data: result.data };
    },

    async create(
      input: CreatePlayerTeamTransferHistoryInput,
    ): Promise<EntityOperationResult<PlayerTeamTransferHistory>> {
      const validation_errors =
        validate_player_team_transfer_history_input(input);

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
      input: UpdatePlayerTeamTransferHistoryInput,
    ): Promise<EntityOperationResult<PlayerTeamTransferHistory>> {
      if (!id || id.trim().length === 0) {
        return { success: false, error_message: "Transfer ID is required" };
      }

      const result = await repository.update(id, input);
      if (!result.success) {
        return { success: false, error_message: result.error };
      }

      return { success: true, data: result.data };
    },

    async delete(id: string): Promise<EntityOperationResult<boolean>> {
      if (!id || id.trim().length === 0) {
        return { success: false, error_message: "Transfer ID is required" };
      }

      const result = await repository.delete_by_id(id);
      if (!result.success) {
        return { success: false, error_message: result.error };
      }

      return { success: true, data: result.data };
    },

    async list_transfers_by_player(
      player_id: string,
      options?: QueryOptions,
    ): Promise<PaginatedAsyncResult<PlayerTeamTransferHistory>> {
      if (!player_id || player_id.trim().length === 0) {
        return create_failure_result("Player ID is required");
      }

      return repository.find_by_player(player_id, options);
    },

    async list_transfers_by_team(
      team_id: string,
      options?: QueryOptions,
    ): Promise<PaginatedAsyncResult<PlayerTeamTransferHistory>> {
      if (!team_id || team_id.trim().length === 0) {
        return create_failure_result("Team ID is required");
      }

      return repository.find_by_team(team_id, options);
    },

    async list_pending_transfers(
      options?: QueryOptions,
    ): Promise<PaginatedAsyncResult<PlayerTeamTransferHistory>> {
      return repository.find_pending_transfers(options);
    },

    async confirm_transfer(
      transfer_id: string,
    ): Promise<AsyncResult<PlayerTeamTransferHistory>> {
      if (!transfer_id || transfer_id.trim().length === 0) {
        return create_failure_result("Transfer ID is required");
      }

      const transfer_result = await repository.find_by_id(transfer_id);
      if (!transfer_result.success) {
        return create_failure_result(transfer_result.error);
      }

      if (!transfer_result.data) {
        return create_failure_result("Transfer not found");
      }

      const transfer = transfer_result.data;

      if (transfer.status !== "pending") {
        return create_failure_result(
          `Transfer cannot be confirmed. Current status: ${transfer.status}`,
        );
      }

      const memberships_result = await membership_repository.find_by_filter({
        player_id: transfer.player_id,
        team_id: transfer.from_team_id,
        status: "active",
      });

      if (!memberships_result.success) {
        return create_failure_result(
          `Failed to find player membership: ${memberships_result.error}`,
        );
      }

      const active_membership = memberships_result.data?.items?.[0];

      if (active_membership) {
        const update_membership_result = await membership_repository.update(
          active_membership.id,
          {
            team_id: transfer.to_team_id,
            start_date: transfer.transfer_date,
          },
        );

        if (!update_membership_result.success) {
          return create_failure_result(
            `Failed to update player membership: ${update_membership_result.error}`,
          );
        }

        console.log(
          `[PlayerTeamTransferHistoryUseCases] Successfully updated membership ${active_membership.id} from team ${transfer.from_team_id} to team ${transfer.to_team_id}`,
        );
      } else {
        console.warn(
          `[PlayerTeamTransferHistoryUseCases] No active membership found for player ${transfer.player_id} in team ${transfer.from_team_id}. Creating new membership.`,
        );

        const create_membership_result = await membership_repository.create({
          organization_id: transfer.organization_id,
          player_id: transfer.player_id,
          team_id: transfer.to_team_id,
          start_date: transfer.transfer_date,
          jersey_number: null,
          status: "active",
        });

        if (!create_membership_result.success) {
          return create_failure_result(
            `Failed to create new membership: ${create_membership_result.error}`,
          );
        }

        console.log(
          `[PlayerTeamTransferHistoryUseCases] Created new membership for player ${transfer.player_id} in team ${transfer.to_team_id}`,
        );
      }

      const update_result = await repository.update(transfer_id, {
        status: "confirmed",
      });

      if (!update_result.success) {
        return create_failure_result(
          `Failed to confirm transfer: ${update_result.error}`,
        );
      }

      console.log(
        `[PlayerTeamTransferHistoryUseCases] Transfer ${transfer_id} confirmed successfully`,
      );

      return create_success_result(update_result.data!);
    },

    async reject_transfer(
      transfer_id: string,
    ): Promise<AsyncResult<PlayerTeamTransferHistory>> {
      if (!transfer_id || transfer_id.trim().length === 0) {
        return create_failure_result("Transfer ID is required");
      }

      const transfer_result = await repository.find_by_id(transfer_id);
      if (!transfer_result.success) {
        return create_failure_result(transfer_result.error);
      }

      if (!transfer_result.data) {
        return create_failure_result("Transfer not found");
      }

      if (transfer_result.data.status !== "pending") {
        return create_failure_result(
          `Transfer cannot be rejected. Current status: ${transfer_result.data.status}`,
        );
      }

      const update_result = await repository.update(transfer_id, {
        status: "rejected",
      });

      if (!update_result.success) {
        return create_failure_result(
          `Failed to reject transfer: ${update_result.error}`,
        );
      }

      console.log(
        `[PlayerTeamTransferHistoryUseCases] Transfer ${transfer_id} rejected`,
      );

      return create_success_result(update_result.data!);
    },

    async delete_transfers(ids: string[]): Promise<AsyncResult<number>> {
      if (!ids || ids.length === 0) {
        return create_failure_result("At least one transfer ID is required");
      }

      return repository.delete_by_ids(ids);
    },
  };
}

let transfer_history_repository_instance: InBrowserPlayerTeamTransferHistoryRepository | null =
  null;
let membership_repository_instance: InBrowserPlayerTeamMembershipRepository | null =
  null;

function get_transfer_history_repository(): InBrowserPlayerTeamTransferHistoryRepository {
  if (!transfer_history_repository_instance) {
    transfer_history_repository_instance =
      new InBrowserPlayerTeamTransferHistoryRepository();
  }
  return transfer_history_repository_instance;
}

function get_membership_repository(): InBrowserPlayerTeamMembershipRepository {
  if (!membership_repository_instance) {
    membership_repository_instance =
      new InBrowserPlayerTeamMembershipRepository();
  }
  return membership_repository_instance;
}

export function get_player_team_transfer_history_use_cases(): PlayerTeamTransferHistoryUseCases {
  const repository = get_transfer_history_repository();
  const membership_repository = get_membership_repository();
  return create_player_team_transfer_history_use_cases(
    repository,
    membership_repository,
  );
}
