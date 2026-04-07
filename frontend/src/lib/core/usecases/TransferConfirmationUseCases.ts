import { EventBus } from "$lib/infrastructure/events/EventBus";

import type { PlayerTeamTransferHistory } from "../entities/PlayerTeamTransferHistory";
import { TRANSFER_STATUS } from "../entities/StatusConstants";
import type {
  PlayerTeamMembershipRepository,
  PlayerTeamTransferHistoryRepository,
  PlayerTeamTransferHistoryUseCasesPort,
} from "../interfaces/ports";
import type { AsyncResult } from "../types/Result";
import { create_failure_result, create_success_result } from "../types/Result";

type TransferConfirmationMethods = Pick<
  PlayerTeamTransferHistoryUseCasesPort,
  "confirm_transfer" | "reject_transfer"
>;

async function handle_membership_transfer(
  membership_repository: PlayerTeamMembershipRepository,
  transfer: PlayerTeamTransferHistory,
): AsyncResult<boolean> {
  const memberships_result = await membership_repository.find_all({
    player_id: transfer.player_id,
    team_id: transfer.from_team_id,
    status: "active",
  });
  if (!memberships_result.success)
    return create_failure_result(
      `Failed to find player membership: ${memberships_result.error}`,
    );

  const active_membership = memberships_result.data?.items?.[0];

  if (active_membership) {
    const old_membership_data = { ...active_membership } as unknown as Record<
      string,
      unknown
    >;
    const update_result = await membership_repository.update(
      active_membership.id,
      {
        team_id: transfer.to_team_id,
        start_date: transfer.transfer_date,
      },
    );
    if (!update_result.success)
      return create_failure_result(
        `Failed to update player membership: ${update_result.error}`,
      );
    if (update_result.data) {
      EventBus.emit_entity_updated(
        "playerteammembership",
        active_membership.id,
        active_membership.id,
        old_membership_data,
        update_result.data as unknown as Record<string, unknown>,
        ["team_id", "start_date"],
      );
    }
    console.log("[Transfer] Updated membership", {
      event: "membership_updated",
      membership_id: active_membership.id,
    });
    return create_success_result(true);
  }

  console.warn("[Transfer] No active membership found, creating new", {
    event: "membership_not_found",
    player_id: transfer.player_id,
  });
  const create_result = await membership_repository.create({
    organization_id: transfer.organization_id,
    player_id: transfer.player_id,
    team_id: transfer.to_team_id,
    start_date: transfer.transfer_date,
    jersey_number: null,
    status: "active",
  });
  if (!create_result.success)
    return create_failure_result(
      `Failed to create new membership: ${create_result.error}`,
    );
  if (create_result.data) {
    EventBus.emit_entity_created(
      "playerteammembership",
      create_result.data.id,
      create_result.data.id,
      create_result.data as unknown as Record<string, unknown>,
    );
  }
  console.log("[Transfer] Created new membership", {
    event: "membership_created",
    player_id: transfer.player_id,
  });
  return create_success_result(true);
}

export function create_transfer_confirmation(
  repository: PlayerTeamTransferHistoryRepository,
  membership_repository: PlayerTeamMembershipRepository,
): TransferConfirmationMethods {
  return {
    async confirm_transfer(transfer_id) {
      if (!transfer_id?.trim())
        return create_failure_result("Transfer ID is required");
      const transfer_result = await repository.find_by_id(transfer_id);
      if (!transfer_result.success)
        return create_failure_result(transfer_result.error);
      if (!transfer_result.data)
        return create_failure_result("Transfer not found");
      if (transfer_result.data.status !== TRANSFER_STATUS.PENDING) {
        return create_failure_result(
          `Transfer cannot be confirmed. Current status: ${transfer_result.data.status}`,
        );
      }
      const membership_result = await handle_membership_transfer(
        membership_repository,
        transfer_result.data,
      );
      if (!membership_result.success)
        return create_failure_result(membership_result.error);
      const update_result = await repository.update(transfer_id, {
        status: TRANSFER_STATUS.APPROVED,
      });
      if (!update_result.success)
        return create_failure_result(
          `Failed to confirm transfer: ${update_result.error}`,
        );
      if (update_result.data) {
        EventBus.emit_entity_updated(
          "playerteamtransferhistory",
          transfer_id,
          transfer_id,
          transfer_result.data as unknown as Record<string, unknown>,
          update_result.data as unknown as Record<string, unknown>,
          ["status"],
        );
      }
      console.log("[Transfer] Transfer confirmed", {
        event: "transfer_confirmed",
        transfer_id,
      });
      return create_success_result(update_result.data!);
    },

    async reject_transfer(transfer_id) {
      if (!transfer_id?.trim())
        return create_failure_result("Transfer ID is required");
      const transfer_result = await repository.find_by_id(transfer_id);
      if (!transfer_result.success)
        return create_failure_result(transfer_result.error);
      if (!transfer_result.data)
        return create_failure_result("Transfer not found");
      if (transfer_result.data.status !== TRANSFER_STATUS.PENDING) {
        return create_failure_result(
          `Transfer cannot be rejected. Current status: ${transfer_result.data.status}`,
        );
      }
      const update_result = await repository.update(transfer_id, {
        status: TRANSFER_STATUS.DECLINED,
      });
      if (!update_result.success)
        return create_failure_result(
          `Failed to reject transfer: ${update_result.error}`,
        );
      if (update_result.data) {
        EventBus.emit_entity_updated(
          "playerteamtransferhistory",
          transfer_id,
          transfer_id,
          transfer_result.data as unknown as Record<string, unknown>,
          update_result.data as unknown as Record<string, unknown>,
          ["status"],
        );
      }
      console.log("[Transfer] Transfer rejected", {
        event: "transfer_rejected",
        transfer_id,
      });
      return create_success_result(update_result.data!);
    },
  };
}
