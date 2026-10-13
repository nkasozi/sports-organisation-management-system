import type { BaseEntity } from "../../core/entities/BaseEntity";
import { MEMBERSHIP_STATUS } from "../../core/entities/StatusConstants";
import type { AsyncResult } from "../../core/types/Result";
import {
  create_failure_result,
  create_success_result,
} from "../../core/types/Result";
import type { PlayerTeamMembershipUseCases } from "../../core/usecases/PlayerTeamMembershipUseCases";
import {
  PLAYER_TRANSFER_EVENT,
  PLAYER_TRANSFER_NEW_MEMBERSHIP_DEFAULTS,
  PLAYER_TRANSFER_TECHNICAL_ERROR,
  PLAYER_TRANSFER_USER_MESSAGE,
} from "./playerTransferMessages";

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
    event: PLAYER_TRANSFER_EVENT.MEMBERSHIP_TRANSFER_STARTED,
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
      PLAYER_TRANSFER_USER_MESSAGE.OLD_MEMBERSHIP_REMOVAL_FAILED,
    );
  }

  const create_result = await create_new_team_membership(
    membership_use_cases,
    transfer,
  );
  if (!create_result.success) {
    return create_failure_result(
      PLAYER_TRANSFER_USER_MESSAGE.NEW_MEMBERSHIP_CREATION_FAILED,
    );
  }
  return create_success_result(true);
}

function extract_memberships_for_team(
  memberships_data: unknown,
  from_team_id: string,
): { all_memberships: BaseEntity[]; memberships_to_delete: BaseEntity[] } {
  const all_memberships = Array.isArray(memberships_data)
    ? (memberships_data as BaseEntity[])
    : ((memberships_data as { items?: BaseEntity[] })?.items ?? []);
  const memberships_to_delete = all_memberships.filter(
    (m) => (m as unknown as { team_id: string }).team_id === from_team_id,
  );
  return { all_memberships, memberships_to_delete };
}

async function delete_team_memberships_by_ids(
  membership_use_cases: PlayerTeamMembershipUseCases,
  ids_to_delete: Array<BaseEntity["id"]>,
): AsyncResult<number> {
  const delete_result =
    await membership_use_cases.delete_memberships(ids_to_delete);

  if (!delete_result.success) {
    console.error("[TRANSFER] Failed to delete old memberships", {
      event: PLAYER_TRANSFER_EVENT.OLD_MEMBERSHIPS_DELETE_FAILED,
      membership_count: ids_to_delete.length,
      error: delete_result.error,
    });
    return create_failure_result(
      `${PLAYER_TRANSFER_TECHNICAL_ERROR.DELETE_MEMBERSHIPS_FAILED}: ${delete_result.error}`,
    );
  }

  console.debug("[TRANSFER] Deleted old memberships", {
    event: PLAYER_TRANSFER_EVENT.OLD_MEMBERSHIPS_DELETED,
    membership_count: ids_to_delete.length,
    membership_ids: ids_to_delete,
  });
  return create_success_result(ids_to_delete.length);
}

function log_memberships_to_delete(summary: {
  player_id: string;
  from_team_id: string;
  total_player_memberships: number;
  matching_from_team: number;
}): number {
  console.debug("[TRANSFER] Found memberships to delete", {
    event: PLAYER_TRANSFER_EVENT.MEMBERSHIPS_TO_DELETE_FOUND,
    total_player_memberships: summary.total_player_memberships,
    matching_from_team: summary.matching_from_team,
    from_team_id: summary.from_team_id,
  });
  if (summary.matching_from_team > 0) return summary.matching_from_team;
  console.warn("[TRANSFER] No memberships found for from team", {
    event: PLAYER_TRANSFER_EVENT.FROM_TEAM_MEMBERSHIPS_MISSING,
    player_id: summary.player_id,
    from_team_id: summary.from_team_id,
  });
  return summary.matching_from_team;
}

export async function delete_old_team_memberships(
  membership_use_cases: PlayerTeamMembershipUseCases,
  player_id: string,
  from_team_id: string,
): AsyncResult<number> {
  const all_memberships_result =
    await membership_use_cases.list_memberships_by_player(player_id);

  if (!all_memberships_result.success) {
    console.error("[TRANSFER] Failed to list player memberships", {
      event: PLAYER_TRANSFER_EVENT.MEMBERSHIPS_LIST_FAILED,
      player_id,
      error: all_memberships_result.error,
    });
    return create_failure_result(
      `${PLAYER_TRANSFER_TECHNICAL_ERROR.LIST_MEMBERSHIPS_FAILED}: ${all_memberships_result.error}`,
    );
  }

  const { all_memberships, memberships_to_delete } =
    extract_memberships_for_team(
      all_memberships_result.data as unknown,
      from_team_id,
    );

  log_memberships_to_delete({
    player_id,
    from_team_id,
    total_player_memberships: all_memberships.length,
    matching_from_team: memberships_to_delete.length,
  });
  if (memberships_to_delete.length === 0) return create_success_result(0);

  return delete_team_memberships_by_ids(
    membership_use_cases,
    memberships_to_delete.map((m) => m.id),
  );
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
    jersey_number: PLAYER_TRANSFER_NEW_MEMBERSHIP_DEFAULTS.JERSEY_NUMBER,
    status: MEMBERSHIP_STATUS.ACTIVE,
  });

  if (!create_result.success) {
    console.error("[TRANSFER] Failed to create new team membership", {
      event: PLAYER_TRANSFER_EVENT.MEMBERSHIP_CREATE_FAILED,
      player_id: transfer.player_id,
      to_team_id: transfer.to_team_id,
      error: create_result.error,
    });
    return create_failure_result(
      `${PLAYER_TRANSFER_TECHNICAL_ERROR.CREATE_MEMBERSHIP_FAILED}: ${create_result.error}`,
    );
  }

  const new_membership_id = create_result.data?.id ?? "";
  console.debug("[TRANSFER] Created new team membership", {
    event: PLAYER_TRANSFER_EVENT.MEMBERSHIP_CREATED,
    membership_id: new_membership_id,
  });
  return create_success_result(new_membership_id);
}
