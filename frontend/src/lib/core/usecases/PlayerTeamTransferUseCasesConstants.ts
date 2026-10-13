import type { TransferStatusValue } from "../entities/StatusConstants";

export const PLAYER_TEAM_TRANSFER_LOG_SCOPE =
  "[PlayerTeamTransferHistoryUseCases]";

export const TRANSFER_ENTITY_TYPE = "playerteamtransferhistory";

export const MEMBERSHIP_ENTITY_TYPE = "playerteammembership";

export const NEW_MEMBERSHIP_DEFAULT_JERSEY_NUMBER = 0;

export const PlayerTeamTransferEvent = {
  LIST_FAILED: "transfer_list_failed",
  GET_ID_MISSING: "transfer_get_id_missing",
  GET_FAILED: "transfer_get_failed",
  CREATE_VALIDATION_FAILED: "transfer_create_validation_failed",
  CREATE_FAILED: "transfer_create_failed",
  UPDATE_ID_MISSING: "transfer_update_id_missing",
  UPDATE_FAILED: "transfer_update_failed",
  DELETE_ID_MISSING: "transfer_delete_id_missing",
  DELETE_FAILED: "transfer_delete_failed",
  LIST_BY_PLAYER_ID_MISSING: "transfer_list_by_player_id_missing",
  LIST_BY_TEAM_ID_MISSING: "transfer_list_by_team_id_missing",
  BULK_DELETE_IDS_MISSING: "transfer_bulk_delete_ids_missing",
  BULK_DELETE_FAILED: "transfer_bulk_delete_failed",
  BULK_DELETE_SNAPSHOT_UNAVAILABLE: "transfer_bulk_delete_snapshot_unavailable",
  RESOLUTION_ID_MISSING: "transfer_resolution_id_missing",
  RESOLUTION_TARGET_NOT_FOUND: "transfer_resolution_target_not_found",
  RESOLUTION_REJECTED: "transfer_resolution_rejected",
  RESOLUTION_SAVE_FAILED: "transfer_resolution_save_failed",
  RESOLUTION_ROLLED_BACK: "transfer_resolution_rolled_back",
  RESOLUTION_ROLLBACK_FAILED: "transfer_resolution_rollback_failed",
  RESOLVED: "transfer_resolved",
  MEMBERSHIP_LOOKUP_FAILED: "transfer_membership_lookup_failed",
  MEMBERSHIP_UPDATE_FAILED: "transfer_membership_update_failed",
  MEMBERSHIP_UPDATED: "transfer_membership_updated",
  MEMBERSHIP_NOT_FOUND: "transfer_membership_not_found",
  MEMBERSHIP_CREATE_FAILED: "transfer_membership_create_failed",
  MEMBERSHIP_CREATED: "transfer_membership_created",
} as const;

export const PlayerTeamTransferMessage = {
  ID_REQUIRED: "Transfer ID is required",
  NOT_FOUND: "Transfer not found",
  NEEDS_ATTENTION:
    "The transfer could not be completed and needs attention. Please refresh and check the player's team before trying again.",
  PLAYER_ID_REQUIRED: "Player ID is required",
  TEAM_ID_REQUIRED: "Team ID is required",
  BULK_IDS_REQUIRED: "At least one transfer ID is required",
} as const;

export function build_cannot_confirm_message(
  status: TransferStatusValue,
): string {
  return `Transfer cannot be confirmed. Current status: ${status}`;
}

export function build_cannot_reject_message(
  status: TransferStatusValue,
): string {
  return `Transfer cannot be rejected. Current status: ${status}`;
}
