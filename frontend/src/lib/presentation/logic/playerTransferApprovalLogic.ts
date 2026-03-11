import type { PlayerTeamMembershipUseCases } from "../../core/usecases/PlayerTeamMembershipUseCases";
import type { AsyncResult } from "../../core/types/Result";
import { create_success_result, create_failure_result } from "../../core/types/Result";
import type { BaseEntity } from "../../core/entities/BaseEntity";

export interface TransferApprovalDetails {
  player_id: string;
  from_team_id: string;
  to_team_id: string;
  organization_id: string;
  transfer_date: string;
}

export async function apply_player_transfer_membership_change(
  membership_use_cases: PlayerTeamMembershipUseCases,
  transfer: TransferApprovalDetails,
): AsyncResult<boolean> {
  console.debug("[TRANSFER] Executing membership transfer", {
    player_id: transfer.player_id,
    from_team_id: transfer.from_team_id,
    to_team_id: transfer.to_team_id,
    organization_id: transfer.organization_id,
  });

  const delete_result = await delete_old_team_memberships(
    membership_use_cases,
    transfer.player_id,
    transfer.from_team_id,
  );

  if (!delete_result.success) {
    return create_failure_result(
      `Transfer approved but failed to remove old team membership: ${delete_result.error}. Please check Player Team Memberships manually.`,
    );
  }

  const create_result = await create_new_team_membership(membership_use_cases, transfer);
  if (!create_result.success) {
    return create_failure_result(create_result.error);
  }
  return create_success_result(true);
}

export async function delete_old_team_memberships(
  membership_use_cases: PlayerTeamMembershipUseCases,
  player_id: string,
  from_team_id: string,
): AsyncResult<number> {
  const all_memberships_result =
    await membership_use_cases.list_memberships_by_player(player_id);

  if (!all_memberships_result.success) {
    console.error(
      "[TRANSFER] Failed to list player memberships:",
      all_memberships_result.error,
    );
    return create_failure_result(
      `Failed to list memberships for player "${player_id}": ${all_memberships_result.error}`,
    );
  }

  const memberships_data = all_memberships_result.data as unknown;
  const all_memberships = Array.isArray(memberships_data)
    ? (memberships_data as BaseEntity[])
    : ((memberships_data as { items?: BaseEntity[] })?.items ?? []);

  const memberships_to_delete = all_memberships.filter(
    (m) => (m as unknown as { team_id: string }).team_id === from_team_id,
  );

  console.debug("[TRANSFER] Found memberships to delete:", {
    total_player_memberships: all_memberships.length,
    matching_from_team: memberships_to_delete.length,
    from_team_id,
  });

  if (memberships_to_delete.length === 0) {
    console.warn(
      "[TRANSFER] No memberships found for from_team_id — skipping delete",
      { player_id, from_team_id },
    );
    return create_success_result(0);
  }

  const ids_to_delete = memberships_to_delete.map((m) => m.id);
  const delete_result =
    await membership_use_cases.delete_memberships(ids_to_delete);

  if (!delete_result.success) {
    console.error(
      "[TRANSFER] Failed to delete old memberships:",
      delete_result.error,
    );
    return create_failure_result(
      `Failed to delete ${ids_to_delete.length} membership(s): ${delete_result.error}`,
    );
  }

  console.debug(
    "[TRANSFER] Deleted",
    ids_to_delete.length,
    "old membership(s):",
    ids_to_delete,
  );
  return create_success_result(ids_to_delete.length);
}

export async function create_new_team_membership(
  membership_use_cases: PlayerTeamMembershipUseCases,
  transfer: Pick<
    TransferApprovalDetails,
    "player_id" | "to_team_id" | "organization_id" | "transfer_date"
  >,
): AsyncResult<string> {
  const start_date =
    transfer.transfer_date || new Date().toISOString().split("T")[0];

  const create_result = await membership_use_cases.create({
    organization_id: transfer.organization_id,
    player_id: transfer.player_id,
    team_id: transfer.to_team_id,
    start_date,
    jersey_number: null,
    status: "active",
  });

  if (!create_result.success) {
    console.error(
      "[TRANSFER] Failed to create new team membership:",
      create_result.error,
    );
    return create_failure_result(
      `Failed to create membership for player "${transfer.player_id}" in team "${transfer.to_team_id}": ${create_result.error}`,
    );
  }

  const new_membership_id = create_result.data?.id ?? "";
  console.debug("[TRANSFER] Created new team membership:", new_membership_id);
  return create_success_result(new_membership_id);
}
