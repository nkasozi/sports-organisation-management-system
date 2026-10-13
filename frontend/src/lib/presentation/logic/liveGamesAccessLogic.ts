import { get_entity_data_category } from "$lib/core/interfaces/ports";

type AuthorizationResult = Promise<{
  success: boolean;
  data?: { is_authorized: boolean; role?: string };
}>;

export interface LiveGamesAuthorizationAdapter {
  check_entity_authorized(
    raw_token: string,
    entity_type: string,
    action: string,
  ): AuthorizationResult;
}

const LIVE_GAMES_PERMISSION_LOG_EVENTS = {
  READ_CHECK_FAILED: "live_games_read_permission_check_failed",
  START_CHECK_FAILED: "live_games_start_permission_check_failed",
} as const;

const START_PERMISSION_UNVERIFIED_MESSAGE =
  "We could not verify your permission to start games. Please try again.";
const START_PERMISSION_DENIED_MESSAGE =
  "Permission denied: You do not have permission to start games. This action requires Officials Manager, Organisation Admin, or Super Admin role.";

interface LiveGamesPermissions {
  authorization_succeeded: boolean;
  is_read_authorized: boolean;
  denial_reason: string;
  can_start_games: boolean;
  permission_info_message: string;
}

function build_failed_read_permissions(): LiveGamesPermissions {
  console.error("[LiveGames] Read permission check failed", {
    event: LIVE_GAMES_PERMISSION_LOG_EVENTS.READ_CHECK_FAILED,
  });
  return {
    authorization_succeeded: false,
    is_read_authorized: false,
    denial_reason: "",
    can_start_games: false,
    permission_info_message: "",
  };
}

export async function load_live_games_permissions(
  raw_token: string,
  authorization_adapter: LiveGamesAuthorizationAdapter,
): Promise<LiveGamesPermissions> {
  const read_authorization =
    await authorization_adapter.check_entity_authorized(
      raw_token,
      "fixture",
      "read",
    );
  if (!read_authorization.success || !read_authorization.data) {
    return build_failed_read_permissions();
  }

  const update_authorization =
    await authorization_adapter.check_entity_authorized(
      raw_token,
      "fixture",
      "update",
    );
  const can_start_games = Boolean(
    update_authorization.success && update_authorization.data?.is_authorized,
  );

  return {
    authorization_succeeded: true,
    is_read_authorized: read_authorization.data.is_authorized,
    denial_reason: read_authorization.data.is_authorized
      ? ""
      : `Role "${read_authorization.data.role}" does not have "read" permission for fixture (${get_entity_data_category("fixture")} data).`,
    can_start_games,
    permission_info_message: can_start_games
      ? ""
      : `Your role "${update_authorization.success && update_authorization.data ? update_authorization.data.role : "unknown"}" can view fixtures but cannot start games. Contact an administrator if you need this permission.`,
  };
}

export async function validate_live_games_start_permission(
  raw_token: string,
  authorization_adapter: LiveGamesAuthorizationAdapter,
): Promise<string> {
  const authorization_check =
    await authorization_adapter.check_entity_authorized(
      raw_token,
      "fixture",
      "update",
    );
  if (!authorization_check.success || !authorization_check.data) {
    console.error("[LiveGames] Start permission check failed", {
      event: LIVE_GAMES_PERMISSION_LOG_EVENTS.START_CHECK_FAILED,
    });
    return START_PERMISSION_UNVERIFIED_MESSAGE;
  }

  return authorization_check.data.is_authorized
    ? ""
    : START_PERMISSION_DENIED_MESSAGE;
}
