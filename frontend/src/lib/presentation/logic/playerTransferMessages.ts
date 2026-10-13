export const PLAYER_TRANSFER_USER_MESSAGE = {
  OLD_MEMBERSHIP_REMOVAL_FAILED:
    "The transfer was approved, but we couldn't remove the player from their old team. Please check Player Team Memberships manually.",
  NEW_MEMBERSHIP_CREATION_FAILED:
    "The transfer was approved, but we couldn't add the player to their new team. Please check Player Team Memberships manually.",
} as const;

export const PLAYER_TRANSFER_EVENT = {
  MEMBERSHIP_TRANSFER_STARTED: "player_transfer_membership_transfer_started",
  OLD_MEMBERSHIPS_DELETE_FAILED:
    "player_transfer_old_memberships_delete_failed",
  OLD_MEMBERSHIPS_DELETED: "player_transfer_old_memberships_deleted",
  MEMBERSHIPS_LIST_FAILED: "player_transfer_memberships_list_failed",
  MEMBERSHIPS_TO_DELETE_FOUND: "player_transfer_memberships_to_delete_found",
  FROM_TEAM_MEMBERSHIPS_MISSING:
    "player_transfer_from_team_memberships_missing",
  MEMBERSHIP_CREATE_FAILED: "player_transfer_membership_create_failed",
  MEMBERSHIP_CREATED: "player_transfer_membership_created",
} as const;

export const PLAYER_TRANSFER_TECHNICAL_ERROR = {
  LIST_MEMBERSHIPS_FAILED: "Failed to list player memberships",
  DELETE_MEMBERSHIPS_FAILED: "Failed to delete old team memberships",
  CREATE_MEMBERSHIP_FAILED: "Failed to create new team membership",
} as const;

export const PLAYER_TRANSFER_NEW_MEMBERSHIP_DEFAULTS = {
  JERSEY_NUMBER: 0,
} as const;
